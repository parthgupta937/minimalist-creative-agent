# Minimalist Creative Agent

A web app that turns a beminimalist.co product URL into a finished, downloadable ad creative: paste a PDP link, review the extracted fields, generate a rendered 1080x1080 PNG built entirely from verbatim page content and the real product photo.

This is Part A (the ad generator) of the Nudge.new PM take-home. The full brief is in `docs/assignment.md`. `docs/minimalist-brand-creative-spec.md` is the authoritative brand spec this build follows; `docs/minimalist-brand-guidelines.md` exists in the repo but was deliberately set aside for this build per `implementation_plan/part_a.md` (the two documents conflict on fundamentals, and the reasoning for choosing the spec doc lives in the decision doc, which is out of scope here).

Part B (the scorer) and the written deliverables (decision doc, failure-modes list) are separate parts of the take-home and are out of scope for this repo.

## Run instructions

Requires Node and an Anthropic API key. From the repo root:

```bash
npm install
cp .env.local.example .env.local
# then edit .env.local and set ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

Open `http://localhost:3000`. Paste a `beminimalist.co` (or `www.beminimalist.co`) product page URL and follow the flow. Total time from clone to a running app should be well under two minutes.

## Env var setup

- **`ANTHROPIC_API_KEY`** — get one from the [Anthropic Console](https://console.anthropic.com/). Used server-side only, to run verbatim extraction (never as a copywriter — it copies strings exactly or returns `null`, it never rewrites or invents). It's read via `process.env.ANTHROPIC_API_KEY` inside route handlers (`app/api/fetch-product/route.ts`, `app/api/extract-text/route.ts`) and is never sent to or exposed in the browser.

There's nothing else to configure — no database, no other external service.

## The CORS clarification

The assignment brief flags that browser CORS restrictions might block fetching `beminimalist.co` directly, and asks for a paste/manual fallback for that reason.

This build sidesteps that CORS issue entirely: the PDP fetch happens server-side, in a Next.js route handler (`app/api/fetch-product/route.ts`), not in the browser. CORS only restricts browser-initiated cross-origin requests — it has no effect on a server fetching another server's HTML, which is what happens here.

The manual-entry and paste-content fallback (`app/api/extract-text/route.ts`) still exists in this build, but for different, real reasons, not CORS:

- anti-bot blocking of the server-side fetch,
- client-side-rendered PDP content that a plain HTML fetch can't execute JS for,
- markup drift across Shopify themes/products, which the live smoke test actually ran into (see Known limitations below).

## How the visual gets made

The creative is a rendered layout, not a generated image. `lib/render-creative.tsx` defines a JSX layout that `app/api/render/route.ts` turns into a PNG via `@vercel/og`'s `ImageResponse` (Satori). The same render call serves both the on-page preview and the downloaded file, so there's no drift between what's shown and what's downloaded.

The product photo in the creative is always the real pack image pulled from the PDP itself — nothing about the product is ever generated. A generated depiction of a real product would misrepresent it, which conflicts with Minimalist's "radical transparency" positioning; the full reasoning lives in the decision doc, out of scope here.

## Template decision

The brand spec defines two named templates: Comparison Sheet (needs 2+ SKUs) and Launch Asset (needs an approved backdrop asset library and legally-approved benefit-triplet copy) — both unavailable for a single-URL input. This build implements a third minimal layout instead, called **Template C**: a single-product card on a plain white canvas, reusing Comparison Sheet's per-field verbatim rules for one product. Canvas size is a fixed **1080x1080** (Meta feed square), the one supported placement, since the spec leaves exact pixel dimensions undefined.

## Known limitations

Pulled directly from the real end-to-end smoke test (`implementation_plan/smoke-test-findings.md`), run against three live `beminimalist.co` PDPs (a serum, a moisturizer, a cleanser):

- **Benefits count was widened from 2 to 2-4, as a deliberate spec deviation.** The brand spec's Template-A language calls for exactly two verbatim benefits. All three real product categories tested currently publish **four** verbatim bullets under "What Makes It Potent?", not two — this looked like a site-wide copy/IA change, not a per-product anomaly, and the original "exactly two" rule would hard-stop on effectively every live product. After that finding, the rule was relaxed to accept 2-4 verbatim benefits (still hard-stops below 2; every benefit present renders, none are dropped or truncated to fit). This is a documented product decision, not a bug.
- **A hard-stop shows no partial payload, by design.** If extraction hard-stops on any field (e.g. too few benefits, missing required field), the marketer gets a clean rejection with a specific reason and must fall back to full manual entry — there's no way to fix just the offending field and keep the rest of the extracted data. This was confirmed as a deliberate product decision (favors the spec's "never improvise" posture over convenience), not an oversight.
- **Concern-chip resolution is a judgment call and can vary between runs on the same product.** When a product's tagline is generic marketing copy rather than a specific concern, the extractor falls through to the "Ideal For -> Concerns:" line and takes the text before the first comma. Re-running the same cleanser URL later in testing resolved to a different (but still verbatim, still on-page) string than the first run. Both outputs were real, both were verbatim — but the exact chip text isn't fully stable across repeated extractions of the same product.
- **The 1080x1080 render layout has been hardened for real-length copy, but was originally validated only against short/synthetic strings.** The first smoke-test pass found long ingredient lists overflowing the canvas horizontally and long benefit text pushing the footer strip off the bottom of the canvas. Both were fixed (flexible image region, wrapping ingredient row, tightened font sizes) and re-verified against the same three real URLs with no clipping. The underlying constraint — a fixed-size canvas rendering variable-length verbatim marketing copy — remains something future products could still stress in ways not covered by the three categories tested.
- **A URL slug can go stale relative to live page content.** One tested product's URL slug (`oat-extract-06-...`) no longer matches its current on-page percentage (6.5%, not "06"). Not an extraction bug — the extractor correctly follows the live `<h1>` text rather than the slug — but worth knowing if a URL and the generated creative look out of sync at a glance.

## Verified

Confirmed for this pass: `npm install` completes cleanly and `npm run dev` starts the Next.js dev server serving on `http://localhost:3000`.
