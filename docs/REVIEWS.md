# Milestone reviews

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
