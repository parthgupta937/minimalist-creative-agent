'use client'

import type { ProductPayload, ValidationResult } from '@/lib/spec'

export interface FormState {
  productName: string
  percentage: string
  formatDescriptor: string
  concernChip: string
  keyIngredientsText: string
  benefit1: string
  benefit2: string
  ph: string
  usageTime: string
  skinType: string
  packRenderUrl: string
  sourceUrl: string
  fetchedAt: string
}

export function emptyFormState(sourceUrl = ''): FormState {
  return {
    productName: '',
    percentage: '',
    formatDescriptor: '',
    concernChip: '',
    keyIngredientsText: '',
    benefit1: '',
    benefit2: '',
    ph: '',
    usageTime: '',
    skinType: '',
    packRenderUrl: '',
    sourceUrl,
    fetchedAt: new Date().toISOString(),
  }
}

export function formStateFromPayload(payload: ProductPayload): FormState {
  return {
    productName: payload.productName,
    percentage: payload.percentage,
    formatDescriptor: payload.formatDescriptor ?? '',
    concernChip: payload.concernChip ?? '',
    keyIngredientsText: payload.keyIngredients.join('\n'),
    benefit1: payload.benefits[0] ?? '',
    benefit2: payload.benefits[1] ?? '',
    ph: payload.ph ?? '',
    usageTime: payload.usageTime ?? '',
    skinType: payload.skinType ?? '',
    packRenderUrl: payload.packRenderUrl,
    sourceUrl: payload.sourceUrl,
    fetchedAt: payload.fetchedAt,
  }
}

/** Shape fed to validatePayload() — mirrors ProductPayload except benefits/keyIngredients
 * are built fresh from the two dedicated benefit fields and the line-delimited textarea. */
export function buildCandidatePayload(form: FormState): unknown {
  return {
    productName: form.productName,
    percentage: form.percentage,
    formatDescriptor: form.formatDescriptor,
    concernChip: form.concernChip,
    keyIngredients: form.keyIngredientsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    benefits: [form.benefit1, form.benefit2],
    ph: form.ph,
    usageTime: form.usageTime,
    skinType: form.skinType,
    packRenderUrl: form.packRenderUrl,
    price: null,
    sourceUrl: form.sourceUrl,
    fetchedAt: form.fetchedAt,
  }
}

const labelClasses = 'text-sm font-medium text-zinc-700 dark:text-zinc-300'
const inputClasses =
  'w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
const inputErrorClasses = 'border-red-500 dark:border-red-500'
const errorTextClasses = 'text-xs text-red-600 dark:text-red-400'

function FieldRow({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelClasses}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
      {error ? <span className={errorTextClasses}>{error}</span> : null}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  hasError,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hasError?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputClasses} ${hasError ? inputErrorClasses : ''}`}
    />
  )
}

/** Maps a HardStop onto the single form field(s) it should be displayed under.
 * validatePayload() short-circuits on the first problem, so at most one of
 * these is ever non-null at a time. */
export interface FieldErrors {
  productName?: string | null
  percentage?: string | null
  keyIngredients?: string | null
  benefits?: string | null
  packRenderUrl?: string | null
  sourceUrl?: string | null
  fetchedAt?: string | null
  other?: string | null
}

export function fieldErrorsFromValidation(validation: ValidationResult): FieldErrors {
  if (validation.ok) return {}
  const { field, detail } = validation.stop
  const known = new Set([
    'productName',
    'percentage',
    'keyIngredients',
    'benefits',
    'packRenderUrl',
    'sourceUrl',
    'fetchedAt',
  ])
  if (known.has(field)) return { [field]: detail }
  return { other: detail }
}

interface ProductPayloadFormProps {
  form: FormState
  onChange: (next: FormState) => void
  errors?: FieldErrors
}

export function ProductPayloadForm({ form, onChange, errors = {} }: ProductPayloadFormProps) {
  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    onChange({ ...form, [key]: value })
  }

  return (
    <div className="flex flex-col gap-4">
      {errors.other && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {errors.other}
        </div>
      )}

      <FieldRow label="Product name" required error={errors.productName}>
        <TextInput
          value={form.productName}
          onChange={(v) => set('productName', v)}
          hasError={!!errors.productName}
        />
      </FieldRow>

      <FieldRow label="Percentage" required error={errors.percentage}>
        <TextInput
          value={form.percentage}
          onChange={(v) => set('percentage', v)}
          placeholder="e.g. 10%"
          hasError={!!errors.percentage}
        />
      </FieldRow>

      <FieldRow label="Format descriptor">
        <TextInput
          value={form.formatDescriptor}
          onChange={(v) => set('formatDescriptor', v)}
          placeholder="e.g. Face Serum"
        />
      </FieldRow>

      <FieldRow label="Concern chip">
        <TextInput
          value={form.concernChip}
          onChange={(v) => set('concernChip', v)}
          placeholder="e.g. Acne & Marks"
        />
      </FieldRow>

      <FieldRow label="Key ingredients (one per line)" error={errors.keyIngredients}>
        <textarea
          value={form.keyIngredientsText}
          onChange={(e) => set('keyIngredientsText', e.target.value)}
          rows={3}
          className={`${inputClasses} ${errors.keyIngredients ? inputErrorClasses : ''}`}
        />
      </FieldRow>

      <FieldRow label="Benefit 1 (verbatim)" required error={errors.benefits}>
        <TextInput value={form.benefit1} onChange={(v) => set('benefit1', v)} hasError={!!errors.benefits} />
      </FieldRow>

      <FieldRow label="Benefit 2 (verbatim)" required error={errors.benefits}>
        <TextInput value={form.benefit2} onChange={(v) => set('benefit2', v)} hasError={!!errors.benefits} />
      </FieldRow>

      <FieldRow label="pH">
        <TextInput value={form.ph} onChange={(v) => set('ph', v)} placeholder="e.g. 6.0 - 7.0" />
      </FieldRow>

      <FieldRow label="Usage time">
        <TextInput
          value={form.usageTime}
          onChange={(v) => set('usageTime', v)}
          placeholder="e.g. AM & PM everyday"
        />
      </FieldRow>

      <FieldRow label="Skin type">
        <TextInput value={form.skinType} onChange={(v) => set('skinType', v)} placeholder="e.g. All Skin Types" />
      </FieldRow>

      <FieldRow label="Pack render image URL" required error={errors.packRenderUrl}>
        <TextInput
          value={form.packRenderUrl}
          onChange={(v) => set('packRenderUrl', v)}
          hasError={!!errors.packRenderUrl}
        />
      </FieldRow>

      <FieldRow label="Source URL" required error={errors.sourceUrl}>
        <TextInput value={form.sourceUrl} onChange={(v) => set('sourceUrl', v)} hasError={!!errors.sourceUrl} />
      </FieldRow>

      <div className="flex flex-col gap-1">
        <span className={labelClasses}>Fetched at</span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{form.fetchedAt || '—'}</span>
        {errors.fetchedAt && <span className={errorTextClasses}>{errors.fetchedAt}</span>}
      </div>
    </div>
  )
}
