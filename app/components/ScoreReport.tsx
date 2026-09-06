import type { Dimension, Finding, ScoreResult, Severity, Verdict } from '@/lib/scoring-spec'

const bannerErrorClasses = 'rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger'

const VERDICT_LABEL: Record<Verdict, string> = {
  pass: 'No blocking issues found — still needs Copy Approver review',
  needs_review: 'Needs human review before publishing',
  reject: 'Blocked — do not publish',
}

const VERDICT_CLASSES: Record<Verdict, string> = {
  pass: 'border-line-strong bg-canvas-sunken text-ink',
  needs_review: 'border-warn-border bg-warn-bg text-warn',
  reject: 'border-danger-border bg-danger-bg text-danger',
}

const DIMENSION_LABEL: Record<Dimension, string> = {
  policy_claims: 'Policy & claims',
  brand_tone: 'Brand tone',
  brand_language: 'Brand language',
}

const SEVERITY_CLASSES: Record<Severity, string> = {
  critical: 'bg-danger text-white',
  high: 'bg-warn text-white',
  medium: 'border border-line-strong text-ink',
  low: 'border border-line text-muted',
}

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 }

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  )
}

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-line bg-canvas p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={SEVERITY_CLASSES[finding.severity]}>{finding.severity}</Badge>
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{DIMENSION_LABEL[finding.dimension]}</span>
        <span className="text-xs text-subtle">{finding.ruleRef}</span>
      </div>
      {finding.quote && (
        <blockquote className="border-l-2 border-line-strong pl-3 text-sm italic text-ink">“{finding.quote}”</blockquote>
      )}
      <p className="text-sm text-ink">{finding.issue}</p>
      {finding.suggestedFix && (
        <p className="text-xs text-muted">
          <span className="font-medium text-ink">Suggested fix: </span>
          {finding.suggestedFix}
        </p>
      )}
    </div>
  )
}

export interface ScoreReportProps {
  result: ScoreResult | null
  loading: boolean
  error: string | null
  /** Tighter spacing/typography for the sticky inline panel in the generator flow. */
  compact?: boolean
}

export function ScoreReport({ result, loading, error, compact = false }: ScoreReportProps) {
  const heading = compact ? 'text-sm font-bold uppercase tracking-wide text-muted' : 'text-lg font-bold tracking-tight text-ink'

  if (loading) {
    return <p className="text-sm text-subtle">Scoring against policy and brand rules…</p>
  }
  if (error) {
    return <div className={bannerErrorClasses}>{error}</div>
  }
  if (!result) {
    return null
  }

  const sortedFindings = [...result.findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  return (
    <div className="flex flex-col gap-4">
      <h2 className={heading}>Compliance &amp; brand score</h2>

      <div className={`rounded-md border px-4 py-3 text-sm font-medium ${VERDICT_CLASSES[result.verdict]}`}>
        {VERDICT_LABEL[result.verdict]}
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(DIMENSION_LABEL) as Dimension[]).map((dim) => (
          <Badge
            key={dim}
            className={
              result.dimensionVerdicts[dim] === 'reject'
                ? 'bg-danger text-white'
                : result.dimensionVerdicts[dim] === 'needs_review'
                  ? 'bg-warn text-white'
                  : 'border border-line-strong text-ink'
            }
          >
            {DIMENSION_LABEL[dim]}: {result.dimensionVerdicts[dim].replace('_', ' ')}
          </Badge>
        ))}
      </div>

      <p className="text-sm text-muted">{result.summary}</p>

      {result.groundTruthChecked && (
        <p className="text-xs text-subtle">Checked against this creative’s verbatim source payload for fabricated claims.</p>
      )}

      {sortedFindings.length > 0 && (
        <div className="flex flex-col gap-3">
          {sortedFindings.map((f, i) => (
            <FindingCard key={i} finding={f} />
          ))}
        </div>
      )}

      <details className="text-xs text-subtle">
        <summary className="cursor-pointer font-medium text-muted">Limitations of this score</summary>
        <ul className="mt-2 flex flex-col gap-1.5 pl-4 list-disc">
          {result.limitations.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </details>
    </div>
  )
}
