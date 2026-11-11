# Adding a language

Use `skills/language-pack/SKILL.md`. M0 has English (en) and Sesotho (st) capability records; both require human review/creator narration. Sesotho is manual transcription only. This does not establish validated fluency.

M5 reads per-language script/clip review state rather than inferring language accuracy from a model. A missing narrative/phrase is visibly provisional; missing current approved audio has a text-only path. Vocabulary audio needs both script and clip approval. Response continuation is a keyboard/touch action, never speech recognition. Mock signals are not pronunciation evidence. No language capability is upgraded by reader tests; actual M4 reviews/recordings remain open.

M4 adds a role-based 24-script review model (page/word/opening/response/continuation), language-specific clips with bounded duration and explicit script/clip approval. Sesotho drafts carry uncertainty notes and actual before/after corrections. Phrases and Sesotho vocabulary are creator-supplied; never copy or invent traditional wording. Adult-own-voice/storage/redistribution consent is separate from language capability. No synthetic speech or Sesotho recognition is enabled. Adding another language still requires deliberate shared-schema/story-storage changes; arbitrary config-only language expansion is not claimed. The initial EN/ST story narration shape remains bilingual.

Extend the language schema and capability record, provide translation guidance, an available reviewer, reviewed fixture text and optional consented recordings. Stage UI should read capabilities, not infer them from model output. The implemented M4 review schema still deliberately bounds languages to English/Sesotho; additional-language generalization remains future work.

Optional example: isiZulu text-only remains visibly unreviewed until fluent review. Do not enable speech or copy phrases from another language. Test review labels/fallback/export; review meaning, orthography, age suitability and cultural context. Adding a language must not auto-approve translations.
