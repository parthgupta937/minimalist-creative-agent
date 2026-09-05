Product Manager - Assignment for Nudge.new


Why we're asking you to do this
We build AI agents for marketing. The core of the job is not writing specs — it's making judgment calls about agent behaviour: what the agent should do on its own, what it should refuse to do, what it should escalate to a human, and how we know whether its output is any good.
This assignment puts you in that position directly. You'll build a small working product using AI tooling of your choice, and more importantly, you'll make and defend a set of design decisions.
We are not evaluating engineering skill. We are not evaluating visual polish. Read the evaluation criteria at the end before you start — they will tell you where to spend your time.

The scenario
You're the PM for an internal tool at Minimalist (https://beminimalist.co), an Indian science-led skincare brand.
The performance marketing team ships dozens of ad creatives a week across Meta and Google. Two things are slow: producing the creative, and getting it through brand and legal review before spend. Reviews happen over Slack, reviewers disagree with each other, and rejected ads bounce back and forth for days.
You've been asked to prototype a tool that addresses both halves.
On tooling
Build this with any coding agent. Claude Code, Codex, Cursor, Gemini CLI, Aider, Windsurf — any of these is fine, and any underlying model is fine. We have no preference among them.
Please don't use prompt-to-app builders — Lovable, Bolt, v0, Replit Agent, Emergent, and similar. Not because they're bad tools, but because they hide the part of the process we want to see. We need to watch you direct an agent through a problem, and those platforms compress that into a few prompts and a finished-looking result.
You are writing a real codebase. Use git and commit as you go, in reasonably sized commits rather than one at the end.
If you don't currently have access to a coding agent, email us before you start and we'll arrange it. Don't pay out of pocket for this assignment, and don't let tool access be the reason you drop out.

Some context on the brand, which you should verify and expand on yourself by looking at their site, packaging, and existing ads:
Founded 2020, Jaipur. Positioning is radical ingredient transparency — active concentrations printed on the front of the pack (10% Niacinamide, 2% Salicylic Acid).
Marketing is education-first. Clinical aesthetic, minimal ornamentation, science communicators and dermatologists rather than celebrity endorsement.
They deliberately avoid the fear-based and exaggerated-claim marketing common in the category.
They operate in India and internationally, which means claims are subject to India's Drugs and Cosmetics rules and the ASCI code, among others.

What to build
Part A — Ad generator
An app where a marketer pastes a product URL from beminimalist.co and gets back a finished ad creative.
Requirements:
Input is a single product URL. The app pulls what it needs from that page.
Output is a rendered visual ad — an actual composed creative with the product image, headline, supporting copy, and any other elements you decide belong there. Not a text list of headline options.
Output at least one standard placement size. If you support more than one, that's a decision you should be able to justify.
The marketer must be able to get the creative out of the tool in some usable form.
On how the visual gets made: two broad paths, both fully acceptable.
You can compose the ad as a rendered layout — HTML/CSS or SVG — using the actual product photograph from the page. Or you can use an image generation model (like nano banana etc) to produce some or all of the visual.
Note that these are not equivalent choices for this brand. A generated product image is a fabricated depiction of a real product, on a brand whose entire position is that it doesn't misrepresent things. If you go the generation route, we'll want to know you thought about that. If you use it for backgrounds, environments, or lifestyle elements around a real product photo, say so. Either way, treat this as a decision to defend rather than a technical detail.
On fetching the page: browser CORS restrictions may block you from reading beminimalist.co directly. If so, build a fallback — let the user paste the page content or enter the product fields manually — and note it as a known limitation. Getting the fetch working is not what we're assessing.
Part B — Ad quality scorer
A second surface that takes an ad creative and scores it before it goes live.
It must evaluate against three distinct dimensions:
Policy and claims. Is anything here unsubstantiated, non-compliant, or legally risky for a skincare product in this market?
Brand tone. Does this sound like Minimalist, or does it sound like a generic skincare ad?
Brand language. Vocabulary, claim structure, how ingredients and concentrations are stated, what the brand does and doesn't say.
Requirements:
The scorer must work on any ad you feed it, not just ones your generator produced. Include a way to paste in an arbitrary ad. We will test it with ads you have not seen.
Output must be actionable. A single number tells a marketer nothing. Decide what a reviewer actually needs to act — severity, specific flagged spans, suggested fixes, a verdict — and build that.
Be explicit about where the standard comes from. You are deriving Minimalist's brand rules yourself; the scorer's judgments are only as good as the rules behind them.
The two parts should connect. How they connect is your decision. Does the generator self-score before showing output? Does a failing score block export? Does the marketer see the score at all, or only the passing creative? There are defensible answers in several directions — pick one and be ready to explain it.

Deliverables
Submit four things. All four are read.
1. The working app. A link we can open and use, or a file we can run with clear instructions. If setup takes more than two minutes we may not get to it. 
2. Your build record. Two parts:
The repo, with its commit history intact. Don't squash it.
Your agent session transcript — the full thing, unedited, including the parts that went badly. Claude Code and most others save these; export or copy them out. Messy is expected and fine.
This is the deliverable we read most closely. It shows us how you break down a problem, where you caught the agent being wrong, and what you did about it.
Also include the prompts your app itself uses. If the scorer's judgment lives in a prompt, that prompt is the substance of your work.
3. A one-page decision doc. One page, hard limit. Cover:
The brand rules you derived, and how you derived them
What you cut, and why
The single design decision you were least sure about, and how you resolved it
4. A failure modes list. The top three ways this tool causes a problem in production — not bugs, but ways a well-functioning version of it still leads to a bad outcome. For each, what you'd do about it and whether you'd do it before launch or after.

How we'll evaluate
Roughly in order of weight:
Judgment under ambiguity. This brief is deliberately underspecified in several places. We're watching what you do with the gaps — whether you name them and decide, or paper over them.
Do you understand the failure that actually costs money? In marketing AI, the expensive failure is publishing something wrong, not writing something bland. We'll look at whether your design reflects that.
Quality of the standard, not the output. Any current model will produce a nice-looking ad. The interesting question is whether your scorer encodes a real, defensible view of what good means for this brand, or whether it's asking a model to have opinions and reporting them back unexamined.
Honesty about limitations. We would rather see a narrow thing that works and an accurate account of what it doesn't do than a broad thing with a confident demo. Overclaiming is the fastest way to fail this.
Iteration. From the transcript: did you look critically at output and push back on it, or accept the first thing that came out?
We are explicitly not scoring visual design quality, code quality, or how many features you fit in. A submission with one well-reasoned feature will beat a submission with six.

Notes
Any coding agent, any model, any stack. Just tell us what you picked.
If you get stuck on something technical, work around it and note it. Don't burn hours debugging.
You don't need to be a strong programmer to do well here. You do need to be able to tell when the agent has done something wrong and say so.
If something in this brief seems wrong or contradictory, say so in your decision doc. That's a valid finding.
Shortlisted candidates will walk us through their work in person. Come ready to defend the decisions, including the ones you're not sure about.




