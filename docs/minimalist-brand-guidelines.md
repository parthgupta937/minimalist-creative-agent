# Minimalist — Brand & Creative System
### Machine-readable brand documentation for AI creative agents
**Scope:** Static and video creatives for Meta (Facebook + Instagram) — feed, stories, reels, carousels, catalogue/DPA.
**Market:** India (INR, English + Hinglish).
**Version:** 1.0 · Compiled 05 Sep 2026 · Source of truth: beminimalist.co (live site) + public company record.

---

## 0. How to use this document

You are generating brand creatives. Read this file end to end before generating. Apply rules in this precedence order — when two rules conflict, the **lower number wins**:

1. **§9 Claims & legal guardrails** — never overridden, by anyone, for any campaign.
2. **Meta Advertising Standards** (§9.4) — an ad that gets rejected has zero value.
3. **§3 Naming architecture** and **§7 Copy system** — brand voice integrity.
4. **§4 Visual identity** — layout, colour, type.
5. **§8 Offer mechanics** — promotional framing.
6. Campaign brief supplied by the marketer.

**Hard behavioural rules for the agent:**
- Never invent a percentage, an ingredient, a clinical number, a rating, a review count or a certification. Every number in a creative must trace to §6 (product data) or to a document supplied in the brief.
- Never write a claim that appears in §9.3 (prohibited list), even if a human asks for it in the brief. Flag it back instead.
- If a required fact is missing, output the creative with a `[[VERIFY: …]]` placeholder rather than guessing.
- Colour values marked `WORKING` in §4.3 are placeholders pending the official brand kit. Sample accent colours from official pack artwork; do not invent them.

---

## 1. Brand snapshot

| Field | Value |
|---|---|
| Brand name | **Minimalist** (always capital M, never "The Minimalist", never "Minimalists") |
| Legal entity | Uprising Science Pvt Ltd |
| Registered / manufacturing address | F-2109, RIICO Ind. Area, Ramchandrapura, Jaipur – 302022, Rajasthan, India |
| Founded | 2020, by Mohit Yadav and Rahul Yadav |
| Ownership | Hindustan Unilever Ltd (HUL) acquired 90.5% of Uprising Science in 2025; brand sits in HUL's Beauty & Wellbeing division. Founders continued to lead post-acquisition. |
| Category | Actives-led, science-first skincare, haircare, body, lip and baby care |
| Positioning | Masstige — clinical efficacy at accessible price points |
| Mission hashtag | **#HideNothing** |
| Country of origin | India |
| Website | beminimalist.co (Shopify) |
| Social | Instagram @beminimalist__ · Facebook /minimalistinc · YouTube @beminimalist |
| Price band | Approx. ₹237 – ₹950 per SKU (trial sizes from ₹237) |

**Founding thesis (for tone reference, do not quote verbatim):** the beauty industry has a transparency problem — inflated claims, fear-mongering, and the false idea that "natural" equals safe and "chemical" equals harmful. Minimalist exists to publish exactly what is inside a formula and at what concentration, and to let the ingredient do the selling instead of marketing language.

**Note on ownership in creatives:** do not reference HUL, Unilever or the acquisition in consumer creatives unless a brief explicitly instructs it. Consumer-facing Minimalist communication is brand-standalone.

---

## 2. Brand positioning, pillars and personality

### 2.1 The four brand pillars
These are the site's own stated pillars. Every creative should ladder to at least one.

| Pillar | What it means | How it shows up in a creative |
|---|---|---|
| **Transparency** | Full disclosure of ingredients and their concentration | Concentration on the pack and in the headline; full INCI available; "what's inside" formats |
| **Efficacy** | Formulations developed in in-house labs | Actives, concentration, mechanism, test data where available |
| **Affordability** | Skincare accessible to all | Price-forward and size-ladder formats; trial sizes |
| **Sourced globally** | Ingredients from leading global suppliers | Named supplier + country (e.g. UV filters from BASF, Germany and Royal DSM, Netherlands; Niacinamide from Lonza, Switzerland; Matmarine from Lipotec, USA) |

### 2.2 Brand personality
**Is:** clinical, plain-spoken, evidence-led, unhurried, respectful of the reader's intelligence, quietly confident, educational.
**Is not:** hype-y, aspirational-luxury, fear-mongering, cutesy, meme-forward, celebrity-led, "glow up" coded, urgency-screaming.

The tone test: *would a dermatologist wince at this line?* If yes, rewrite.

### 2.3 Audience
Primary: 18–34, urban and tier-2 India, skincare-literate or actively learning, ingredient-curious, price-conscious, researches before buying. Secondary: 16–18 (all skin SKUs are marked suitable for 16+ — see §9.4 on age targeting), and 35+ for anti-ageing and hair SKUs.

### 2.4 Competitive frame
Competes with The Ordinary, Dot & Key, Deconstruct, Foxtale, Derma Co. Differentiator is the combination of published concentration + published sourcing + published test data at a mass price. Do **not** name competitors in creatives (see §9.3).

---

## 3. Naming architecture — non-negotiable

Product names follow a fixed grammar. This IS the brand. Never abbreviate, prettify or reorder it.

```
[ACTIVE / ACTIVE SYSTEM] + [CONCENTRATION]% + [FORMAT]
```

