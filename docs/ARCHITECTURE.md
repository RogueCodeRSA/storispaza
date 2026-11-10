# Architecture — through M2

## M2 live capture (current)

`/create` is a separate client editor; it is never imported into the offline bundle. POST `/api/capture/session`, `/story` and `/transcribe` delegate to a vendor-neutral capture service. Loopback host and exact same-origin checks, explicit transmission consent, bounded request streams, an expiring HttpOnly/SameSite cookie and SQLite-issued session IDs precede paid work. Both real mode and `ENABLE_LIVE_AI=1` are required. Default mock stays network/key-free.

Only the server adapter owns OpenAI credentials, SDK, prompts, strict structured output and published-rate calculations. Text and English transcription are available; other live capabilities remain unavailable. Text output is schema-validated, private and unapproved, with per-page producer/model metadata. The UI edits all page fields; edits invalidate approvals and preserve producers/history. Explicit consented Save stores only the story in browser localStorage, never the input audio or raw transcript. Restore/deletion handle blocked storage without replacing open work.

Recording is browser-memory-only with consent, microphone track cleanup, a two-minute stop and upload/manual fallback. Browser decoding downmixes/resamples into bounded 16 kHz mono PCM WAV; the server validates exact headers/frame duration, processes memory buffers and does not write recording files. Transmission and capture consent are separate. The transcript stays editable and is copied into the idea only by explicit action; generating then requires text consent. Deleting audio preserves the editable transcript until Clear.

SQLite schema version 2 adds `ai_sessions` and usage-only `ai_measurements` via an atomic additive initialization/migration; existing stories/accounting survive, newer versions are refused. Dollar reservations are durable and atomic before dispatch ($0.15 text/$0.02 audio); known usage settles, uncertain outcomes retain reservations. Two historical probes are carried forward once. Tokens and rate-derived cost are accounting metadata, not verified provider invoices. No automatic retries/fallback. See DECISIONS and REVIEWS for measured evidence. The following sections record earlier milestone architecture; their statements about absent live routes apply to those historical milestones only.

## Provider preparation

The public server factory returns a protected StoryProvider. Vendor code is confined to `src/server/providers/adapters/*.adapter.ts`; registry entries create the mock adapter or generic deferred live placeholders. Generic config uses AI_PROVIDER (mock/real) and optional AI_ADAPTER. No live vendor integration, credential reads, network request or account-specific allowance ledger is implemented in this preparation change. See SWITCHING_PROVIDERS.md before activation.

The shared boundary enforces capabilities, transmission consent and English-only transcription policy, requires an allowance/budget guard for any available live operation, validates six-page data/output assets and usage, strips unknown transport fields, checks asset producer/ID consistency and redacts exceptions. Zero-dollar live responses need allowance metadata. Unknown cost/allowance usage and failures retain reservations. Generic tests cover the boundary; every registered adapter has the same offline contract suite, including explicit rejection coverage for deferred entries.

Story pages now include independent assetSources for text, illustration, translation and narration, plus assetHistory for replaced illustrations. Model IDs are nullable where unknown. Creator edits retain producer metadata and mark the edit; mock replay preserves the original producer rather than stamping the replay adapter. Legacy JSON gets unknown sources through schema defaults; the SQLite table layout/version is unchanged. UI and exports render labels from metadata without vendor branches. Future generated assets must populate these fields; never infer a producer from current configuration.

## M1 offline journey

`src/components/MockJourney.tsx` is shared by Next.js `/studio` and `src/offline/entry.tsx`. `scripts/build-offline.mjs` bundles the same React UI/CSS into one generated `public/offline/storispaza-offline.html`. Images are deterministic inline SVG symbols; audio is a six-second PCM WAV tone generated locally, never a voice. Fixture content imports only the shared domain/schema modules. No server modules or keys may enter the offline bundle; the build checks its input metadata. The standalone CSP blocks network connections and remote media/scripts/fonts.

Runtime journey work is entirely client-side, with no network fetch, API cost or new mutation route. Next.js serves the same UI on localhost; real mode does not mount the mock studio. A downloaded standalone copy is always an explicitly labelled mock demo. It can be opened on a phone without exposing the no-auth server on the LAN. File/content-origin behavior and media/storage/downloads require real-device acceptance; see MOBILE_OFFLINE_TEST.md.

Edits live in React state. Only an explicit consented Save stores a validated mock draft in browser localStorage; restore is explicit. Browser/file-origin storage may be unavailable, in which case a visible error preserves the open draft. Demo acknowledgements are separate from real page approvals. Persistence/export normalize provenance and genuine approvals back to unreviewed; provisional content still cannot pass the real final-approval gate. Changing source fields invalidates dependent acknowledgements; image regeneration affects one page only.

The optional recording copy is an attachment to the built-in non-speech tone, not a captured human voice. Consent is needed to attach it; explicit Save persists the attachment flag. Delete pauses playback and removes the attachment from open and saved drafts. The built-in public tone remains available for the reader; deletion does not claim to remove immutable demo media. Both exports exclude the recording attachment. Real recording storage/deletion remains later work.

Provisional JSON and a minimal escaped/CSP-protected standalone HTML reader exercise export. Shared export additionally needs distribution consent; nothing is published or uploaded. The full portable journey bundle is a separate M1 demo delivery artifact, not a public publishing service. SQLite primitives from M0 remain intact for future server-side workflows.

## M0 foundation retained

Browser → read-only Next.js page/API → domain/provider. Later mutation routes → services → SQLite/private files; paid routes → durable budget ledger → real adapter. One app, Node 24, local system fonts/assets, no CDN.

`src/domain` holds story/consent/language contracts. `src/server` is server-only: config, errors, providers, SQLite and budget. `fixtures` is public-safe provisional data; public contains only a book-symbol placeholder. Private media will live in ignored data/ with validated routes.

Routes: GET /api/health exposes readiness/milestone, no secrets; GET /api/demo/story returns mock data/provenance/unreviewed status. Real mode returns 503; no request is sent. No mutation/paid route exists. Home is a foundation preview, not the five-stage demo.

SQLite stores confirmed story JSON and AI accounting (schema version 1). Repository receives an explicit DB handle; tests use temporary directories. Draft save requires confirmation; final/shared saves require approvals. The ledger uses BEGIN IMMEDIATE, integer microdollars, durable totals across sessions/connections and one pending image globally. Unknown outcomes remain reserved. Actual cost exceeding estimate is recorded and blocks further work, not hidden. Later server routes must issue session IDs and pass configured limits; M0 has no browser session flow.

Config rejects unknown modes and allowances above approved $2/$10/10 requests. No DB creation during page render/build. No secret/exception text in API errors. Private recording upload/deletion, validated MIME/signature/duration, safe asset delivery, cross-origin mutation protection and explicit forward migrations belong to later milestones. Story deletion does not imply audio deletion; no private media is currently stored.
