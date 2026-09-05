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
        padding: 56,
        gap: 20,
      }}
    >
      {/* flex:1 (not a fixed 600x600 block) so this area shrinks to whatever room is
          left once the text below it (2-4 real-length verbatim benefits) has laid
          out — real PDP benefit copy runs 100-300+ chars each and a fixed-height
          image block pushed the footer strip off the fixed 1080 canvas. */}
      <div
        style={{
          display: 'flex',
          flex: '1 1 0%',
          minHeight: 160,
          width: '100%',
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

      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 14 }}>
        <span style={{ fontSize: 42, fontWeight: 700 }}>{payload.productName}</span>
        {/* Black, not brand.accent.orange — orange percentage is a launch-asset-only rule
            (spec §3.4); this build renders Template C only. */}
        <span style={{ fontSize: 42, fontWeight: 700, color: INK }}>{payload.percentage}</span>
      </div>

      {payload.concernChip !== null && (
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            alignItems: 'center',
            border: `2px solid ${INK}`,
            borderRadius: 9999,
            padding: '12px 24px',
            fontSize: 26,
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          {payload.concernChip}
        </div>
      )}

      {payload.keyIngredients.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', fontSize: 24, lineHeight: 1.4, gap: 8 }}>
          <span style={{ fontWeight: 700, flexShrink: 0 }}>Key ingredients :</span>
          {/* flex:1 + minWidth:0 forces satori to constrain this span to the row's
              remaining width so long ingredient lists wrap instead of clipping past
              the right edge of the canvas. */}
          <span style={{ fontWeight: 400, flex: 1, minWidth: 0 }}>{payload.keyIngredients.join(', ')}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {payload.benefits.map((benefit, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={TICK_ICON_DATA_URI} width={30} height={30} alt="" style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.35, flex: 1, minWidth: 0 }}>{benefit}</span>
          </div>
        ))}
      </div>

      {footerParts.length > 0 && (
        <div style={{ display: 'flex', marginTop: 'auto', fontSize: 22, fontWeight: 400, color: INK }}>
          {footerParts.join('  ·  ')}
        </div>
      )}
    </div>
  )
}