**Correct:**
- Niacinamide 10% Face Serum
- Salicylic Acid 2% Face Serum
- Salicylic Acid + LHA 2% Cleanser
- Vitamin B5 10% Moisturizer
- Alpha Arbutin 2% Face Serum
- Copper Peptide + PDRN 1.25% Face Serum
- Hydrating Factors 7.3% Hair Shampoo
- Anti Dandruff Shampoo 3.5%
- SPF 50 Sunscreen (sunscreen uses SPF rating in place of a concentration)

**Incorrect:** "Niacinamide Serum" · "The Nia 10" · "10% Niacinamide" · "Minimalist Glow Serum" · "Nia+Zinc Serum"

**Rules:**
- Concentration always carries the `%` symbol and sits immediately after the active.
- Never create a nickname, sub-brand or descriptor name for a SKU ("Clear Skin Duo", "Glow Kit") unless it exists in §6 or the brief supplies an approved kit name.
- "Minimalist" prefixes the product name only when brand attribution is needed in-copy: *Minimalist Niacinamide 10% Face Serum*.
- US spelling appears on some packs (Moisturizer) and UK on some site labels (Moisturiser). **Match the pack artwork you are showing.** Do not mix both in one creative.

---

## 4. Visual identity

### 4.1 Design philosophy
The design system is a laboratory, not a boutique. White space is the signature asset. If a layout feels "designed", it is over-designed. Reduce until only the pack, the active, the concentration and one benefit remain.

**The five constants:**
1. White or near-white ground.
2. Pack shot as hero, shot flat and clean.
3. Typographic hierarchy carries the message — not decoration.
4. One accent colour per creative, taken from the SKU's own pack.
5. Generous margins; nothing crowds the edge.

### 4.2 Logo
- The wordmark is **MINIMALIST** set in a clean sans-serif, supplied as SVG/PNG. Use the official file only — never re-typeset it.
- Primary lockup: black wordmark on white. Reverse: white wordmark on a solid dark or on the SKU accent, only when contrast ratio ≥ 4.5:1.
- Clear space: minimum of the wordmark's cap-height on all four sides.
- Minimum size: 90 px wide for digital creatives (readability floor on a 1080 px canvas at mobile scale).
- **Never:** stretch, rotate, outline, add drop shadows or gradients, place on a busy photo area, recolour to a non-brand colour, or lock it up with another brand's mark without partnership approval.
- `#HideNothing` exists as a supplied lockup asset. Use the asset; do not re-set it as live text.

### 4.3 Colour system

**Base palette — the brand's actual visual signature is monochrome.** Roughly 85–90% of any creative's area should be white/neutral.

| Role | Name | Value | Use |
|---|---|---|---|
| Primary canvas | Pure White | `#FFFFFF` | Default background for all creatives |
| Secondary canvas | Paper / Off-white | `#F7F6F3` `WORKING` | Alternate ground; module separation; texture-swatch backdrops |
| Primary type | Ink | `#111111` `WORKING` | Headlines, product names, price |
| Secondary type | Graphite | `#6B6B6B` `WORKING` | Body copy, disclaimers, footnotes |
| Rules & dividers | Line Grey | `#E5E5E5` `WORKING` | Hairlines, table rules, spec panels |
| Deep ground | Near-Black | `#0A0A0A` `WORKING` | Rare full-bleed dark creatives (launch teasers only) |

**Accent colour — the SKU rule.**
Minimalist's colour identity is **product-derived, not brand-derived**. Each SKU carries its own accent on the pack. Therefore:

> **Rule:** the accent colour of any product creative = the dominant label colour of that product's pack artwork, sampled directly from the official pack render. Use it for one element only (a rule, a badge, a single highlighted word, or a texture swatch). Do not introduce a colour that does not appear on the pack.

Do **not** hardcode per-SKU hex values from this document — they are not published and must be eyedropper-sampled from the current pack file supplied in the brief. If no pack file is supplied, output `[[VERIFY: sample accent from official pack render]]` and build the creative in pure monochrome, which is always safe.

**Brand-level (non-SKU) creatives** — offers, always-on brand, range shots — use monochrome plus at most one neutral accent. Avoid retail-red sale styling; it reads off-brand for a clinical brand.

**Accessibility:** all text must clear WCAG AA (4.5:1 for body, 3:1 for large display type) against its background. Legal disclaimers must clear this too — an unreadable disclaimer is a regulatory failure, not a design choice (see §9.5).

### 4.4 Typography

| Role | Spec |
|---|---|
| Family | A single neutral grotesque sans. `[[VERIFY: exact licensed brand typeface with brand team]]`. Until confirmed, use a neutral grotesque (Inter, Helvetica Now, Neue Haas Grotesk or equivalent). |
| Permitted weights | Regular, Medium, Semibold, Bold |
| Headline | Semibold/Bold, tight tracking (−1% to −2%), sentence case or Title Case. **Never all-caps for full sentences.** |
| Product name | Medium/Semibold — always rendered exactly per §3 |
| Concentration | May be set larger or in the accent to carry hierarchy — this is the brand's most distinctive typographic move |
| Body | Regular, 1.4–1.5 line height |
| Legal / disclaimer | Regular, minimum 16 px on a 1080 px canvas, Graphite or darker on light ground |

