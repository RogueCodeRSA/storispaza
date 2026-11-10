# Codex lifecycle evidence

## M1 — 2026-11-10 (implementation reviewed; milestone report pending)

- **Creator authorized:** only the offline five-stage mock journey; real-phone networking-disabled check in addition to Playwright; visible provisional/unreviewed text/audio/phrase labels; immediate product explanation. Android/Chrome selected for physical testing.
- **Branch:** fetched origin/main and found M0 was not remotely merged. Fast-forwarded local main to approved 11022e3, then created codex/m1-offline-journey; no remote push/merge claim.
- **Planned:** same React component in Next.js and a single self-contained HTML, with local fixture media and browser save/restore. Keep real approval gates intact; separate all demo acknowledgements.
- **Built:** six-page editing, selected-page placeholder regeneration, editable bilingual slots, reader navigation/toggle/audio/timed response pause, acknowledgements/consent/visibility, local drafts, tone attachment deletion and escaped provisional exports. No paid APIs, real recordings or fabricated Sesotho/traditional phrases.
- **Review caught:** empty-field edits must not crash schema validation; fixture/cultural acknowledgements must not promote real approval; generated artifact safety checks must run before writing; UI errors must preserve open drafts. Initial hook lint issue and two browser selector issues were fixed without suppressing checks.
- **Validation:** lint, typecheck, 26 unit/integration/API tests, production/offline builds and eight desktop/mobile Playwright checks passed on the final build. Phone evidence recorded separately in MOBILE_OFFLINE_TEST.md. Screenshots are browser captures only. No paid API calls.
- **Creator changes/observations:** creator explicitly reported successful Android/Chrome airplane-mode checklist completion; device details follow. Record this as human-reported PASS with model/versions/tested hash pending, not independent observation or invented measurements. M0 was accepted by the creator when M1 was authorized. Stop before M2.

## M0 — 2026-11-10 (implementation complete, creator acceptance pending)

- **Planned:** inspected repo/complete spec; eight bounded questions; official API research; vertical milestones, risks and scope.
- **Creator changed:** M0 only; educator feedback Must in M7; JSON/HTML export fallback; research labels/sources in decisions; no Sesotho speech claims; 24 creator clips during M4; pitch date not set.
- **Built:** AGENTS first, approved plan, Next.js foundation, schemas/consent/languages, mock/real boundary, SQLite repository, durable budget/rate controls, provisional fixtures, tests/CI/docs.
- **Review caught:** Node/TS/lint peer compatibility, minimatch advisory, provisional approval bypass, stale illustration approval after text edits, newer-schema downgrade risk, future paid fixture GET risk and generated-route clean-check requirement. Fixed these with targeted dependency choices, fail-closed guards, approval invalidation and regression tests. Early lint/type errors corrected; browser setup overlap corrected by sequential retry.
- **Validation:** npm ci, lint, typecheck, 18 unit/integration/API tests, production build, two desktop/mobile production Playwright checks with external browser traffic blocked, three skill validations and audits passed. Production screenshots inspected and saved. See REVIEWS.md for exact limits/notices. No real requests, quality claims or full demo claims.
- **User review:** pending milestone report. Stop before M1; never invent reviewer feedback.
