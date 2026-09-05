# Task 9 — Real-page smoke test findings

Date: 2026-09-05
Scope: live end-to-end test of `/api/fetch-product` and `/api/render` against three
real, category-diverse `beminimalist.co` PDPs, now that the Anthropic account has
credit. This is a test-and-document pass only; see "Code changes" below for the one
thing that was touched (and reverted) during investigation.

## URLs tested

| Category | URL |
|---|---|
| Serum | `https://www.beminimalist.co/products/2-hyaluronic-acid` |
| Moisturizer | `https://www.beminimalist.co/products/vitamin-b5-10-moisturizer` |
| Cleanser | `https://www.beminimalist.co/products/oat-extract-06-gentle-cleanser` |

## Headline result

The Claude call itself now works — the earlier "credit balance too low" 400 is gone;
`POST /api/fetch-product` completes and calls the model successfully for all three
URLs. **All three, however, hit the same hard-stop: `TOO_MANY_BENEFITS` (4 found,
2 required).** This is not limited to the hyaluronic-acid serum as originally
flagged — the live site currently publishes **four** verbatim bullets under
"What Makes It Potent?" on every one of the three categories checked (serum,
moisturizer, cleanser), not two. I confirmed this directly against the raw cached
HTML (not just the model's say-so) — each page's `.toggle__content` under that
heading contains exactly 4 `<li>` elements, and the model's extracted `benefits`
array matches those 4 `<li>` strings character-for-character in all three cases.

So the finding is upgraded from "one known edge case (hyaluronic acid)" to
**"the 'exactly two benefits' assumption does not match the current state of any
of the three checked live product categories."** This looks like a site-wide
copy/IA change (all product categories now ship 4 bullets under that heading)
rather than a per-product anomaly. Per the confirmed product decision, this is
working as designed — no partial data leaks out, the marketer gets a clean,
correctly-worded hard-stop and must fall back to manual entry. It is a strong
candidate for the assignment's "known limitations" note: as of the current PDP
markup, essentially no live product will pass this specific validation rule.

## Per-product outcome

### 1. Hyaluronic + PGA 2% Face Serum
- `POST /api/fetch-product`: **HTTP 422**, `{"stopCode":"TOO_MANY_BENEFITS","field":"benefits","detail":"Exactly two verbatim benefit strings are required; found 4."}`
- Hard-stop fired cleanly, no partial payload returned, `detail` message is accurate and specific (states the actual count found).

### 2. Vitamin B5 10% Moisturizer
- `POST /api/fetch-product`: **HTTP 422**, same `TOO_MANY_BENEFITS` stop, "found 4."
- Same clean behavior as above.

### 3. B12 + Oat Extract 6.5% Gentle Cleanser
- `POST /api/fetch-product`: **HTTP 422**, same `TOO_MANY_BENEFITS` stop, "found 4."
- Same clean behavior as above. Note also: this product's current H1 is
  "B12 + Oat Extract 6.5% Gentle Cleanser" — the URL slug (`oat-extract-06-...`)
  is stale relative to the live title/percentage (now 6.5%, not "06%"); this is a
  site content/URL-history quirk, not an extraction bug — the extractor correctly
  followed the live H1 text rather than the slug.

## Field-fidelity spot-check (diagnostic bypass of the hard-stop)

To confirm the model's actual field-level fidelity — not just that it hard-stopped
correctly — I temporarily added a one-line diagnostic `console.error` in
`lib/extract.ts` (immediately before the `validatePayload()` call in
`extractProductPayload`) to print the raw model output before validation discards
it on a hard-stop. This let me compare Claude's real output against the raw cached
HTML for every field, not just the ones that happen to survive validation. The line
was removed immediately after use — `git diff` on `lib/extract.ts` is empty; nothing
extra shipped. (The `ANTHROPIC_API_KEY` value itself was never printed by this or
any other step.)

Result: **every field matched the raw page content exactly, verbatim, for all
three products.** No paraphrasing, no hallucination, no staleness observed anywhere.

### productName
| Product | Extracted | Actual `<h1>` |
|---|---|---|
| Serum | `Hyaluronic + PGA 2% Face Serum` | `Hyaluronic + PGA 2% Face Serum` — match |
| Moisturizer | `Vitamin B5 10% Moisturizer` | `Vitamin B5 10% Moisturizer` — match |
| Cleanser | `B12 + Oat Extract 6.5% Gentle Cleanser` | `B12 + Oat Extract 6.5% Gentle Cleanser` — match |

### percentage
| Product | Extracted | Basis |
|---|---|---|
| Serum | `2%` | from "...+ PGA **2%** Face Serum" — correct, no zero-pad |
| Moisturizer | `10%` | from "Vitamin B5 **10%** Moisturizer" — correct |
| Cleanser | `6.5%` | from "...Oat Extract **6.5%** Gentle Cleanser" — correct decimal retained |

### benefits (all 4 verbatim bullets returned by the model, pre-validation)
Spot-checked bullet 1 of 4 for each, against the raw `<li>` text:

- Serum: *"This fast absorbing formula contains a blend of 2 highly powerful hydrators - Hyaluronic Acid & Polyglutamic Acid. Together they provide multi-level hydration & instant plump look"* — exact match, including the unusual free-standing hyphen instead of an em dash.
- Moisturizer: *"A very high concentration of Vitamin B5 / Panthenol (at 10%) for deep, oil-free moisturization and repairing skin"* — exact match.
- Cleanser: *"A mild, daily creamy gel cleanser that gently washes away impurities without drying skin."* — exact match, including trailing period.

All 4 bullets (not just bullet 1) were diffed for all three products; all matched
character-for-character. No compression, no merging of bullets, no invented bullet.

### Other fields (checked because I had the diagnostic output anyway)
- `formatDescriptor`: "Face Serum" / "Face Moisturizer" / "Face Cleanser" — all match "Product type: ..." verbatim in the specifications toggle.
- `concernChip`: "Dry" / "Damaged Barrier" / "Dry" — all correctly resolved via the fallback path (the CONCERN_STRAP_UNDER_TITLE text on all three is a generic marketing tagline, e.g. "Intense, Multi-Level Hydration without the Oily Feel," not a specific concern, so the model correctly fell through to "Ideal For → Concerns:" and took only the text before the first comma — e.g. "Concerns: Dry, Dehydrated & Skin Tightness" → "Dry"). Verified against raw HTML for all three.
- `keyIngredients`: matched the toggle heading list exactly, in order, correctly excluding "All Ingredients" — e.g. moisturizer: `["Vitamin B5 (Panthenol)", "Biosaccharide Gum", "Zinc, Copper & Magnesium"]`.
- `ph`: "6.0 - 7.0" / "5.0 - 6.0" / "5.5 - 6.5" — all match the `pdp_icon` attribute-badge text verbatim.
- `usageTime`: "AM & PM everyday" / "AM & PM. Everyday." / "AM & PM. Everyday" — all match the text after "When to use:" verbatim (including each page's own punctuation/capitalization inconsistency — the source text itself isn't consistent between products, and the model correctly preserved each one rather than normalizing).
- `skinType`: all matched the "Skin type:" line verbatim.
- `packRenderUrl`: all matched the first `.product-gallery img` (a clean product-only shot, not a lifestyle image) and all three URLs returned HTTP 200 `image/jpeg` on a direct check.

**No selector/heading-pattern bug was found in `lib/extract.ts` against any of the
three real pages.** Every cheerio selector currently in the file (`.toggle`,
`.toggle__title`, `.toggle__content`, `.product-gallery img`,
`[class*="pdp_icon"]`, `[class*="product__subtitle"]`) matched the live theme's
actual markup correctly across all three product categories, and the model's
field-by-field instructions (verbatim-copy, first-concern-before-comma, exclude
"All Ingredients", etc.) were followed precisely by Claude in every case. **No code
fix was needed or made to `lib/extract.ts`.**

## Render pipeline test

Since all three real fetches correctly hard-stopped (no `ok:true` payload),
there was no naturally successful extraction to feed `/api/render` with. To still
exercise the render pipeline against real page data, I manually assembled a valid
`ProductPayload` for each product using the real, verbatim field values recovered
above (productName, percentage, formatDescriptor's related fields, concernChip,
keyIngredients, ph, usageTime, skinType, real `packRenderUrl`), trimmed to the
**first two** of each page's four real verbatim benefit bullets (chosen, not
paraphrased or altered) purely so the payload would pass `validatePayload()` for
this isolated render check. This is *not* something the live tool would produce
under its current hard-stop rules — it's a hand-built test fixture using real data,
used only to confirm the renderer itself still works correctly against real pack
images and real copy. It does not touch or bypass the hard-stop architecture.

