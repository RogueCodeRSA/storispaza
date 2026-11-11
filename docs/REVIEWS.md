# Milestone reviews

## M3 — 2026-11-11

Authorized on `codex/m3-storicreate` from completed M2 `eb27093`. Creator supplied and confirmed the brief, approved the single-sheet measurement/visuals before pages, confirmed six AI-suggested scene plans, reviewed/approved the contact sheet, then explicitly consented to freezing and committing redistributable image fixtures. M4 is not started. Approval/consent evidence is recorded in fixtures/approved-images/CONSENT.md; no broader language or educational approval is inferred.

### Review findings and fixes

- **High, spend/duplicate controls:** added atomic shared maximum-20 image reservation count, inclusive of failed/uncertain dispatches and persistent across sessions/restarts. One unresolved image blocks all subsequent image work; unknown measurements halt the workspace. A durable lease and revision/current-asset checks prevent overlapping dispatches and stale approvals. Existing US$2/session/US$10 development accounting carries M2 spend/hold forward. Denial/timeout/billing/model failures never retry/fall back.
- **High, approval/safety:** every real sheet/page/regeneration passes a fresh check of the complete prompt before image reservation/dispatch. Pages require an approved current sheet and its measured cost, actual sheet bytes and explicitly confirmed scenes. Input-story approvals are normalized to unreviewed; mock acknowledgements never become genuine approvals. Replacing one image resets its approval and fixture redistribution consent while preserving others/history. Freeze requires all current approvals plus explicit redistribution consent.
- **Medium, creator work preservation:** applying a one-page response initially reset all prompt textareas, risking lost unsaved edits on another page. Preserve open prompt edits on operation/error responses; only explicit restore/start replaces them. Desktop/mobile browser tests now edit two prompts, regenerate one and verify the other's unsaved text and image identity survive.
- **Medium, loopback URL normalization:** real browser testing found Next canonicalizes request.url to localhost while browser Origin uses 127.0.0.1. Validate both local URL/Host and exact Host-derived Origin. Host/origin spoofing and cross-site regressions remain rejected. No weakening to wildcard or missing-origin acceptance.
- **Provenance/offline honesty:** frozen source fixtures keep producer/model, IDs, hashes, reported usage and history through offline replay/restore/JSON/HTML. Clone fixture sources/history when creating drafts so one draft cannot mutate later provenance; regression covered. Initial tests assumed the first historical source was always a local placeholder; replaced that assumption with original-source identity assertions. Offline source-image review is separate from unreviewed edited drafts; no fixture replay is labelled live generation. Byte/hash checks match all six embedded images to optimized WebPs. SQLite v3 preserves older stories/spend and refuses newer schemas.
- **Privacy:** bounded same-origin/consent/session routes, still-WebP size/pixel/format validation and private SQLite blobs; no public paths or raw SDK errors. Session-isolated image reads and logical workspace deletion preserve accounting. Seven-day review cookies/local unencrypted storage, logical deletion and provider-retention limits are documented. No raw prompts, image bytes, keys, session IDs or recordings are emitted in usage reports/commits; only creator-confirmed public fixture prompts are committed.
- **Visual/science review:** inspected generated sheet/contact sheet and optimized classroom image plus desktop/mobile UI captures. No child contacts real electrical infrastructure; an adult operates an enclosed kit. Flagged fantasy ribbons around the classroom kits and recommended removing them; creator explicitly approved all six as shown. Record this accepted review observation rather than claiming scientifically certified illustrations. AI-suggested floral dress/footwear and scene staging were separately identified and confirmed.
- **Test environment:** corrected JSON import attributes for Playwright's Node loader; resolved sandboxed lint/esbuild parent-directory reads by approved reruns. Earlier sandboxed browser runners completed assertions but stalled in Windows server teardown; stopped only task-owned processes and reran outside that restriction to obtain a clean 18-test/exit-zero result. No failed assertion was hidden. A strict test-header union type and the old placeholder-only provenance expectation were corrected before final checks.

### Validation and paid evidence

