# Architecture — M0 + M1

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