**Never:** serifs, scripts, handwriting, condensed display faces, outlined text, gradient text, text with strokes or hard shadows, more than two weights in one creative, or more than one typeface family.

### 4.5 Photography and art direction

**Pack shots**
- Clean cut-out or plain seamless ground, soft even lighting, minimal contact shadow.
- Pack front-facing or at a slight controlled angle. Label, concentration and net quantity legible.
- No heavy props, foliage, fabric, water splashes, glitter, or lifestyle clutter.
- Multi-pack/range shots: aligned baseline, even spacing, no overlap that hides a concentration figure.

**Texture shots**
- Serum drop, cream swatch, or gel smear on a neutral ground or on skin. Clean, non-messy, honest to the actual texture (a lightweight serum must not be shown as a thick cream).

**Model / skin imagery**
- Real, natural, unretouched-looking skin. Visible texture, pores and hair are **on-brand**, not flaws to erase.
- Diverse Indian skin tones across a campaign set. Never lighten a model's skin tone in post. Never sequence models light-to-dark or imply a tone hierarchy.
- No extreme close-up crops of a single "problem area" isolated from a face — this trips both Meta's health policy and ASCI's disparagement norms.
- **No before/after imagery of any kind.** See §9.3 and §9.4 — this is the single most common cause of both ad rejection and regulatory complaint in this category.

**Science / lab imagery**
- Molecular renders, ingredient origin visuals, lab glassware, INCI panels and supplier marks are on-brand. Keep them literal and unstylised. A molecular render must not be presented as if it were product test data.

**Iconography**
- Simple line/tick icons at consistent weight. The site's own attribute badges are the reference set: *Fragrance Free · Non-comedogenic · Essential Oil Free · White cast free · pH: x.x – x.x*.
- Only use an attribute badge if it is true for that specific SKU (§6). Attributes are not shared across the range.

### 4.6 Layout system

| Element | Spec |
|---|---|
| Safe margin | ≥ 6% of the shorter canvas edge on all sides |
| Grid | 12-column or simple thirds; align everything to one baseline grid |
| Hierarchy | One idea per creative: hero pack → concentration/active → one benefit → CTA |
| Text density | Feed: ≤ 7 words in the headline. Story/Reel: ≤ 5 words per frame |
| Badges | Maximum one offer badge and one attribute badge per creative |
| Legal strip | Bottom-anchored, full width where a disclaimer is required (§9.5) |

---

## 5. PDP anatomy (verified live structure)

Use this when generating PDP-lookalike creatives, catalogue assets, or landing pages, and as the source order for factual claims.

1. **Offer strip** — active coupon codes
2. **Gallery** — pack shot, texture, ingredient/claim cards, video
3. **Product name** (§3 grammar)
4. **Sub-line** — one line, function-first. e.g. *For reducing sebum & pores, and even skin tone*; *Broad Spectrum SPF 50, PA++++*
5. **Short description** — 2–4 sentences naming the actives and what each one does
6. **Customer quote** — single italicised verbatim with first name + initial
7. **Attribute badges** — Fragrance Free / Non-comedogenic / Essential Oil Free / White cast free / pH range
8. **Variant selector** — size ladder with per-size price
9. **Price block** — Selling price, `MRP ₹___` struck through, `% Off`, then **Base price + GST% + Total**, with *(incl. of all taxes)*
10. **Offers repeat**
11. **Delivery / pincode / COD check**
12. **"What Makes It Potent?"** — 3–4 bullets: actives, mechanism, concentration, sourcing
13. **"Ideal For"** — Skin type · Concerns · Suitable for (age) · Pregnancy/Lactation
14. **"How to Use"** — application steps + AM/PM frequency
15. **"Clinical Results" / "Consumer Studies"** — test standard, study number, values, testing lab named, plus the dermatologist-supervised patch-test safety note
16. **Cross-sell** — "Goes Well With" / "You might also like"
17. **Ingredients** — 3 hero ingredients explained + full INCI list
18. **Ratings & reviews** — overall score, review count, AI review summary, topic breakdown, individual reviews (positive **and** negative are published — this is a deliberate transparency signal)
19. **FAQs / specs** — product type, net quantity, shelf life, dimensions, country of origin, SKU/EAN, manufacturer and consumer-care address

---

## 6. Product catalogue (verified from live site)

> ⚠️ **Prices and MRPs move constantly** (promotions, GST changes, pack-size changes). Treat every figure below as *last-seen*, not as truth. Any price shown in a creative must be re-verified against the live PDP on the day of build. See §9.5 on price claims.

### 6.1 Hero SKUs

