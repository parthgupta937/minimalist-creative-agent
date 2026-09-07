import { NextRequest, NextResponse } from 'next/server'
import { sampleBackgroundColor } from '@/lib/sample-background-color'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const FETCH_TIMEOUT_MS = 10_000

export async function POST(request: NextRequest): Promise<Response> {
  const { imageUrl } = (await request.json().catch(() => ({}))) as { imageUrl?: string }

  if (!imageUrl || typeof imageUrl !== 'string') {
    return NextResponse.json({ ok: false, error: 'Missing imageUrl parameter.' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(imageUrl)
  } catch {
    return NextResponse.json({ ok: false, error: 'imageUrl is not a valid URL.' }, { status: 400 })
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({ ok: false, error: 'imageUrl must be http(s).' }, { status: 400 })
  }

  let imageBuffer: Buffer
  try {
    const response = await fetch(parsed, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: `Failed to fetch image: HTTP ${response.status}.` },
        { status: 400 },
      )
    }
    const arrayBuffer = await response.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ ok: false, error: 'Image is too large (max 8MB).' }, { status: 400 })
    }
    imageBuffer = Buffer.from(arrayBuffer)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: `Failed to fetch image from URL: ${message}` }, { status: 400 })
  }

  try {
    const color = await sampleBackgroundColor(imageBuffer)
    return NextResponse.json({ ok: true, color })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: `Could not read image: ${message}` }, { status: 400 })
  }
}
