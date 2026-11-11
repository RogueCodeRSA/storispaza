# StoriSpaza

M6 StoriOwn is implemented at `/own`: open the same private StoriSpeak workspace, review per-page attribution/content, save your creator name and private/shared file choice, then explicitly confirm the current edition. Final JSON and standalone HTML exports are blocked until current English, Sesotho, image associations, cultural assumptions and any sharing consent are complete. Missing narration stays text-only. Download both files; the HTML embeds reviewed images and opens offline by itself. Raw source recordings and correction history are excluded; optional current reviewed adult page narration requires separate export consent. No public URL or gallery is created. Deleting all recordings clears local bytes/references, audio approvals and voice redistribution consent; existing exported copies cannot be recalled.

**Submission deadline: 2026-11-11, 23:00 SAST.** M4 review remains OPEN; M6 implementation does not approve content or freeze fixtures. See [M6 ownership/export details](docs/M6_STORIOWN.md). M7 hardening and educator feedback have not started.

M5 StoriPlay is implemented at `/play`: private English/Sesotho navigation, page-level read-along, play/pause/resume and seek, current approved vocabulary audio, and opening → response pause → continuation with keyboard/touch and no microphone. It reads the same browser's M4 workspace without editing or approving it. Missing narration stays text-only; unreviewed/unrecorded items are labelled provisional. Mock defaults use explicitly labelled non-speech signals, never spoken Sesotho. Images load individually and the next page preloads when reduced-data settings allow it. Audio positions are kept only for this visit; private media support byte-range requests and are not persistently cached.

**M4 remains OPEN**, with 17/24 scripts and 2/24 clips approved at M5 authorization; no speech fixtures are frozen. See [M4 dependencies recorded before M6](docs/M5_M4_DEPENDENCIES.md) and the [review/recording pack](docs/M4_REVIEW_PACK.md). Enter your phrases at `/speak` → Open / restore → **2 · Your vocabulary and phrases**: `en-opening`, `en-response`, `en-continuation`, `st-opening`, `st-response`, `st-continuation`. Until supplied/reviewed/recorded, StoriPlay uses clearly provisional text placeholders and tap-to-continue. No traditional phrase is invented.

M4 review is implemented at `/speak`: real-generated Sesotho narrative drafts with page-by-page uncertainty notes, explicit in-app source/translation approvals, private before/after corrections, and exactly 24 versioned adult-recording slots. See [recording list](docs/M4_RECORDING_LIST.md) before recording. The creator supplies all interaction phrases and exact Sesotho vocabulary. No synthetic Sesotho, voice cloning or child recordings. **Implementation-only closeout:** the creator deferred remaining reviews, recordings and final consent. No speech fixtures are frozen or committed; the language pack is incomplete.

Start/restore the private workspace, review English/image association before the paired Sesotho page, save corrections, then approve each script in the app. Record/upload only your own consenting adult voice, listen fully and approve the current script-bound clip. Source edits invalidate dependent reviews and recordings. Drafts/corrections/audio persist in unencrypted ignored SQLite; Delete workspace removes them logically, while accounting and the original unapproved server seed remain. No recordings go to an AI provider. Review remains available when live generation is disabled; only a new real translation needs explicit activation/transmission consent.

The first draft is an explicit local opt-in: `RUN_PAID_TRANSLATION=1 node scripts/draft-translation.mjs` reserves US$0.15 within a session ceiling of at most US$0.25 and the shared development ledger. It refuses a prior attempt; failures do not retry/fall back. Default tests and mock mode remain key/network-free. Once **every current page/script and all 24 clips are approved in app**, use the final confirmation and redistribution checkboxes to freeze privately. `FREEZE_REVIEWED_SPEECH=1 node scripts/freeze-speech.mjs` then validates the actual frozen state and writes `fixtures/approved-speech` without network access; it refuses missing approvals/consent or existing-pack overwrite. Never run it to bypass human review. Optional correction evidence needs separate inclusion consent. M5 reader work is not part of M4.