- Lint and strict typechecking pass; **90 offline unit/integration/contract/API tests pass** across 14 files, with three opt-in workflows skipped by default. Production and standalone builds pass. The **18 desktop/mobile browser tests pass** with blank credentials and no external fixture traffic. Final history-only artifact reruns are recorded below if needed; no real phone retest is claimed for this new bundle.
- Paid one-sheet measurement passed, then separately authorized six-reference-page run passed; approval/freeze workflow also passed without network requests. **7/20 real image attempts**, zero retries/regenerations, seven complete-prompt screens. Sheet: 534 text input / 0 image input / 1,449 image output, **US$0.046140**; first screen **US$0.001652**. Pages: **US$0.328142** total. All screens **US$0.014668** total. M3 **US$0.388950**; cumulative measured **US$0.403278** plus retained M2 unknown hold **US$0.150000** = development exposure **US$0.553278**. All reported-usage/published-rate calculations; invoices not verified.
- Optimized seven-image pack: **956,438 bytes** total; six page images are embedded for key/network-free replay. Latest standalone artifact hash/size and final secret/staged hygiene are recorded in CODEX_WORKFLOW. Private database/session recovery files and original private image copies remain ignored.

### Remaining limitations

No new hosted CI, real-device test of the larger bundle, paid selective-regeneration-quality test, independent cultural/science/educator validation, verified invoice or reviewed English/Sesotho/audio pack is claimed. Classroom fantasy glow is a creator-accepted visual ambiguity; narrative/educator review must keep real science distinct from magic. The broader cap counts application dispatch reservations, not provider-account activity from other tools. Clearing/moving the ledger loses that accounting, so preserve it. Interrupted leases/unknown reservations require deliberate investigation; no automatic recovery dispatch. Accounts/public hosting and M4 work are outside scope.

Final artifact/review evidence: four additional desktop/mobile offline journeys passed after history preservation; final metadata-source cloning was covered by 90 tests, targeted lint and a fresh production/typecheck build. Standalone is 1,836,031 bytes, SHA256 `8caddad10fab8ad9cd3662275189ea3b76bc237eaa5f8e5407e7d2b9c21603b7`. Full changed/new diff reviewed; pre-stage source/static/offline secret scan passed, with no credential values printed. No additional paid calls occurred during final checks.

Staged review gate: 60 intended paths; whitespace and staged/static/offline secret scans passed (97 scanned entries). No ignored runtime data, credentials, private recordings, session recovery files or generated offline bundle is staged. Commit is local only; no remote push/merge or new milestone activation.

## M2 — 2026-11-11

Authorized on `codex/m2-storistart` from `202a8f5` after creator-reported hosted CI PASS, explicit OpenAI selection and bounded access checks. Scope: real six-page structuring, consented English capture/upload, editable transcript and manual fallback, page editing/draft persistence, budget/refusal/error handling. Stop before M3. Hosted CI for this new branch remains for the creator to run; baseline confirmation is not a new CI result.

### Review findings and fixes

- **High, credential exposure:** a creator-entered real key in the dirty `.env.example` was displayed by a diagnostic read. Blanked it immediately; creator confirmed revocation/replacement in ignored `.env.local`. No credential is included in this report. Added a blank-credential template regression test and final staged/bundle secret scan. Rotation does not erase historical diagnostic output.
- **Privacy:** separate browser capture/transmission/text-generation consent; no server audio file, raw transcript/prompt logging or automatic transcript forwarding. Owned server request buffers are cleared. Track/URL cleanup and distinct audio/transcript/draft deletion are visible/tested. Provider retention is qualified rather than promising deletion outside the app.
- **Input/accounting:** exact PCM header/frame validation prevents extension/duration spoofing; bounded streams reject oversize input. Guard reserves before dispatch, persists actual usage only, retains unknown outcomes and never falls back. Server-issued sessions, same-origin loopback checks and hard configuration caps protect paid routes. Unpriced model overrides fail closed.
- **Compatibility:** atomic additive v1→v2 migration preserves story/spend rows and refuses newer versions. Provider validation now rejects through promises consistently. Home-page corruption during editing was restored from the committed source and corrected; lint caught it before delivery.
- **Test setup:** canonicalized the stock synthetic WAV before dispatch. Vitest test-mode env loading skips `.env.local`; moved local credential loading to the opt-in runner and added a pre-reservation missing-key check. The earlier failed attempt retains a conservative $0.15 hold. Browser selectors were corrected to distinguish the labelled region/textbox and Next's route announcer; no behavior/assertion was disabled.
- **Approval/provenance:** generated pages start private/unapproved, producer/model metadata preserved on edits/restore. Edits invalidate approvals. Images, translation and narration remain unavailable. Prompts treat creator input as data and require safe, age-appropriate fiction with explicit cultural assumptions; human quality review remains necessary.

