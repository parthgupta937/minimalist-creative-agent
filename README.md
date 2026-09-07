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

## App UI design system

The surrounding tool (entry form, review screen) is a separate surface from the creative itself, but it's now built from the same brand tokens rather than generic Tailwind defaults, so the tool doesn't look like a mismatched wrapper around an on-brand output:

- **Colour** — `brand.ink #000000`, `brand.panel #222222` (primary buttons/badges/active states), `brand.white #FFFFFF`, and `brand.accent.orange #E57131` used sparingly for focus rings only (spec §2.1 scopes orange to launch-asset percentages; the app chrome uses it as the one interactive accent, never on body copy). Defined as CSS custom properties in `app/globals.css` with a dark-mode variant, mapped into Tailwind v4 via `@theme inline` (so e.g. `bg-panel`, `text-muted`, `border-line` are real utilities).
- **Type** — Inter (spec §3.1), loaded via `next/font/google` in `app/layout.tsx`, replacing the scaffold's default Geist.
- **Layout** — the review step is a two-column layout on wider viewports: the editable form on the left, a sticky live creative preview + Generate/Download panel on the right, so the output is visible while editing instead of only appearing after a scroll. Single column on mobile.

## Part B — ad quality scorer

A second surface, `/score` (`app/score/page.tsx`), scores *any* ad creative image — not just ones this tool generated — against `docs/legal.md` and `docs/minimalist-brand-creative-spec.md`. Every generated creative is also auto-scored inline in the main flow, non-blocking: the score never gates the download.

### Three dimensions, not two