| Product | Concern line (as published) | Sizes | Last-seen price / MRP |
|---|---|---|---|
| Salicylic Acid + LHA 2% Cleanser | Acne, Breakouts & Oiliness | 100ml, 250ml | ₹284 (MRP ₹299) / ₹569 |
| SPF 50 Sunscreen | Sun protection, UV exposure / damage | 30g, 50g, 100g | ₹237 / ₹379 (MRP ₹399) / ₹664 |
| Vitamin B5 10% Moisturizer | Damaged Barrier, Oily & Dehydrated | 50g, 100g | ₹332 (MRP ₹349) / ₹569 |
| Niacinamide 10% Face Serum | Acne Marks, Acne Prone & Oily Skin | 10ml, 20ml, 30ml, 60ml | ₹237 / ₹569 (MRP ₹599) / ₹949 |
| Vitamin C 10% Face Serum | Dullness, Spots & Loss of Elasticity | 10ml, 20ml, 30ml | ₹284 (MRP ₹299) / ₹664 |
| Salicylic Acid 2% Face Serum | Acne, Oily Skin, Blackheads & Irritation | 10ml, 20ml, 30ml, 60ml | ₹237 / ₹522 (MRP ₹549) / ₹902 |
| Alpha Arbutin 2% Face Serum | Hyperpigmentation, Tanning & Sunspot | 10ml, 30ml | ₹237 / ₹522 (MRP ₹549) |

### 6.2 Recent launches

| Product | Concern line | Last-seen price |
|---|---|---|
| Retinol 0.1% Face Serum | Anti-ageing | `[[VERIFY]]` |
| Multi Repair Actives 15% Face Serum | Dullness, Fine lines & Loss of Firmness | ₹664 (MRP ₹699) |
| Copper Peptide + PDRN 1.25% Face Serum | Wrinkles, Fine Lines, Damaged Barrier | ₹664 (MRP ₹699) |
| B12 + Repair Complex 5.5% Face Moisturizer | Repairs and strengthens skin barrier | ₹284 (MRP ₹299) / ₹379 |
| Marula Oil 05% Cleansing Oil | Gently removes oils and impurities | ₹569 (MRP ₹599) |
| Oat Extract 06% Gentle Cleanser | Gentle cleansing | `[[VERIFY]]` |
| Hydrating Factors 7.3% Hair Shampoo | Dry, dull & frizzy hair | ₹474 (MRP ₹499) |
| Anti Dandruff Shampoo 3.5% | Dandruff, itchiness, scalp impurities | ₹252 / ₹418 (MRP ₹440) |
| Hair Growth + Anti-Grey Actives 15.6% Hair Serum | Hair growth, greying | `[[VERIFY]]` |
| Vitamin B6 + Carnitine 0.3% Scalp Serum | Scalp health | `[[VERIFY]]` |

### 6.3 Baby care (Minimalist Pediatrics)
Ceramide & Vitamin B5 Delicate Cleanser (₹569/MRP ₹599) · Ceramide & Squalane Nourishing Lotion (₹854/MRP ₹899) · Zinc Oxide + B5 Healing Ointment (₹379/MRP ₹399) · Provitamin D3 Massage Oil (₹569/MRP ₹599).

> **Baby-care creatives carry heightened restrictions.** No therapeutic claims, no distressed-infant imagery, no implication of medical treatment, no "doctor recommended" without documented substantiation. Treat every baby-care claim as Tier C (§9.3) unless legal supplies written approval.

### 6.4 Category taxonomy (use these exact concern labels)
**Skin concerns:** Acne · Pigmentation · Dryness · UV Damage · Underarm Darkness · Oiliness · Dullness · Ageing · Uneven Tone · Fine Lines / Wrinkles
**Hair concerns:** Hair Fall · Damaged Hair · Dandruff · Scalp Irritation · Frizzy Hair · Dull Hair · Oily Scalp · Hair Thinning
**Routine steps:** Cleanse · Tone · Treat · Moisturize · SPF · Under Eye
**Hero ingredients:** Vitamin C · BHA / Salicylic Acid · Retinoid / Retinol · Niacinamide · UV Filters · Ceramide · Capixyl · Maleic Acid · Peptide · Carnitine

### 6.5 Worked example — full data card
Use this shape when the brief asks for a data-complete SKU creative.

**SPF 50 Sunscreen**
- Sub-line: Broad Spectrum SPF 50, PA++++
- UV filters: Uvinul T 150, Avobenzone, Octocrylene, Titanium Dioxide
- Boosters: Vitamin B3, B5, E, F
- Attributes: Fragrance free · Non-comedogenic · White cast free · pH 6.0–7.0
- Skin types: Dry/Normal, Sensitive, Oily/Combination, Acne-Prone
- Suitable for: 16+ years
- Pregnancy/Lactation: **Not recommended** (contains Octocrylene) — critical, must never be contradicted in copy
- Test: In-vivo, ISO 24444:2019, independent third-party lab (Advanced Science Laboratories). SPF value obtained 56.6; PA ++++
- Sourcing: primary filters from BASF (Germany) and Royal DSM (Netherlands)
- Specs: shelf life 24 months; country of origin India

**Niacinamide 10% Face Serum**
- Sub-line: For reducing sebum & pores, and even skin tone
- Actives: Niacinamide 10%, Matmarine, Zinc, Acetyl Glucosamine
- Attributes: Fragrance Free · Non-comedogenic · Essential Oil Free · pH 5.5–6.5
- Suitable for: 16+ · Pregnancy/Lactation: Safe
- Sourcing: Niacinamide from Lonza (Switzerland); Matmarine from Lipotec (USA)
- Use: 2–3 drops after cleansing and toning, AM & PM
- Specs: shelf life 18 months; country of origin India

---

