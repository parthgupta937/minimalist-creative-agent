# Minimalist — Brand Creative Specification for AI Agents

**Version:** 1.0
**Scope:** India market only (`beminimalist.co`)
**Applies to:** Automated generation of product display creatives
**Status:** Draft for brand and legal review before production use

---

## 0. How to read this document

This document is the operating contract for an AI agent that assembles Minimalist product creatives. It has two layers:

1. **Markdown rules** (this document) — the reasoning and constraints the agent applies.
2. **JSON payload spec** (Section 8) — the structured data the agent parses per render request.

Every statement below is tagged:

| Tag | Meaning |
|---|---|
| `[VERIFIED]` | Measured directly from brand assets or read from `beminimalist.co` |
| `[CONFIRMED]` | Stated by the brand owner during specification |
| `[GAP]` | Not yet supplied — the agent must hard-stop rather than improvise |

The agent must never resolve a `[GAP]` by inference, external lookup, or generation.

---

## 1. Brand foundation

### 1.1 What Minimalist is

Founded 2020 by Mohit Yadav and Rahul Yadav. Operated by Uprising Science Pvt Ltd, Jaipur. Hindustan Unilever acquired a 90.5% stake in April 2025. Science-led, actives-first skincare and haircare sold primarily through digital channels. `[VERIFIED]`

### 1.2 The founding conviction

The brand exists as a reaction against opacity in beauty marketing. From its own values page: it was founded on the belief that the industry needs a revolution in **transparency**, that inaccurate advice and incorrect claims produce fear-mongering and bad consumer decisions, and that the march toward "natural" claims rests on a false premise. Its own formulation of that point:

> "Everything is a chemical – water is a chemical – therefore, chemical-free products don't exist."

`[VERIFIED]`

**This has a direct operational consequence.** The agent must never generate copy positioning Minimalist as natural, clean, chemical-free, toxin-free, or free-from. Such copy contradicts the brand's stated founding position, not merely its tone.

### 1.3 Brand mission line

`#HideNothing` — appears as a standing brand asset (`HideNothing-Black.svg`) and in the brand's own social bio. `[VERIFIED]`

### 1.4 Stated brand pillars

From the brand's own description of itself: *efficacious, transparent, comprehensive.* `[VERIFIED]`

Supporting proof points as published on site:
- **Transparency** — full disclosure of ingredients and their concentration
- **Efficacy** — formulations developed in in-house laboratories
- **Affordable** — skincare accessible to all
- **Sourcing** — ingredients sourced from global suppliers

### 1.5 The naming convention is the positioning

Products are named by active and concentration: *Niacinamide 10% Face Serum*, *Salicylic Acid 2% Face Serum*, *B12 + Repair Complex 5.5% Face Moisturizer*. The concentration is not decoration — it is the brand's core claim of transparency, and it is why the percentage receives its own typographic treatment. `[VERIFIED]`

---

## 2. Verified design tokens

Only tokens the agent can apply are listed. Values were measured directly from supplied brand artwork.

### 2.1 Core palette

| Token | Hex | Use | Source |
|---|---|---|---|
| `brand.white` | `#FFFFFF` | Primary canvas for comparison assets | `[VERIFIED]` — 50.9% of Comparison Sheet pixels |
| `brand.ink` | `#000000` | All body and headline type | `[CONFIRMED]` |
| `brand.panel` | `#222222` | Header bands, badge fills | `[VERIFIED]` — measured on Comparison Sheet header and New Launch badge |
| `brand.accent.orange` | `#E57131` | Percentage value, launch assets only | `[VERIFIED]` — hue 21°, sat 0.79 |

### 2.2 Backdrop for product-in-scene assets

Soft grey gradient, approximately `#E6E6E6` → `#EDEDED`, lighter toward the upper area. `[VERIFIED]`

The agent does **not** construct this. Backdrops come from the approved asset library (Section 6.4).

### 2.3 Colours the agent must NOT use

