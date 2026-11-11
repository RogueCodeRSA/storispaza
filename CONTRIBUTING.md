# Contributing

Read [AGENTS.md](AGENTS.md), [SPEC](docs/SPEC.md) and the [approved plan](docs/PLAN.md). Use Node 24.14+ within 24.x (pinned 24.22.1) and `npm ci`. Follow the [clean-clone guide](docs/CLEAN_CLONE.md); do not copy a contributor’s environment, database or recordings.

## Validate a change

```sh
npm run check
npm run verify:public
npx playwright install chromium
npm run test:e2e
git diff --check
npm run verify:public -- --staged
```

Run `check` before browser tests; tests create an ignored synthetic M6 reader needed by E2E. The default suite needs no provider key and dispatches no paid requests. Browser installation/npm installation need network. Native microphone tests use a fake device, not a person’s recording. Keep ports 3100/3200 free and all test data separate from a creator workspace. CI runs the same checks; local results do not prove a hosted CI run passed.

## Review and consent

Stay within the approved milestone on one `codex/` branch. Add meaningful behavioral regressions for security/data changes, review the complete diff including new files, and record findings and actual results in REVIEWS/CODEX_WORKFLOW. Report scope, changed files, checks, fixes, risks, judging impact and proposed next milestone; stop for authorization. Do not disable failing checks to finish a milestone.

Never commit credentials, private stories/recordings/corrections, databases, local configuration, generated exports, test output or browser profiles. M4 is OPEN: no new content approvals, speech fixture freeze or recording commits under M7 Part A. The public scanner intentionally rejects audio/speech-fixture paths until a future explicitly consented policy change. Preserve creator edits, original asset producers/history and review invalidation. Language output/schema validation alone never establishes fluent or culturally authentic support. Never invent traditional wording.

No paid test, generation runner or fixture-freeze command is part of normal contribution/evaluation. Such operations require separate explicit authorization, existing durable dollar/image limits and real current human approvals. Do not delete the spend ledger to reset limits. No keys or personal data in logs/issues/screenshots. If a credential leaks, revoke/rotate it through its owner and disclose the incident without reproducing it; deleting the latest file does not remove Git history.

## Reuse and scope

Use `skills/language-pack` and `docs/ADDING_A_LANGUAGE.md` for language changes; use `skills/story-page-generator` for story schemas/prompts and `skills/milestone-review` at milestone closeout. New providers need isolated adapters and the reusable contract suite in `docs/SWITCHING_PROVIDERS.md`. Disable unreviewed speech capabilities: no Sesotho recognition/TTS, voice cloning or child-response recording.

Code/documentation use MIT; retain notices. The seven reviewed image fixtures have separate public review/redistribution evidence in `fixtures/approved-images/CONSENT.md`; they do not authorise unrelated material or private voices. Teacher/parent feedback needs actual observation and permission to publish; use the blank template without fabricating findings. Public hosting/accounts/new integrations require separate design/authorization; current deployment is loopback only.