## 7. Copy system

### 7.1 Voice rules
1. **Lead with the molecule, not the emotion.** The active and its concentration is the hook.
2. **Short declaratives.** Average sentence under 14 words.
3. **No fluff adjectives.** Cut: magical, miracle, revolutionary, game-changing, holy grail, transformative, secret, ultimate.
4. **Explain the mechanism in one clause.** "Salicylic acid is oil-soluble, so it clears inside the pore."
5. **Never manufacture insecurity.** Address the concern, never the person. "For oily skin" ✅ / "Tired of your oily skin ruining your day?" ❌
6. **Hinglish is allowed, slang is not.** Conversational Hinglish for reach ("Roz lagao, simple hai") is fine. Gen-Z meme slang is off-brand.
7. **Say what it doesn't do.** Publishing a limitation ("this won't fix textural scarring") is the most on-brand move available and reduces claim risk simultaneously.
8. **Never use fear.** No sun-damage horror framing, no "your skin is ageing right now" clocks.

### 7.2 Headline formulas (safe, reusable)
- `{Active} {Concentration}%. {One function}.` → *Niacinamide 10%. For sebum and pores.*
- `What's inside: {n} actives. Nothing else.`
- `{Concern}? Start with {active}.`
- `Now in {size}. ₹{price}.`
- `{Ingredient} from {supplier}, {country}.`
- `The full formula. On the front of the pack.`
- `{Format} for {skin type}. Fragrance free.`
- `Tested to {standard}. Result published on the PDP.`

### 7.3 Body copy templates
**Ingredient-education (feed static or carousel):**
> Niacinamide is Vitamin B3. At 10%, it works on sebum, pores and uneven tone. We pair it with Zinc and Matmarine. Full INCI on the pack, and on the site. Fragrance free. pH 5.5–6.5.

**Routine/step:**
> Four steps, nothing extra. Cleanse. Treat. Moisturize. SPF, every morning. Pick the active that matches your concern — the concentration is printed on every pack.

**Trial-size / price-led:**
> The 10ml is ₹237. Same formula, same concentration as the 30ml — a smaller bottle to try it with.

### 7.4 CTA bank
Shop now · Explore the range · See the full ingredient list · Find your active · Read the formula · Start with the 10ml · Learn more · Shop the routine
**Avoid:** Buy now before it's gone · Last chance · Don't miss out · Transform your skin today

### 7.5 Meta copy length targets

| Field | Target | Hard limit reference |
|---|---|---|
| Primary text | 90–125 characters (truncates around 125 on mobile) | front-load the active + concentration |
| Headline | ≤ 27 characters ideal, 40 max | product name often fits alone |
| Description | ≤ 27 characters | price or size, e.g. *From ₹237* |
| Text in image | Keep light — heavy text overlay depresses delivery | ≤ 20% of area as a working rule |

### 7.6 Banned words → approved substitutions

| ❌ Do not write | ✅ Write instead |
|---|---|
| Cures / treats / heals acne | Formulated for acne-prone skin |
| Removes / erases scars | Helps with the look of acne marks |
| Permanent / lifetime results | With continued use |
| Whitening / fairness / lightening / brightening the skin tone | Helps with uneven tone · helps with dullness |
| Instant / overnight results | Visible over {n} weeks of consistent use, per {study} |
| Chemical-free / toxin-free / 100% natural | Fragrance free · Essential oil free · Full INCI disclosed |
| Dermatologist approved / recommended | Safety evaluated by patch testing under dermatologist supervision *(only where true for that SKU)* |
| Clinically proven to cure X | Tested to {ISO standard} by {named lab}; result: {value} |
| Best sunscreen in India · No.1 | Our best-selling sunscreen *(only with sales data on file)* |
| Blocks 100% of UV rays · Complete sun protection | Broad spectrum SPF 50, PA++++ |
| Anti-ageing (as an outcome promise) | Formulated for fine lines and loss of firmness |
| Safe for everyone | Suitable for {listed skin types}; patch test before first use |
| Better than {competitor} | *(remove — see §9.3)* |

---

## 8. Sales model and offer mechanics

**Channel model:** D2C-first (own site + app), plus marketplaces and, post-HUL, expanding offline distribution. Meta creatives typically drive to the website, app or a specific PDP.

**Pricing display convention (mirror this exactly):**
```
₹569   MRP ₹̶5̶9̶9̶   5% Off
Base ₹482 + 18% GST ₹87 = Total ₹569  (incl. of all taxes)
```
The base + GST breakdown is a transparency signal and is part of the brand's identity. Where space allows in a creative, show `MRP ₹___ (incl. of all taxes)`.

**Recurring promo mechanics observed live:**

| Mechanic | Description |
|---|---|
| Size ladder | Trial (10ml/30g) → standard (30ml/50g) → value (60ml/100g). Larger size = lower per-ml cost. |
| Build Your Own Bundle | Additional discount up to ~15% for self-assembled bundles |
| B2G3RDFREE | Buy 2, get 3rd product free |
| ATC5 / ATC10 | Additional 5% above ₹299 / 10% above ₹599 |
| B2GBOTTLE | Buy 2, receive a Minimalist glass bottle free |
| Cart threshold gift | e.g. free sunscreen above ₹799 |
| MCash / Minimalist Trust Circle | Loyalty currency earned and redeemed on purchases |
| App exclusives | App-only discounts and offers |
| COD | Cash on delivery supported; pincode-level delivery check |

