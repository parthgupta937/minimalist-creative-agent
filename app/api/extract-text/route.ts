import { NextRequest, NextResponse } from 'next/server'
import type { HardStop, HardStopCode, ValidationResult } from '@/lib/spec'
import { ALLOWED_HOSTNAMES, extractProductPayload } from '@/lib/extract'

function hardStop(stopCode: HardStopCode, field: string, detail: string): NextResponse {
  const body: ValidationResult = { ok: false, stop: { stopCode, field, detail } as HardStop }
  return NextResponse.json(body, { status: 422 })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const { content, url } = (body as { content?: unknown; url?: unknown } | null) ?? {}

  if (typeof content !== 'string' || content.trim().length === 0) {
    return hardStop('EXTRACTION_FAILED', 'root', 'Request body must include non-empty pasted "content" text or HTML.')
  }

  const rawUrl = typeof url === 'string' ? url.trim() : ''
  let sourceUrl = ''
  if (rawUrl) {
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
    sourceUrl = parsedUrl.toString()
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'Server misconfiguration: ANTHROPIC_API_KEY is not set.' },
      { status: 500 },
    )
  }

  const result = await extractProductPayload({
    apiKey,
    rawContent: content,
    sourceUrl,
    contentLabel: 'the pasted content',
  })
  return NextResponse.json(result, { status: result.ok ? 200 : 422 })
}