- **`#E2E6E7`** — appears in brand social artwork but is post-specific, not a brand token. `[CONFIRMED]`
- **Any ingredient or concern accent colour.** Minimalist packaging carries a colour-coded rule under each product name (reddish for Salicylic Acid + LHA, blue for Aquaporin Booster, yellow for Alpha Lipoic + Glycolic, olive for the B12 range). **The agent never draws these.** They arrive already present inside the photographic pack render. `[CONFIRMED]`

> **Why this matters.** These accent colours could not be sampled reliably from supplied screenshots — the rules are 1–2px wide and blend into white, returning desaturated blends (max saturation 0.11–0.35) rather than true values. Because the agent only places photographic renders, this is not a blocker. It becomes one the moment anyone asks the agent to draw a chip, rule, or swatch. If that requirement ever appears, stop and request the hex values from the design file.

---

## 3. Typography

### 3.1 Families

| Role | Family | Notes |
|---|---|---|
| Primary | **Inter** | All headline, body, and label type `[CONFIRMED]` |
| Brand-approved alternate | **Helvetica Neue** | Specific components only `[CONFIRMED]` |

Both are neo-grotesque. This is consistent with measured letterforms in supplied artwork: double-storey `a` with tail spur, horizontal terminals on `C`/`e`/`S`, flat-cut `t`. `[VERIFIED]`

The agent must not substitute any other family. If neither font is available at render time, **hard-stop** (Section 10).

### 3.2 Weights observed in approved artwork

| Weight | Applied to |
|---|---|
| Bold | Product name headline, section headers, "Key ingredients :" label |
| Medium | Concern chip text, benefit lines |
| Regular | Format descriptor, footer strip, supporting copy |

### 3.3 Case and style

- Headlines and product names: **sentence case**
- Format descriptor (e.g. "Face Moisturizer"): sentence case, lighter weight, set below the product name
- Benefit triplet on launch assets (e.g. "Soothe. Repair. Restore."): **italic**, sentence case, full stop after each word `[VERIFIED]`
- Badges (e.g. "New Launch"): sentence case, white on `brand.panel`

### 3.4 Percentage formatting — strict

| Rule | Value |
|---|---|
| Format | `2%` — **no zero-padding** `[CONFIRMED]` |
| Deprecated | `02%`, `05%`, `07%` — legacy artwork only, never reproduce `[CONFIRMED]` |
| Decimals | Retain as published: `5.5%`, `6.5%`, `15.6%` |
| Colour on launch assets | `brand.accent.orange` `#E57131` `[CONFIRMED]` |
| Colour on comparison assets | `brand.ink` `#000000` `[CONFIRMED]` |

The percentage is coloured **only** on launch assets. Everywhere else it is black.

---

## 4. Wordmark and branding

- **No Minimalist logo lockup appears on creatives.** Branding is carried by the pack render alone. This is deliberate. `[CONFIRMED]`
- The word "Minimalist" may appear as the **first word of a launch-asset headline** (e.g. "Minimalist B12 + Repair Complex 5.5%"). `[VERIFIED]`
- Comparison assets do **not** prefix product names with "Minimalist". `[VERIFIED]`
- The agent must never overlay, redraw, recolour, or reposition a logo.

---

## 5. Template A — Comparison Sheet

### 5.1 When to use

Two or more SKUs compared on shared attributes within one category.

### 5.2 Structure `[VERIFIED]`

```
┌────────────────────────────────────────────┐
│  [#222222 header band]                     │
│  <Category> Cheat Sheet          (white)   │
├──────────────────────┬─────────────────────┤
│  PRODUCT BLOCK       │  PRODUCT BLOCK      │
├──────────────────────┼─────────────────────┤
│  PRODUCT BLOCK       │  PRODUCT BLOCK      │
└──────────────────────┴─────────────────────┘
```

Canvas: `#FFFFFF`. Header band: `#222222`, white type, category word bold + "Cheat Sheet" regular.

### 5.3 Product block — fixed order

1. Pack render (left)
2. Product name + percentage — bold, black
3. Concern chip — outlined pill
4. `Key ingredients :` label (bold) + ingredient list (regular)
5. Benefit lines — circled tick icon + text, **two per product**
6. Footer strip — `AM + PM` with sun/moon icons | skin type | pH

### 5.4 Field rules

