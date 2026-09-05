import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { jsonSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/json-schema'
import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import { validatePayload, type HardStop, type HardStopCode, type ValidationResult } from '@/lib/spec'

// Verbatim-extraction model. Claude Sonnet 5 (current Sonnet-tier model as of this
// writing) rather than Opus-tier: this call only copies strings out of pre-trimmed
// HTML into a fixed schema, which is a straightforward classification/extraction
// task and doesn't need Opus-level reasoning.
const EXTRACTION_MODEL = 'claude-sonnet-5'

const FETCH_TIMEOUT_MS = 15_000

const ALLOWED_HOSTNAMES = new Set(['beminimalist.co', 'www.beminimalist.co'])

// Headings whose bodies are never part of the field mapping (§7.1) - keeping
// these out of the model's input keeps token cost down and, more importantly,
// keeps clinical-study / review copy (a likely source of non-compliant claims)
// away from the extractor entirely.
const EXCLUDED_HEADING_PATTERNS = [
  /clinical\s*results?/i,
  /consumer\s*stud/i,
  /review/i,
  /shipping/i,
  /\breturns?\b/i,
  /warranty/i,
  /payment/i,
]

const RELEVANT_HEADING_PATTERNS = [
  /ideal\s*for/i,
  /how\s*to\s*use/i,
  /what\s*makes\s*it\s*potent/i,
  /specifications?/i,
  /product\s*type/i,
]

const EXTRACTION_SYSTEM_PROMPT = `You are a verbatim data-extraction engine for Minimalist (beminimalist.co) skincare product pages. You are given pre-trimmed, labeled text sections copied directly from one product detail page (PDP). Your only job is to copy fields out of this text exactly as written into the JSON fields described below.

Hard rules:
- Copy strings verbatim, character-for-character, from the sections provided. Never rewrite, paraphrase, summarize, compress, shorten, or translate.
- Never invent, guess, or infer a value that is not explicitly present in the text.
- If a field is not confidently and unambiguously present in the provided text, return null for it (or an empty array for list fields). A missing or ambiguous field must never be filled in with an invented or approximate value.
- Only use the labeled sections given to you. Do not use any outside knowledge about this or any other product.
- Ignore any price, MRP, or discount figures even if they appear in the provided text - never let one influence any field.

Field-by-field instructions:
- productName: the exact text of the PRODUCT_NAME_H1 section. Verbatim, including punctuation and casing.
- percentage: the active-ingredient percentage written inside the product name (e.g. "2%", "5.5%", "10%"). Reformat only by stripping a leading zero (e.g. "02%" becomes "2%"); keep decimals exactly as published (e.g. "5.5%" stays "5.5%"). If no percentage appears in the product name, return null.
- formatDescriptor: the value that follows "Product type" in the section about product specifications (e.g. "Face Serum"). Verbatim. Null if absent.
- concernChip: the single first concern for this product. First check the CONCERN_STRAP_UNDER_TITLE section - if it reads as a specific skin concern (not a generic tagline), use it verbatim. Otherwise, look inside the section titled "Ideal For" for a line beginning "Concerns:" and take only the first concern listed before any comma, "&", or "and". Verbatim, first concern only. Null if no concern is confidently identifiable either way.
- keyIngredients: section headings that name individual ingredients (short noun-phrase headings such as "Hyaluronic Acid" or "Niacinamide"), NOT the heading that aggregates the full ingredient list (e.g. "All Ingredients") and not any other heading. Return their heading text verbatim as a list, in the order given. Empty array if none are present.
- benefits: the individual verbatim bullets/lines inside the section titled "What Makes It Potent?" (the primary product description). Return each bullet as its own array entry, unmodified and uncompressed - never merge two bullets into one string and never shorten a long bullet. Return exactly as many distinct verbatim bullets as are actually present; do not pad to a specific count and do not invent one.
- ph: the pH value or range from the ATTRIBUTE_BADGES section (e.g. "6.0 - 7.0"), verbatim. Null if absent.
- usageTime: the value after "When to use:" inside the section titled "How to Use" (e.g. "AM & PM everyday"), verbatim. Null if absent.
- skinType: the value after "Skin type:" (or, only if that label is absent, "Suitable for:") inside the section titled "Ideal For", verbatim. Null if absent.
- packRenderUrl: the exact URL given in the PACK_RENDER_IMAGE_URL section. Null if none was provided.

Return only the structured JSON output - no commentary, no markdown fences.`

const extractionSchema = {
  type: 'object',
  properties: {
    productName: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    percentage: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    formatDescriptor: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    concernChip: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    keyIngredients: { type: 'array', items: { type: 'string' } },
    benefits: { type: 'array', items: { type: 'string' } },
    ph: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    usageTime: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    skinType: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    packRenderUrl: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  },
  required: [
    'productName',
    'percentage',
    'formatDescriptor',
    'concernChip',
    'keyIngredients',
    'benefits',
    'ph',
    'usageTime',
    'skinType',
    'packRenderUrl',
  ],
  additionalProperties: false,
} as const

function hardStop(stopCode: HardStopCode, field: string, detail: string): NextResponse {
  const body: ValidationResult = { ok: false, stop: { stopCode, field, detail } as HardStop }
  return NextResponse.json(body, { status: 422 })
}

function normalizeUrl(rawSrc: string | undefined): string | null {
  if (!rawSrc) return null
  const trimmed = rawSrc.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  return trimmed
}

function firstSrcFromSrcset(srcset: string | undefined): string | null {
  if (!srcset) return null
  const first = srcset.split(',')[0]?.trim().split(/\s+/)[0]
  return normalizeUrl(first)
}

function extractPackRenderUrl($: CheerioAPI): string | null {
  const gallerySelectors = [
    '.product-gallery img',
    '[class*="product-gallery"] img',
    '[class*="product__media"] img',
    '[class*="product-media"] img',
    '[class*="product__slide"] img',
  ]
  for (const selector of gallerySelectors) {
    const img = $(selector).first()
    if (img.length === 0) continue
    const url =
      normalizeUrl(img.attr('src')) ??
      normalizeUrl(img.attr('data-src')) ??
      firstSrcFromSrcset(img.attr('srcset'))
    if (url) return url
  }
  return null
}

function extractH1($: CheerioAPI): string | null {
  const text = $('h1').first().text().trim()
  return text.length > 0 ? text : null
}

function extractConcernStrap($: CheerioAPI): string {
  const candidates: string[] = []
  $('[class*="product__subtitle"], [class*="product-subtitle"]').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (text && !candidates.includes(text)) candidates.push(text)
  })
  return candidates.join(' | ')
}

