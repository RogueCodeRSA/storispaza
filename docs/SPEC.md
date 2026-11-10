# StoriSpaza: Product Spec

**Tagline:** Every Story Has a Place. Tell It. Create It. Own It.
**Hackathon:** OpenAI x Andela Codex Capstone. Impact theme: Education.

## 1. Vision

StoriSpaza is an AI-assisted African storytelling studio. It turns story ideas, voice recordings and oral traditions into illustrated, bilingual, narrated and interactive stories. The creator stays in control.

Anyone should be able to create, preserve and share an illustrated African story in their own language without an illustrator, translator or publishing tools.

## 2. Problem and users

- Children lack engaging learning material in home languages.
- Teachers lack affordable ways to create multilingual content.
- Oral traditions are lost when elders' stories aren't recorded.
- Writers face barriers to illustration, translation and publishing.
- Generic AI misrepresents African cultures.

**Primary users (Grade R-3 focus):** teachers, parents, elders. **Secondary:** children, writers, schools and community organisations.

**Differentiators:** African-language-first; creator-supplied cultural context; human-reviewed translation; consistent characters; oral-story preservation; interactive learning; ownership, attribution and consent; reusable language architecture.

Do not claim authentic support for a language or culture just because a model can generate text in it. Build mechanisms for correction and validation.

## 3. The five stages

### StoriStart: capture

Inputs: voice note or typed idea, optional title, age group, story language, cultural/geographic context, educational objective. Output: an editable six-page story. Each page has: number, title, narrative text, illustration description, character references, learning moment. The user can edit everything before continuing.

### StoriCreate: illustrate

- Consistent characters and style across pages (character sheet + shared style block).
- Page-specific prompts, editable descriptions, per-page regeneration.
- Prompt-safety check before every image call. No stereotypes or generic "Africa".
- Distinguish creator-provided cultural details from AI assumptions. Never present assumptions as fact.
- Example contexts: Soweto township, Basotho clothing, Cape Town street art, rural Eastern Cape, Johannesburg city life, African wildlife.

### StoriSpeak: translate and narrate

- Languages: English and Sesotho (primary, reviewed by the creator, a Sesotho speaker). Optional: isiZulu as a text-only second language pack with an "unreviewed" badge, to demonstrate reusability. Language-pack architecture so others can be added by config + language-specific capabilities, not by rewriting the app.
- Side-by-side source/translation per page; human edit and approval; per-page status: `machine-translated` -> `edited` -> `approved`.
- Machine translation is never labelled verified. Unreviewed text shows an "unreviewed" badge.
- TTS narration per page (subject to verified Sesotho quality; fallback per plan). Optional playback of the creator's own recording.

### StoriPlay: read

Mobile-first reader: page navigation, illustrated pages, read-along audio, play/pause, tap-a-word pronunciation, bilingual toggle, text highlighting where feasible, configurable call-and-response (the narrator speaks an opening phrase, the reader pauses until the child taps/responds, then the narrator continues). The Sesotho opening/response phrases are supplied and verified by me (a Sesotho speaker); never invent traditional phrases. isiZulu's "Kwasukasukela!" / "Cosu!" may be used as the example for an optional isiZulu text-only language pack. Works on slow connections (optimised images, lazy loading, resumable audio).

### StoriOwn: approve and publish

Preview; approval of text, translations and illustrations; AI-assistance attribution per page; private/shared visibility; export; voice-consent management; delete recording; ownership info. Stories involving children are private by default. No public sharing without consent and privacy controls.

## 4. Demo story: "The Girl Who Spoke to Electricity"

A young girl from Soweto discovers she can control electricity. Instead of using it for herself, she uses it to help her community. Six pages, English + Sesotho, age-appropriate, with a real basic-science idea (e.g. circuits, safety around electricity, load-shedding context). The setting must be meaningful, not decoration.

**Fixture pack:** generate the demo story once using real APIs, review it myself, and commit optimised assets (text, translations, images, audio) as fixtures. Mock mode serves these.

## 5. Responsible AI, privacy and safety (architectural requirements)

- **Human control:** all AI output editable; explicit approval before save/share; nothing auto-published; translations and illustrations need approval.
- **Voice:** no voice cloning, ever. Explicit consent before storing recordings, with a clear explanation of use. Deletion supported. Don't retain audio unnecessarily. Never use a child's voice for unrelated training.
- **Cultural safety:** cultural context originates from the creator or trusted contributors; prompt-safety validation stage; users can flag and correct inaccuracies; preserve original language and meaning.
- **Children:** private by default; age-appropriate language; no unnecessary personal data; no public messaging or unrestricted interaction.
- Document data flows, retention and deletion in docs/AI_SAFETY.md.

## 6. Mock mode (required)

The whole demo must work with no API keys and no network. Real and mock providers share the same interfaces. Mock responses simulate async latency and are clearly labelled as mock. The live demo must never depend on a successful external API call.

## 7. Technical requirements

TypeScript (strict), Next.js or justified alternative, Tailwind, OpenAI APIs, lightweight DB/storage, modular reusable components, input validation, centralised error handling, loading/error/empty states, secure env config, accessible and low-bandwidth-conscious. No premature microservices. Use Playwright for e2e if the stack supports it.

## 8. Design

Warm, proudly African, playful, modern, accessible, educational, professional. Picture-book and modern African editorial feel, not a generic AI dashboard. The five stages are visibly connected: StoriStart -> StoriCreate -> StoriSpeak -> StoriPlay -> StoriOwn. Large readable type, generous spacing, vibrant balanced colour, large touch targets, keyboard accessibility, high contrast. The first screen must communicate what StoriSpaza does immediately. Prioritise the story experience over admin screens.

## 9. Required documentation

AGENTS.md, README.md (overview, screenshots, features, stack, setup, env vars, mock mode, real API config, tests, deployment), .env.example, LICENSE, CONTRIBUTING.md, docs/PLAN.md, ARCHITECTURE.md, DECISIONS.md, REVIEWS.md, ADDING_A_LANGUAGE.md, CODEX_WORKFLOW.md, AI_SAFETY.md, DEMO_SCRIPT.md.

## 10. Quality assurance

Test the complete journey, not just the build:

- Create story from text and from voice; edit six pages.
- Illustrations per page with consistent characters.
- Sesotho translation, edit, approve; narration play/pause.
- Call-and-response; approve all content; save; export; change visibility; delete a recording.
- Unit, integration, API and Playwright e2e tests; error handling; responsive behaviour; accessibility; security; mock-mode run.
  Prioritise critical journeys over vanity coverage.

## 11. Demo (3-5 min) -> docs/DEMO_SCRIPT.md

0:00 Problem | 0:30 StoriStart | 1:00 StoriCreate | 1:45 StoriSpeak | 2:30 StoriPlay | 3:15 StoriOwn | 3:45 Impact + Codex (planning, building, reviewing, documenting; show AGENTS.md, plan mode, a review, a skill) | 4:30 What I'd do with another month.
Memorable within the first 30 seconds. Rehearse in mock mode. Keep a screen-recorded backup video. Don't demo untested features.

## 12. Definition of done

**Product:** demo story works end to end; six editable pages; illustrations on every page; English + Sesotho with review/correction; narration; interactive reader incl. call-and-response; approve/save/export; attribution and visibility; voice consent and deletion.
**Engineering:** clean architecture; tests and lint pass; no exposed secrets; no critical security issues; mock mode works; responsive and accessible; docs complete.
**Hackathon:** Codex use documented across the lifecycle; three skills included; adding a language is demonstrated; impact is specific; pitch rehearsed; repo ready for public evaluation.