| Field | Rule |
|---|---|
| Product name | Verbatim from PDP title, minus "Minimalist" prefix |
| Percentage | Black. `2%` format. |
| Concern chip | **First listed concern only, verbatim** from the PDP concern strap. Never compress the full phrase. `[CONFIRMED]` |
| Key ingredients | Verbatim from PDP key-ingredient list |
| Benefits | Exactly two, verbatim PDP strings. If none available → hard-stop |
| pH | Omit the field entirely if not published on the PDP. Never guess, never look up externally. `[CONFIRMED]` |
| Price | **Never rendered.** `[CONFIRMED]` |

---

## 6. Template B — Launch Asset

### 6.1 When to use

Single-SKU announcement of a new or reformulated product.

### 6.2 Structure `[VERIFIED]`

```
┌────────────────────────────────────────────┐
│  [New Launch]  ← #222222 badge, white type │
│                                            │
│  Minimalist <Product Name> <N%>            │
│  <Format Descriptor>                       │
│                                            │
│  <Benefit. Triplet. Italic.>               │
│                                            │
│              [ product-in-scene render ]   │
└────────────────────────────────────────────┘
```

Backdrop: soft grey gradient from approved library. Type block upper-left. Product scene lower-right.

### 6.3 Field rules

| Field | Rule |
|---|---|
| Badge | `New Launch` on `#222222`, white, top-left |
| Headline | `Minimalist` + product name + percentage. Percentage in `#E57131`. |
| Format descriptor | Verbatim PDP product type ("Face Moisturizer", "Face Serum") |
| Benefit triplet | Three words, italic, each closed with a full stop. **Requires copy approval — not agent-generated.** `[GAP]` |
| Price | **Never rendered.** `[CONFIRMED]` |

### 6.4 Scene assets

Lab glassware, petri dishes, powders, and backdrops are pulled **exclusively** from the approved asset library URL supplied in the system prompt. The agent is **strictly forbidden from generating backdrops or props.** `[CONFIRMED]`

If the library URL is absent or unreachable → hard-stop.

---

## 7. Sourcing data from a product URL

The agent receives a `beminimalist.co` PDP URL and parses it. No other source is permitted.

### 7.1 Field mapping

| Creative field | PDP source | Rule |
|---|---|---|
| Product name | Page H1 | Verbatim |
| Percentage | Parsed from product name | Reformat to `2%` style |
| Format descriptor | FAQ → "Product type" | Verbatim |
| Concern chip | Concern strap under title | **First concern only, verbatim** |
| Key ingredients | "Ingredients" section headings | Verbatim |
| Benefit lines | Primary product description / "What Makes It Potent?" | Verbatim, unmodified |
| pH | Product attribute badges | Omit if absent |
| AM/PM | "How to Use" → "When to use" | Parse; omit if absent |
| Skin type | "Ideal For" → "Suitable for" | Verbatim |
| Pack render | **First image in the PDP media gallery** `[CONFIRMED]` | |
| Price | — | **Never used** |

### 7.2 Source precedence

**Primary product description outranks meta description.** `[CONFIRMED]`

This is not a stylistic preference. Minimalist's meta descriptions contain materially stronger claims than its on-page copy — one PDP meta description states the product "removes acne scars & blemishes," language that does not appear in the approved on-page description. The agent must never read claims from `<meta>` tags, page titles, or OG tags.

---

## 8. JSON payload spec

The agent parses a PDP into this structure before rendering. Any `null` in a required field triggers a hard-stop.

```json
{
  "spec_version": "1.0",
  "market": "IN",
  "template": "comparison_sheet | launch_asset",
  "source_url": "https://beminimalist.co/products/<handle>",
  "products": [
    {
      "product_name": "Salicylic Acid + LHA",
      "percentage": {
        "value": "2%",
        "colour": "#000000"
      },
      "format_descriptor": "Face Cleanser",
      "concern_chip": "Acne",
      "key_ingredients": ["Salicylic Acid", "LHA", "Zinc"],
      "benefits": [
        "Reduces sebum",
        "Prevents breakouts without drying"
      ],
      "footer": {
        "usage_time": "AM + PM",
        "skin_type": "Oily / acne-prone, combination",
        "ph": "4.5 – 5.5"
      },
      "pack_render_url": "<first gallery image URL>",
      "price": null
    }
  ],
  "scene": {
    "backdrop_asset_id": "<from approved library>",
    "prop_asset_ids": []
  },
  "typography": {
    "family": "Inter",
    "fallback": "Helvetica Neue"
  },
  "provenance": {
    "claims_source": "primary_description",
    "fetched_at": "<ISO 8601>"
  }
}
```

