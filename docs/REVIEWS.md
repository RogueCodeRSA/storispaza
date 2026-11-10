# Milestone reviews

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
