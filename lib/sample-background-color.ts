import sharp from 'sharp'

// Studio product shots are near-universally a centered product on a clean backdrop —
// so the border of the frame is a reliable background sample without needing any ML
// segmentation. Downscaling first makes sampling cheap and smooths over JPEG
// compression noise; it deliberately replaces the old rembg/Render pipeline (see git
// history), which kept OOM-ing in production for a cost this heuristic avoids
// entirely — no model, no external service, sub-100ms.
//
// Sampling ONLY the four corners (the original approach) is biased by any vignette —
// real product photography often has corners a few RGB units darker/cooler than the
// flatter background area around the product, which the corners alone don't capture.
// A real product photo (a Sept 2026 smoke test on an underarm roll-on) showed exactly
// this: 4-corner averaging returned a colour measurably different from the photo's own
// dominant background tone, producing a visible seam against the fixed-fill canvas.
// Sampling the full border band and taking the MODE (not the mean) of a quantized
// colour histogram fixes both problems at once: far more of the image's actual
// background territory is considered (not four small squares), and the mode is
// naturally robust to both a vignette (the flatter majority tone still wins) and a
// product that happens to touch one edge (a minority of border pixels, won't win).
const SAMPLE_GRID = 64
const BORDER_FRACTION = 0.12
const QUANTIZE_STEP = 8

export async function sampleBackgroundColor(imageBuffer: Buffer): Promise<string> {
  const { data, info } = await sharp(imageBuffer)
    .resize(SAMPLE_GRID, SAMPLE_GRID, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const bandW = Math.max(1, Math.round(width * BORDER_FRACTION))
  const bandH = Math.max(1, Math.round(height * BORDER_FRACTION))

  const samples: Array<[number, number, number]> = []
  for (let y = 0; y < height; y++) {
    const onBorderRow = y < bandH || y >= height - bandH
    for (let x = 0; x < width; x++) {
      const onBorder = onBorderRow || x < bandW || x >= width - bandW
      if (!onBorder) continue
      const idx = (y * width + x) * channels
      samples.push([data[idx], data[idx + 1], data[idx + 2]])
    }
  }

  return modeColor(samples)
}

function modeColor(samples: Array<[number, number, number]>): string {
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>()
  for (const [r, g, b] of samples) {
    const key = `${Math.round(r / QUANTIZE_STEP)}_${Math.round(g / QUANTIZE_STEP)}_${Math.round(b / QUANTIZE_STEP)}`
    const entry = buckets.get(key)
    if (entry) {
      entry.count++
      entry.r += r
      entry.g += g
      entry.b += b
    } else {
      buckets.set(key, { count: 1, r, g, b })
    }
  }

  let best: { count: number; r: number; g: number; b: number } | null = null
  for (const entry of buckets.values()) {
    if (!best || entry.count > best.count) best = entry
  }
  if (!best) return '#FFFFFF'

  return rgbToHex(Math.round(best.r / best.count), Math.round(best.g / best.count), Math.round(best.b / best.count))
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}
