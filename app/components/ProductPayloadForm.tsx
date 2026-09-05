'use client'

import type { ProductPayload } from '@/lib/spec'

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

function FieldRow({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelClasses}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputClasses}
    />
  )
}

interface ProductPayloadFormProps {
  form: FormState
  onChange: (next: FormState) => void
}

export function ProductPayloadForm({ form, onChange }: ProductPayloadFormProps) {
  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    onChange({ ...form, [key]: value })
  }

  return (
    <div className="flex flex-col gap-4">
      <FieldRow label="Product name" required>
        <TextInput value={form.productName} onChange={(v) => set('productName', v)} />
      </FieldRow>

      <FieldRow label="Percentage" required>
        <TextInput value={form.percentage} onChange={(v) => set('percentage', v)} placeholder="e.g. 10%" />
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

      <FieldRow label="Key ingredients (one per line)">
        <textarea
          value={form.keyIngredientsText}
          onChange={(e) => set('keyIngredientsText', e.target.value)}
          rows={3}
          className={inputClasses}
        />
      </FieldRow>

      <FieldRow label="Benefit 1 (verbatim)" required>
        <TextInput value={form.benefit1} onChange={(v) => set('benefit1', v)} />
      </FieldRow>

      <FieldRow label="Benefit 2 (verbatim)" required>
        <TextInput value={form.benefit2} onChange={(v) => set('benefit2', v)} />
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

      <FieldRow label="Pack render image URL" required>
        <TextInput value={form.packRenderUrl} onChange={(v) => set('packRenderUrl', v)} />
      </FieldRow>

      <FieldRow label="Source URL" required>
        <TextInput value={form.sourceUrl} onChange={(v) => set('sourceUrl', v)} />
      </FieldRow>

      <div className="flex flex-col gap-1">
        <span className={labelClasses}>Fetched at</span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{form.fetchedAt || '—'}</span>
      </div>
    </div>
  )
}
