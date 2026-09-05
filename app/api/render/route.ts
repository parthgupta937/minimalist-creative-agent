import { NextRequest, NextResponse } from 'next/server'
import { ImageResponse } from '@vercel/og'
import { validatePayload, type HardStop, type ValidationResult } from '@/lib/spec'
import { buildCreativeElement, loadCreativeFonts, CANVAS_SIZE } from '@/lib/render-creative'

const IMAGE_CHECK_TIMEOUT_MS = 8_000

function hardStop(field: string, detail: string): NextResponse {
  const body: ValidationResult = { ok: false, stop: { stopCode: 'FETCH_FAILED', field, detail } as HardStop }
  return NextResponse.json(body, { status: 422 })
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  // Re-validate server-side: the client already checked this payload, but it travels
  // over the network in between and must never be trusted blindly (plan §7).
  const result = validatePayload(body)
  if (!result.ok) {
    return NextResponse.json(result, { status: 422 })
  }

  // Satori/ImageResponse swallows a broken <img> fetch silently (renders a blank box,
  // never throws), so an unreachable pack image would otherwise pass through as a
  // silent quality bug instead of the clear hard-stop the plan calls for here.
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), IMAGE_CHECK_TIMEOUT_MS)
    let check: Response
    try {
      check = await fetch(result.payload.packRenderUrl, { method: 'HEAD', signal: controller.signal })
    } finally {
      clearTimeout(timeout)
    }
    if (!check.ok) {
      return hardStop(
        'packRenderUrl',
        `Pack render image request failed with HTTP ${check.status} ${check.statusText}.`,
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown network error.'
    return hardStop('packRenderUrl', `Could not reach the pack render image: ${message}`)
  }

  const fonts = await loadCreativeFonts()
  return new ImageResponse(buildCreativeElement(result.payload), {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    fonts,
  })
}
