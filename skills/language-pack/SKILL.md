---
name: language-pack
description: Add or review a StoriSpaza language pack with explicit capabilities, review status and consented fixture assets.
---

Read ../../docs/ADDING_A_LANGUAGE.md and the approved milestone. Add language configuration and validated text/assets without embedding language-specific assumptions into stage UI. Model output alone is not authentic language support. Capability changes require evidence and human review. No synthetic Sesotho or Sesotho voice-to-story claims.

## Input schema

```json
{"type":"object","required":["code","label","reviewer","translationGuidance","speechEvidence"],"properties":{"code":{"type":"string"},"label":{"type":"string"},"reviewer":{"type":["string","null"]},"translationGuidance":{"type":"string"},"speechEvidence":{"type":"array","items":{"type":"string"}}}}
```

## Output schema

```json
{"type":"object","required":["code","reviewStatus","transcription","narration","requiredChecks"],"properties":{"code":{"type":"string"},"reviewStatus":{"enum":["unreviewed","human-reviewed"]},"transcription":{"enum":["manual-only","validated"]},"narration":{"enum":["none","creator-recorded","validated-tts"]},"requiredChecks":{"type":"array","items":{"type":"string"}}}}
```

## Checklist

- Extend shared schema/storage types deliberately; test unknown-language handling.
- Define orthography/context guidance and reviewer availability; preserve source meaning.
- Leave translation unreviewed until actual review; edits invalidate existing approvals.
- Disable unsupported speech; require evidence/sample review before enabling it.
- Obtain recording storage/redistribution consent; never infer traditional phrases.
- Test fallback/review badges/export and document the contributor procedure.

## Example

Input: `zu`, isiZulu, no available reviewer, text-only demonstration, no speech evidence. Output: `unreviewed`, `manual-only`, `none`; required checks include six-page shape and persistent unreviewed badges. Do not invent reviewed text or enable audio. This example does not authorize adding isiZulu before its milestone approval.