All three POSTs to `/api/render` returned **HTTP 200**, `image/png`, real
1080×1080 PNGs (203KB / 174KB / 221KB). Visual inspection of all three:

- **Real pack images rendered correctly** — actual product photography (dropper
  bottle, tube, pink pump bottle), not a broken-image box, in all three.
- Product name, percentage, concern chip pill, "Key ingredients :" line, and tick-mark
  benefit lines all rendered with the correct real text in all three.
- No price, no drawn logo, no drawn accent color anywhere — branding comes only from
  the pack photo itself, as intended.
- Percentage renders in black (not orange), matching this build's Template-C-only
  scope.

**Two real rendering-fidelity issues observed** (in `lib/render-creative.tsx` /
`app/api/render/route.ts`, not `lib/extract.ts` — **out of scope for this task's
fixes**, which are restricted to PDP-parsing selectors, so these are documented
only, not changed):

1. **Long `keyIngredients` lines overflow the canvas horizontally.** The
   moisturizer's ingredient row ("Vitamin B5 (Panthenol), Biosaccharide Gum,
   Zinc, Copper & Magnesium") is long enough to run past the right edge of the
   1080px canvas; the `flex-direction: row` container has no `flexWrap` and no
   width constraint on the value span, so Satori doesn't wrap it — the text is
   simply clipped at the canvas edge instead of wrapping to a second line. The
   serum and cleanser ingredient lines are short enough that this doesn't show.
