'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ScoreReport } from '@/app/components/ScoreReport'
import type { ScoreResult } from '@/lib/scoring-spec'

const primaryButtonClasses =
  'inline-flex items-center justify-center gap-2 rounded-md bg-panel px-5 py-2.5 text-sm font-medium on-panel transition-colors hover:bg-panel-hover disabled:cursor-not-allowed disabled:opacity-40'
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

interface ScoreApiResponse {
  ok: boolean
  result?: ScoreResult
  error?: string
}

export default function ScoreAdPage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(f ? URL.createObjectURL(f) : null)
    setResult(null)
    setError(null)
  }

  async function submitScore(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('image', file)
      if (notes.trim().length > 0) formData.append('notes', notes.trim())
      const res = await fetch('/api/score', { method: 'POST', body: formData })
      const data = (await res.json()) as ScoreApiResponse
      if (data.ok && data.result) {
        setResult(data.result)
      } else {
        setError(data.error ?? `Scoring failed with HTTP ${res.status}.`)
      }
    } catch {
      setError('Network error — could not reach the server. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-canvas-sunken">
      <header className="border-b border-line bg-canvas">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-base font-bold tracking-tight text-ink">Minimalist</p>
            <p className="text-xs font-medium text-muted">Ad Quality Scorer</p>
          </div>
          <Link href="/" className="text-sm font-medium text-muted underline-offset-2 hover:text-ink hover:underline">
            ← Back to generator
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full flex-1 px-6 py-10">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Score any ad creative</h1>
            <p className="mt-1.5 text-sm text-muted">
              Upload a rendered ad image — one this tool generated, or any other Meta/Google creative — and get a
              policy, brand-tone, and brand-language review before it goes live.
            </p>
          </div>

          <form onSubmit={submitScore} className={`${cardClasses} flex flex-col gap-4`}>
            <label className="flex flex-col gap-1.5">
              <span className={labelClasses}>Ad image (PNG, JPEG, or WebP)</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFileChange} className={inputClasses} />
            </label>

            {previewUrl && (
              <div className="flex aspect-square w-full max-w-xs items-center justify-center overflow-hidden rounded-md border border-line bg-canvas-sunken">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Ad to be scored" className="h-full w-full object-contain" />
              </div>
            )}

            <label className="flex flex-col gap-1.5">
              <span className={labelClasses}>Additional context or copy (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Paste the ad's copy if the on-image text is stylized or hard to read, or add any context a reviewer would want…"
                className={inputClasses}
              />
            </label>

            <button type="submit" disabled={!file || loading} className={`self-start ${primaryButtonClasses}`}>
              {loading && <Spinner />}
              {loading ? 'Scoring…' : 'Score this ad'}
            </button>
          </form>

          {error && <div className={bannerErrorClasses}>{error}</div>}

          {(result || loading) && (
            <div className={cardClasses}>
              <ScoreReport result={result} loading={loading} error={null} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
