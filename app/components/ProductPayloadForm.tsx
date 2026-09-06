'use client'

import { useRef } from 'react'
import { TAGLINE_MAX_CHARS, type ProductPayload, type ValidationResult } from '@/lib/spec'

export const MIN_BENEFITS = 2
export const MAX_BENEFITS = 4

export interface FormState {
  productName: string
  percentage: string
  formatDescriptor: string
  concernChip: string
  keyIngredientsText: string
  benefits: string[]
  tagline: string
  ph: string
  usageTime: string
  skinType: string
  packRenderUrl: string
  sourceUrl: string
  fetchedAt: string
  removeBackground: boolean
  bgRemovalProcessing: boolean
  bgRemovalError: string | null
}

export function emptyFormState(sourceUrl = ''): FormState {
  return {
    productName: '',
    percentage: '',
    formatDescriptor: '',
    concernChip: '',
    keyIngredientsText: '',
    benefits: ['', ''],
    tagline: '',
    ph: '',
    usageTime: '',
    skinType: '',
    packRenderUrl: '',
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    removeBackground: false,
    bgRemovalProcessing: false,
    bgRemovalError: null,
  }
}

export function formStateFromPayload(payload: ProductPayload): FormState {
  return {
    productName: payload.productName,
    percentage: payload.percentage,
    formatDescriptor: payload.formatDescriptor ?? '',
    concernChip: payload.concernChip ?? '',
    keyIngredientsText: payload.keyIngredients.join('\n'),
    benefits: payload.benefits.length > 0 ? [...payload.benefits] : ['', ''],
    tagline: payload.tagline,
    ph: payload.ph ?? '',
    usageTime: payload.usageTime ?? '',
    skinType: payload.skinType ?? '',
    packRenderUrl: payload.packRenderUrl,
    sourceUrl: payload.sourceUrl,
    fetchedAt: payload.fetchedAt,
    removeBackground: false,
    bgRemovalProcessing: false,
    bgRemovalError: null,
  }
}

/** Shape fed to validatePayload() — mirrors ProductPayload except benefits/keyIngredients
 * are built fresh from the benefits array and the line-delimited textarea. */
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
    benefits: form.benefits,
    tagline: form.tagline,
    ph: form.ph,
    usageTime: form.usageTime,
    skinType: form.skinType,
    packRenderUrl: form.packRenderUrl,
    price: null,
    sourceUrl: form.sourceUrl,
    fetchedAt: form.fetchedAt,
  }
}

const labelClasses = 'text-sm font-medium text-ink'
const inputClasses =
  'w-full rounded-md border border-line-strong bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-subtle focus:border-ink focus:ring-2 focus:ring-accent/25'
const inputErrorClasses = 'border-danger focus:border-danger focus:ring-danger/20'
const errorTextClasses = 'text-xs text-danger'

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 border-b border-line pb-6 last:border-b-0 last:pb-0">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted">{title}</h3>
        {description && <p className="mt-1 text-xs text-subtle">{description}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

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
    <label className="flex flex-col gap-1.5">
      <span className={labelClasses}>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
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
  tagline?: string | null
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
    'tagline',
    'packRenderUrl',
    'sourceUrl',
    'fetchedAt',
  ])
  if (known.has(field)) return { [field]: detail }
  return { other: detail }
}

interface ProductPayloadFormProps {
  form: FormState
  onChange: (patch: Partial<FormState> | ((prev: FormState) => Partial<FormState>)) => void
  errors?: FieldErrors
}

