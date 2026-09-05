export interface ProductPayload {
  productName: string
  percentage: string
  formatDescriptor: string | null
  concernChip: string | null
  keyIngredients: string[]
  benefits: [string, string]
  ph: string | null
  usageTime: string | null
  skinType: string | null
  packRenderUrl: string
  price: null
  sourceUrl: string
  fetchedAt: string
}

export type HardStopCode =
  | 'INVALID_PAYLOAD'
  | 'MISSING_REQUIRED_FIELD'
  | 'INSUFFICIENT_BENEFITS'
  | 'TOO_MANY_BENEFITS'
  | 'PRICE_POPULATED'

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
        detail: `Exactly two verbatim benefit strings are required; found ${benefits.length}.`,
      },
    }
  }
  if (benefits.length > 2) {
    return {
      ok: false,
      stop: {
        stopCode: 'TOO_MANY_BENEFITS',
        field: 'benefits',
        detail: `Exactly two verbatim benefit strings are required; found ${benefits.length}.`,
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
    benefits: [benefits[0], benefits[1]],
    ph: toNullableString(raw.ph),
    usageTime: toNullableString(raw.usageTime),
    skinType: toNullableString(raw.skinType),
    packRenderUrl: raw.packRenderUrl,
    price: null,
    sourceUrl: raw.sourceUrl,
    fetchedAt: raw.fetchedAt,
  }

  return { ok: true, payload }
}