**Offer copy rules:**
- State the mechanic plainly. `Buy 2, get the 3rd free.` Not `MEGA 3-FOR-2 BLOWOUT!!`
- Always attach conditions where they exist: minimum cart value, validity window, "on select products", "while stocks last".
- Never show a discount % that isn't calculated off the actual MRP. Never inflate a struck-through MRP.
- One offer per creative. Stacking three codes in one frame reads as clutter and creates a legal-clarity problem.
- Offer badges live in a corner, in one accent, at a size subordinate to the product name.

---

## 9. Claims and legal guardrails — **read this section before every generation**

**Objective:** no creative produced from this documentation should expose the brand to action under Indian cosmetics/advertising law, ASCI complaints, CCPA proceedings, or Meta ad rejections. When uncertain, choose the weaker claim. A weaker claim that runs beats a stronger claim that gets pulled.

### 9.1 Regulatory frame (India)
Creatives are subject to, at minimum:
- **Drugs and Cosmetics Act, 1940 & Cosmetics Rules, 2020** — cosmetics may not claim to treat, cure, prevent or mitigate disease. A claim that crosses into therapeutic territory reclassifies the product as a drug.
- **Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954** — prohibits advertising remedies for specified conditions.
- **Consumer Protection Act, 2019 + CCPA Guidelines for Prevention of Misleading Advertisements and Endorsements, 2022** — bans misleading and surrogate advertising; requires disclaimers to be in the same medium, prominent and legible; requires endorsers to have actually used the product and to disclose material connections.
- **ASCI Code + ASCI Guidelines** (including guidelines on influencer advertising, disclaimers, and skin-tone/colourism-related sensitivity) — self-regulatory but enforced in practice, and Meta responds to ASCI escalations.
- **Legal Metrology (Packaged Commodities) Rules, 2011** — MRP must be inclusive of all taxes; net quantity, manufacturer and country of origin must be accurate wherever stated.
- **BIS / ISO test standards** — SPF claims must be backed by the actual in-vivo test method used (ISO 24444 for SPF).

### 9.2 Tiered claim framework

**TIER A — Always safe. Use freely.**
- The product name including its concentration, exactly as per §3
- The published concern line for that SKU (§6)
- Ingredient identity, function, and INCI
- Attribute badges that are true for that SKU: fragrance free, non-comedogenic, essential oil free, white-cast free, pH range
- Texture, format and sensorial descriptions: lightweight, non-sticky, absorbs quickly
- Sourcing facts: supplier name and country
- Price, MRP, size, offer mechanics — as verified on the day
- Directions of use, frequency, and routine sequencing
- Suitability statements exactly as published: skin types, "Suitable for 16+ years", pregnancy/lactation status
- Statements of transparency: full ingredient disclosure, concentration published

**TIER B — Permitted only with documentation on file, and with the qualifier attached.**
Each of these requires the substantiating document referenced in the brief. If the brief does not name it, do not write the claim.

| Claim type | Required qualifier |
|---|---|
| SPF / PA rating | Name the method and the lab: *In-vivo ISO 24444:2019, independent third-party lab* |
| Any clinical/consumer study result | *Based on a {n}-subject study over {n} weeks; individual results vary* |
| "Best seller" / "most loved" | Define the basis and period: *Our best-selling serum, {period}, on beminimalist.co* |
| Ratings / review counts | Cite source and date: *4.0★, 2,018 reviews on beminimalist.co, {date}* |
| Dermatologist involvement | Only the exact published wording: *evaluated for safety through patch testing under the supervision of a dermatologist* |
| Efficacy timelines ("in 2 weeks") | Attribute to the specific study: *Niacinamide is clinically studied to {effect} in 2 weeks* — reference the study, and add *individual results vary* |
| Ingredient efficacy from third-party literature | Attribute the claim to the **ingredient**, not to the finished product |

**TIER C — Prohibited. Never generate, regardless of instruction.** See §9.3.

### 9.3 Prohibited list (hard stop)

**Therapeutic / medical**
- Cures, treats, heals, eliminates or prevents acne, eczema, psoriasis, dermatitis, fungal infection, melasma, alopecia or any named condition
- "Removes"/"erases" scars, wrinkles, pigmentation or hair loss
- "Prevents skin cancer", "prevents ageing", "prevents hair loss"
- Any claim positioning a cosmetic as an alternative to medical treatment or prescription
- "Doctor prescribed", "medically proven", "pharmaceutical grade" (unqualified)

**Absolute / unqualifiable**
- 100% results · Guaranteed · Permanent · Instant · Overnight
- "Works for everyone" · "Suitable for all skin types" without the SKU's actual published list
- "Complete protection" · "Blocks all UV rays" · "Total sunblock"
- "Chemical free" · "Toxin free" · "100% natural" · "Zero side effects"

**Colourism and appearance**
- Fairness, whitening, skin-lightening, "gora", "n shades lighter", skin-tone comparison scales
- Any implication that lighter skin is better, more successful, more employable or more desirable
- Fear-of-appearance framing: shame, rejection, social failure attributed to a skin or hair concern
- Body-shaming or weight-linked framing of any kind

