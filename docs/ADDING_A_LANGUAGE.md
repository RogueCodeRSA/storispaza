# Adding a language

Use `skills/language-pack/SKILL.md`. M0 has English (en) and Sesotho (st) capability records; both require human review/creator narration. Sesotho is manual transcription only. This does not establish validated fluency.

Extend the language schema and capability record, provide translation guidance, an available reviewer, reviewed fixture text and optional consented recordings. Stage UI should read capabilities, not infer them from model output. Generalizing the initial bilingual storage shape belongs to M4; arbitrary config-only languages are not implemented in M0.

Optional example: isiZulu text-only remains visibly unreviewed until fluent review. Do not enable speech or copy phrases from another language. Test review labels/fallback/export; review meaning, orthography, age suitability and cultural context. Adding a language must not auto-approve translations.
