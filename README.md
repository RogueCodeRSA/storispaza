# StoriSpaza

**Every Story Has a Place. Tell It. Create It. Own It.**

A creator-led African storytelling studio for Grade R–3 teachers, parents and families. Planned journey: StoriStart → StoriCreate → StoriSpeak → StoriPlay → StoriOwn. Read the [spec](docs/SPEC.md) and [approved plan](docs/PLAN.md).

## Current status: M0 foundation

Implemented: local foundation page, provisional six-page English fixture API, provider contract/mock implementation, unavailable real adapter boundary, story/consent/language rules, SQLite story repository, durable budget/rate ledger, tests and CI. **Not the complete interactive demo.** Translation, live generation, recording upload/playback and export UI arrive later.

No Sesotho voice-to-story or synthetic Sesotho speech claims. Sesotho requires human review/creator recordings. [Fixtures](fixtures/manifest.json) are not real-generated or human-approved. No recordings are committed.

![M0 desktop foundation preview](docs/screenshots/m0-desktop.png)

[Mobile screenshot](docs/screenshots/m0-mobile.png). Both captured from the production build and visually reviewed; these show the foundation, not finished story-generation screens.

## Setup

Use **Node 24.14+ (24.x)**, preferably the `.nvmrc` version, with npm. Node 18.6 found on the development laptop is too old. Select Node 24 with your runtime manager; the project does not change global Node.

On this laptop, the bundled runtime can be selected for the current PowerShell session only:

```powershell
$env:PATH = "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
node --version
```

Confirm a 24.x version before running npm commands. This bundled path is specific to the Codex desktop environment; other contributors should install/select Node 24 normally.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. No environment file/key/network needed at runtime in mock mode. Installation requires registry access. Fonts/assets are local. To customize, copy `.env.example` to `.env.local` and keep it ignored.

## Environment and API

| Variable | Default | Purpose |
| --- | --- | --- |
| AI_PROVIDER | mock | Explicit mock/real; unknown values rejected. |
| OPENAI_API_KEY | unset | Server-only; never NEXT_PUBLIC_. Real operations disabled in M0. |
| OPENAI_TEXT_MODEL | gpt-5.6-terra | Planned M2/M4 model, not called in M0. |
| OPENAI_IMAGE_MODEL | gpt-image-2.6-sunburst | Planned M3 default. |
| OPENAI_TRANSCRIPTION_MODEL | gpt-transcribe | Planned English capture. |
| DATA_DIR | ./data | Ignored SQLite/private asset directory. |
| SESSION_BUDGET_USD | 2 | Approved session allowance; may be lowered. |
| DEVELOPMENT_BUDGET_USD | 10 | Development allowance; may be lowered. |
| AI_REQUESTS_PER_MINUTE | 10 | Maximum per-session rate. |
| NEXT_TELEMETRY_DISABLED | 1 in example/CI | Disable Next telemetry, including builds. |

GET /api/health returns readiness/milestone without secrets. GET /api/demo/story returns data/provenance/review status in mock mode; real mode returns 503. No mutation/paid routes. Configuration/ledger are foundation primitives; future routes must integrate them before paid requests. Keep this no-auth app on loopback.

## Checks

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

Check runs lint, strict typecheck, unit/integration/API tests and production build. E2E starts a production server at 127.0.0.1:3100, with mock mode/no key and external browser requests blocked. These tests cover M0, not the later full journey. SQLite tests use temporary databases. Real tests/paid requests are not enabled in M0/CI. Exact results and known tooling notices are in [reviews](docs/REVIEWS.md).

## Local production and reuse

```sh
npm run build
npm start
```

Node server binds to loopback. Hosted deployment/auth/publishing are deferred. See [architecture](docs/ARCHITECTURE.md), [research](docs/DECISIONS.md), [safety](docs/AI_SAFETY.md), [language extension](docs/ADDING_A_LANGUAGE.md), [Codex evidence](docs/CODEX_WORKFLOW.md), [pitch](docs/DEMO_SCRIPT.md), [contributing](CONTRIBUTING.md), and [MIT license](LICENSE). The exact 24 M4 recording filenames/purposes are in PLAN.md; scripts follow finalized text. M7 educator/reviewer feedback is mandatory and not yet collected.