### Paid evidence

Explicit opt-in, one successful story then one synthetic English transcription, no retry/fallback. Text: `gpt-5.6-terra`, **334 input / 1,050 output tokens**, **$0.013268**. Audio: `gpt-transcribe`, **8 reported audio seconds**, tokens **not returned**, **$0.000600**. Local synthetic sample was 7.33 seconds; accounting uses returned billable duration. Two earlier probes: **74 input / 26 output tokens**, **$0.000460** combined. Measured rate-derived total **$0.014328**; separate uncertain reservation **$0.150000**, total ledger exposure **$0.164328**. Invoice/taxes unverified. Only usage metadata is retained; no generated story/transcript/audio is committed. Synthetic voice is a stock system voice, not a human recording or cloned voice.

### Validation and remaining limits

Final `npm run check` PASS: lint, strict typecheck, **80 offline tests across 11 files** (paid test skipped by default), production and offline builds. Explicit `npm run test:paid` PASS: one sequential two-operation live smoke. Final `npm run test:e2e` PASS: **16 desktop/mobile checks** (8 M2 + 8 retained M1/foundation checks). Desktop/mobile screenshots inspected with no overflow and saved as `docs/screenshots/m2-desktop.png` and `m2-mobile.png`; screenshots use intercepted fixture data, not paid content. Diff whitespace check PASS. Staged secret scan results are recorded in the final hygiene note below.

Full changed/new source, tests and docs are reviewed against the milestone-review skill. Native Chromium fake-device recording and intercepted browser responses are distinct from the paid adapter smoke and real human-device quality evidence. M1 offline artifact hash remains `163f4aea1d1d03301afd8d0cf07a9b646b06f63ea4f143ae8cf03b28520ba7f3`; no new physical-phone test is inferred. Creator-reported M1 Android PASS still lacks model/version/test-date/hash details. Review also fixed partial-recording success after recorder errors, intermediate comma-separated reference edits and a paid assertion that could otherwise print a transcript on failure. No further paid run was needed for that assertion-only privacy correction.

Remaining risks: real microphone/accent/noise quality and full physical-mobile M2 capture untested; Sesotho/science/culture need human review; provider retention/account billing not independently audited; no image/translation/narration integration, publication or learning-outcome proof. Local drafts are unencrypted. App allowances exclude external account spend. Full accessibility/security hardening and educator feedback remain M7.

Final hygiene: **PASS**, 43 intended staged paths reviewed; staged content plus offline/static build artifacts scanned (77 files/artifacts) against actual local credential values in memory and key-pattern checks, with values/output suppressed. Ignored local configuration, databases, synthetic test audio and tooling are excluded. Authorized local config now enables M2; the committed template/default remains mock with live activation off. Staged whitespace check PASS. No unresolved blocking review findings; ready for the milestone report, subject to the limitations above.

## Provider preparation — 2026-11-10 (implementation reviewed)

Authorized portability/provenance/tests/docs work on codex/provider-contract-foundation; live M2 not started. Real entries are deferred placeholders only. Original OpenAI evidence/model names/cost labels retained as future-adapter documentation. Cloudflare setup/permissions/free allowance checked against official docs in SWITCHING_PROVIDERS/DECISIONS.

Shared contracts cover every registry entry, six operations, data/provenance/usage, consent and English-only speech policy, private/unapproved initial stories and mutation isolation. Unavailable-entry rejection coverage must not be described as live-adapter success. Boundary tests cover denied/missing/empty reservations, zero-dollar allowance metadata, malformed results, mismatched/missing asset sources, uncertain usage, stripped transport extras and redacted SDK exceptions without retries/logs. Architecture test forbids vendor code in routes/UI/shared schemas.

Provenance tests verify mixed-provider illustration replacement/history, independent text sources, legacy unknown sources and restore/JSON/HTML preservation. Existing M1 offline browser journeys will be rerun; previous creator-reported phone evidence remains tied to an unreported tested hash, not this new build.

First run: lint, typecheck, 63 tests and production/offline build passed. Final validation: **lint, strict typecheck, 66 tests across eight files, production/offline build and all eight desktop/mobile offline browser checks passed**. No external API request or live usage measurement occurred: zero live tokens/allowance consumed and US$0 API spend.