2. **Long benefit bullets overflow the canvas vertically**, pushing the footer
   strip (AM/PM · skin type · pH) off the bottom of the fixed 1080×1080 canvas
   entirely in all three renders — none of the three test PNGs show the footer
   strip at all, and in two of the three the second benefit line itself is cut
   off mid-sentence at the bottom edge. Real verbatim benefit bullets on
   beminimalist.co PDPs run 100–300+ characters each (see the benefits quoted
   above), and the current layout has a fixed-height column with no
   scroll/reflow/truncation-safe budget for that much text, so the footer strip
   is effectively unreachable for any real product whose two chosen benefit
   strings are of typical real-world length. This is a layout capacity problem,
   not a parsing bug, and reproduces identically across all three categories
   tested, so it isn't a category-specific fluke.

These are worth carrying into the assignment's known-limitations note as a
found-in-testing issue: the 1080×1080 single-column layout was validated against
short/synthetic strings in earlier tasks but not against real-length PDP copy,
and real copy is long enough to break it.

## Hard-stop confirmation

For all three products, `TOO_MANY_BENEFITS` fired exactly as the architecture
intends: HTTP 422, `ok:false`, a `stop` object with a correct `stopCode`, `field:
"benefits"`, and a human-readable `detail` string stating the actual count found
("found 4"). No partial payload was returned in any case — consistent with the
confirmed, deliberate product decision that a hard-stop yields no partial data and
routes the marketer to full manual entry. This was not modified or worked around;
it was only confirmed to behave as designed, end-to-end, against real Claude output
on real pages.

## Markup/theme variance across categories

All three categories (serum, moisturizer, cleanser) use the **same underlying
Shopify theme structure** — `.toggle` / `.toggle__title` / `.toggle__content` for
every collapsible section, `.product-gallery img` for the media gallery,
`[class*="pdp_icon"]` for the pH/attribute badge strip, and `[class*="product__subtitle"]`
for the tagline. No selector needed to branch per category; the same code path
handled all three correctly. The one piece of copy-level inconsistency observed
was punctuation/spacing around "When to use:" (e.g. "AM & PM everyday" vs. "AM & PM.
Everyday." vs. "AM & PM. Everyday" — three different punctuation styles across three
products), which the extractor correctly preserved verbatim rather than normalizing
— exactly the intended verbatim-only behavior, just worth noting as evidence the
site's own copy isn't internally consistent either.

The moisturizer's "How to Use" section also contains a duplicated label in the
raw markup ("When to use: When to use: AM & PM. Everyday.") — apparently two
adjacent elements both carrying that label text. The model still correctly
extracted just the trailing value ("AM & PM. Everyday.") rather than the
duplicated label text, so this did not cause an extraction defect, but it's a
minor oddity in the live page's own markup worth flagging.

## Code changes

None kept. A single diagnostic `console.error` line was added to
`lib/extract.ts` during investigation (to inspect the model's raw output ahead of
`validatePayload()`, since the API intentionally discards it on a hard-stop) and
was removed immediately after use; `git diff` on the file is empty. No selector or
heading-pattern fix was needed in `lib/extract.ts` — every field matched real page
markup correctly across all three categories tested. The two render-layout
overflow issues found (above) are in `lib/render-creative.tsx` / the fixed-canvas
design, outside this task's fix scope (PDP-parsing bugs in `lib/extract.ts` only),
and are documented here rather than changed.

## Bottom line for the "known limitations" note

1. **The "exactly two benefits" hard-stop rule, as currently written, will fire on
   effectively every live beminimalist.co product**, not just an edge case —
   every one of three checked categories currently publishes four bullets under
   "What Makes It Potent?". This is expected/by-design behavior per the confirmed
   product decision (no guessing, no truncation, clean escalation to manual entry)
   but its practical hit rate against the live catalog is much higher than "one
   known SKU."
2. Field-level extraction fidelity is excellent: 100% verbatim match against raw
   page content across every field checked (productName, percentage, benefits,
   formatDescriptor, concernChip, keyIngredients, ph, usageTime, skinType,
   packRenderUrl) on all three categories. No hallucination, no paraphrase, no
   staleness.
3. The render pipeline itself works correctly against real pack photography and
   real copy, but the fixed 1080×1080 single-column canvas has no headroom for
   real-length PDP benefit strings — the footer strip is effectively always
   pushed off-canvas, and long ingredient lists can overflow horizontally. This
   is a layout capacity issue for a future task, not a parsing bug.
