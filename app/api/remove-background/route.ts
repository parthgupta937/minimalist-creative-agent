import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Use 127.0.0.1 explicitly, not 'localhost' — on macOS, 'localhost' can resolve
// to ::1 first and hit the AirPlay Receiver (ControlCenter), which also listens
// on port 5000 and returns 403, masking the real rembg server on 127.0.0.1.
const REMBG_SERVER_URL = process.env.REMBG_SERVER_URL || 'http://127.0.0.1:5000'

// Render's free tier spins the rembg service down after 15 min idle; the next
// request has to wake the instance and reload the model before it can respond,
// which can take well past Vercel's default function timeout.
export const maxDuration = 60

// Local debug dump of every processed image, so results can be inspected on disk
// without decoding the data URL by hand. Git-ignored; dev-only convenience.
const DEBUG_OUTPUT_DIR = path.join(process.cwd(), 'debug-output')

async function saveDebugCopy(buffer: Buffer): Promise<string | null> {
  try {
    await mkdir(DEBUG_OUTPUT_DIR, { recursive: true })
    const filename = `bg-removed-${new Date().toISOString().replace(/[:.]/g, '-')}.png`
    const filePath = path.join(DEBUG_OUTPUT_DIR, filename)
    await writeFile(filePath, buffer)
    return filePath
  } catch (err) {
    console.error('Failed to save debug copy of processed image:', err)
    return null
  }
}

/**
 * Remove background from an image using Rembg.
 *
 * Make sure the Rembg server is running:
 *   python3 rembg-server.py
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { imageUrl } = await request.json() as { imageUrl?: string }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl parameter' }, { status: 400 })
    }

    // Check if Rembg server is running
    try {
      const healthCheck = await fetch(`${REMBG_SERVER_URL}/health`, { method: 'GET' })
      if (!healthCheck.ok) {
        return NextResponse.json(
          {
            error: 'Rembg server is not responding. Make sure to run: python3 rembg-server.py',
            serverUrl: REMBG_SERVER_URL,
          },
          { status: 503 },
        )
      }
    } catch {
      return NextResponse.json(
        {
          error: 'Rembg server is not available. Start it with: python3 rembg-server.py',
          serverUrl: REMBG_SERVER_URL,
        },
        { status: 503 },
      )
    }

    // Call Rembg to remove background
    const response = await fetch(`${REMBG_SERVER_URL}/remove-bg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error: `Rembg processing failed: ${error}` }, { status: response.status })
    }

    // Get the processed image as a buffer
    const imageBuffer = Buffer.from(await response.arrayBuffer())

    const debugPath = await saveDebugCopy(imageBuffer)
    if (debugPath) console.log(`Saved background-removed image to ${debugPath}`)

    // Return as a data URL so it can be used directly in the frontend
    const dataUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`

    return NextResponse.json({ imageUrl: dataUrl, success: true, debugPath: debugPath ?? undefined })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Request processing failed: ${message}` }, { status: 500 })
  }
}
