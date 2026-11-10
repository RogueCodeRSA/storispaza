# StoriSpaza

**Every Story Has a Place. Tell It. Create It. Own It.**

A creator-led African storytelling studio for Grade R–3 teachers, parents and families. Planned journey: StoriStart → StoriCreate → StoriSpeak → StoriPlay → StoriOwn. Read the [spec](docs/SPEC.md) and [approved plan](docs/PLAN.md).

## Current status: M2 capture plus M1 offline journey

M2 adds `/create`: real text-to-six-pages, consented English microphone/upload transcription, editable transcript/manual fallback, all page fields editable, and explicit browser draft save/restore/deletion. Output is private/unreviewed. OpenAI text/audio passed a bounded paid smoke; images, translation and narration remain later work. See [M2 evidence](docs/REVIEWS.md) for costs and limitations.

[M2 desktop editor](docs/screenshots/m2-desktop.png) · [mobile editor](docs/screenshots/m2-mobile.png). Browser captures use intercepted public fixture data; they do not expose paid output or recordings.

The offline mock implements all five stages with six editable fixture pages, per-page illustration placeholders/regeneration, editable Sesotho slots, bilingual reader, non-speech audio play/pause/resume, opening/pause/tap-to-continue interaction, demo acknowledgements, browser-local save/restore, consented tone-copy attachment/deletion and provisional JSON/HTML exports. Real images, reviewed translations and creator narration remain later milestones. M0's server-only provider/storage/budget foundations remain intact.

Open `/studio` for the journey. The first screen explains six-page illustrated bilingual storytelling immediately. Every placeholder text/image/audio/phrase stays visibly **provisional / unreviewed**; checking demo acknowledgements never grants actual language/cultural approval or enables final publication.

Providers have isolated adapters, a reusable contract suite and per-asset producer/model/history labels. Mock remains the default; OpenAI supports M2 text/audio, while Cloudflare is deferred. Follow [Switching providers](docs/SWITCHING_PROVIDERS.md) and [decisions](docs/DECISIONS.md) for configuration, guard requirements and evidence.

**Real-device check: passed, creator-reported.** The creator confirmed successful Android/Chrome airplane-mode checklist completion; model/OS/browser versions and tested-file hash are pending. See the [device test record](docs/MOBILE_OFFLINE_TEST.md) for the distinction between human-reported and automated evidence.

No Sesotho voice-to-story or synthetic Sesotho speech claims. Sesotho requires human review/creator recordings. [Fixtures](fixtures/manifest.json) are not real-generated or human-approved. No recordings are committed.

![M1 desktop reader](docs/screenshots/m1-desktop.png)

[Mobile reader screenshot](docs/screenshots/m1-mobile.png). Captured from automated production/standalone browser checks, not physical hardware. [M0 foundation screenshot](docs/screenshots/m0-desktop.png) remains as lifecycle evidence.

First screen: [desktop](docs/screenshots/m1-welcome-desktop.png) · [mobile](docs/screenshots/m1-welcome-mobile.png). Product explanation and Start action are verified in the initial viewport.

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

## Android offline journey

```sh
npm run build:offline
```

Transfer `public/offline/storispaza-offline.html` to the phone's Downloads folder and open it in Chrome. Enable airplane mode and turn Wi-Fi/mobile data off; the full journey is embedded in that one file. No LAN server exposure, account, public hosting or API key is needed after transfer. Build metadata/hash is in `public/offline/build.json`. The generated file is ignored by Git and rebuilt from the same React component used at `/studio`. Both npm run dev (via predev) and npm run build generate the home-page download.

Follow the [real-device checklist](docs/MOBILE_OFFLINE_TEST.md), including audible playback, both downloads, reload/restore and recording-copy deletion. File/content-origin storage and opening behavior vary by browser; errors stay visible rather than silently claiming success. Browser drafts are saved only on explicit consented Save and are not encrypted. Use fictional demo content. Keep JSON/HTML exports as recovery copies.

## Environment and API