export function ProductPayloadForm({ form, onChange, errors = {} }: ProductPayloadFormProps) {
  // Sends a partial patch rather than a full { ...form, [key]: value } object — the
  // parent merges it against the LATEST state, so a stale closure (e.g. an in-flight
  // async call from a previous render) can never clobber a field a concurrent update
  // just wrote.
  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    onChange({ [key]: value } as Partial<FormState>)
  }
  // Synchronous re-entrancy guard: React state (bgRemovalProcessing) only blocks a
  // second click after a re-render commits, which isn't fast enough to catch two
  // click events that land in the same tick (observed: two "Process background
  // removal" requests completing milliseconds apart, racing to set packRenderUrl).
  // A ref is mutated immediately, so the second call sees it before the first
  // await ever yields.
  const bgRemovalInFlight = useRef(false)

  return (
    <div className="flex flex-col gap-6">
      {errors.other && <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger">{errors.other}</div>}

      <Section title="Identity" description="What the creative headlines with.">
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
      </Section>

      <Section title="Claims" description="Verbatim from the PDP, except the tagline (see below).">
        <FieldRow label="Key ingredients (one per line)" error={errors.keyIngredients}>
          <textarea
            value={form.keyIngredientsText}
            onChange={(e) => set('keyIngredientsText', e.target.value)}
            rows={3}
            className={`${inputClasses} ${errors.keyIngredients ? inputErrorClasses : ''}`}
          />
        </FieldRow>

        <div className="flex flex-col gap-2">
          <span className={labelClasses}>
            Benefits (verbatim, {MIN_BENEFITS}-{MAX_BENEFITS})
            <span className="text-danger"> *</span>
          </span>
          {form.benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <TextInput
                  value={benefit}
                  onChange={(v) => {
                    const next = [...form.benefits]
                    next[index] = v
                    set('benefits', next)
                  }}
                  placeholder={`Benefit ${index + 1}`}
                  hasError={!!errors.benefits}
                />
              </div>
              <button
                type="button"
                onClick={() => set('benefits', form.benefits.filter((_, i) => i !== index))}
                disabled={form.benefits.length <= MIN_BENEFITS}
                className="rounded-md border border-line-strong px-2.5 py-2 text-xs font-medium text-muted transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set('benefits', [...form.benefits, ''])}
            disabled={form.benefits.length >= MAX_BENEFITS}
            className="self-start rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Add benefit
          </button>
          {errors.benefits && <span className={errorTextClasses}>{errors.benefits}</span>}
        </div>

        <FieldRow label={`Tagline (shown on the creative, max ${TAGLINE_MAX_CHARS} chars)`} required error={errors.tagline}>
          <textarea
            value={form.tagline}
            onChange={(e) => set('tagline', e.target.value)}
            rows={2}
            placeholder="A short, grounded summary of the benefits above — this is the one field the model is allowed to condense rather than copy verbatim."
            className={`${inputClasses} ${errors.tagline ? inputErrorClasses : ''}`}
          />
          <span className="text-xs text-subtle">
            {form.tagline.length}/{TAGLINE_MAX_CHARS}
          </span>
        </FieldRow>
      </Section>

      <Section title="Attributes" description="Not shown on-canvas, kept for the record and as tagline grounding.">
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
      </Section>

      <Section title="Image">
        <FieldRow label="Pack render image URL" required error={errors.packRenderUrl}>
          <TextInput
            value={form.packRenderUrl}
            onChange={(v) => set('packRenderUrl', v)}
            hasError={!!errors.packRenderUrl}
          />
        </FieldRow>

        <div className="flex flex-col gap-3 rounded-md border border-line bg-canvas-sunken p-4">
          <p className={labelClasses}>Product image background</p>
          <p className="text-xs text-subtle">
            The creative places this image straight onto a fixed canvas background, so a
            background-removed (transparent) pack shot blends in — recommended before generating.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="removeBackground"
              checked={form.removeBackground}
              onChange={(e) => set('removeBackground', e.target.checked)}
              disabled={form.bgRemovalProcessing}
              className="h-4 w-4 cursor-pointer accent-(--color-panel)"
            />
            <label htmlFor="removeBackground" className={`${labelClasses} cursor-pointer`}>
              Remove image background before generating
            </label>
          </div>
          {form.removeBackground && (
            <button
              type="button"
              onClick={async () => {
                if (bgRemovalInFlight.current) return
                bgRemovalInFlight.current = true
                onChange({ bgRemovalProcessing: true, bgRemovalError: null })
                try {
                  const res = await fetch('/api/remove-background', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageUrl: form.packRenderUrl }),
                  })
                  const data = (await res.json()) as { imageUrl?: string; error?: string }
                  if (data.imageUrl) {
                    onChange({ packRenderUrl: data.imageUrl })
                  } else {
                    onChange({ bgRemovalError: data.error || 'Unknown error' })
                  }
                } catch (err) {
                  onChange({ bgRemovalError: err instanceof Error ? err.message : 'Unknown error' })
                } finally {
                  bgRemovalInFlight.current = false
                  onChange({ bgRemovalProcessing: false })
                }
              }}
              disabled={form.bgRemovalProcessing || !form.packRenderUrl.trim()}
              className="inline-flex w-fit items-center gap-2 rounded-md bg-panel px-3 py-1.5 text-xs font-medium on-panel transition-colors hover:bg-panel-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {form.bgRemovalProcessing ? 'Processing…' : 'Process background removal'}
            </button>
          )}
          {form.bgRemovalError && (
            <p className={errorTextClasses}>
              Background removal failed: {form.bgRemovalError}. Make sure the local Rembg server is
              running (<code className="font-mono">python3 rembg-server.py</code>) — this is a local,
              optional enhancement, not a hard-stop, so you can still generate with the original image.
            </p>
          )}
          {form.packRenderUrl.trim() && (
            <div className="flex items-center gap-3 rounded-md border border-line bg-canvas p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.packRenderUrl}
                alt="Current pack render preview"
                className="h-20 w-20 rounded-md border border-line object-contain"
              />
              <span className="text-xs font-medium text-muted">
                {form.packRenderUrl.startsWith('data:')
                  ? '✓ Background-removed image is active — this is what Generate will use.'
                  : 'Original image URL is active — background has not been removed yet.'}
              </span>
            </div>
          )}
        </div>
      </Section>

      <Section title="Source">
        <FieldRow label="Source URL" required error={errors.sourceUrl}>
          <TextInput value={form.sourceUrl} onChange={(v) => set('sourceUrl', v)} hasError={!!errors.sourceUrl} />
        </FieldRow>

        <div className="flex flex-col gap-1">
          <span className={labelClasses}>Fetched at</span>
          <span className="text-sm text-muted">{form.fetchedAt || '—'}</span>
          {errors.fetchedAt && <span className={errorTextClasses}>{errors.fetchedAt}</span>}
        </div>
      </Section>
    </div>
  )
}
