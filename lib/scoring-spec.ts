export type Dimension = 'policy_claims' | 'brand_tone' | 'brand_language'
export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type Verdict = 'reject' | 'needs_review' | 'pass'

export interface Finding {
  dimension: Dimension
  severity: Severity
  /** Exact text/phrase this finding is about — every finding is content-based (scope
   *  excludes the product photograph), so this is never null in practice. */
  quote: string | null
  issue: string
  /** e.g. "legal.md §3.2", "brand spec §9.2" — lets a reviewer go check the source. */
  ruleRef: string
  /** Action-oriented only ("remove this line") — never a rewritten claim; that would
   *  itself violate the verbatim-only rule the finding is trying to enforce. */
  suggestedFix: string | null
}

export interface ScoreResult {
  verdict: Verdict
  dimensionVerdicts: Record<Dimension, Verdict>
  findings: Finding[]
  summary: string
  limitations: string[]
  /** True only when the caller supplied the verbatim source ProductPayload (i.e. this
   *  tool generated the creative being scored) so fabricated-claim detection ran. */
  groundTruthChecked: boolean
}

// Standing disclaimer, always present regardless of verdict — legal.md §0 lists six
// governance preconditions (approved claim register, SKU concentration record, a named
// Copy Approver, font licence confirmation, etc.) for the file to be considered "live."
// None exist in this repo, so this scorer cannot do what the full framework describes
// (verbatim-match a claim against a register, verify a percentage against a live SKU
// batch). It applies only the parts of legal.md that don't depend on those missing
// registers. Stated here rather than implied, per the assignment's "honesty about
// limitations" bar.
export const SANDBOX_DISCLAIMER =
  'Sandbox tool — legal.md §0 governance preconditions (approved claim register, SKU concentration record, named Copy Approver) are not present in this environment. No verdict here authorizes publication; every asset still requires human Copy Approver review (legal.md §1).'

// Always true regardless of mode (vision OCR vs. known-content). Mode-specific
// limitations (OCR misread risk, font licensing) are appended in lib/score-ad.ts
// only for the vision path, where they actually apply.
export const BASE_LIMITATIONS: string[] = [
  SANDBOX_DISCLAIMER,
  'Scope is on-canvas text/copy only — this reviewer does not evaluate the product photograph itself (composition, backdrop, whether it depicts a specific real product, or any other purely visual element). A visually non-compliant photo (e.g. §3.5/§9.3 imagery rules) is not caught here.',
  'No APPROVED_CLAIM_REGISTER or SKU_CONCENTRATION_RECORD exists, so claims are checked against the hard blocklist (legal.md §3) and tier heuristics (§5/§12.3), not verified against an authoritative register or a live batch concentration.',
  'The deterministic blocklist matches word stems and can false-positive on legitimate brand phrasing (e.g. "barrier repair") — treat every match as something to adjudicate, not an automatic fact.',
  'The deterministic time-bound-claim check only matches a claim with a literal digit ("in 7 days"); vague equivalents ("in just weeks", "soon") rely entirely on model judgment and are not guaranteed to be caught.',
]

const SEVERITY_RANK: Record<Severity, number> = { critical: 3, high: 2, medium: 1, low: 0 }

/**
 * Pure, deterministic aggregation — never the model's own self-graded rollup. The
 * model classifies individual findings; the passing bar itself is fixed in code, so
 * the standard doesn't shift with model mood or phrasing (assignment: "quality of the
 * standard, not the output").
 */
export function deriveVerdict(findings: Finding[]): { verdict: Verdict; dimensionVerdicts: Record<Dimension, Verdict> } {
  const dims: Dimension[] = ['policy_claims', 'brand_tone', 'brand_language']
  const dimensionVerdicts = {} as Record<Dimension, Verdict>

  for (const dim of dims) {
    const dimFindings = findings.filter((f) => f.dimension === dim)
    const worst = dimFindings.reduce((acc, f) => Math.max(acc, SEVERITY_RANK[f.severity]), -1)
    if (dim === 'policy_claims') {
      // Only the policy dimension can reject outright — brand tone/language issues are
      // never themselves a legal blocker, at most a "needs review."
      dimensionVerdicts[dim] = worst >= SEVERITY_RANK.critical ? 'reject' : worst >= SEVERITY_RANK.medium ? 'needs_review' : 'pass'
    } else {
      dimensionVerdicts[dim] = worst >= SEVERITY_RANK.medium ? 'needs_review' : 'pass'
    }
  }

  const verdict: Verdict = dims.some((d) => dimensionVerdicts[d] === 'reject')
    ? 'reject'
    : dims.some((d) => dimensionVerdicts[d] === 'needs_review')
      ? 'needs_review'
      : 'pass'

  return { verdict, dimensionVerdicts }
}