| Variable | Default | Purpose |
| --- | --- | --- |
| AI_PROVIDER | mock | Explicit mock/real; unknown values rejected. |
| AI_ADAPTER | unset | Registered adapter ID in real mode; use openai for M2. No fallback. |
| ENABLE_LIVE_AI | 0 | Explicit server activation; set 1 only for authorized live use. |
| CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN | unset | Actual values only in ignored .env.local; no live integration is enabled by setting them. |
| OPENAI_API_KEY | unset | Server-only M2 credential in ignored .env.local; never NEXT_PUBLIC_. |
| OPENAI_TEXT_MODEL | gpt-5.6-terra | Approved M2 structured text model. |
| OPENAI_IMAGE_MODEL | gpt-image-2.6-sunburst | Retained future illustration research. |
| OPENAI_TRANSCRIPTION_MODEL | gpt-transcribe | Approved English transcription model. |
| DATA_DIR | ./data | Ignored SQLite/private asset directory. |
| SESSION_BUDGET_USD | 2 | Approved session allowance; may be lowered. |
| DEVELOPMENT_BUDGET_USD | 10 | Development allowance; may be lowered. |
| AI_REQUESTS_PER_MINUTE | 10 | Maximum per-session rate. |
| NEXT_TELEMETRY_DISABLED | 1 in example/CI | Disable Next telemetry, including builds. |

GET /api/health returns configuration readiness/milestone without secrets; it does not verify current model access. GET /api/demo/story returns mock data/provenance/review status; real mode returns 503. POST /api/capture/session, /story and /transcribe require local same-origin requests; paid operations require explicit consent, live activation and a server-issued session. Preserve ignored local credentials when setting AI_PROVIDER=real, AI_ADAPTER=openai and ENABLE_LIVE_AI=1. Open `/create`. Use fictional consenting-adult input; no server audio files are retained. Keep this no-auth app on loopback.

## Checks

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

Check runs lint, route-type generation/strict typecheck, offline unit/integration/API tests and production/offline builds. E2E starts mock port 3100 and activated capture port 3200, both with blank API credentials. M2 HTTP responses are intercepted; native microphone checks use Chromium's fake device. M1 checks disable networking, including standalone file load. Desktop/mobile tests cover editing, consent, error recovery, local save/restore and audio/transcript deletion. SQLite tests use temporary databases. Default tests/CI make no paid requests.

Paid smoke is separate and disabled by default. On explicit opt-in only, prepare a consenting synthetic English **canonical 16 kHz mono PCM WAV** outside Git, then run in PowerShell:

```powershell
$env:RUN_PAID_TESTS='1'
$env:PAID_TEST_AUDIO_PATH='C:\path\to\synthetic-english.wav'
npm run test:paid
Remove-Item Env:RUN_PAID_TESTS
```

The runner refuses CI, loads ignored local credentials before Vitest's test environment, and sends at most one text call then one audio call (no retries; audio is not attempted if text fails). Session ceiling is $0.25, within the $10 durable development cap. It logs usage/error codes only, never keys, prompt bodies or transcripts. Costs are derived from measured tokens/duration and published rates, not verified invoices. Unknown outcomes retain reservations. Do not repeat a failed billing/access test without resolving the cause. Results and verification limits are in [reviews](docs/REVIEWS.md).

## Local production and reuse

```sh
npm run build
npm start
```

Node server binds to loopback. Hosted deployment/auth/publishing are deferred. See [architecture](docs/ARCHITECTURE.md), [research](docs/DECISIONS.md), [safety](docs/AI_SAFETY.md), [language extension](docs/ADDING_A_LANGUAGE.md), [Codex evidence](docs/CODEX_WORKFLOW.md), [pitch](docs/DEMO_SCRIPT.md), [contributing](CONTRIBUTING.md), and [MIT license](LICENSE). The exact 24 M4 recording filenames/purposes are in PLAN.md; scripts follow finalized text. M7 educator/reviewer feedback is mandatory and not yet collected.
