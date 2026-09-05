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

// Plain black-on-white circled tick — never the packaging's ingredient/concern accent
// colour (spec §2.3): the agent only ever places the photographic pack render, it does
// not draw brand-coded chips or rules, so this icon deliberately stays neutral.
const TICK_ICON_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="19" fill="none" stroke="${INK}" stroke-width="2"/>
      <path d="M12 20.5 L17.5 26 L28 14" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  )

export function buildCreativeElement(payload: ProductPayload) {
  const footerParts = [payload.usageTime, payload.skinType, payload.ph].filter(
    (part): part is string => part !== null,
  )

  return (
    <div
      style={{
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: WHITE,
        color: INK,
        fontFamily: 'Inter',
        padding: 64,
        gap: 28,
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: 600,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={payload.packRenderUrl}
          width={600}
          height={600}
          style={{ objectFit: 'contain' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 14 }}>
        <span style={{ fontSize: 46, fontWeight: 700 }}>{payload.productName}</span>
        {/* Black, not brand.accent.orange — orange percentage is a launch-asset-only rule
            (spec §3.4); this build renders Template C only. */}
        <span style={{ fontSize: 46, fontWeight: 700, color: INK }}>{payload.percentage}</span>
      </div>

      {payload.concernChip !== null && (
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            alignItems: 'center',
            border: `2px solid ${INK}`,
            borderRadius: 9999,
            padding: '14px 26px',
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          {payload.concernChip}
        </div>
      )}

      {payload.keyIngredients.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'row', fontSize: 26, gap: 8 }}>
          <span style={{ fontWeight: 700 }}>Key ingredients :</span>
          <span style={{ fontWeight: 400 }}>{payload.keyIngredients.join(', ')}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {payload.benefits.map((benefit, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={TICK_ICON_DATA_URI} width={32} height={32} />
            <span style={{ fontSize: 28, fontWeight: 500 }}>{benefit}</span>
          </div>
        ))}
      </div>

      {footerParts.length > 0 && (
        <div style={{ display: 'flex', marginTop: 'auto', fontSize: 24, fontWeight: 400, color: INK }}>
          {footerParts.join('  ·  ')}
        </div>
      )}
    </div>
  )
}