Full diff reviewed, including moved adapter files, generic config/schema defaults, UI/export producer labels, error paths, architecture checks and switching/setup documentation. Review fixes reject empty reservations and missing free-allowance metadata, preserve unknown measurements, canonicalize validated response fields (including asset key ordering) and strip transport-only data rather than returning raw SDK objects. Generic exceptions are redacted without automatic retry or fallback. Legacy producers default to unknown rather than being guessed.

Mobile reader screenshot from the new standalone build visually inspected: source/creator-edit labels readable, provisional text/audio/phrase labels retained, no clipping/overflow at the tested viewport. Generated bundle: **721,692 bytes**, SHA256 `163f4aea1d1d03301afd8d0cf07a9b646b06f63ea4f143ae8cf03b28520ba7f3`. This new build does not inherit the prior creator-reported phone result.

Final staged hygiene: **33 intended paths**, whitespace check clean, .env.local and generated offline files ignored, local credential values checked in memory against staged text and the offline artifact without printing values; **zero detected exposures**. Product spec unchanged; no new dependencies. No account/token created by Codex, no live Cloudflare/OpenAI adapter or account-aware allowance ledger implemented, no hosted CI run or remote push. These remain explicit activation gates.

## M1 — implementation reviewed, 2026-11-10

M1 acceptance: five fixture stages offline; explicitly provisional/unreviewed text, images, audio and phrases; clear first-screen product explanation; actual Android/Chrome acceptance separate from emulation. Local main was fast-forwarded to approved M0 before creating codex/m1-offline-journey; origin/main had not incorporated M0 and was not pushed.

Initial automated run: lint/typecheck, 26 unit/integration/API tests and production/offline build passed. Initial browser run had six failures caused by two selectors (Next route announcer also has role alert; wrapping select label includes option text). Corrected to scope app alerts and use the visibility combobox role; all eight browser checks then passed. Full journeys exercised real tone play/pause/resume, response pause/continuation, storage/downloads and copy deletion; no mocked successful media playback in the journey tests.

Review fix: cultural demo acknowledgement is now a separate field; normalization preserves real assumptionsConfirmed=false, genuine content approvals=false and provisional provenance. An additional final check/build/browser run follows this safety fix. Bundle validation moved before output writing. Temporarily empty editable fields are allowed in memory, with validation at save/export. Source edits invalidate dependent acknowledgements; image replay affects one page.

Physical phone status: **PASS, creator-reported**. Creator explicitly reported successful Android/Chrome airplane-mode checklist completion, with device details to follow. Model, OS/browser versions, URI-opening method and tested-file hash are not provided. The report is not independent observation and does not prove that the phone used the final regenerated artifact; see MOBILE_OFFLINE_TEST.md.

### Final validation and review

- `npm run check`: lint, next typegen/strict typecheck, **26 tests across four files**, production build and offline bundle passed.
- `npm run test:e2e`: **8 passed**. Desktop/mobile cover both Next.js and standalone-file five-stage journeys with networking disabled, real media play/pause/resume/response gating, persisted save/restore, deletion, both downloads and error paths. Standalone reload/restore works in tested Chromium file origins. Actual phone storage/audio/browser behavior is covered only by the creator report above.
- Final automated-tested offline bundle: **718,734 bytes (~702 KiB)**, SHA256 `ceef878f3c7ef0fed8097c11f81fd9ad07faf4e08026ce497a11372759f72fb5`. Generated output is ignored; build sources are committed. Browser copy on the phone is not hash-identified.
- Full authored diff reviewed against authorized M1: no real operation, child recording, fabricated Sesotho/traditional phrase, hidden publication or weakened real approval guard. All fixtures/reader/export labels stay provisional. JSON/HTML export injection test confirms escaping; standalone CSP blocks remote connections.
- Save/restore normalizes all genuine approvals, provenance and cultural confirmation to unreviewed. Early M1 drafts without the new separate cultural acknowledgement restore with acknowledgement=false rather than losing edits. Recording deletion patches the saved attachment too, avoiding resurrection after restore. Failure states preserve open edits.
- Build checks fixture provenance and server-dependency exclusion before writing its downloadable output. predev also builds the offline file so a clean setup does not produce a broken download link.
- Desktop/mobile reader screenshots visually inspected; no overflow/clipping found at tested sizes. Initial screen gives a direct six-page illustrated bilingual product explanation. Broad accessibility/security review, reviewed content, real media and language quality remain later milestones.
- Final `npm audit --json`: **zero vulnerabilities**, including the new offline bundler dependency. Existing ESLint deprecation and host color notices remain as documented in M0. GitHub-hosted CI has not been run from this local branch.
- Additional targeted standalone runs: **2 passed** with new first-screen assertions. Product explanation and Start action are in the initial viewport on desktop and emulated mobile. Welcome screenshots visually inspected and saved alongside reader screenshots.
- Final staged hygiene passed: 30 intended files, zero detected key/private-key patterns, no private runtime data or generated offline bundle staged, matching dependency manifest/lockfile and matching offline SHA256/byte count. Product spec unchanged. No public hosting or remote push performed.

