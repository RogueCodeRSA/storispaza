# M1 real-device offline acceptance

Status: **PASS — creator-reported, 2026-11-10**. The creator explicitly replied: "I completed the checks successfully; device details follow" to the Android/Chrome airplane-mode checklist. This is a human-reported result, not direct observation by Codex. Device/OS/browser versions and tested-file hash have not been provided; do not invent them. Playwright mobile emulation remains separate evidence.

## Get the file

Run `npm run build` using Node 24. The generated, self-contained file is `public/offline/storispaza-offline.html`; its SHA256 and byte count are in `public/offline/build.json`. The source is versioned; generated copies are ignored. Download through the home page while the laptop app is running, or transfer the file to the phone's Downloads folder by USB/your preferred method. There is no need to expose the Next.js server or use a public host.

Open the downloaded **HTML file in Chrome**, not a file-manager preview. If Android offers an HTML viewer that disables scripts, choose Chrome instead. Note whether the address starts `file:` or `content:`. The exact opening behavior is part of this real-device test; a blank screen is a failure to investigate, not a reason to waive the criterion.

## Checklist (airplane mode)

1. Enable airplane mode and explicitly turn **Wi-Fi and mobile data off**. Leave the downloaded file open or reopen it from Downloads; the story must not depend on the laptop/server. Note phone model, Android version and Chrome version.
2. First screen clearly explains six-page illustrated bilingual storytelling and shows mock/provisional labels. Tap **Start the mock journey**, then **Load six-page demo story**. Edit English text on a page, visit all six pages, and tick each provisional text acknowledgement.
3. StoriCreate: regenerate one placeholder and confirm only that page changes. Visit/acknowledge all six illustration placeholders.
4. StoriSpeak: confirm every Sesotho slot is visibly provisional/unreviewed; edit a slot and acknowledge all six. These are placeholders, not verified translations.
5. StoriPlay: switch English/Sesotho, navigate pages, play/pause/resume the quiet tone. It must be audible with a clear **audio placeholder / unreviewed** label; it is not narration or pronunciation. Start the opening placeholder; verify it pauses and waits for **I responded — continue**. Tap to continue; no microphone is used. Phrase placeholders must remain labelled unreviewed.
6. StoriOwn: check export is blocked until all acknowledgements and cultural-assumption acknowledgement are complete. Shared visibility additionally needs explicit distribution consent. Check recording consent before adding the tone copy; save the provisional draft, delete the recording copy, restore the saved draft, return to StoriOwn and confirm the copy stays deleted.
7. Export provisional JSON and HTML reader while still offline. Open the saved reader; all six pages, your edit and provisional/unreviewed notices should be present. JSON must exclude the recording copy and never mark translations approved.
8. Reopen/reload the downloaded journey while still offline, restore the saved draft and verify your edit. If file-origin storage is blocked, record the limitation rather than claiming persistence worked. Keep exports as recovery copies. Check touch targets, scrolling, keyboard entry and absence of horizontal overflow.

## Result record

- Tester / date: creator / 2026-11-10.
- Phone model / Android / Chrome: Android/Chrome confirmed; model and versions pending creator follow-up.
- Tested file SHA256: not reported. Final locally automated-tested build: `ceef878f3c7ef0fed8097c11f81fd9ad07faf4e08026ce497a11372759f72fb5` (718,734 bytes). Do not assume this identifies the phone's copy.
- Opened via file: or content: / method: not reported.
- Airplane mode / Wi-Fi / mobile data: creator reported successful completion of the networking-disabled checklist; individual toggles not independently observed.
- Steps 1–8: creator reported successful checklist completion after an explicit question covering all five stages, save/restore, deleted recording-copy state, audible playback, response pause and both exports. No step-by-step measurements supplied.
- Issues / exact failing step: none reported.
- Overall: **PASS (creator-reported); reproducibility metadata pending**.

No real voice, child recording, API request or cultural/language validation is exercised. This test validates M1 fixture workflow only.
