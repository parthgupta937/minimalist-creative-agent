import { NextRequest, NextResponse } from 'next/server'
import { scoreAd } from '@/lib/score-ad'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export async function POST(request: NextRequest): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'Server is missing ANTHROPIC_API_KEY.' }, { status: 500 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'Request must be multipart/form-data.' }, { status: 400 })
  }

  const image = formData.get('image')
  if (!(image instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Missing required "image" file field.' }, { status: 400 })
  }
  if (!ALLOWED_MIME_TYPES.has(image.type)) {
    return NextResponse.json(
      { ok: false, error: `Unsupported image type "${image.type}". Use PNG, JPEG, or WebP.` },
      { status: 400 },
    )
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ ok: false, error: 'Image is too large (max 8MB).' }, { status: 400 })
  }

  const notesRaw = formData.get('notes')
  const notes = typeof notesRaw === 'string' ? notesRaw : null

  // Only the internal auto-score call from the generator flow sends this — a caller
  // scoring an arbitrary pasted-in ad has no verified source payload to check against.
  const groundTruthRaw = formData.get('groundTruthPayload')
  let groundTruthPayload: Record<string, unknown> | null = null
  if (typeof groundTruthRaw === 'string' && groundTruthRaw.trim().length > 0) {
    try {
      groundTruthPayload = JSON.parse(groundTruthRaw)
    } catch {
      return NextResponse.json({ ok: false, error: 'groundTruthPayload was present but not valid JSON.' }, { status: 400 })
    }
  }

  const imageBase64 = Buffer.from(await image.arrayBuffer()).toString('base64')
  const outcome = await scoreAd({
    apiKey,
    imageBase64,
    mediaType: image.type as 'image/png' | 'image/jpeg' | 'image/webp',
    notes,
    groundTruthPayload,
  })

  if (!outcome.ok) {
    return NextResponse.json({ ok: false, error: outcome.error }, { status: 502 })
  }
  return NextResponse.json({ ok: true, result: outcome.result })
}
