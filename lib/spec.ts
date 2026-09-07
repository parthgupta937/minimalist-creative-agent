// Extraction prompt targets ~100 chars; 140 leaves real headroom for LLM length
// variance (a live smoke test produced a 127-char tagline against an initial 120
// cap and hard-stopped) without letting the line run long enough to wrap past 3
// lines in the renderer's left column.
export const TAGLINE_MAX_CHARS = 140

export interface ProductPayload {
  productName: string
  percentage: string
  formatDescriptor: string | null
  concernChip: string | null
  keyIngredients: string[]
  // 2-4, not the spec doc's literal "exactly two" (§5.4/8.1) — every real PDP checked
  // in the Sept 2026 smoke test ships 4 verbatim bullets, so "exactly two" hard-stopped
  // on 100% of real products. Confirmed product decision: accept 2-4 verbatim, unmodified.
  benefits: string[]
  // The one deliberately non-verbatim field (product decision, Sept 2026 redesign):
  // a short synthesized summary grounded only in the verbatim fields above (never a
  // new claim). Required on-canvas copy for the decluttered hero layout that replaced
  // the full benefits list; benefits/keyIngredients/ph/usageTime/skinType are still
  // extracted and validated for grounding + the review form, just no longer rendered.
  tagline: string
  ph: string | null
  usageTime: string | null
  skinType: string | null
  packRenderUrl: string
  // Sampled from the four corners of the pack photo (lib/sample-background-color.ts)
  // and used as the product-image panel's canvas background, so the photo's own
  // studio backdrop blends in without needing an ML cutout. Null until sampled;
  // the renderer falls back to plain white.
  bgColor: string | null
  price: null
  sourceUrl: string
  fetchedAt: string
}

export type HardStopCode =
  | 'INVALID_PAYLOAD'
  | 'MISSING_REQUIRED_FIELD'
  | 'INSUFFICIENT_BENEFITS'
  | 'TOO_MANY_BENEFITS'
  | 'TAGLINE_TOO_LONG'
  | 'PRICE_POPULATED'
  | 'INVALID_DOMAIN'
  | 'FETCH_FAILED'
  | 'EXTRACTION_FAILED'

export interface HardStop {
  stopCode: HardStopCode
  field: string
  detail: string
}

export type ValidationResult =
  | { ok: true; payload: ProductPayload }
  | { ok: false; stop: HardStop }

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function toNullableString(value: unknown): string | null {
  return isNonEmptyString(value) ? value : null
}

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

// A malformed sampled color is a cosmetic miss, not a reason to block generation —
// silently fall back to null (renderer defaults to white) rather than hard-stopping.
function toNullableHexColor(value: unknown): string | null {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value) ? value : null
}

function missingField(field: string): ValidationResult {
  return {
    ok: false,
    stop: {
      stopCode: 'MISSING_REQUIRED_FIELD',
      field,
      detail: `Required field "${field}" is missing or empty.`,
    },
  }
}

export function validatePayload(input: unknown): ValidationResult {
  if (typeof input !== 'object' || input === null) {
    return {
      ok: false,
      stop: {
        stopCode: 'INVALID_PAYLOAD',
        field: 'root',
        detail: 'Payload must be an object.',
      },
    }
  }

  const raw = input as Record<string, unknown>

  if (!isNonEmptyString(raw.productName)) return missingField('productName')
  if (!isNonEmptyString(raw.percentage)) return missingField('percentage')
  if (!isNonEmptyString(raw.packRenderUrl)) return missingField('packRenderUrl')
  if (!isNonEmptyString(raw.sourceUrl)) return missingField('sourceUrl')
  if (!isNonEmptyString(raw.fetchedAt)) return missingField('fetchedAt')

  if (!Array.isArray(raw.keyIngredients) || !raw.keyIngredients.every((v) => typeof v === 'string')) {
    return missingField('keyIngredients')
  }

  const benefits = raw.benefits
  if (!Array.isArray(benefits) || !benefits.every(isNonEmptyString)) {
    return missingField('benefits')
  }
  if (benefits.length < 2) {
    return {
      ok: false,
      stop: {
        stopCode: 'INSUFFICIENT_BENEFITS',
        field: 'benefits',
        detail: `Between two and four verbatim benefit strings are required; found ${benefits.length}.`,
      },
    }
  }
  if (benefits.length > 4) {
    return {
      ok: false,
      stop: {
        stopCode: 'TOO_MANY_BENEFITS',
        field: 'benefits',
        detail: `Between two and four verbatim benefit strings are required; found ${benefits.length}.`,
      },
    }
  }

  if (!isNonEmptyString(raw.tagline)) return missingField('tagline')
  if (raw.tagline.length > TAGLINE_MAX_CHARS) {
    return {
      ok: false,
      stop: {
        stopCode: 'TAGLINE_TOO_LONG',
        field: 'tagline',
        detail: `Tagline must be ${TAGLINE_MAX_CHARS} characters or fewer; got ${raw.tagline.length}.`,
      },
    }
  }

  if (raw.price !== null && raw.price !== undefined) {
    return {
      ok: false,
      stop: {
        stopCode: 'PRICE_POPULATED',
        field: 'price',
        detail: 'Price must never be extracted or rendered, but a value was present.',
      },
    }
  }

  const payload: ProductPayload = {
    productName: raw.productName,
    percentage: raw.percentage,
    formatDescriptor: toNullableString(raw.formatDescriptor),
    concernChip: toNullableString(raw.concernChip),
    keyIngredients: raw.keyIngredients as string[],
    benefits: benefits as string[],
    tagline: raw.tagline,
    ph: toNullableString(raw.ph),
    usageTime: toNullableString(raw.usageTime),
    skinType: toNullableString(raw.skinType),
    packRenderUrl: raw.packRenderUrl,
    bgColor: toNullableHexColor(raw.bgColor),
    price: null,
    sourceUrl: raw.sourceUrl,
    fetchedAt: raw.fetchedAt,
  }

  return { ok: true, payload }
}
