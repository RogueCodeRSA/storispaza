# Approved StoriSpaza plan

Approved 2026-11-10 with amendments. **Only M0 is authorized.** Pitch date: **not set**. Stop after the M0 report; later milestones require separate approval.

## Goal and defaults

Deliver a polished six-page English/Sesotho storytelling journey for Grade R–3 teachers, parents and families. *The Girl Who Spoke to Electricity* is set meaningfully in Soweto. Electrical powers are fantasy; real science is safe and adult-supervised. The 3–5 minute pitch runs on reviewed fixtures without any external network/API dependency.

One strict-TypeScript Next.js App Router app, Tailwind, Zod, Vitest and Playwright. Localhost only, no accounts, SQLite/local files. Creator-recorded narration in both languages; no Sesotho voice-to-story or synthetic Sesotho speech claims. You review Sesotho, cultural details, science, recordings and supplied opening/response phrases. Billing/model access unconfirmed.

US$10 development total; US$2 per generation session. Reserve estimates before dispatch, reconcile actuals, retain uncertain reservations. App allowances cannot guarantee provider billing. Time: 38 hours build/review/test/docs plus two contingency hours; final six reserved for hardening/rehearsal. Human review waiting time is additional.

## Architecture and contracts

Browser → validated server routes → services → SQLite/private files or provider. Server-only secrets; explicit mock/real mode and provenance; no silent fallback. Story includes context/objective, characters/style, six ordered pages, consent, visibility and approvals. Each page contains the spec's title, narrative, illustration description, character references and learning moment, with translation/media/provenance. Language packs declare review and speech capabilities. Provider operations cover structure, transcription, translation, prompt checks, character sheet and illustration.

All output stays editable/unreviewed until explicitly approved. Draft saves require confirmation; final/shared output requires current content approvals. Edits invalidate dependents. Fixed character sheet/shared style plus complete-prompt checks on every illustration/regeneration; cultural assumptions require confirmation. Voice storage/transmission/redistribution have separate consent. Default raw input deletion after processing; retention opt-in. Private assets stay outside public files. Shared means approved manual export, not public hosting.

Before paid operations: server-controlled sessions, ten AI requests/minute/session, one pending image operation, bounded retries for explicit transient failures only. Never retry quota/billing or ambiguous image timeouts automatically. M0 has no paid or mutating HTTP routes. Measure actual cost/access before generating final fixtures.

## MoSCoW

- **Must:** five stages; six editable pages; English voice capture/editable transcript/manual fallback; six consistent reviewed illustrations and per-page regeneration; human-reviewed Sesotho; creator narration; bilingual reader, page read-along/play/pause/resume, reviewed vocabulary taps, supplied call-and-response with tap-to-continue; approve/save/export, attribution, consent/deletion and visibility; fully offline mock mode; tests/docs/three reusable skills; **short educator/reviewer feedback record in M7**.
- **Should:** optimized media, next-page preload and accessible async status announcements.
- **Could:** optional unreviewed isiZulu text-only pack, expanded vocabulary.
- **Won't / Future Enhancements:** public hosting/accounts/gallery, collaboration, voice cloning, synthetic Sesotho speech, automated Sesotho speech claims, arbitrary-word pronunciation, child-response recognition, exact word highlighting, PDF/EPUB and extra export formats.

## Vertical milestones

Judging: J1 Codex planning/build/review/docs; J2 impact; J3 reusability; J4 reliable demo.