### 8.1 Field constraints

| Field | Required | Null behaviour |
|---|---|---|
| `product_name` | Yes | Hard-stop |
| `percentage.value` | Yes | Hard-stop |
| `concern_chip` | Template A only | Hard-stop |
| `benefits` | Template A only, exactly 2 | Hard-stop if fewer than 2 |
| `footer.ph` | No | Omit field from render |
| `footer.usage_time` | No | Omit field from render |
| `pack_render_url` | Yes | Hard-stop |
| `price` | Must be `null` | Hard-stop if populated |

---

## 9. Copy and claims

### 9.1 The single governing rule

**Reuse verbatim. Never rewrite, never paraphrase, never compress.** `[CONFIRMED]`

If a PDP string does not fit a template field, the agent **hard-stops** and escalates. It does not shorten, truncate, or reword. `[CONFIRMED]`

This is the most important rule in this document. Compression is where a compliant claim becomes non-compliant — "clinically proven to reduce melanin concentration in 2 weeks" and "reduces melanin" are legally different statements, and only one of them is substantiated.

### 9.2 Voice, where the agent has any latitude at all

It has almost none. But for structural copy (headers, category labels):

- Plain, declarative, specific. Short sentences.
- Lead with the active and the concentration.
- No superlatives, no urgency, no aspiration.
- No "clean", "natural", "chemical-free", "toxin-free", "free from" — these contradict the brand's founding position (Section 1.2).

### 9.3 Prohibited generation

The agent must not generate:

- Any efficacy or performance claim not present verbatim on the PDP
- Before/after imagery, in any form
- Star ratings, review counts, or review quotations
- Superlatives requiring comparative substantiation: "No.1", "best", "most effective", "India's favourite"
- Dermatologist endorsement, lab-coat imagery, or implied medical authority
- Human models `[CONFIRMED — not used in product display creatives]`
- Any price, discount, MRP, or offer figure

---

## 10. Hard-stop refusal architecture

The agent **stops and escalates to a human** rather than rendering, whenever any of these is true. `[CONFIRMED]`

**Data integrity stops**
1. PDP unreachable, or not a `beminimalist.co` URL
2. Required field returns null (Section 8.1)
3. A figure — pH, percentage, net quantity, size — is absent from the PDP
4. Fewer than two benefit strings available for Template A

**Compliance stops**
5. A claim string is too long for its field
6. Required copy is not available verbatim from the primary description
7. Claim text would come from a meta description, page title, or OG tag
8. Any price, MRP, or discount figure appears in the payload

**Asset integrity stops**
9. Pack render unavailable, or first gallery image is not a clean pack shot
10. Approved asset library unreachable
11. Backdrop or prop would need to be generated
12. Inter and Helvetica Neue both unavailable
13. The request would require re-typesetting a pack label

**Escalation format**

```json
{
  "status": "halted",
  "stop_code": "CLAIM_OVERFLOW",
  "field": "benefits[1]",
  "detail": "PDP string exceeds field capacity; paraphrase prohibited.",
  "source_url": "<url>",
  "action_required": "human_copy_approval"
}
```

The agent must never resolve a stop by substituting, shortening, or inventing.

---

## 11. Sales channels

"Sales type" resolves to **channel**: D2C versus third-party marketplace. `[CONFIRMED]`

| Channel | Notes |
|---|---|
| D2C — `beminimalist.co` + own app | Primary. Source of record for all product data. |
| Own mobile app | App-exclusive offers exist; creative implications `[GAP]` |
| Third-party marketplaces | Amazon, Nykaa, Flipkart |
| Quick commerce | `[GAP]` — confirm presence and tile specs |
| General / modern trade | Expanded post-HUL acquisition `[GAP]` |