The assignment names three distinct axes — Policy & Claims, Brand Tone, Brand Language — and the scorer keeps them separate (`lib/scoring-spec.ts`'s `Dimension` type) rather than collapsing tone and language into one "brand" bucket, since copy can nail Minimalist's vocabulary while still reading like a generic ad, or vice versa.

### Scope: the generated content, not the product photo

The scorer reviews the ad's **text/copy only** — it never judges the product photograph itself (composition, backdrop, whether it depicts a specific real product, human figures, or any other purely visual element). This runs two different ways depending on what's being scored (`lib/score-ad.ts`):

- **Tool-generated creatives** (the auto-score in the main flow): the exact on-canvas text is already known server-side — `lib/render-creative.tsx`'s `getRenderedTextLines()` returns the same lines it draws (chip, headline, percentage, format descriptor, tagline). That text is sent to Claude directly; **no image is uploaded to the model at all** for this path.
- **The standalone `/score` page** (an arbitrary, externally-sourced ad image, no known payload): there's no other source of truth for its text, so vision OCR is unavoidable — but the model is explicitly instructed to extract and judge only the text it reads, never to comment on the photo underneath it.

Earlier in development the scorer sent the rendered image to vision in both cases and let the model report on the photo too — it flagged things like "product image shows competitor packaging" against a placeholder test image. That's a real finding about a real image, but it isn't what a *legal/content* reviewer should be scoring, and it's exactly the kind of judgment the product decision above rules out.

### The blocklist is deterministic code, not model opinion

`docs/legal.md` §3 is a literal "never render" word/phrase list. `lib/blocklist.ts` applies it as regex over the text being reviewed (known on-canvas text, or `extractedText` from vision OCR on the standalone page), guaranteeing no miss regardless of model mood — the model is reserved for judgment only where judgment is actually required (fuzzy brand-voice tone/genericness). The overall verdict is likewise computed by a pure function, `deriveVerdict()` in `lib/scoring-spec.ts`, from each finding's dimension and severity — the model classifies individual findings, but the passing bar itself is fixed in code, not the model's own self-graded rollup. This is the direct answer to "does your scorer encode a real view of what good means, or just ask a model to have opinions and report them back."

Known trade-off, confirmed in testing: word-stem regex can false-positive on legitimate phrasing (e.g. "barrier repair" would trip the `repair` blocklist term) and the time-bound-claim regex only fires on a literal digit ("in 7 days"), missing vague equivalents ("in just weeks") — those rely on model judgment alone. Both are the safe failure direction for a compliance tool and are surfaced in every result's "Limitations" panel, not tuned away.

### `legal.md` itself says its rules aren't "live" here

Section 0 of `legal.md` lists six preconditions (an approved claim register, a SKU concentration record, a named Copy Approver, confirmed font licensing, etc.) before the file may be treated as live; the sandbox alternative applies otherwise. None of those six exist in this repo. So the scorer cannot do what the full framework describes — verbatim-match a claim against a register, or verify a percentage against a live SKU batch. It applies only the parts that don't depend on those missing registers (the hard blocklist, the tier/escalation logic, the content-only text checks, the input-handling rule) and says so explicitly: every score result carries a standing disclaimer (`SANDBOX_DISCLAIMER` in `lib/scoring-spec.ts`), shown in the UI regardless of verdict, that no score here authorizes publication and every asset still needs human Copy Approver review. This is a direct instance of the brief's "honesty about limitations" bar, not an incidental caveat.

### Connecting Part A and Part B

Every generated creative is auto-scored (`app/page.tsx`'s `scoreGeneratedCreative`), and the score renders inline in the same sticky "Creative" panel, right under the download link — but a failing score never disables the download. `legal.md` §1 is explicit that "the agent is not an approver" and "cannot clear its own stop"; by the same logic it has no authority to gate export either. The marketer always sees the score, can't miss it, but a human stays the actual approver.

Tool-generated creatives get one more check the standalone page can't offer, since only they have a known source of truth: because the on-canvas text is pulled directly from the same `ProductPayload` used to render it, any claim there is tautologically grounded — there's no separate "fabricated claim" check to run in known-content mode, since the text can't drift from its own source. (An earlier version of this scorer instead re-read the rendered image via OCR even for tool-generated creatives, and that *did* once catch a real bug: a hyaluronic-acid serum's own physical pack photo carried an unqualified "for all skin types" line, and OCR-based ground-truth checking flagged the mismatch. That trade-off is intentional now — that finding came from reading text baked into the product photo itself, which is exactly the product-photo review this scorer is no longer scoped to do. The standalone `/score` page's vision path would still catch it if that same image were uploaded there.)

### Output shape

Every result is a verdict (`reject` / `needs_review` / `pass`) plus per-finding cards (severity, quoted span, the rule cited, and — only when a fix doesn't require inventing new copy — a suggested fix). `app/components/ScoreReport.tsx` renders this identically inline and on the standalone page.

### Known limitations

- Vision OCR (standalone `/score` page only) can miss or misread small, stylized, or low-contrast type.
- No font-licence verification is possible from an image (`legal.md` §7) — standalone page only.
- No true register/SKU-batch verification exists (see above) — only the blocklist and tier heuristics.
- The standalone page's image-only input means arbitrary ads must be uploaded as a rendered file; there's no URL-fetch path for a third-party ad the way there is for a beminimalist.co PDP in Part A.
- A visually non-compliant product photo (e.g. §3.5/§9.3's imagery rules — human figures, before/after, price/rating overlays) is out of scope by design; this scorer reviews content, not photography.

## Template decision

The brand spec defines two named templates: Comparison Sheet (needs 2+ SKUs) and Launch Asset (needs an approved backdrop asset library and legally-approved benefit-triplet copy) — both unavailable for a single-URL input. This build implements a third minimal layout instead, called **Template C**: a single-product hero card on a plain white canvas, reusing Comparison Sheet's per-field verbatim rules for one product. Canvas size is a fixed **1080x1080** (Meta feed square), the one supported placement, since the spec leaves exact pixel dimensions undefined.

### Sept 2026 redesign

The original Template C layout stacked every extracted field (multi-bullet benefits, a key-ingredients line, a footer strip for pH/usage time/skin type) and read as verbose compared to Minimalist's own real ad style. It was redesigned to match: an outlined concern-chip pill, headline + percentage, format descriptor, a thin rule, one short tagline, and a large product shot — modeled directly on real Minimalist creatives. `keyIngredients`, `benefits`, `ph`, `usageTime`, and `skinType` are still extracted and validated (they stay in the review form and feed the tagline), they're just no longer drawn on-canvas.

Two decisions from that redesign, made explicitly rather than silently:

- **`tagline` is the one field that is deliberately not verbatim.** Every other field is copied character-for-character or hard-stops; `tagline` is a short (≤140 char) summary Claude is explicitly allowed to synthesize in its own words, but only by condensing the already-extracted verbatim `benefits`/`concernChip`/`keyIngredients` — the prompt (`lib/extract.ts`) forbids introducing any claim not already present in those fields. This is a named, product-approved exception to the spec's §9.1 verbatim-only rule, not an oversight.
- **The whole canvas background is driven by the product photo, not a fixed colour** — pack photos ship with differing studio backdrops (grey, off-white, warm-tinted), so the review form has an optional **"Sample background colour"** step (`/api/sample-bg-color`, `lib/sample-background-color.ts`) that averages the four corner patches of the pack photo (downscaled via `sharp`) and applies that colour to the entire creative background — text side included — so the photo blends in with no visible seam anywhere on the canvas. Text/chip/rule colour automatically flips to white when the sampled colour is dark (`lib/render-creative.tsx`'s `isDark` luminance check), so a photo shot on a dark backdrop doesn't render illegible black-on-black.
- Renderer also dedupes `percentage` when a product's own name already bakes it in (e.g. "Hair Growth + Anti-Grey 15.6% Hair Serum") — otherwise it printed twice, once inside the verbatim name and once as its own line.

### Background colour sampling (replaces an earlier ML cutout attempt)

An earlier version of this tool called out to a Python Rembg (ML background-removal) server to produce a transparent-background PNG. That approach was abandoned: even after switching to the smallest available model and disabling onnxruntime's memory-arena allocator, a hosted instance (Render's free tier, 512MB) kept getting OOM-killed under real inference load, and it added an entire second service (a Python process, a separate host, a `REMBG_SERVER_URL` env var) for a problem this corner-colour heuristic solves in-process, in milliseconds, with a library (`sharp`) already in the dependency tree via `@vercel/og`.

The heuristic assumes what's almost always true for studio product photography: a centered product on a clean, uniform backdrop, so the four corners are reliable background samples. Known limitation: a product shot that extends into a corner (unusual for this brand's real pack renders, but possible) will skew the sampled colour — this is a cosmetic miss, not a hard-stop, and the panel falls back to white if sampling fails or is skipped.

## Known limitations

Pulled directly from the real end-to-end smoke test (`implementation_plan/smoke-test-findings.md`), run against three live `beminimalist.co` PDPs (a serum, a moisturizer, a cleanser):

- **Benefits count was widened from 2 to 2-4, as a deliberate spec deviation.** The brand spec's Template-A language calls for exactly two verbatim benefits. All three real product categories tested currently publish **four** verbatim bullets under "What Makes It Potent?", not two — this looked like a site-wide copy/IA change, not a per-product anomaly, and the original "exactly two" rule would hard-stop on effectively every live product. After that finding, the rule was relaxed to accept 2-4 verbatim benefits (still hard-stops below 2; every benefit present renders, none are dropped or truncated to fit). This is a documented product decision, not a bug.
- **A hard-stop shows no partial payload, by design.** If extraction hard-stops on any field (e.g. too few benefits, missing required field), the marketer gets a clean rejection with a specific reason and must fall back to full manual entry — there's no way to fix just the offending field and keep the rest of the extracted data. This was confirmed as a deliberate product decision (favors the spec's "never improvise" posture over convenience), not an oversight.
- **Concern-chip resolution is a judgment call and can vary between runs on the same product.** When a product's tagline is generic marketing copy rather than a specific concern, the extractor falls through to the "Ideal For -> Concerns:" line and takes the text before the first comma. Re-running the same cleanser URL later in testing resolved to a different (but still verbatim, still on-page) string than the first run. Both outputs were real, both were verbatim — but the exact chip text isn't fully stable across repeated extractions of the same product.
- **The 1080x1080 render layout has been hardened for real-length copy, but was originally validated only against short/synthetic strings.** The first smoke-test pass found long ingredient lists overflowing the canvas horizontally and long benefit text pushing the footer strip off the bottom of the canvas. Both were fixed (flexible image region, wrapping ingredient row, tightened font sizes) and re-verified against the same three real URLs with no clipping. The underlying constraint — a fixed-size canvas rendering variable-length verbatim marketing copy — remains something future products could still stress in ways not covered by the three categories tested.
- **A URL slug can go stale relative to live page content.** One tested product's URL slug (`oat-extract-06-...`) no longer matches its current on-page percentage (6.5%, not "06"). Not an extraction bug — the extractor correctly follows the live `<h1>` text rather than the slug — but worth knowing if a URL and the generated creative look out of sync at a glance.
- **The tagline character cap needed a real-data-driven adjustment.** The extraction prompt targets ~100 characters, but a live smoke test on a real hair-serum PDP produced a 127-character tagline against an initial 120-char hard-stop cap — the model doesn't always hit a soft target precisely. The cap was widened to 140 to give real headroom rather than hard-stopping on every slightly-long-but-fine tagline.
- **Corner-colour sampling isn't a cutout — it doesn't remove the product photo's background, it colour-matches the panel behind it.** For the common case (uniform studio backdrop, centered product) this reads as seamless; a busy, gradient, or corner-touching product photo will still show its own background pixels, just no longer clashing against a mismatched fixed colour.

## Verified

Confirmed for this pass: `npm install` completes cleanly and `npm run dev` starts the Next.js dev server serving on `http://localhost:3000`.
