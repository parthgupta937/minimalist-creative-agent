import { NextRequest, NextResponse } from 'next/server'
import { scoreAd } from '@/lib/score-ad'
import { validatePayload } from '@/lib/spec'

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

  // Only the internal auto-score call from the generator flow sends this — a caller
  // scoring an arbitrary pasted-in ad has no verified source payload to check against.
  // When present and valid, the image above is never uploaded to the model at all —
  // the exact on-canvas text is already known server-side (lib/score-ad.ts
  // 'known-content' mode), which is both more accurate than OCR and keeps the review
  // scoped to content rather than the photo.
  const groundTruthRaw = formData.get('groundTruthPayload')
  if (typeof groundTruthRaw === 'string' && groundTruthRaw.trim().length > 0) {
    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(groundTruthRaw)
    } catch {
      return NextResponse.json({ ok: false, error: 'groundTruthPayload was present but not valid JSON.' }, { status: 400 })
    }
    const validation = validatePayload(parsedJson)
    if (!validation.ok) {
      return NextResponse.json(
        { ok: false, error: `groundTruthPayload failed validation: ${validation.stop.detail}` },
        { status: 400 },
      )
    }
    const outcome = await scoreAd({ apiKey, mode: 'known-content', payload: validation.payload })
    if (!outcome.ok) {
      return NextResponse.json({ ok: false, error: outcome.error }, { status: 502 })
    }
    return NextResponse.json({ ok: true, result: outcome.result })
  }

  const notesRaw = formData.get('notes')
  const notes = typeof notesRaw === 'string' ? notesRaw : null

  const imageBase64 = Buffer.from(await image.arrayBuffer()).toString('base64')
  const outcome = await scoreAd({
    apiKey,
    mode: 'vision',
    imageBase64,
    mediaType: image.type as 'image/png' | 'image/jpeg' | 'image/webp',
    notes,
  })

  if (!outcome.ok) {
    return NextResponse.json({ ok: false, error: outcome.error }, { status: 502 })
  }
  return NextResponse.json({ ok: true, result: outcome.result })
}
