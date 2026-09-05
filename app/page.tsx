'use client'

import { useMemo, useState } from 'react'
import { validatePayload, type ValidationResult } from '@/lib/spec'
import {
  ProductPayloadForm,
  buildCandidatePayload,
  emptyFormState,
  fieldErrorsFromValidation,
  formStateFromPayload,
  type FormState,
} from '@/app/components/ProductPayloadForm'

type EntryMode = 'url' | 'paste' | 'manual'
type Step = 'entry' | 'review'

type ApiResponse = ValidationResult | { ok: false; error: string }

const tabClasses = (active: boolean) =>
  `rounded-t px-4 py-2 text-sm font-medium border-b-2 ${
    active
      ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
      : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
  }`

function messageFromApiResponse(data: ApiResponse): string {
  if (!data.ok) {
    if ('stop' in data) return data.stop.detail
    return data.error
  }
  return ''
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
    } catch (err) {
      setBanner(err instanceof Error ? err.message : 'Network error — could not reach the server.')
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
  }

  const validation = useMemo(
    () => (form ? validatePayload(buildCandidatePayload(form)) : null),
    [form],
  )
  const fieldErrors = validation ? fieldErrorsFromValidation(validation) : {}
  const canGenerate = validation?.ok === true

  async function generateCreative() {
    if (!validation?.ok) return
    setRendering(true)
    setRenderError(null)
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
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Network error — could not reach the server.')
    } finally {
      setRendering(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8 px-6 py-16">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Minimalist — Ad Creative Generator
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Pull a beminimalist.co product page, or enter its details by hand, then review every field before
            generating a creative.
          </p>
        </div>

        {step === 'entry' && (
          <div className="flex flex-col gap-6">
            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
              <button type="button" className={tabClasses(mode === 'url')} onClick={() => setMode('url')}>
                Fetch by URL
              </button>
              <button type="button" className={tabClasses(mode === 'paste')} onClick={() => setMode('paste')}>
                Paste content instead
              </button>
              <button type="button" className={tabClasses(mode === 'manual')} onClick={() => setMode('manual')}>
                Enter manually
              </button>
            </div>

            {banner && (
              <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {banner}
              </div>
            )}

            {mode === 'url' && (
              <form onSubmit={submitUrl} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Product page URL
                  </span>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://beminimalist.co/products/..."
                    className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading || urlInput.trim().length === 0}
                  className="self-start rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {loading ? 'Fetching…' : 'Fetch'}
                </button>
              </form>
            )}

            {mode === 'paste' && (
              <form onSubmit={submitPaste} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Source URL (optional but recommended)
                  </span>
                  <input
                    type="text"
                    value={pasteUrl}
                    onChange={(e) => setPasteUrl(e.target.value)}
                    placeholder="https://beminimalist.co/products/..."
                    className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Pasted page text or HTML
                  </span>
                  <textarea
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    rows={10}
                    placeholder="Paste the product page's visible text (or its HTML source) here…"
                    className="w-full rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading || pasteContent.trim().length === 0}
                  className="self-start rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {loading ? 'Extracting…' : 'Extract'}
                </button>
              </form>
            )}

            {mode === 'manual' && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Skip extraction entirely and type every field in yourself.
                </p>
                <button
                  type="button"
                  onClick={startManual}
                  className="self-start rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Start manual entry
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'review' && form && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Review &amp; edit</h2>
              <button
                type="button"
                onClick={startOver}
                className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Start over
              </button>
            </div>

            <ProductPayloadForm form={form} onChange={setForm} errors={fieldErrors} />

            <div className="flex flex-col gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <button
                type="button"
                disabled={!canGenerate || rendering}
                onClick={() => void generateCreative()}
                className="self-start rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {rendering ? 'Rendering…' : 'Generate creative'}
              </button>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {canGenerate ? 'All required fields pass validation.' : 'Fix the highlighted field above to enable Generate.'}
              </p>

              {renderError && (
                <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                  {renderError}
                </div>
              )}

              {previewUrl && (
                <div className="mt-4 flex flex-col items-start gap-3">
                  <img
                    src={previewUrl}
                    alt="Generated ad creative preview"
                    className="w-full max-w-sm rounded border border-zinc-200 dark:border-zinc-800"
                  />
                  <a
                    href={previewUrl}
                    download="minimalist-creative.png"
                    className="rounded border border-zinc-900 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900"
                  >
                    Download PNG
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
