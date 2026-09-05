Part A — Ad Generator: Implementation Plan

 Context

 This is the PM take-home for Nudge.new (docs/assignment.md). Part A asks for a web app: marketer pastes a beminimalist.co product URL, gets back a
 finished, downloadable ad creative. Part B (scorer) and the written deliverables (decision doc, failure-modes list) are explicitly out of scope for
 this pass — we're only building the generator now.

 Two brand rule documents exist in docs/ and they conflict on fundamentals (copy generation, logo/model usage, price display, color sourcing). Per
 discussion, minimalist-brand-creative-spec.md is authoritative; minimalist-brand-guidelines.md is set aside entirely for this build. Key spec rules
 driving this plan:

 - Verbatim only (§9.1): never generate, rewrite, or paraphrase copy. Every string in the creative must come from the PDP's primary description,
   unmodified.
 - Hard-stop over guessing (§10): if a required field is missing, ambiguous, or would need invention, the tool stops and asks a human — it never
   fabricates.
 - No logo, no human models, no price, no drawn accent colors (§2.3, §4, §9.3) — branding rides entirely on the real pack photo.
 - Primary description outranks meta description; claims must never come from <meta>/OG tags (§7.2) — Minimalist's own meta descriptions contain
   stronger, non-compliant claims than the on-page copy.
 - The spec's two named templates don't cleanly fit a single-URL input: Comparison Sheet needs 2+ SKUs; Launch Asset needs an approved backdrop
   asset library and a legally-approved benefit triplet, both flagged [GAP] (unavailable to us). Resolution (a named decision, to carry into the
   decision doc): build a third minimal layout — call it Template C, single-product card — that reuses Comparison Sheet's per-field verbatim rules
   for one product instead of a grid, on a plain white canvas (no backdrop asset library needed), with no badge/triplet (avoids both GAP items).
 - Canvas pixel dimensions are an explicit spec gap (§13 item 6). We'll default to 1080×1080 (Meta feed square) as our one supported placement, and
   name that as a decision.
 - Claude API (key available) is used strictly as a verbatim extractor — turning messy/varying Shopify PDP HTML into the structured payload below,
   copying strings exactly and returning null when not confidently present — never as a copywriter. This keeps the "verbatim only" rule intact
   despite real-world markup variance across product pages.
 - Server-side fetch (a Next.js route handler) sidesteps the browser CORS issue the assignment flags entirely, since CORS only restricts
   browser-initiated requests. The real fetch risk is different (anti-bot blocking, client-side-rendered content, per-theme markup drift) — we still
   build the manual/paste fallback the assignment requires, but for that reason, not for CORS, and we'll say so precisely rather than misdiagnose
   it in the write-up.

 Stack

 Next.js (App Router, TypeScript) deployed on Vercel — one repo, one deploy:
 - Route handlers do the server-side PDP fetch, Claude extraction, and creative rendering (keeps ANTHROPIC_API_KEY server-only).
 - Rendering uses @vercel/og's ImageResponse (Satori under the hood): the API returns a PNG directly from a JSX layout description. This is deployed
   as a single render path — the same PNG is both the on-page preview and the downloaded file, so there's no drift between "what you see" and "what
   you get."
 - Minimal Tailwind for the surrounding form UI only (not scored on visual polish; keep this cheap).

 Data model (lib/spec.ts)

 TypeScript type + validator mirroring spec §8, trimmed to Template C (single product, no scene/backdrop, no multi-product array):

 ProductPayload {
   productName: string          // required — hard-stop if missing
   percentage: string           // required, "N%" no zero-pad — hard-stop if missing
   formatDescriptor: string | null
   concernChip: string | null   // first concern only, verbatim
   keyIngredients: string[]     // verbatim list
   benefits: [string, string]   // exactly two, verbatim — hard-stop if fewer than 2
   ph: string | null            // omit field from render if null
   usageTime: string | null     // AM/PM — omit if null
   skinType: string | null
   packRenderUrl: string        // required — hard-stop if missing
   price: null                  // must always be null — hard-stop if the extractor ever populates it
   sourceUrl: string
   fetchedAt: string            // ISO 8601
 }

 validatePayload() returns either { ok: true, payload } or { ok: false, stop: { stopCode, field, detail } } in the §10 escalation shape — used to
 drive the UI's hard-stop messaging.

 Task list (each a commit)

 1. Scaffold — create-next-app (TS, App Router, Tailwind, no src/ dir needed). .env.local.example with ANTHROPIC_API_KEY. Basic README stub.
 2. Payload schema + hard-stop validator — lib/spec.ts as above, with unit-testable validatePayload().
 3. PDP fetch + verbatim extraction route — app/api/fetch-product/route.ts: validate the URL is on beminimalist.co (else hard-stop per §10.1),
    server-fetch the HTML, lightly pre-trim it (cheerio: title, first gallery <img>, description/FAQ/attribute-badge regions only — never <meta>/OG
    tags per §7.2), then call Claude with a strict extraction-only prompt ("copy verbatim, null if not confidently present, never paraphrase or
    infer") to produce the ProductPayload. Runs validatePayload() on the result before returning.
 4. Manual entry / paste fallback — a form with the same fields, usable either for direct manual typing or for pasting raw page text/HTML (routed
    through the same Claude extraction step) when the live fetch fails or a marketer prefers it.
 5. Review & edit step (UI) — after fetch or manual entry, show every field editable, visibly flag any field the validator hard-stops on (with the
    exact §10-style reason), and keep "Generate creative" disabled until every required field is resolved.
 6. Creative renderer — lib/render-creative.tsx (JSX layout) + app/api/render/route.ts (ImageResponse, 1080×1080): white canvas, pack photo, product
    name + percentage in black, outlined concern-chip pill (first concern, verbatim), key ingredients line, exactly two verbatim benefit lines with
    tick marks, footer strip for AM/PM · skin type · pH (each field entirely omitted, not blanked, when null). Inter typeface. No logo, no price,
    no models, no generated backdrop.
 7. Preview + download wiring — page calls /api/render, displays the returned PNG as the live preview, "Download PNG" saves that exact file.
 8. Hard-stop UX pass — confirm every §10 condition we can hit (unreachable/wrong-domain URL, missing required field, fewer than 2 benefits, price
    populated) surfaces a clear human-readable stop message rather than failing silently or guessing.
 9. Real-page smoke test — run an actual beminimalist.co product URL end-to-end, fix concrete parsing breakage found, and write down precisely what
    broke and why (feeds the assignment's required "known limitations" note — not a new deliverable file yet, just captured for later).
 10. README pass — run instructions, env var setup, the CORS clarification stated accurately, current known limitations.

 Verification

 - npm run dev locally, walk the flow: paste a real beminimalist.co PDP URL → confirm extraction or a correct hard-stop → edit/confirm fields →
   generate → verify the downloaded PNG matches the on-screen preview exactly (same render path) → visually check spec compliance (no price, no
   logo, no model, exactly 2 verbatim benefits, correct percentage formatting).
 - Deliberately test failure paths: a non-beminimalist.co URL (expect domain hard-stop), a URL that 404s (expect fetch hard-stop), manually blanking
   a required field before generating (expect the Generate button to stay disabled with the reason shown).
 - Deploy to Vercel, confirm the same flow works with ANTHROPIC_API_KEY set as a Vercel env var, under the assignment's "runnable in under two
   minutes" bar.