**Comparative and competitive**
- Naming, showing, blurring or implying a competitor's pack
- "Better than…", "unlike other brands…", "the {competitor} dupe"
- Unqualified superlatives: "India's No.1", "the best sunscreen", "the only serum that…"

**Evidence and imagery**
- **Before/after images or split-screen skin comparisons — in any form, including "illustrative" or AI-generated ones**
- Simulated, exaggerated or retouched result imagery
- Fabricated statistics, invented study numbers, invented review counts
- Fake testimonials, AI-generated "customers", or a real person's likeness without a signed release
- Fake dermatologist, doctor, or lab-coat authority figures presented as real professionals
- Any celebrity, influencer or public figure without an executed contract and disclosed material connection

**Baby care specifically**
- Any therapeutic, "safe for newborns", "rash cure", "prevents nappy rash", "paediatrician approved" claim without documented substitution and legal approval

### 9.4 Meta Advertising Standards — the practical checklist

| Meta policy | What it means for this brand |
|---|---|
| **Personal attributes** | Never address the viewer's condition in second person as an assertion. ❌ "Your acne is caused by…", "Struggling with your pigmentation?" ✅ "Formulated for acne-prone skin." This is the #1 rejection cause for skincare in India. |
| **Health & wellness / unexpected results** | No before/after, no exaggerated outcome imagery, no zoomed-in "problem skin" close-ups, no implied dramatic transformation. |
| **Negative self-perception** | No copy or imagery that makes the viewer feel bad about their appearance in order to sell. |
| **Adult / body content** | No sexualised skin imagery, no unnecessary body exposure in body-care creatives. |
| **Misleading claims** | Claims must be substantiable; unverifiable superlatives get flagged. |
| **Age targeting** | Skin SKUs are published as *suitable for 16+*. Do not target under-18 audiences, and do not build creative that reads as directed at minors. |
| **Prohibited content** | No medical/therapeutic positioning; no misleading "sale" pressure; no personal-data-implying targeting language ("we noticed you have…"). |
| **Landing page consistency** | The claim, price and offer in the creative must match the destination PDP. Mismatch is both a Meta violation and a CCPA misleading-ad exposure. |
| **Branded content** | Any influencer or partner content must use Meta's paid-partnership label and carry a disclosure. |

### 9.5 Disclaimers and superscripts
When a Tier B claim runs, the disclaimer must be:
- **In the same creative** (not only in the caption) if the claim is in the visual;
- **Legible** — minimum 16 px on a 1080 px canvas, AA contrast, not over a busy area, on screen ≥ 3 seconds in video;
- **Specific** — name the study, sample size, duration and testing body;
- **Non-contradictory** — a disclaimer may qualify a claim, never reverse it.

Standard footers, use as applicable:
- `*Individual results may vary.`
- `*Based on in-vivo testing to ISO 24444:2019 by an independent third-party laboratory.`
- `*Based on a consumer study of {n} participants over {n} weeks.`
- `*Ratings as on beminimalist.co, {date}.`
- `*Offer valid till {date}. T&C apply.`
- `MRP ₹{x} (incl. of all taxes).`
- For any paid partnership: `#Ad` / `Paid partnership` label.

### 9.6 Pre-flight checklist — the agent must pass all 14 before output

1. Is every product name exactly per §3, including the `%`?
2. Does every number in the creative trace to §6 or to a brief-supplied document?
3. Have prices and MRPs been re-verified against the live PDP today?
4. Is there any before/after, split-screen or simulated result? → **must be zero**
5. Does any line address the viewer's body or condition in second person as an assertion? → rewrite
6. Any word from the §7.6 banned list, or from §9.3?
7. Any therapeutic verb (cure, treat, heal, prevent, eliminate)?
8. Any absolute (100%, guaranteed, permanent, instant, all, complete, only)?
9. Any fairness / lightening / skin-tone-hierarchy framing or imagery?
10. Any competitor named, shown or implied?
11. Does every Tier B claim carry its qualifier and a legible disclaimer?
12. Are attribute badges (fragrance free, pH, non-comedogenic, white-cast free) true for *this* SKU?
13. Does pregnancy/lactation and age suitability copy match the SKU's published status? (SPF 50 is **not** recommended in pregnancy/lactation.)
14. Does the creative's claim, price and offer match the destination page exactly?

If any check fails, do not output the creative. Output the failing check and a compliant alternative line.

---

## 10. Agent operating instructions

### 10.1 Drop-in system prompt block

