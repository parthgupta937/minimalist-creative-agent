'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { validatePayload, type ValidationResult } from '@/lib/spec'
import {
  ProductPayloadForm,
  buildCandidatePayload,
  emptyFormState,
  fieldErrorsFromValidation,
  formStateFromPayload,
  type FormState,
} from '@/app/components/ProductPayloadForm'
import { ScoreReport } from '@/app/components/ScoreReport'
import type { ScoreResult } from '@/lib/scoring-spec'

type EntryMode = 'url' | 'paste' | 'manual'
type Step = 'entry' | 'review'

type ApiResponse = ValidationResult | { ok: false; error: string }

function messageFromApiResponse(data: ApiResponse): string {
  if (!data.ok) {
    if ('stop' in data) return data.stop.detail
    return data.error
  }
  return ''
}

const primaryButtonClasses =
  'inline-flex items-center justify-center gap-2 rounded-md bg-panel px-5 py-2.5 text-sm font-medium on-panel transition-colors hover:bg-panel-hover disabled:cursor-not-allowed disabled:opacity-40'
const secondaryButtonClasses =
  'inline-flex items-center justify-center gap-2 rounded-md border border-line-strong px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40'
const cardClasses = 'rounded-lg border border-line bg-canvas p-6 sm:p-8'
const labelClasses = 'text-sm font-medium text-ink'
const inputClasses =
  'w-full rounded-md border border-line-strong bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-subtle focus:border-ink focus:ring-2 focus:ring-accent/25'