| Milestone | Acceptance | Hours | Judging |
| --- | --- | ---: | --- |
| M0 Foundation | AGENTS first, approved plan/docs, app/config/lint/test/CI, schemas, persistence, consent/approval rules, mock provider and fail-closed real boundary, provisional fixture pack. Paid access/cost check only if billing confirmed. | 4 | J1 J3 J4 |
| M1 Mock golden path | All stages on mobile; fixture edits, bilingual reader/audio, approval/save/export, deletable recording copy; offline Playwright journey. | 6 | J2 J4 |
| M2 StoriStart | Real text-to-six-pages and editable English voice transcript with consent/manual fallback; refusal/error/budget handling. | 4 | J1 J2 |
| M3 StoriCreate | Approved character sheet, six referenced images, selective regeneration with prompt checks; human identity/context/science review; freeze optimized images. | 6 | J2 J4 |
| M4 StoriSpeak | Side-by-side translation/edit/approval, 24 creator clips and verified phrases; freeze complete reviewed real-generated fixture pack/provenance. | 5 | J2 J3 J4 |
| M5 StoriPlay | Mobile/keyboard bilingual reader, page audio/play/pause/resume, reviewed vocabulary and call-and-response; no child microphone needed. | 4 | J2 J4 |
| M6 StoriOwn | Final approvals, attribution, consent/visibility/export, recording deletion and ownership explanation. ZIP reader/assets/JSON desired; **story JSON + simple standalone HTML reader accepted if time is short**. Raw input recordings excluded by default. | 3 | J2 J3 |
| M7 Hardening | Complete journey/a11y/privacy/security checks, clean-clone docs, skills, **educator/reviewer feedback record**, rehearsals/backup recording; checks pass. | 6 | All |

Consent/approval rules begin in M0. Initial fixtures are provisional; final real-generated text/images/translations and human recordings are frozen progressively. M0 is not the final fixture pack or five-stage demo.

## M4: exactly 24 creator recordings

Scripts are prepared from finalized reviewed text during M4. Use your own consenting adult voice; quiet environment, consistent browser-supported format (prefer MP3), no background music. Review each clip and separately consent to redistribution before committing it.

- 12 full page narrations: `en-page-01` through `en-page-06`; `st-page-01` through `st-page-06`.
- 6 vocabulary clips: `en-word-01`, `en-word-02`, `en-word-03`; `st-word-01`, `st-word-02`, `st-word-03`. Select three useful words per language from the final story.
- 6 interaction clips: `en-opening`, `en-response`, `en-continuation`; `st-opening`, `st-response`, `st-continuation`. You supply/verify Sesotho phrases; never invent traditional ones. Opening pauses for a tap, response is a separately playable example, continuation resumes. No child recording required.

## Validation, risks and cut order

Unit/integration/API tests: six-page shape/order/references, invalid/refused output, approval invalidation, consent/deletion, safe assets, durable/concurrent budget reservations/rate limiting, prompt checks on regeneration and no hidden fallback. Playwright: complete text/voice fixture journeys, translation edit/approve, regenerate, reader/respond, final save/export/visibility/deletion. Production mock journey starts without a key or external requests. Real tests are opt-in and reported separately.

Human review covers every Sesotho page/clip, character identity, cultural specifics and electrical safety. Keyboard/mobile/focus/labels/contrast/touch targets and automated accessibility checks are required. M7 feedback records reviewer role, date, task, observed benefit, problems, changes and limitations; never fabricate feedback or claim proven learning gains.

API access blocks real acceptance/final real-generated assets until confirmed. Character drift needs sheet/references/contact-sheet review and selective regeneration. Language quality depends on your review/recordings. Privacy depends on consent/deletion and no private recordings in Git. Protect six hardening hours.

Cut isiZulu UI → expanded vocabulary → decorative motion → extra export formats → optional English synthetic narration. Must-haves cannot silently disappear; propose a scope amendment if needed. Smallest competitive MVP: the fully reviewed offline six-page bilingual journey plus honest real-provider evidence, educator feedback and reusable language architecture.

## Milestone protocol

One milestone per `codex/` branch: confirm criteria → build → test/lint/typecheck/build → full diff review for bugs/a11y/security/privacy/culture → fix → docs → commit. Append REVIEWS/CODEX_WORKFLOW evidence. Never hide failed tests or claim untested features. Report Built | Files changed | Tests run and results | Review findings and fixes | Remaining risks | Judging impact | Proposed next milestone, then stop for approval.

Required docs follow SPEC section 9. MIT/CONTRIBUTING and three schema/checklist/example skills support reuse. Research sources/VERIFIED–ASSUMED labels live in DECISIONS.md. No GitHub MCP exposed in session; add no integrations.