**Channel-specific creative specs are not yet supplied `[GAP]`.** Marketplace listing images carry platform rules that differ from D2C — Amazon restricts badges and promotional text in main images; Nykaa and Flipkart have their own banner specs. Until these are supplied, the agent should render to the D2C spec and flag any marketplace-destined request for manual review.

---

## 12. Legal guardrails — India

**This section is a working framework, not legal advice. It requires review by qualified counsel and by HUL's claim-approval function before production use.**

### 12.1 Applicable regime

Scoped to India only, on the basis that all source URLs are `beminimalist.co`. `[CONFIRMED]`

| Instrument | Relevance |
|---|---|
| Drugs and Cosmetics Act, 1940 and Cosmetics Rules, 2020 | Governs cosmetic claims; separates cosmetic from drug claims |
| Legal Metrology (Packaged Commodities) Rules, 2011 | Declarations: net quantity, MRP, manufacturer, country of origin, consumer care |
| ASCI Code | Truthful, substantiated, non-misleading advertising |
| CCPA Guidelines for Prevention of Misleading Advertisements, 2022 | Misleading and surrogate advertising; due diligence on endorsements |
| Consumer Protection Act, 2019 | Liability for misleading advertisement |

### 12.2 The cosmetic/drug boundary

The sharpest exposure in this category. A cosmetic may **cleanse, beautify, promote attractiveness, or alter appearance**. Language implying it **treats, cures, prevents, or heals a condition** can reclassify it as a drug, triggering licensing requirements it does not hold.

Because the agent reuses PDP strings verbatim and never generates claims, it does not create this exposure. But it can **propagate** it. The verbatim rule is the control.

### 12.3 Word-level risk register `[PROPOSED — requires legal sign-off]`

| Risk | Words |
|---|---|
| **High** — likely drug claim | cures, treats, heals, prevents, eliminates, permanent, medicine, therapy |
| **High** — unsubstantiated superlative | No.1, best, most effective, guaranteed, 100% |
| **Medium** — needs substantiation on file | clinically proven, dermatologically tested, proven, results in X days/weeks |
| **Contradicts brand position** | clean, natural, chemical-free, toxin-free, free from |

The agent does not apply this list to generate copy. It applies it as a **flag**: if a verbatim PDP string contains a High-risk term, render but log it for review.

### 12.4 Statutory declarations `[GAP]`

Whether net quantity, manufacturer name and address, country of origin, and consumer care details must appear on a digital creative — as opposed to being legible on the pack render — has not been confirmed.

Conservative default until confirmed: the pack render must be legible and unobscured, and the agent must never crop, overlay, or obscure the label area of a pack render.

### 12.5 Claim substantiation

Substantiation is held by the brand, not the agent. The PDP is the approved claim source of record `[CONFIRMED]`. The agent's compliance posture rests entirely on:

1. Verbatim reuse only
2. Primary description only, never meta
3. Hard-stop on overflow

If any of those three is relaxed, the compliance argument collapses.

---

## 13. Open gaps

| # | Gap | Blocks |
|---|---|---|
| 1 | Approved asset library URL for backdrops and props | Template B |
| 2 | Benefit-triplet copy source and approval route | Template B |
| 3 | Channel-specific specs for marketplaces and quick commerce | Section 11 |
| 4 | Statutory declaration requirements on digital creatives | Section 12.4 |
| 5 | Legal sign-off on the word-level risk register | Section 12.3 |
| 6 | Canvas dimensions per channel and placement | Both templates |
| 7 | Ingredient and concern accent hexes | Only if the agent is ever asked to draw chips or rules |
| 8 | Whether Facebook creative differs from Instagram | Social adaptation |

Items 1 and 2 are blocking for Template B. Items 4 and 5 are blocking for production use in any template.

---

## 14. Change control

This spec is versioned. Any change to Sections 9 (claims), 10 (refusals), or 12 (legal) requires brand and legal re-approval. Design token and template changes require brand approval.

The agent must refuse to operate against a spec version it cannot verify.