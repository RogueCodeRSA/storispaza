# Reviewed adult fixture snapshot

Frozen on 2026-11-11 from the settled local M4 workspace, revision 89. All 24 current scripts and all 24 matching adult clips had explicit saved approval, freeze confirmation and redistribution consent. The creator additionally confirmed in chat: “None — all 24 clips reviewed and consented for publication.” No clips were skipped. No approvals were inferred from this document or created by the maintenance command.

The 24 WAVs in `manifest.json` are the only recordings authorized for this repository snapshot. Their exact bytes, SHA-256 hashes, script versions and adult-own-voice declarations are validated during offline builds and repository scans. They include English and Sesotho page narration, three vocabulary clips per language, and opening/response/continuation clips per language. These are human adult recordings; no synthetic Sesotho speech or voice cloning was used.

`manifest.json` retains actual per-asset producers and provenance history. `reader.json` is a read-only projection of those saved reviews. Private correction journals, local databases, other recordings, credentials and session cookies are excluded. The frozen pack is separate from the ongoing local workspace; editing a copy invalidates its approvals.

This is content/clip approval, not a fabricated final publication decision. The saved story still has `assumptionsConfirmed: false` and the placeholder creator attribution “Demo creator — approval pending”. Those ownership/cultural confirmations remain outstanding and publication/export gates remain in force. No public URL or gallery is created. The reader uses “the creator” until an actual attribution is supplied. The original editable mock sandbox remains provisional; its non-speech samples are not these recordings. Provider invoice verification and educator feedback remain separate pending evidence.

Regenerate the distributable offline reader using `npm run build:offline` on Node 24. The generated HTML is ignored by Git; only consented source fixtures and their provenance are committed.
