import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ProductPayload } from '@/lib/spec'

export const CANVAS_SIZE = 1080

const INK = '#000000'
const WHITE = '#FFFFFF'

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
// they're deliberately no longer drawn on-canvas. Canvas background is a fixed flat
// colour regardless of the source photo — "keep the background consistent" — so a
// background-removed pack image (see /api/remove-background) blends onto it seamlessly.
export function buildCreativeElement(payload: ProductPayload) {
  // Real PDP H1s vary: some carry the percentage as a separate token from the name
  // (e.g. "2% Salicylic Acid Serum"), others bake it directly into the name (e.g.
  // "Hair Growth + Anti-Grey 15.6% Hair Serum"). Rendering percentage as its own
  // line unconditionally duplicated it verbatim in the latter case.
  const percentageAlreadyInName = payload.productName.includes(payload.percentage)

  return (
    <div
      style={{
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: WHITE,
        color: INK,
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
              border: `2px solid ${INK}`,
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
            {/* Black, not brand.accent.orange — orange percentage is a launch-asset-only
                rule (spec §3.4); this build renders Template C only. */}
            {!percentageAlreadyInName && (
              <span style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.05, color: INK }}>
                {payload.percentage}
              </span>
            )}
          </div>
          {payload.formatDescriptor !== null && (
            <span style={{ fontSize: 30, fontWeight: 400, color: '#5B5954' }}>{payload.formatDescriptor}</span>
          )}
        </div>

        <div style={{ display: 'flex', width: 64, height: 3, backgroundColor: INK }} />

        <span style={{ fontSize: 30, fontWeight: 400, lineHeight: 1.4, color: INK }}>{payload.tagline}</span>
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
