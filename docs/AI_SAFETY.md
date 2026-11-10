# AI safety and data lifecycle

## Provider preparation amendment

Only mock operations work. Both intended live entries remain deferred and send no requests. Actual account ID/token stay only in ignored .env.local; adapter code will own credential loading. Do not log or commit keys, raw recording prompts, transcripts, SDK exception bodies or vendor response headers. Shared boundary errors are redacted; undeclared response fields are stripped.

Every output asset records its original producer/model/origin separately from review state. Regeneration preserves earlier illustration sources and invalidates approval; replay does not rewrite the producer to the current adapter. Old missing metadata stays unknown. These labels do not verify cultural/language quality. M1 placeholders and existing human-review/consent requirements remain intact.

All future live requests, including free calls, need an explicit guard. Unknown measurements retain conservative reservations. The generic guard boundary is tested; persistent account/day free-unit counters and vendor access remain unimplemented. No fallback on auth, quota/allowance, billing or model-access failure. Hosted CI remains for the creator to run/confirm before live M2. No new physical-device test is implied by the regenerated provenance-labelled artifact.

## M1 mock journey

All five stages use fixtures, not live AI. Sesotho slots are English-labelled placeholders until the creator enters text; no Sesotho translation or traditional phrase is invented. Every editing/reader screen preserves provisional/unreviewed labels for text, symbols, audio and phrases. Acknowledgement checkboxes rehearse a review flow but never confer genuine human approval. Saved/restored/exported drafts normalize approval claims to unreviewed. Final publication remains blocked for fixture provenance.

No real recording is captured. Consent attaches a copy/reference of the built-in tone; deletion removes that attachment from open/saved drafts, pauses audio and does not delete the immutable public fixture tone. No voice cloning or synthetic Sesotho. The quiet tone tests playback/pause/resume and timed interaction only; it teaches no pronunciation and provides no true read-along narration.

Browser drafts persist only after explicit Save; Delete saved draft clears the browser copy. localStorage is unencrypted device/browser storage, not a hosted private vault. Use fictional, non-sensitive material in the demo. File-origin storage availability varies; surface errors and keep export recovery available. Provisional exports include clear notices and exclude the recording attachment; shared exports require separate consent. They are manual files, not remotely revocable links.

The downloaded journey contains code, public fixtures and inline assets only. Its CSP disallows remote connections, images, scripts and media. No account/API key or server access is needed after transfer. The creator reported successful Android/Chrome airplane-mode testing separately from Playwright; model/versions/tested hash remain pending in MOBILE_OFFLINE_TEST.md.

## M0 foundation

Public-safe provisional fixtures only. No recording upload, microphone, live model call or publishing. No paid cost. All text/translation/media review is pending. Placeholder is a book symbol, not a culturally validated illustration. The fantasy power is explicitly impossible in real life. Adults supervise purpose-made enclosed battery kits; children must never handle mains, exposed wires or dangerous repairs. Human science/cultural review is pending.

## Required later controls

- Storage consent before recording upload; separate API transmission and redistribution consent. Explain each use. No voice cloning, child recognition or unrelated use. Use consenting adult demo voice.
- English recording → validated private upload → consented transcription → editable text. Default source audio deletion after processing including error cleanup; creator retention opt-in. Sesotho is manual text/transcript only; no synthetic Sesotho speech.
- Idea → six structured pages → creator edits → checked reference-image prompts → illustrations → translation → human edit/approval → creator narration → reader → approved export. Preserve meaning and original language.
- Explicit draft-save action; final/shared output requires current content approvals and confirmed cultural assumptions. Invalidate affected approvals after edits/regeneration; never label machine text verified.
- Cultural context originates from creator/trusted contributors. AI suggestions are assumptions, not facts. No generic cultural shorthand or invented traditional phrases. Provide correction/flagging in later UI.
- Private by default. No public gallery, messaging or hosting. Shared means approved manual export. Exported copies cannot be remotely revoked.
- Deleting recordings must remove bytes/references/playback access. Local deletion does not retract exported files or guarantee deletion of provider-held records. Never commit private recordings; fixture redistribution requires explicit separate consent.

## Retention and boundaries

M0 fixture text/symbol remain in Git as unreviewed material. Runtime DB is ignored; drafts persist until creator deletion. No private recording is stored in M0. Later raw input defaults to immediate deletion after processing; approved narration persists until deletion. Log operation/error IDs/accounting, never keys, transcripts or raw prompts.

Future Responses use `store:false` where supported and avoid persistent provider uploads. Endpoint-specific retention/account controls must be documented before real operations; see [official data controls](https://developers.openai.com/api/docs/guides/your-data). No paid check or account settings verification has occurred.

Review consent refusal, approval invalidation, story prompt-injection treated as data, prompt checks on every regeneration, upload validation, traversal/cross-origin rejection, deletion, budget/429/quota errors and secret exposure. M0 has no mutation routes; upload/origin controls are mandatory before later routes. Full security/a11y and educator feedback are required in M7, not asserted complete now.