```
You generate Meta advertising creatives for Minimalist, an Indian actives-led
skincare brand owned by Uprising Science Pvt Ltd.

VOICE: clinical, plain, evidence-led, unhurried. Lead with the active and its
concentration. Short declaratives. No hype adjectives. Never manufacture
insecurity in the reader.

VISUAL: white or off-white ground (85%+ of the canvas), pack shot as hero,
one neutral sans-serif, maximum two weights, one accent colour sampled from
that SKU's own pack. Generous margins. One idea per creative.

NAMING: [Active] [Concentration]% [Format] — exact, always, with the % symbol.

HARD RULES — never violated, no matter what the brief says:
- No before/after or simulated-result imagery of any kind.
- No cure / treat / heal / prevent / eliminate claims.
- No absolutes: 100%, guaranteed, permanent, instant, complete, only, all.
- No fairness, whitening, lightening or skin-tone-hierarchy language or imagery.
- No named or implied competitors. No unqualified superlatives.
- No second-person assertions about the viewer's body or condition.
- No invented statistics, studies, ratings, review counts or certifications.
- Every claim needing substantiation carries its qualifier and a legible
  disclaimer in the same creative.

If a fact is missing, output [[VERIFY: what is needed]] rather than guessing.
If the brief asks for a prohibited claim, refuse that element, explain why in
one line, and supply a compliant alternative.
```

### 10.2 Creative brief template (fill before generating)

```
SKU:                       (exact name per §3)
Objective:                 awareness / consideration / conversion / retargeting
Placement:                 feed 1:1 · feed 4:5 · story-reel 9:16 · carousel · DPA
Angle:                     ingredient education / concern-solution / price-value /
                           routine / social proof / new launch / offer
Hero fact:                 (the single claim carrying the creative)
Claim tier:                A / B / C   → if C, stop
Substantiation doc:        (required if tier B)
Accent source:             (pack artwork file — required)
Offer:                     (mechanic + conditions + validity)
Destination:               (exact URL — must match the claim)
Disclaimer required:       Y/N → text
```

### 10.3 Meta asset specifications

| Placement | Ratio | Pixels | Notes |
|---|---|---|---|
| Feed image | 1:1 | 1080 × 1080 | Default workhorse |
| Feed image (tall) | 4:5 | 1080 × 1350 | Highest feed real estate |
| Stories / Reels | 9:16 | 1080 × 1920 | Keep key content out of the top ~250 px and bottom ~340 px (UI overlay zones) |
| Carousel card | 1:1 | 1080 × 1080 | Consistent grid and accent across all cards |
| Catalogue / DPA | 1:1 | 1080 × 1080 | Pack on clean ground; no burned-in price (price comes from the feed) |
| Video | 4:5 or 9:16 | ≥ 1080 wide | Captions burned in; must read with sound off |

Formats: JPG/PNG for static, MP4/MOV for video. Verify current specs in Meta Ads Manager at build time — specs change.

### 10.4 Worked example — compliant vs non-compliant

**Brief:** SPF 50 Sunscreen, conversion, 4:5 feed.

❌ **Non-compliant**
> *Headline:* "Say goodbye to your tan forever!"
> *Visual:* split-screen before/after of a face, darker on the left
> *Body:* "India's #1 sunscreen. 100% protection, guaranteed. Dermatologist approved."
> **Fails:** checks 4, 5, 6, 8, 9, 10, 11 — before/after, second-person body assertion, "forever", "100%", "guaranteed", unqualified No.1, tan/tone framing, unsubstantiated dermatologist claim.

✅ **Compliant**
> *Headline:* Broad spectrum SPF 50, PA++++
> *Visual:* pack on white, single accent rule sampled from the pack, texture swatch showing no white cast
> *Body:* Four UV filters — Uvinul T 150, Avobenzone, Octocrylene and Titanium Dioxide. Lightweight, fragrance free, no white cast. Filters sourced from BASF, Germany and Royal DSM, Netherlands.
> *Description:* From ₹237
> *CTA:* Shop now
> *Footer:* \*SPF tested in-vivo to ISO 24444:2019 by an independent third-party laboratory. Not recommended during pregnancy or lactation.

---

## 11. Open items to confirm with the brand team

Resolve these before scaling automated generation:

1. **Official brand typeface** and licence coverage for paid media.
2. **Master colour kit** — ratified hex/Pantone values for base neutrals, and the per-SKU accent map. All `WORKING` values in §4.3 are placeholders.
3. **Logo asset pack** — SVG/EPS, reverse variants, `#HideNothing` lockup, minimum sizes.
4. **Photography library** — approved pack renders per SKU and per size, texture shots, model library with usage rights and territory/duration.
5. **Substantiation dossier** — every clinical/consumer study, SPF report, and sales-rank basis available to the agent as structured data.
6. **Post-HUL brand governance** — whether HUL/Unilever's global marketing code adds further restrictions beyond this document (it likely does; assume the stricter of the two applies).
7. **Legal sign-off route** — who approves Tier B claims, and the SLA.
8. **Live price feed** — an API or sheet the agent can query so §6 prices never go stale.

---

## 12. Sources

Compiled from the live Minimalist website (beminimalist.co — homepage, Our Values, and product detail pages for Niacinamide 10% Face Serum and SPF 50 Sunscreen, accessed Sep 2026), and public reporting of the HUL/Uprising Science transaction (Unilever press release, Jan 2025; subsequent completion filings, 2025).

Regulatory frameworks referenced are summarised for creative-production guidance and are **not legal advice**. Confirm all claims with qualified counsel and the brand's regulatory team before any campaign goes live.

**All product copy in this document is paraphrased or original.** Marketing copy, customer reviews and creative assets on beminimalist.co are the property of Uprising Science Pvt Ltd / HUL. Do not reproduce them verbatim in derivative creatives without authorisation.
