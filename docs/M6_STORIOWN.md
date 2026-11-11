# M6 StoriOwn — slimmed ownership and export

Authorized 2026-11-11 for `codex/m6-storiown`, approximately 90 minutes. Submission deadline is today at 23:00 SAST. No M7 work is authorized by M6.

## Use

1. In the same browser/session as your reviews, open `/own` and **Open / refresh private edition**. It restores the StoriSpeak workspace; it does not create a new story or approve content.
2. Preview text, translation, learning moments and per-asset attribution. Use `/play` for image/audio preview and `/speak` for corrections and current approvals. All output remains editable there.
3. Enter the creator attribution, keep **Private** or choose **Shared** with contributor/guardian permission, and confirm cultural/science/context review. **Save edition choices**. Shared means a manual file handoff, never a URL.
4. Resolve every final checklist issue. Mock and provisional content cannot become final publications. All six English/Sesotho page scripts, translations and image associations require current approval. Missing images block export. Missing audio stays text-only.
5. Narration is excluded by default. Optionally include available current approved adult page narration and explicitly consent to copying/redistribution. No raw source recording, auxiliary clip or correction journal is exported. Missing/unapproved/stale narration has no player.
6. Confirm the current final edition and download **JSON + provenance** and **offline HTML reader**. The HTML embeds images/audio; open it directly without a server, network, ZIP, JavaScript or external fonts. It provides bilingual pages, page links, native optional audio and provenance details. The JSON includes story fields, sources/history and embedded media. Neither creates a public link.
7. To withdraw retained voice consent, explicitly confirm **Delete all recordings**. All 24 slots’ local bytes/references/history are removed, audio approval and fixture redistribution consent clear, and the revision changes. Text/images stay available; the new edition is text-only. Individual deletion remains in StoriSpeak. Workspace deletion also removes ownership settings.

## Enforcement and limitations

`POST /api/ownership` requires exact same-origin loopback access and the HttpOnly review session, a bounded JSON body, matching provider mode, a non-busy workspace and the current revision. A SQLite write transaction serializes each snapshot/export/settings/deletion with concurrent speech mutations. Final export independently rechecks content approvals, script equality, known reviewed image availability and sharing consent. Optional narration needs explicit export consent and current-script approval plus matching stored bytes/hash. A stale confirmation returns 409. Ownership settings are project-bound so a replacement workspace starts private.

The HTML escapes all creator/provider text and uses a deny-by-default CSP allowing only inline styling and embedded image/media data. No scripts, fetches, external assets, raw recording bytes, correction history, API keys or session identifiers are included. Downloads are manual copies outside application control. Local SQLite/WAL and backups are unencrypted; deletion is logical, not guaranteed physical erasure. Exported copies cannot be remotely recalled. Ownership text explains control of contributions without promising copyright, originality or exclusive rights over AI output or third-party contributions.

The current export embeds the existing consented reviewed fixture image pack only. An unknown/unavailable image blocks final export instead of producing a broken offline file. All available current page narration may be included; vocabulary/interaction clips remain in the private reader and are outside this slim standalone format. No ZIP/PDF/EPUB/public hosting/gallery was added. No paid request or provider adapter change was needed.

## Separate M4 content dependencies

M4 remains OPEN: **17/24 scripts and 2/24 clips approved at authorization**, not re-counted or promoted by M6. Remaining English/Sesotho, science/context and image-association review must be performed explicitly by the creator in the app. Supply/review missing auxiliary vocabulary and opening/response/continuation phrases; do not invent traditional wording. Record/listen/approve remaining consenting adult clips only against approved scripts. Missing narration stays text-only. Final confirmation/redistribution consent for the 24-clip speech freeze remains pending, independent of optional M6 narration consent. No speech fixture freeze or recording commit occurred. Actual M4 content acceptance, educator/reviewer feedback, physical-device testing of the new reader, pitch rehearsal and backup recording remain unverified or deferred.
