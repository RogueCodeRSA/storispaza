---
name: milestone-review
description: Review a StoriSpaza milestone's complete diff and validation evidence before its commit and creator approval gate.
---

Read ../../AGENTS.md and ../../docs/PLAN.md. Inspect the complete diff, including untracked new files, against the authorized milestone. Passing a build is not proof of the full journey. Review and report actual behavior/evidence; do not fabricate language review, educator feedback or API success. This review does not authorize the next milestone.

## Input schema

```json
{"type":"object","required":["milestone","acceptanceCriteria","changedFiles","checkResults"],"properties":{"milestone":{"type":"string","pattern":"^M[0-7]$"},"acceptanceCriteria":{"type":"array","items":{"type":"string"}},"changedFiles":{"type":"array","items":{"type":"string"}},"checkResults":{"type":"array","items":{"type":"object","required":["command","result"],"properties":{"command":{"type":"string"},"result":{"type":"string"}}}}}}
```

## Output schema

```json
{"type":"object","required":["findings","unverified","readyForReport"],"properties":{"findings":{"type":"array","items":{"type":"object","required":["severity","evidence","fix"],"properties":{"severity":{"enum":["critical","high","medium","low"]},"evidence":{"type":"string"},"fix":{"type":"string"}}}},"unverified":{"type":"array","items":{"type":"string"}},"readyForReport":{"type":"boolean"}}}
```

## Checklist

- Acceptance/scope, dependency compatibility, real-vs-mock provenance and fixture labels.
- Bugs/error paths, input validation, persistence, approval invalidation and spend races.
- Keyboard/mobile/labels/contrast; never imply a placeholder control works.
- Secrets, consent, private asset access, deletion and provider retention claims.
- Cultural assumptions, human review, electrical safety and truthful pitch claims.
- Run relevant tests/lint/typecheck/build; inspect failures; record fixes and remaining risks.
- Update REVIEWS/CODEX_WORKFLOW/docs; commit only intended files, report all eight fields and stop.

## Example

M0 input contains passing mock tests but no real API run. Output includes real API access/quality in `unverified`; it must not claim real generation works. If a provisional translation was marked approved, record a finding, reset it, add a regression test and rerun the relevant checks before reporting readiness.