## M0 — completed implementation/review, 2026-11-10

Reviewed all authored files (including newly added files), generated dependency metadata/lockfile and the production screenshots against M0 acceptance. Product spec was preserved and added to version control. M1 is not started. Creator milestone acceptance remains pending.

### Validation actually run

| Check | Result |
| --- | --- |
| npm ci under Node 24.22.1 | Passed clean lockfile installation. |
| npm run lint | Passed, zero warnings/errors. |
| npm run typecheck | Passed; next typegen runs before tsc so a clean checkout does not need pre-existing generated route types. |
| npm test | 18 passed across 3 files: schema/order/references, consent, approval invalidation, provenance, providers/API/error redaction, persistence/deletion/newer-schema rejection, spend/rate accounting. |
| npm run build | Passed production webpack build. |
| npm run test:e2e | 2 passed: Chromium desktop and Pixel 7-sized Chromium. Production server uses mock mode/no key; external browser requests are blocked and none observed. Covers heading/stages, keyboard skip link, navigation, no horizontal overflow and six-page fixture API. |
| Skill Creator quick_validate.py | All three repository skills valid. Validator initially lacked PyYAML; installed only under ignored .tools/python and reran with explicit module path. |
| npm audit; npm audit --omit=dev | Both reported zero vulnerabilities after targeted dependency overrides. |
| Visual QA | Desktop/mobile screenshots inspected; no clipping/overflow found. Screenshots in docs/screenshots. This is not a full accessibility audit. |
| Git hygiene | Diff whitespace check and ignored env/data/tools paths checked; final staged secret/path/lockfile checks precede commit. |

### Findings and fixes

- **Approval correctness:** provisional content could pass final checks if flags were toggled. Final checks now reject provisional provenance; regression test covers it and shared consent. Narrative edits invalidate text, translation, image and audio approvals; regeneration invalidates image approval.
- **Data compatibility:** initialization could reset a newer DB schema version. Refuse newer schemas without downgrading them; regression test added.
- **API boundary:** a future real adapter could accidentally make the fixture GET route paid. Explicitly restrict that endpoint to mock mode, even with a configured key; real mode returns 503 with no fallback.
- **Reproducibility:** default host Node 18.6 incompatible, parser did not support latest TS 7, and ESLint 10 conflicted with Next lint plugin peers. Use Node 24, TS 6 and supported-peer ESLint 9; preserve strict checks. Generate Next route types before a clean typecheck.
- **Dependency advisory:** minimatch glob amplification in dev-only lint dependencies; patched with targeted overrides, re-audited and ran lint. No framework downgrade or suppressed lint rules.
- **Early validation failures:** link/default-export lint findings and environment parameter typing fixed. Browser install was interrupted by overlapping npm ci; reran installation sequentially and both browser tests passed. Vite config format warning resolved by declaring ESM.
- **Cultural/privacy review:** no invented Sesotho text/traditional phrases, child voice or authentic appearance claims. Clearly provisional English story distinguishes fantasy from real electrical safety; creator review remains pending. No private recording, raw key or database is included in fixtures.

### Remaining limitations

ESLint 9 prints an upstream deprecation notice on install, retained for declared peer compatibility; revisit in M7. SQLite may produce a runtime experimental notice depending on Node version. Playwright emits harmless FORCE_COLOR/NO_COLOR notices from the host environment. CI workflow is configured but has not run on GitHub/Linux; local Windows commands above passed.

Real adapter deliberately unavailable until approved later milestones; no paid API access/quality/cost measurement. Fixture pack lacks approved Sesotho, real images and creator recordings. Upload/delete-recording UI, paid route integration, full journey, export, broad a11y/security testing and educator feedback remain later work. Budget enforcement is a tested foundation ledger, not an implemented paid HTTP flow or billing guarantee.
