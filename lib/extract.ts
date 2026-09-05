import Anthropic from '@anthropic-ai/sdk'
import { jsonSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/json-schema'
import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import { validatePayload, type HardStop, type ValidationResult } from '@/lib/spec'

// Verbatim-extraction model. Claude Sonnet 5 (current Sonnet-tier model as of this
// writing) rather than Opus-tier: this call only copies strings out of pre-trimmed
// HTML into a fixed schema, which is a straightforward classification/extraction
// task and doesn't need Opus-level reasoning.
export const EXTRACTION_MODEL = 'claude-sonnet-5'

export const ALLOWED_HOSTNAMES = new Set(['beminimalist.co', 'www.beminimalist.co'])

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

const EXTRACTION_SYSTEM_PROMPT = `You are a verbatim data-extraction engine for Minimalist (beminimalist.co) skincare product pages. You are given pre-trimmed, labeled text sections copied directly from one product detail page (PDP), OR (when no labeled structure could be identified) the raw unstructured text of a page pasted by a marketer. Your only job is to copy fields out of this text exactly as written into the JSON fields described below.

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

If instead you are given RAW_PASTED_CONTENT (unstructured plain text, no labeled sections), apply these same field definitions and the same verbatim/null-if-absent rules, reading the raw text as the entire visible page content - do not treat the absence of labeled sections as license to guess.

Return only the structured JSON output - no commentary, no markdown fences.`

const extractionSchema = {
  type: 'object',
  properties: {
    productName: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    percentage: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    formatDescriptor: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    concernChip: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    keyIngredients: { type: 'array', items: { type: 'string' } },
    // minItems/maxItems here only guide the model's own guess at a typical count;
    // validatePayload() is the real 2-4 enforcement point (spec.ts), not this schema.
    benefits: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8 },
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
const PLAIN_TEXT_MAX_CHARS = 20_000

interface StructuredContext {
  productName: string | null
  packRenderUrl: string | null
  concernStrap: string
  attributeBadges: string
  toggles: ToggleSection[]
}

function parseStructuredContext(html: string): StructuredContext {
  const $ = cheerio.load(html)
  $('script, style, noscript, template, svg').remove()
  return {
    productName: extractH1($),
    packRenderUrl: extractPackRenderUrl($),
    concernStrap: extractConcernStrap($),
    attributeBadges: extractAttributeBadges($),
    toggles: extractToggleSections($),
  }
}

function formatStructuredContext(ctx: StructuredContext): string {
  const parts = [
    `PRODUCT_NAME_H1:\n${ctx.productName ?? '(not found)'}`,
    `PACK_RENDER_IMAGE_URL:\n${ctx.packRenderUrl ?? '(not found)'}`,
    `CONCERN_STRAP_UNDER_TITLE:\n${ctx.concernStrap || '(not found)'}`,
    `ATTRIBUTE_BADGES:\n${ctx.attributeBadges || '(not found)'}`,
  ]

  for (const section of ctx.toggles) {
    const body = section.lines.join('\n').slice(0, MAX_SECTION_CHARS)
    parts.push(`SECTION "${section.title}":\n${body}`)
  }

  return parts.join('\n\n---\n\n')
}

/** True for real markup; a plain-text paste with no tags at all reads false. */
function looksLikeHtml(input: string): boolean {
  return /<[a-z][\s\S]*?>/i.test(input)
}

function stripToVisibleText(html: string): string {
  const $ = cheerio.load(html)
  $('script, style, noscript, template, svg').remove()
  return $.root().text().replace(/\s+/g, ' ').trim()
}

/**
 * Builds the text handed to the extraction model. Real fetched PDP HTML has a
 * <h1> and toggle sections, so it always takes the structured path below. A
 * pasted plain-text page (or an HTML paste whose markup doesn't match the
 * theme selectors above) has neither, so it falls back to raw text with a
 * note telling the model not to expect labeled sections.
 */
export function buildExtractionContext(rawInput: string): string {
  const inputHasTags = looksLikeHtml(rawInput)
  if (inputHasTags) {
    const structured = parseStructuredContext(rawInput)
    if (structured.productName || structured.toggles.length > 0) {
      return formatStructuredContext(structured)
    }
  }

  const plainText = inputHasTags ? stripToVisibleText(rawInput) : rawInput.trim()
  return [
    'NOTE: no labeled sections (PRODUCT_NAME_H1, SECTION "...") could be identified in this content, so it is passed below as unstructured plain text instead. It may be an incomplete paste of the page. Apply the same field-by-field verbatim / null-if-absent rules using this as the entire available page content.',
    '',
    'RAW_PASTED_CONTENT:',
    plainText.slice(0, PLAIN_TEXT_MAX_CHARS),
  ].join('\n')
}

export interface ExtractedFields {
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

type ModelOutcome = { ok: true; fields: ExtractedFields } | { ok: false; hardStop: HardStop }

async function callExtractionModel(
  apiKey: string,
  context: string,
  contentLabel: string,
): Promise<ModelOutcome> {
  const client = new Anthropic({ apiKey })
  let parsedOutput: ExtractedFields | null
  try {
    const response = await client.messages.parse({
      model: EXTRACTION_MODEL,
      max_tokens: 4096,
      system: EXTRACTION_SYSTEM_PROMPT,
      output_config: { format: jsonSchemaOutputFormat(extractionSchema) },
      messages: [{ role: 'user', content: context }],
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
    return { ok: false, hardStop: { stopCode: 'EXTRACTION_FAILED', field: 'root', detail: `Claude extraction call failed: ${message}` } }
  }

  if (!parsedOutput) {
    return {
      ok: false,
      hardStop: {
        stopCode: 'EXTRACTION_FAILED',
        field: 'root',
        detail: `Claude did not return structured JSON matching the expected extraction schema for ${contentLabel}.`,
      },
    }
  }

  return { ok: true, fields: parsedOutput }
}

function buildCandidatePayload(fields: ExtractedFields, sourceUrl: string, fetchedAt: string) {
  return {
    productName: fields.productName,
    percentage: fields.percentage,
    formatDescriptor: fields.formatDescriptor,
    concernChip: fields.concernChip,
    keyIngredients: fields.keyIngredients,
    benefits: fields.benefits,
    ph: fields.ph,
    usageTime: fields.usageTime,
    skinType: fields.skinType,
    packRenderUrl: fields.packRenderUrl,
    price: null,
    sourceUrl,
    fetchedAt,
  }
}

export interface ExtractProductPayloadParams {
  apiKey: string
  rawContent: string
  sourceUrl: string
  /** How the content is described in the "Claude returned nothing usable" hard-stop message. */
  contentLabel?: string
}

/**
 * Shared verbatim-extraction pipeline used by both the live-fetch route and
 * the paste/manual-fallback route: trim the input to labeled sections (or a
 * plain-text fallback), call Claude with the extraction-only prompt, then
 * run the result through validatePayload().
 */
export async function extractProductPayload(params: ExtractProductPayloadParams): Promise<ValidationResult> {
  const context = buildExtractionContext(params.rawContent)
  const modelResult = await callExtractionModel(params.apiKey, context, params.contentLabel ?? 'this content')
  if (!modelResult.ok) {
    return { ok: false, stop: modelResult.hardStop }
  }
  const candidate = buildCandidatePayload(modelResult.fields, params.sourceUrl, new Date().toISOString())
  return validatePayload(candidate)
}
