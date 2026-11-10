# Architecture — M0

Browser → read-only Next.js page/API → domain/provider. Later mutation routes → services → SQLite/private files; paid routes → durable budget ledger → real adapter. One app, Node 24, local system fonts/assets, no CDN.

`src/domain` holds story/consent/language contracts. `src/server` is server-only: config, errors, providers, SQLite and budget. `fixtures` is public-safe provisional data; public contains only a book-symbol placeholder. Private media will live in ignored data/ with validated routes.

Routes: GET /api/health exposes readiness/milestone, no secrets; GET /api/demo/story returns mock data/provenance/unreviewed status. Real mode returns 503; no request is sent. No mutation/paid route exists. Home is a foundation preview, not the five-stage demo.

SQLite stores confirmed story JSON and AI accounting (schema version 1). Repository receives an explicit DB handle; tests use temporary directories. Draft save requires confirmation; final/shared saves require approvals. The ledger uses BEGIN IMMEDIATE, integer microdollars, durable totals across sessions/connections and one pending image globally. Unknown outcomes remain reserved. Actual cost exceeding estimate is recorded and blocks further work, not hidden. Later server routes must issue session IDs and pass configured limits; M0 has no browser session flow.

Config rejects unknown modes and allowances above approved $2/$10/10 requests. No DB creation during page render/build. No secret/exception text in API errors. Private recording upload/deletion, validated MIME/signature/duration, safe asset delivery, cross-origin mutation protection and explicit forward migrations belong to later milestones. Story deletion does not imply audio deletion; no private media is currently stored.
