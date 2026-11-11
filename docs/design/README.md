# M7 visual addendum — before / after

## Local library — 2026-11-11

[Desktop library](library-desktop.png) · [Mobile library](library-mobile.png). Captured from the regenerated standalone file with networking disabled after exercising add/save/reload/remove; the visible removal message records that test action. Only the consented frozen fixture and clearly labelled authored English examples remain in these captures. No private story, voice or fabricated community contribution is shown. The historical M4 images below are retained unchanged.

## M4 reviewed snapshot — 2026-11-11

The later M4 freeze adds [desktop](m4-frozen-chromium.png) and [mobile emulation](m4-frozen-mobile.png) captures of the actual consented reviewed reader from the freshly generated standalone HTML, with network disabled. All 24 reviewed adult clips and six approved images were exercised. These screenshots show the creator-approved text, not intercepted test wording. Creator attribution is still a placeholder, so the badge honestly says “the creator”. No private journal/session or child recording is shown. The historical M7 comparisons below predate completed content review.

Captured 2026-11-11 from an isolated **mock** production server on loopback 3700, with external browser requests blocked. Desktop **1365 × 900**, mobile **390 × 844**, DPR 1; full-page PNGs, reduced motion enabled for comparable stills. Before is merged Part A `029f445`; after is this visual addendum. No actual creator reviews, private recordings, corrections or session identifiers are shown. M4 content review remains open; screenshots are not language approval evidence.

| View | Before | After |
| --- | --- | --- |
| Landing, desktop | [Before](before-landing-desktop.png) | [After](after-landing-desktop.png) |
| Landing, mobile | [Before](before-landing-mobile.png) | [After](after-landing-mobile.png) |
| Reader, desktop | [Before](before-reader-desktop.png) | [After](after-reader-desktop.png) |
| Reader, mobile | [Before](before-reader-mobile.png) | [After](after-reader-mobile.png) |
| Offline-capable journey reader, desktop | [Before](before-journey-desktop.png) | [After](after-journey-desktop.png) |
| Offline-capable journey reader, mobile | [Before](before-journey-mobile.png) | [After](after-journey-mobile.png) |

## What changed, in the requested order

1. **Approved source art:** landing directly imports `fixtures/approved-images/page-1.webp`; readers use the approved six-page image pack, whose bytes/hash already match those consented files. The old landing explicitly pointed to `placeholder.svg`. Mock “regeneration” also replaced an approved asset ID with `mock-image-…`, causing icon fallback; preview now keeps the real source ID/history and invalidates only the demo acknowledgement/current draft image review. Restore repairs known old placeholder IDs, preserving history and resetting review/acknowledgement. No new image generation or fixture changes.
2. **One review panel:** mode, provisional text/audio, source attribution, counts and language/science notes live in a native collapsible **Review status** panel. One small badge remains per page. Current real Sesotho approval shows **Sesotho reviewed by [creator]**, using saved project-bound attribution where available; absent identity uses “the creator”, never an invented name. Pending/edited/mock content cannot get that reviewed badge. Consent and unmet approval controls remain explicit in their creator workspaces.
3. **Read first:** primary **Read the story** opens `/play`; secondary **Create your own** opens the appropriate creator path; offline download is a small link. A real-mode visitor with no private workspace gets the explicitly disclosed fixed mock edition with text-only narration, no key/network call and no storage creation. Existing private projects retain their own review/media checks.
4. **A picture-book spread:** large uncropped M3 illustration, soft paper text panel, six compact page dots, slim five-stage studio progress, 48-pixel controls, readable type and no developer banners. Desktop art occupies about 62% of the spread; mobile stacks full-width art above the copy. UI photo errors keep readable text rather than inserting a placeholder icon.
5. **Motion:** a short transform/opacity page turn and a finite decorative response spark on waiting/completion. No looping flash, new audio, microphone or speech recognition. `prefers-reduced-motion: reduce` disables both animations while keyboard focus, status announcements and the response state remain functional. CSS ships in the self-contained offline bundle; no dependency/CDN is added.

The read-only private reader may display an approved M3 source for an unavailable legacy association, but explicitly leaves that association pending. It never rewrites a private project’s ID/review state or weakens M6 export checks. Unknown/unapproved actual export assets remain gated. Non-speech samples are labelled **audio sample**; they are not presented as narration/pronunciation. Reviewer identity is creator-supplied attribution, not an authenticated external certification.

## Verification

- Full lint, strict TypeScript, production/offline build: PASS.
- **114 unit/integration tests PASS**, five paid tests intentionally skipped; current media/consent/provenance/deletion/export/budget contracts retained.
- **42 desktop/mobile browser checks PASS, exit 0, 1.2 minutes**, including all six decoded images, image dominance, one collapsed status panel, reviewed-name invalidation, keyboard focus, 48-pixel targets, normal/reduced motion, private audio/error/reduced-data handling and both Next/file-origin five-stage offline journeys.
- First browser pass found the removed legacy mock-header assertion and an unstable exact wrapping-textarea label lookup. Updated the disclosure assertion to its panel, added an explicit stable textarea accessible name and role selector, then reran the full suite successfully. No tests or consent/approval assertions were deleted.
- Screenshot visual QA: approved artwork visible, no clipping/horizontal overflow at both sizes, a soft reading panel, compact progress and a single subdued badge. All twelve captures use public-safe fixture content; before/after do not show the creator’s current M4 progress.
- New standalone mock: **1,841,270 bytes**, SHA256 `cd563a3823498324e1dd0b442a41506efe5d185957abd43afdabc727da04a473`. This is a rebuilt provisional journey, not a new reviewed speech fixture. New physical-device/assistive-technology acceptance is not claimed.

M4 human reviews/recordings/final redistribution consent, real educator feedback, final rehearsal/backup recording and hosted CI remain separate. No paid calls, speech fixture freeze, private-data commit, public hosting or remote push occurred.
