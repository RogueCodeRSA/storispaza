# StoriSpaza engineering rules

- Read `docs/SPEC.md` and the approved `docs/PLAN.md` before changing behavior. Slimmed M6 StoriOwn is authorized on `codex/m6-storiown`: current final approvals, attribution, private/shared manual export, voice consent/deletion and ownership explanation; story JSON/provenance plus standalone offline HTML, no ZIP required. Missing audio stays text-only; raw source recordings are excluded. Children’s stories stay private by default; no public URL/gallery. M4 content review remains OPEN (17/24 scripts, 2/24 clips approved at authorization); do not approve content or freeze/commit speech fixtures. Preserve prior dollar/image limits. Pitch/submission deadline is 2026-11-11 at 23:00 SAST. Time-box M6 to about 90 minutes and immediately report any must-have at risk. Report M4 dependencies separately; stop after M6’s report, before M7.
- Keep vendor-specific code only in server provider adapter files. Routes, UI and schemas remain vendor-neutral. Preserve per-asset producers/history; every registered adapter needs the reusable contract suite. See `docs/SWITCHING_PROVIDERS.md`.
- Use strict TypeScript, one Next.js app, local SQLite/files, and explicit mock/real providers. No accounts or public hosting in the MVP.
- Keep keys server-side. Mock mode must need neither API keys nor external network. Never pass off fixtures as live generation.
- Keep all AI output editable and unreviewed until explicit human approval. Invalidate approvals when their content changes. See `docs/AI_SAFETY.md`.
- No voice cloning, synthetic Sesotho speech, or claims of Sesotho voice-to-story. Recordings require consent; cultural assumptions require confirmation. Never invent traditional phrases.
- One milestone per `codex/` branch: confirm acceptance criteria, build, test/lint/typecheck/build, review the complete diff, fix findings, update docs, commit, report, then wait for approval.
- Never hide failing checks or claim untested capabilities work. Record review findings in `docs/REVIEWS.md` and lifecycle evidence in `docs/CODEX_WORKFLOW.md`.
- Required report: Built | Files changed | Tests run and results | Review findings and fixes | Remaining risks | Judging impact | Proposed next milestone.
- Preserve user work and never commit secrets, local databases, or private recordings. Repository fixtures must have explicit redistribution consent.
- Educator/reviewer feedback is required in M7. Follow the three repository skills under `skills/` when applicable. Do not add MCP integrations.
