import sharp from 'sharp'

// Studio product shots are near-universally a centered product on a clean, uniform
// backdrop — so the four corners are reliable background samples without needing any
// ML segmentation. Downscaling first makes corner-patch averaging cheap and smooths
// over JPEG compression noise; it deliberately replaces the old rembg/Render pipeline
// (see git history), which kept OOM-ing in production for a cost this heuristic avoids
// entirely — no model, no external service, sub-100ms.
const SAMPLE_GRID = 48
const CORNER_FRACTION = 0.15

export async function sampleBackgroundColor(imageBuffer: Buffer): Promise<string> {
  const { data, info } = await sharp(imageBuffer)
    .resize(SAMPLE_GRID, SAMPLE_GRID, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const patch = Math.max(1, Math.round(Math.min(width, height) * CORNER_FRACTION))

  const corners: Array<[number, number]> = [
    [0, 0],
    [width - patch, 0],
    [0, height - patch],
    [width - patch, height - patch],
  ]

  const cornerAverages = corners.map(([startX, startY]) =>
    averagePatch(data, width, channels, startX, startY, patch),
  )

  const [r, g, b] = [0, 1, 2].map((channel) =>
    Math.round(cornerAverages.reduce((sum, avg) => sum + avg[channel], 0) / cornerAverages.length),
  )

  return rgbToHex(r, g, b)
}

function averagePatch(
  data: Buffer,
  width: number,
  channels: number,
  startX: number,
  startY: number,
  size: number,
): [number, number, number] {
  let r = 0
  let g = 0
  let b = 0
  let count = 0
  for (let y = startY; y < startY + size; y++) {
    for (let x = startX; x < startX + size; x++) {
      const idx = (y * width + x) * channels
      r += data[idx]
      g += data[idx + 1]
      b += data[idx + 2]
      count++
    }
  }
  return [r / count, g / count, b / count]
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}