M3 adds the local `/illustrate` review workspace. Save your six-page draft in `/create`, open the illustration workspace, supply/confirm the creative brief, and consent to private local storage/transmission. Generate **one sheet only**, inspect its reported tokens and published-rate cost, then explicitly approve it before any pages. Scene descriptions are suggestions until confirmed. Six pages use the sheet as a visual reference; each can be regenerated and approved separately in the contact sheet. Freeze optimizes private copies only after approval of all current images and redistribution consent. Mock produces labelled solid-colour placeholders with no paid/network calls.

`IMAGE_ATTEMPT_LIMIT=20` is the hard maximum for real development image dispatch attempts, including measurement, failures and regeneration; it can only be lowered. Existing US$2/session and US$10/development guards remain active. Unknown usage or an ambiguous failure stops further image work; never delete/reset the ledger or automatically retry. Local workspaces/images are unencrypted SQLite data under ignored DATA_DIR; Delete workspace removes logical image/project records while preserving accounting. No public hosting or new accounts.

The approved image pack replays without a key/network in `/studio`, the standalone download and provisional HTML export; text/translation/audio remain unreviewed. `/illustrate` mock is a separate solid-colour workflow rehearsal. Original image source IDs/history survive replay and simulated replacement. Paid fixture maintenance is explicitly gated via `scripts/image-workflow.mjs` (`M3_ACTION=pages|regenerate|freeze`); generation needs confirmed scenes, and freezing needs current image approvals plus redistribution consent. `regenerate` selects exactly one `M3_PAGE` and uses its confirmed prompt from docs/M3_SCENES.json. All runners respect locally lowered limits; the measurement also tightens the session ceiling to at most US$0.75. Never treat an env flag as a substitute for creator authorization.

The one-off authorized measurement is `RUN_PAID_IMAGE=1 npm run measure:image` (local only, never CI). It generates **only the character sheet**, uses a tighter US$0.75 session ceiling, stores private review material under ignored `.tools`, and refuses an existing measurement/prior image attempt. It does not approve/freeze the sheet or generate pages. Use only after creator approval of the brief and budget; rate-derived cost is not an invoice.

**Every Story Has a Place. Tell It. Create It. Own It.**

A creator-led African storytelling studio for Grade R–3 teachers, parents and families. Planned journey: StoriStart → StoriCreate → StoriSpeak → StoriPlay → StoriOwn. Read the [spec](docs/SPEC.md) and [approved plan](docs/PLAN.md).

## Current status: M6 ownership/export implementation; M4 content review open

`/create` provides real text-to-six-pages, consented English microphone/upload transcription, editable transcript/manual fallback, page editing and explicit browser draft save/restore/deletion. Output is private/unreviewed. M3's seven reviewed image fixtures are recorded in [image consent/provenance](fixtures/approved-images/CONSENT.md). `/speak` adds translation review and local adult recording; completing the reviewed speech fixture pack remains pending. See [review evidence](docs/REVIEWS.md) for costs and limitations.

[M2 desktop editor](docs/screenshots/m2-desktop.png) · [mobile editor](docs/screenshots/m2-mobile.png). Browser captures use intercepted public fixture data; they do not expose paid output or recordings.

The offline mock implements all five stages with six editable fixture pages, reviewed image-source replay, simulated placeholder replacement, editable Sesotho slots, bilingual reader, non-speech audio play/pause/resume, opening/pause/tap-to-continue interaction, demo acknowledgements, browser-local save/restore, consented tone-copy attachment/deletion and provisional JSON/HTML exports. Original images have creator approval; edited story drafts, translations and audio do not. Provider/storage/budget foundations remain intact.

Open `/studio` for the journey. The first screen explains six-page illustrated bilingual storytelling immediately. Every placeholder text/image/audio/phrase stays visibly **provisional / unreviewed**; checking demo acknowledgements never grants actual language/cultural approval or enables final publication.

Providers have isolated adapters, a reusable contract suite and per-asset producer/model/history labels. Mock remains the default; OpenAI supports text/audio capture, prompt checks and images, while Cloudflare is deferred. Follow [Switching providers](docs/SWITCHING_PROVIDERS.md) and [decisions](docs/DECISIONS.md) for configuration, guard requirements and evidence.

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
| OPENAI_IMAGE_MODEL | gpt-image-2.6-sunburst | Approved M3 image model with bounded live evidence. |
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
