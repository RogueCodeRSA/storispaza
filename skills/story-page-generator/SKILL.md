---
name: story-page-generator
description: Prepare and review culturally guided StoriSpaza character-sheet and page illustration prompts before generation or regeneration.
---

Read ../../docs/AI_SAFETY.md. This skill prepares prompts and review findings; it does not authorize paid calls or certify cultural authenticity. Use creator-confirmed context, fixed character descriptions/reference sheet and the shared style block. Check the complete prompt on every regeneration. Keep assumptions separate and stop for their confirmation. Never invent traditional details or depict unsafe child electrical experiments.

## Input schema

```json
{"type":"object","required":["page","creatorContext","characterSheetAssetId","sharedStyle","confirmedAssumptions"],"properties":{"page":{"type":"object","required":["number","illustrationDescription","characterRefs"],"properties":{"number":{"type":"integer","minimum":1,"maximum":6},"illustrationDescription":{"type":"string"},"characterRefs":{"type":"array","items":{"type":"string"}}}},"creatorContext":{"type":"string"},"characterSheetAssetId":{"type":"string"},"sharedStyle":{"type":"string"},"confirmedAssumptions":{"type":"array","items":{"type":"string"}}}}
```

## Output schema

```json
{"type":"object","required":["prompt","assumptions","status","reasons"],"properties":{"prompt":{"type":"string"},"assumptions":{"type":"array","items":{"type":"string"}},"status":{"enum":["needs-review","blocked","ready-for-creator-approval"]},"reasons":{"type":"array","items":{"type":"string"}}}}
```

## Checklist

- Confirm creator-specific setting/character details; avoid generic "Africa" stereotypes.
- Preserve the same reference sheet/identity/style and page-specific educational moment.
- Include added regeneration instructions in the safety review; no bypass via edits.
- Exclude real child likeness/personal data and dangerous electrical demonstrations.
- Return unresolved assumptions for confirmation; retain human illustration approval after generation.

## Example

Input: page 3, adult teacher with an enclosed battery kit; creator confirms the classroom setting; sheet `girl-v1`; shared warm picture-book style. Output: a prompt reusing `girl-v1`, adult-led safe activity, no wall sockets/exposed wiring, no invented clothing customs; `needs-review` if classroom details are still assumptions. Generation remains blocked until the relevant milestone/budget and creator approval exist.
