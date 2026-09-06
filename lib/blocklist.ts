import type { Severity } from '@/lib/scoring-spec'

export interface BlocklistMatch {
  severity: Severity
  quote: string
  ruleRef: string
  issue: string
}

interface BlocklistEntry {
  pattern: RegExp
  severity: Severity
  ruleRef: string
  issue: string
}

// Sourced directly from docs/legal.md. Section 3 is labeled "Hard blocklist — never
// render" in the document itself, so every term in it is treated as `critical`
// (reject-tier) here rather than left to model judgment — a literal word list should
// never miss a hit because a model was in a lenient mood. Word-stem matching can
// false-positive on legitimate brand phrasing (e.g. "barrier repair"); that's the
// safe failure direction for a compliance tool and is surfaced as a known limitation
// rather than tuned away — a human still adjudicates every match (legal.md §1).
const HARD_BLOCKLIST: BlocklistEntry[] = [
  // §3.1 Treatment and disease language
  ...[
    'cures?', 'treats?', 'treatment for', 'heals?', 'repair(?:s|ed|ing)?', 'prevents?',
    'eliminate[sd]?', 'eradicate[sd]?', 'removes?', 'fix(?:es|ed)?', 'reverse[sd]?',
    'restore[sd]?', 'clinical remedy',
  ].map((term) => ({
    pattern: new RegExp(`\\b${term}\\b`, 'i'),
    severity: 'critical' as Severity,
    ruleRef: 'legal.md §3.1',
    issue: 'Treatment/disease language — implies the product treats, cures, prevents, or heals a condition, which can reclassify a cosmetic as a drug.',
  })),
  ...[
    'acne', 'hyperpigmentation', 'dermatitis', 'eczema', 'psoriasis', 'alopecia', 'rosacea',
    'fungal infection', 'DNA damage',
  ].map((term) => ({
    pattern: new RegExp(`\\b${term}\\b`, 'i'),
    severity: 'critical' as Severity,
    ruleRef: 'legal.md §3.1',
    issue: 'Named medical condition presented as a claim object — blocked regardless of the verb used with it.',
  })),
  // §3.2 Absolutes and superlatives
  ...[
    '100%', 'guaranteed', 'permanent(?:ly)?', 'instant cure', 'no\\.?\\s?1', 'number one',
    'best', 'most effective', "india'?s favou?rite", "india'?s most", 'unmatched', "world'?s best",
  ].map((term) => ({
    pattern: new RegExp(`\\b${term}\\b`, 'i'),
    severity: 'critical' as Severity,
    ruleRef: 'legal.md §3.2',
    issue: 'Unsubstantiated absolute or superlative claim.',
  })),
  // §3.3 Safety absolutes
  ...[
    'no side effects', 'completely safe', 'totally safe', 'zero risk',
    'suitable for everyone', 'safe for all skin types',
  ].map((term) => ({
    pattern: new RegExp(`\\b${term}\\b`, 'i'),
    severity: 'critical' as Severity,
    ruleRef: 'legal.md §3.3',
    issue: 'Safety absolute — cannot be substantiated for a skincare product.',
  })),
  // §3.4 Off-brand and unsubstantiable ("chemical-free products do not exist")
  ...[
    'clean', 'all-natural', 'natural', 'chemical-free', 'toxin-free', 'non-toxic',
    'free from chemicals', 'pure', '100% safe',
  ].map((term) => ({
    pattern: new RegExp(`\\b${term}\\b`, 'i'),
    severity: 'critical' as Severity,
    ruleRef: 'legal.md §3.4',
    issue: 'Contradicts the brand’s own published founding position ("chemical-free products don’t exist") — a compliance and brand-consistency failure at once.',
  })),
  // §5 / §12.3 restricted phrasings — legal sign-off required every use, not an outright
  // ban, so held one tier below the hard blocklist.
  ...[
    'clinically proven', 'dermatologically tested', 'dermatologist recommended',
    'non-comedogenic', 'hypoallergenic', 'proven',
  ].map((term) => ({
    pattern: new RegExp(`\\b${term}\\b`, 'i'),
    severity: 'high' as Severity,
    ruleRef: 'legal.md §5 / §12.3',
    issue: 'Restricted phrasing that always requires recorded legal sign-off before use, regardless of register match.',
  })),
  {
    pattern: /\b(?:in|within)\s+\d+\s*(day|days|week|weeks)\b/i,
    severity: 'high',
    ruleRef: 'legal.md §5',
    issue: 'Time-bound result claim (T4) — requires legal sign-off every use.',
  },
]

/**
 * Runs the deterministic hard-blocklist / restricted-phrasing check over every
 * string the vision call read off the ad. Independent of the model's own judgment —
 * a literal legal.md-sourced word list applied by regex, so it can't be missed by
 * an inattentive model pass.
 */
export function scanForBlocklistMatches(extractedText: string[]): BlocklistMatch[] {
  const matches: BlocklistMatch[] = []
  for (const line of extractedText) {
    for (const entry of HARD_BLOCKLIST) {
      const m = entry.pattern.exec(line)
      if (m) {
        matches.push({ severity: entry.severity, quote: m[0], ruleRef: entry.ruleRef, issue: entry.issue })
      }
    }
  }
  return matches
}