const bannerErrorClasses = 'rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger'

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Stepper({ step }: { step: Step }) {
  const items: { key: Step; index: number; label: string }[] = [
    { key: 'entry', index: 1, label: 'Source' },
    { key: 'review', index: 2, label: 'Review & generate' },
  ]
  return (
    <ol className="flex items-center gap-3">
      {items.map((item, i) => {
        const active = item.key === step
        const done = step === 'review' && item.key === 'entry'
        return (
          <li key={item.key} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  active || done ? 'bg-panel on-panel' : 'border border-line-strong text-subtle'
                }`}
              >
                {done ? '✓' : item.index}
              </span>
              <span className={`text-sm font-medium ${active ? 'text-ink' : 'text-muted'}`}>{item.label}</span>
            </div>
            {i < items.length - 1 && <span className="h-px w-8 bg-line-strong" />}
          </li>
        )
      })}
    </ol>
  )
}

function EntryTabs({ mode, onSelect }: { mode: EntryMode; onSelect: (m: EntryMode) => void }) {
  const options: { key: EntryMode; label: string }[] = [
    { key: 'url', label: 'Fetch by URL' },
    { key: 'paste', label: 'Paste content' },
    { key: 'manual', label: 'Enter manually' },
  ]
  return (
    <div className="inline-flex gap-1 rounded-md bg-canvas-sunken p-1">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onSelect(opt.key)}
          className={`rounded-sm px-3.5 py-1.5 text-sm font-medium transition-colors ${
            mode === opt.key ? 'bg-panel on-panel' : 'text-muted hover:text-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function Home() {
  const [mode, setMode] = useState<EntryMode>('url')
  const [step, setStep] = useState<Step>('entry')
  const [urlInput, setUrlInput] = useState('')
  const [pasteContent, setPasteContent] = useState('')
  const [pasteUrl, setPasteUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [rendering, setRendering] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [scoring, setScoring] = useState(false)
  const [scoreError, setScoreError] = useState<string | null>(null)
  // Bumped on every generateCreative() call; a scoring response only gets applied if
  // it's still for the latest generation, so a slow score from a superseded
  // Regenerate click can never clobber a newer one.
  const generationRef = useRef(0)

  // Merges a partial patch (or an updater keyed off the latest state) instead of
  // replacing the whole object — a plain setForm(fullObject) from a stale async
  // closure (e.g. two overlapping "Process background removal" calls) can silently
  // clobber a field a concurrent update just wrote. Functional merge makes result
  // order-independent.
  function patchForm(patch: Partial<FormState> | ((prev: FormState) => Partial<FormState>)) {
    setForm((prev) => (prev ? { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) } : prev))
  }

  async function callExtraction(path: string, body: unknown) {
    setLoading(true)
    setBanner(null)
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as ApiResponse
      if (data.ok) {
        setForm(formStateFromPayload(data.payload))
        setStep('review')
      } else {
        setBanner(messageFromApiResponse(data))
      }
    } catch {
      // fetch()/res.json() throw raw browser-internal messages (e.g. "Failed to
      // fetch") that aren't meaningful to a marketer — always show the same plain
      // explanation instead of surfacing err.message verbatim.
      setBanner('Network error — could not reach the server. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function submitUrl(e: React.FormEvent) {
    e.preventDefault()
    void callExtraction('/api/fetch-product', { url: urlInput })
  }

  function submitPaste(e: React.FormEvent) {
    e.preventDefault()
    void callExtraction('/api/extract-text', { content: pasteContent, url: pasteUrl })
  }

  function startManual() {
    setBanner(null)
    setForm(emptyFormState())
    setStep('review')
  }

  function startOver() {
    setForm(null)
    setStep('entry')
    setBanner(null)
    setRenderError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setScoreResult(null)
    setScoreError(null)
  }

  const validation = useMemo(
    () => (form ? validatePayload(buildCandidatePayload(form)) : null),
    [form],
  )
  const fieldErrors = validation ? fieldErrorsFromValidation(validation) : {}
  const canGenerate = validation?.ok === true

  // Fire-and-forget relative to the download link: previewUrl/download availability
  // never depends on scoring state. The agent that generated this creative is not its
  // own approver (legal.md §1), so a score can inform the marketer but never gate
  // export — a human stays the final approver either way.
  async function scoreGeneratedCreative(blob: Blob, payload: unknown, generation: number) {
    setScoring(true)
    setScoreError(null)
    try {
      const formData = new FormData()
      formData.append('image', blob, 'creative.png')
      formData.append('groundTruthPayload', JSON.stringify(payload))
      const res = await fetch('/api/score', { method: 'POST', body: formData })
      const data = (await res.json()) as { ok: boolean; result?: ScoreResult; error?: string }
      if (generation !== generationRef.current) return // superseded by a newer regenerate
      if (data.ok && data.result) {
        setScoreResult(data.result)
      } else {
        setScoreError(data.error ?? `Scoring failed with HTTP ${res.status}.`)
      }
    } catch {
      if (generation !== generationRef.current) return
      setScoreError('Network error — could not reach the server. Check your connection and try again.')
    } finally {
      if (generation === generationRef.current) setScoring(false)
    }
  }

  async function generateCreative() {
    if (!validation?.ok) return
    const generation = ++generationRef.current
    setRendering(true)
    setRenderError(null)
    setScoreResult(null)
    setScoreError(null)
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.payload),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as ApiResponse | null
        setRenderError(data ? messageFromApiResponse(data) : `Render failed with HTTP ${res.status}.`)
        return
      }
      // Same blob backs both the on-page preview and the download — one render call,
      // no re-fetch — so the two can never drift from each other.
      const blob = await res.blob()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(blob))
      void scoreGeneratedCreative(blob, validation.payload, generation)
    } catch {
      setRenderError('Network error — could not reach the server. Check your connection and try again.')
    } finally {
      setRendering(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-canvas-sunken">
      <header className="border-b border-line bg-canvas">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-base font-bold tracking-tight text-ink">Minimalist</p>
            <p className="text-xs font-medium text-muted">Ad Creative Generator</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/score" className="text-sm font-medium text-muted underline-offset-2 hover:text-ink hover:underline">
              Score an ad
            </Link>
            <p className="hidden text-xs font-medium tracking-wide text-subtle sm:block">#HideNothing</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full flex-1 px-6 py-10">
        <div className={step === 'review' ? 'mx-auto max-w-6xl' : 'mx-auto max-w-2xl'}>
          <div className="mb-8 flex flex-col gap-4">
            <Stepper step={step} />
            {step === 'entry' && (
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink">Turn a product page into a creative</h1>
                <p className="mt-1.5 text-sm text-muted">
                  Pull a beminimalist.co product page, or enter its details by hand, then review every field before
                  generating a creative.
                </p>
              </div>
            )}
          </div>

          {step === 'entry' && (
            <div className={`${cardClasses} flex flex-col gap-6`}>
              <EntryTabs mode={mode} onSelect={setMode} />

              {banner && <div className={bannerErrorClasses}>{banner}</div>}

              {mode === 'url' && (
                <form onSubmit={submitUrl} className="flex flex-col gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className={labelClasses}>Product page URL</span>
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://beminimalist.co/products/..."
                      className={inputClasses}
                    />
                  </label>
                  <button type="submit" disabled={loading || urlInput.trim().length === 0} className={`self-start ${primaryButtonClasses}`}>
                    {loading && <Spinner />}
                    {loading ? 'Fetching…' : 'Fetch'}
                  </button>
                </form>
              )}

              {mode === 'paste' && (
                <form onSubmit={submitPaste} className="flex flex-col gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className={labelClasses}>Source URL (optional but recommended)</span>
                    <input
                      type="text"
                      value={pasteUrl}
                      onChange={(e) => setPasteUrl(e.target.value)}
                      placeholder="https://beminimalist.co/products/..."
                      className={inputClasses}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className={labelClasses}>Pasted page text or HTML</span>
                    <textarea
                      value={pasteContent}
                      onChange={(e) => setPasteContent(e.target.value)}
                      rows={10}
                      placeholder="Paste the product page's visible text (or its HTML source) here…"
                      className={`${inputClasses} font-mono text-xs`}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={loading || pasteContent.trim().length === 0}
                    className={`self-start ${primaryButtonClasses}`}
                  >
                    {loading && <Spinner />}
                    {loading ? 'Extracting…' : 'Extract'}
                  </button>
                </form>
              )}

              {mode === 'manual' && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-muted">Skip extraction entirely and type every field in yourself.</p>
                  <button type="button" onClick={startManual} className={`self-start ${primaryButtonClasses}`}>
                    Start manual entry
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'review' && form && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold tracking-tight text-ink">Review &amp; edit</h2>
                  <button type="button" onClick={startOver} className="text-sm font-medium text-muted underline-offset-2 hover:text-ink hover:underline">
                    Start over
                  </button>
                </div>
                <div className={cardClasses}>
                  <ProductPayloadForm form={form} onChange={patchForm} errors={fieldErrors} />
                </div>
              </div>

              <div className="lg:sticky lg:top-8 lg:self-start">
                <div className={`${cardClasses} flex flex-col gap-4`}>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Creative</h2>

                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border border-line bg-canvas-sunken">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} alt="Generated ad creative preview" className="h-full w-full object-contain" />
                    ) : (
                      <p className="px-6 text-center text-sm text-subtle">
                        {rendering ? 'Rendering your creative…' : 'Your 1080×1080 creative will appear here.'}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!canGenerate || rendering}
                    onClick={() => void generateCreative()}
                    className={primaryButtonClasses}
                  >
                    {rendering && <Spinner />}
                    {rendering ? 'Rendering…' : previewUrl ? 'Regenerate creative' : 'Generate creative'}
                  </button>
                  <p className="text-xs text-subtle">
                    {canGenerate ? 'All required fields pass validation.' : 'Fix the highlighted field to enable Generate.'}
                  </p>

                  {renderError && <div className={bannerErrorClasses}>{renderError}</div>}

                  {previewUrl && (
                    <a href={previewUrl} download="minimalist-creative.png" className={`text-center ${secondaryButtonClasses}`}>
                      Download PNG
                    </a>
                  )}

                  {(scoring || scoreResult || scoreError) && (
                    <div className="border-t border-line pt-4">
                      <ScoreReport result={scoreResult} loading={scoring} error={scoreError} compact />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