function extractAttributeBadges($: CheerioAPI): string {
  const selectors = ['[class*="icon-list"]', '[class*="pdp_icon"]', '[class*="attribute-list"]', '[class*="product-attributes"]']
  for (const selector of selectors) {
    const el = $(selector).first()
    if (el.length > 0) {
      const text = el.text().replace(/\s+/g, ' ').trim()
      if (text) return text
    }
  }
  return ''
}

function blockLines($: CheerioAPI, el: ReturnType<CheerioAPI>): string[] {
  const items = el.find('li')
  if (items.length > 0) {
    return items
      .toArray()
      .map((li) => $(li).text().replace(/\s+/g, ' ').trim())
      .filter(Boolean)
  }
  const paras = el.find('p')
  if (paras.length > 0) {
    return paras
      .toArray()
      .map((p) => $(p).text().replace(/\s+/g, ' ').trim())
      .filter(Boolean)
  }
  const html = (el.html() ?? '').replace(/<br\s*\/?>/gi, '\n')
  const text = cheerio.load(`<div>${html}</div>`)('div').text()
  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function isRelevantHeading(title: string): boolean {
  if (EXCLUDED_HEADING_PATTERNS.some((p) => p.test(title))) return false
  if (RELEVANT_HEADING_PATTERNS.some((p) => p.test(title))) return true
  const wordCount = title.trim().split(/\s+/).filter(Boolean).length
  return wordCount > 0 && wordCount <= 6 && !title.trim().endsWith('?')
}

interface ToggleSection {
  title: string
  lines: string[]
}

function extractToggleSections($: CheerioAPI): ToggleSection[] {
  const sections: ToggleSection[] = []
  const seenTitles = new Set<string>()
  $('.toggle').each((_, el) => {
    const $el = $(el)
    const title = $el.find('.toggle__title').first().text().replace(/\s+/g, ' ').trim()
    const content = $el.find('.toggle__content').first()
    if (!title || content.length === 0) return
    if (!isRelevantHeading(title)) return
    if (seenTitles.has(title)) return
    const lines = blockLines($, content)
    if (lines.length === 0) return
    seenTitles.add(title)
    sections.push({ title, lines })
  })
  return sections
}

const MAX_SECTION_CHARS = 4000

function buildTrimmedContext(html: string): string {
  const $ = cheerio.load(html)
  $('script, style, noscript, template, svg').remove()

  const productName = extractH1($) ?? '(not found)'
  const packRenderUrl = extractPackRenderUrl($) ?? '(not found)'
  const concernStrap = extractConcernStrap($) || '(not found)'
  const attributeBadges = extractAttributeBadges($) || '(not found)'
  const toggles = extractToggleSections($)

  const parts = [
    `PRODUCT_NAME_H1:\n${productName}`,
    `PACK_RENDER_IMAGE_URL:\n${packRenderUrl}`,
    `CONCERN_STRAP_UNDER_TITLE:\n${concernStrap}`,
    `ATTRIBUTE_BADGES:\n${attributeBadges}`,
  ]

  for (const section of toggles) {
    const body = section.lines.join('\n').slice(0, MAX_SECTION_CHARS)
    parts.push(`SECTION "${section.title}":\n${body}`)
  }

  return parts.join('\n\n---\n\n')
}

interface ExtractedFields {
  productName: string | null
  percentage: string | null
  formatDescriptor: string | null
  concernChip: string | null
  keyIngredients: string[]
  benefits: string[]
  ph: string | null
  usageTime: string | null
  skinType: string | null
  packRenderUrl: string | null
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const rawUrl = (body as { url?: unknown } | null)?.url
  if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
    return hardStop('INVALID_DOMAIN', 'sourceUrl', 'Request body must include a non-empty "url" string.')
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(rawUrl)
  } catch {
    return hardStop('INVALID_DOMAIN', 'sourceUrl', `"${rawUrl}" is not a valid URL.`)
  }

  const isAllowedProtocol = parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:'
  if (!isAllowedProtocol || !ALLOWED_HOSTNAMES.has(parsedUrl.hostname)) {
    return hardStop(
      'INVALID_DOMAIN',
      'sourceUrl',
      `"${rawUrl}" is not a beminimalist.co product URL. Only beminimalist.co and www.beminimalist.co PDP links are supported.`,
    )
  }

  let html: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    let response: Response
    try {
      response = await fetch(parsedUrl.toString(), { signal: controller.signal, redirect: 'follow' })
    } finally {
      clearTimeout(timeout)
    }
    if (!response.ok) {
      return hardStop(
        'FETCH_FAILED',
        'sourceUrl',
        `PDP request failed with HTTP ${response.status} ${response.statusText}.`,
      )
    }
    html = await response.text()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown network error.'
    return hardStop('FETCH_FAILED', 'sourceUrl', `Could not reach the PDP: ${message}`)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'Server misconfiguration: ANTHROPIC_API_KEY is not set.' },
      { status: 500 },
    )
  }

  const trimmedContext = buildTrimmedContext(html)
  const client = new Anthropic({ apiKey })

  let parsedOutput: ExtractedFields | null
  try {
    const response = await client.messages.parse({
      model: EXTRACTION_MODEL,
      max_tokens: 4096,
      system: EXTRACTION_SYSTEM_PROMPT,
      output_config: { format: jsonSchemaOutputFormat(extractionSchema) },
      messages: [{ role: 'user', content: trimmedContext }],
    })
    parsedOutput = response.parsed_output
  } catch (err) {
    let message = 'Unknown extraction error.'
    if (err instanceof Anthropic.AuthenticationError) {
      message = `Authentication with the Anthropic API failed: ${err.message}`
    } else if (err instanceof Anthropic.RateLimitError) {
      message = `Anthropic API rate limit hit: ${err.message}`
    } else if (err instanceof Anthropic.APIConnectionError) {
      message = `Could not connect to the Anthropic API: ${err.message}`
    } else if (err instanceof Anthropic.APIError) {
      message = `Anthropic API error (${err.status}): ${err.message}`
    } else if (err instanceof Error) {
      message = err.message
    }
    return hardStop('EXTRACTION_FAILED', 'root', `Claude extraction call failed: ${message}`)
  }

  if (!parsedOutput) {
    return hardStop(
      'EXTRACTION_FAILED',
      'root',
      'Claude did not return structured JSON matching the expected extraction schema for this PDP.',
    )
  }

  const candidate = {
    productName: parsedOutput.productName,
    percentage: parsedOutput.percentage,
    formatDescriptor: parsedOutput.formatDescriptor,
    concernChip: parsedOutput.concernChip,
    keyIngredients: parsedOutput.keyIngredients,
    benefits: parsedOutput.benefits,
    ph: parsedOutput.ph,
    usageTime: parsedOutput.usageTime,
    skinType: parsedOutput.skinType,
    packRenderUrl: parsedOutput.packRenderUrl,
    price: null,
    sourceUrl: parsedUrl.toString(),
    fetchedAt: new Date().toISOString(),
  }

  const result = validatePayload(candidate)
  return NextResponse.json(result, { status: result.ok ? 200 : 422 })
}
