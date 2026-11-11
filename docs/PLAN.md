# Approved StoriSpaza plan

Approved 2026-11-10, amended 2026-11-11. **M3 is authorized with the gates below.** Creator selected OpenAI within $2/session and $10 development caps. Stop for character-sheet approval before page images, then stop after M3's report; M4 requires new approval. Pitch date: **not set**.

## M3 activation and creative approval amendment

- Work on `codex/m3-storicreate` from completed M2. M3 only: creator brief, ONE character sheet first, six reference-guided illustrations after explicit sheet approval, contact-sheet review, selective page regeneration and approved optimized images. No M4 work.
- Creator supplied the brief in `M3_CREATIVE_BRIEF.json` and separately confirmed Palesa, white shirt/grey skirt/green jersey and Orlando Towers. The name's meaning is omitted from prompts. Other AI suggestions remain suggestions pending creator confirmation; scene descriptions require explicit confirmation before generation.
- Use the first character sheet as the **single paid image measurement**. Report actual reported text/image input and image output tokens plus published-rate cost, separately from prompt screening and reservations; do not claim invoice verification. No additional images before the creator approves the sheet and measured cost. Unknown measurements, billing/access failures or ambiguous outcomes stop image work, with reservations retained and no automatic retry/fallback.
- Maximum **20 development image attempts total**, inclusive of the sheet measurement, sheets, all six pages, failed/ambiguous dispatched operations and regenerations. The creator's suggested split is guidance, not permission to exceed the cap or skip sheet approval. Durable shared SQLite counts persist across sessions/restarts; lowering `IMAGE_ATTEMPT_LIMIT` is allowed, raising it above 20 is rejected. Retain US$2/session and US$10/development including M2 spend/holds. App accounting cannot guarantee external provider billing.
- Every complete image prompt, including the sheet and every regeneration, passes the prompt-safety stage before image dispatch. Powers are explicitly fantasy; no child touching mains, sockets, exposed wires, power lines or substations; no unsafe imitable actions or lightning striking people. Human review remains necessary.
- After sheet approval, generate six pages sequentially with the actual approved sheet bytes as reference. Present a contact sheet with individual approval and regeneration; preserve unrelated pages and producer history. Freeze optimized copies privately only after all current images are approved and redistribution consent is explicit. No fixture images are committed before that approval.
- The first-image gate is an intentional pause within M3, not a completed milestone report. Complete checks/review/docs/commit and the required eight-part milestone report after the creator's image gates are satisfied; then stop before M4.

## M2 activation amendment

OpenAI replaces the prior Cloudflare-first choice for M2; Cloudflare stays deferred. Retain adapter isolation, reusable contract tests and per-asset provenance/history. Access probe passed before implementation (37 input / 13 output tokens, $0.00023 at published rates); after credential rotation a second identical probe also passed ($0.00023). Prior probe spend $0.00046 must be carried into development accounting. Both are rate-derived amounts, not independently verified invoices.

Real text-to-six-pages and English voice capture/transcription are M2 only; translation, illustration and narration remain unavailable. Paid tests require explicit opt-in and safe usage-only reporting; stop on billing/model/access failures without fallback. No raw prompts, transcripts or keys in logs/commits. The creator confirmed revocation/replacement after a credential was discovered in a tracked example and diagnostic output; blank the example and preserve only ignored local configuration.

## Historical provider preparation — superseded by M2 activation above

The creator authorized adapter isolation, per-asset provenance, reusable provider contract tests and SWITCHING_PROVIDERS.md. Implement this preparation on codex/provider-contract-foundation without starting live M2. M1 is complete. Live M2 remains conditional on a bounded explicit-opt-in access/usage check; the creator pushes branches/runs hosted CI, and failed CI requires their confirmation before branching M2.

Cloudflare Workers AI is the intended free provider. It is not implemented or access-tested in this preparation change; account/token setup instructions are in SWITCHING_PROVIDERS.md. Both actual account ID and token stay only in ignored .env.local. OpenAI research/model names/costs and VERIFIED/ASSUMED labels remain in DECISIONS.md as a future adapter, with no OpenAI integration now. All vendor-specific code belongs only in adapter files; route/UI/schema behavior stays generic. Each produced/replaced asset retains producer/model/history independently of the current adapter. Free allowance guards are required, not bypassed because estimated dollars are zero. No keys, raw recording prompts or transcripts are logged/committed.

## M1 authorization additions

- Branch `codex/m1-offline-journey` from integrated M0. Remote main still preceded M0 when checked; local main was fast-forwarded to approved M0 before branching. Nothing was pushed.
- Complete five-stage fixture journey on a real mobile device with networking disabled, in addition to Playwright mobile checks. Creator confirmed Android/Chrome and willingness to test. Record the real device result separately; emulation is not hardware evidence.
- Placeholder audio, Sesotho text and interaction phrases remain visibly provisional/unreviewed throughout editing, reading, saving and export. Demo acknowledgements never become human language approval.
- First screen explains the product immediately. Use the same client journey for Next.js and a self-contained downloadable offline HTML; no mobile server connection is required after download. This is an M1 demo bundle, not public hosting or the final M6 publishing workflow.

## Goal and defaults

Deliver a polished six-page English/Sesotho storytelling journey for Grade R–3 teachers, parents and families. *The Girl Who Spoke to Electricity* is set meaningfully in Soweto. Electrical powers are fantasy; real science is safe and adult-supervised. The 3–5 minute pitch runs on reviewed fixtures without any external network/API dependency.

One strict-TypeScript Next.js App Router app, Tailwind, Zod, Vitest and Playwright. Localhost only, no accounts, SQLite/local files. Creator-recorded narration in both languages; no Sesotho voice-to-story or synthetic Sesotho speech claims. You review Sesotho, cultural details, science, recordings and supplied opening/response phrases. M2 text/English transcription access is smoke-tested; later operations remain unverified.

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
