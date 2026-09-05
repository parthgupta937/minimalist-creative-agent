import { NextRequest, NextResponse } from 'next/server'
import type { HardStop, HardStopCode, ValidationResult } from '@/lib/spec'
import { ALLOWED_HOSTNAMES, extractProductPayload } from '@/lib/extract'

const FETCH_TIMEOUT_MS = 15_000

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

  const result = await extractProductPayload({
    apiKey,
    rawContent: html,
    sourceUrl: parsedUrl.toString(),
    contentLabel: 'this PDP',
  })
  return NextResponse.json(result, { status: result.ok ? 200 : 422 })
}
