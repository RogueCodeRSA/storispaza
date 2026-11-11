# Four-minute pitch — reviewed offline edition

**Deadline: 11 November 2026, 23:00 SAST. Rehearsal/backup recording remain pending.** M4 is complete: all 24 scripts and adult clips are approved and consented for publication, none skipped. This is reviewed fixture replay, not live generation. Do not change approvals or the creator's private workspace during the pitch. Attribution/cultural assumptions remain outstanding; a final publication decision is separate.

## Preflight

1. Use Node 24 and run `npm run build:offline` from the current freeze branch. Transfer the freshly generated `public/offline/storispaza-offline.html` (about 17 MiB), open it directly, then disable networking. The initial screen is now the reviewed reader; there is no initial Load button. Test the destination device's audio before the pitch. Earlier mock-only offline copies are obsolete.
2. Prepare a separate private-free mock browser profile/server for `/own` if demonstrating final gates. A different port alone does not isolate cookies. Never show the active creator session, private correction journal, databases or credentials. Use the standalone file as the main path so no server/API is necessary.
3. Prepare README, `docs/CODEX_WORKFLOW.md`, `docs/REVIEWS.md` and `fixtures/approved-speech/CONSENT.md` locally. Have public-safe screenshots ready. Teacher/parent feedback is still pending unless a real permitted record has since been supplied; never treat the blank template as evidence.

## Exact four-minute click path

| Time | Click / show | Spoken outline |
| --- | --- | --- |
| 0:00–0:25 | Open the fresh offline HTML, Page 1 English. | “StoriSpaza helps teachers and families create stories close to home. This fictional Soweto story explores curiosity and safe science. The girl's power is fantasy. This is a reviewed local fixture, not a live generation.” |
| 0:25–1:05 | **Sesotho** → **Play page audio** → **Pause page audio** → **Resume page audio**. Move the **Narration position** slider briefly, then **Next page**. | “All 24 scripts and matching adult recordings were explicitly reviewed and consented. The reader works offline with approved illustrations and human voice. Missing or stale audio in other drafts stays text-only. We do not generate Sesotho speech or recognise Sesotho voice.” |
| 1:05–1:45 | **Start reading turn** → wait for opening → **Play response example** → wait → **I responded — continue without microphone**. If the clips take too long, use the text and describe continuation. | “The opening pauses for the child's response. A tap or Enter continues. The adult response example is optional. Nothing captures or recognises the child's response. One player owns narration, vocabulary and phrases.” |
| 1:45–2:25 | **Create / edit an unreviewed copy** → **Start the mock journey** → **Load six-page demo story** → edit **English narrative**. Show **StoriSpeak** and **Review status**, without approving anything. | “The reviewed original stays intact. Editing a copy clears approvals and starts private. This editor is a provisional rehearsal; its samples are tones, not the approved narration. Live English-only capture and generation are separate local workspaces with consent.” |
| 2:25–3:05 | **StoriOwn** tab in the offline copy. Optionally switch to the prepared isolated `/own` → **Choose this edition** → **Final approval checklist**, showing blocked final downloads. | “Private is the default. Sharing is a manual file, never a public URL or gallery. Final exports require current reviews, attribution, cultural confirmation and separate sharing/voice consent. Raw inputs and private corrections are excluded. Local deletion cannot recall already exported copies.” |
| 3:05–3:35 | **Library** → show the frozen first card, English/Sesotho badges and creator credit → **The Rain Jar** → **Next page** → **Library** → point to **Add your story**. | “This library stays on this device and works offline. The first story is our consented reviewed fixture. These two English examples are clearly labelled, not community submissions. New stories start private; a visible local copy needs explicit sharing and library consent. No accounts or public links.” |
| 3:35–3:50 | Show consent manifest, workflow and review records in the local editor. | “Codex helped plan gates, build, test consent and review the diff. The evidence records failures and fixes. Tests do not establish learning gains.” |
| 3:50–4:00 | **Library** → first frozen demo card → Page 1. | “Next: attribution, cultural confirmation, educator feedback and device rehearsal. Every story has a place. Tell it. Create it. Own it.” |

## Backup plan — switch within ten seconds

- **Server/network failure:** stay in the standalone HTML. It needs no network or server, and embeds all six approved illustrations and 24 consented adult clips.
- **Audio/device failure:** keep the approved text and images visible; use the response button's text fallback. Say sound is unavailable on this device. Do not substitute a tone for spoken Sesotho or open a microphone.
- **File/browser failure:** show `docs/design/m4-frozen-chromium.png` or `m4-frozen-mobile.png`, labelled as static test evidence. If a real checked backup video exists, play it; otherwise do not claim one.
- **Gate demonstration unavailable:** show the documented ownership tests; do not expose the private review session or approve content to make a download work. The offline copy exports provisional files, not final publication approval.
- **Private material appears:** switch to the public-safe story screenshot. Preserve the creator's ongoing local workspace.

## Presenter checklist — human work still pending

- [ ] Transfer and open this freshly built file on the actual presentation device; check its audio in airplane mode.
- [ ] Rehearse within four minutes and record/verify a backup if time allows.
- [ ] Collect one real teacher/parent feedback record with permission, or explicitly say it is pending.
- [ ] Confirm final creator attribution and cultural assumptions separately; do not imply this task approved them.
