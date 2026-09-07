import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ProductPayload } from '@/lib/spec'

export const CANVAS_SIZE = 1080

const INK = '#000000'
const WHITE = '#FFFFFF'
const MUTED_ON_LIGHT = '#5B5954'
const MUTED_ON_DARK = '#C9C7C2'

function hexToRgb(hex: string): [number, number, number] {
  const int = parseInt(hex.slice(1), 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

// Perceptual luminance (not gamma-correct, but plenty for a light/dark text-colour
// decision) — picks white ink on a dark sampled backdrop, black ink on a light one,
// so a photo shot on a dark studio background doesn't render illegible black-on-black.
function isDark(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex)
  return 0.299 * r + 0.587 * g + 0.114 * b < 140
}

type SatoriFont = {
  name: string
  data: ArrayBuffer
  weight: 400 | 500 | 700
  style: 'normal'
}

async function loadFont(fileName: string): Promise<ArrayBuffer> {
  const buffer = await readFile(path.join(process.cwd(), 'public', 'fonts', fileName))
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
}

export async function loadCreativeFonts(): Promise<SatoriFont[]> {
  const [regular, medium, bold] = await Promise.all([
    loadFont('Inter-Regular.woff'),
    loadFont('Inter-Medium.woff'),
    loadFont('Inter-Bold.woff'),
  ])
  return [
    { name: 'Inter', data: regular, weight: 400, style: 'normal' },
    { name: 'Inter', data: medium, weight: 500, style: 'normal' },
    { name: 'Inter', data: bold, weight: 700, style: 'normal' },
  ]
}

// Sept 2026 redesign (product decision, replacing the original multi-bullet Template C
// layout): a decluttered hero card matching Minimalist's own real ad style — eyebrow
// concern pill, headline + percentage, format descriptor, one synthesized tagline, and
// a large product shot. keyIngredients/benefits/ph/usageTime/skinType are still
// extracted and validated (lib/spec.ts) for the review form and as tagline grounding,
// they're deliberately no longer drawn on-canvas. The whole canvas (both the text side
// and the product-image side) is filled with payload.bgColor — the pack photo's own
// studio backdrop colour, sampled by lib/sample-background-color.ts — so the photo
// blends in without needing an ML background cutout, and text/chip/rule colours flip
// to white-on-dark automatically when that sampled colour is dark.
export function buildCreativeElement(payload: ProductPayload) {
  // Real PDP H1s vary: some carry the percentage as a separate token from the name
  // (e.g. "2% Salicylic Acid Serum"), others bake it directly into the name (e.g.
  // "Hair Growth + Anti-Grey 15.6% Hair Serum"). Rendering percentage as its own
  // line unconditionally duplicated it verbatim in the latter case.
  const percentageAlreadyInName = payload.productName.includes(payload.percentage)

  const canvasColor = payload.bgColor ?? WHITE
  const dark = isDark(canvasColor)
  const textColor = dark ? WHITE : INK
  const mutedColor = dark ? MUTED_ON_DARK : MUTED_ON_LIGHT

  return (
    <div
      style={{
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: canvasColor,
        color: textColor,
        fontFamily: 'Inter',
        padding: 72,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '46%',
          paddingRight: 40,
          gap: 24,
        }}
      >
        {payload.concernChip !== null && (
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              alignItems: 'center',
              border: `2px solid ${textColor}`,
              borderRadius: 9999,
              padding: '10px 22px',
              fontSize: 22,
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            {payload.concernChip}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.05 }}>{payload.productName}</span>
            {/* Same textColor as the name, not brand.accent.orange — orange percentage
                is a launch-asset-only rule (spec §3.4); this build renders Template C only. */}
            {!percentageAlreadyInName && (
              <span style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.05, color: textColor }}>
                {payload.percentage}
              </span>
            )}
          </div>
          {payload.formatDescriptor !== null && (
            <span style={{ fontSize: 30, fontWeight: 400, color: mutedColor }}>{payload.formatDescriptor}</span>
          )}
        </div>

        <div style={{ display: 'flex', width: 64, height: 3, backgroundColor: textColor }} />

        <span style={{ fontSize: 30, fontWeight: 400, lineHeight: 1.4, color: textColor }}>{payload.tagline}</span>
      </div>

      <div
        style={{
          display: 'flex',
          width: '54%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={payload.packRenderUrl}
          width="100%"
          height="100%"
          style={{ objectFit: 'contain' }}
          alt=""
        />
      </div>
    </div>
  )
}
