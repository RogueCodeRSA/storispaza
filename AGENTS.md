# StoriSpaza engineering rules

- Read `docs/SPEC.md` and the approved `docs/PLAN.md` before changing behavior. M1 is authorized; stop after its milestone report and do not begin M2.
- Use strict TypeScript, one Next.js app, local SQLite/files, and explicit mock/real providers. No accounts or public hosting in the MVP.
- Keep keys server-side. Mock mode must need neither API keys nor external network. Never pass off fixtures as live generation.
- Keep all AI output editable and unreviewed until explicit human approval. Invalidate approvals when their content changes. See `docs/AI_SAFETY.md`.
- No voice cloning, synthetic Sesotho speech, or claims of Sesotho voice-to-story. Recordings require consent; cultural assumptions require confirmation. Never invent traditional phrases.
- One milestone per `codex/` branch: confirm acceptance criteria, build, test/lint/typecheck/build, review the complete diff, fix findings, update docs, commit, report, then wait for approval.
- Never hide failing checks or claim untested capabilities work. Record review findings in `docs/REVIEWS.md` and lifecycle evidence in `docs/CODEX_WORKFLOW.md`.
- Required report: Built | Files changed | Tests run and results | Review findings and fixes | Remaining risks | Judging impact | Proposed next milestone.
- Preserve user work and never commit secrets, local databases, or private recordings. Repository fixtures must have explicit redistribution consent.
- Educator/reviewer feedback is required in M7. Follow the three repository skills under `skills/` when applicable. Do not add MCP integrations.
