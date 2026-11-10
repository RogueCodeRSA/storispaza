# Decisions and research

**Current strategy amendment (2026-11-10): free provider first; OpenAI is a documented future adapter only.** Preserve the original OpenAI research below, including model names, cost calculations, links and VERIFIED/ASSUMED labels. Those dated findings are not current account validation and do not authorize or implement OpenAI calls. Reverify them before a future adapter is added.

## Provider preparation decisions

- **VERIFIED:** Cloudflare's direct REST setup specifies Workers AI Read and Edit permissions; restrict token resources to the intended account. Use its account/token setup rather than adding DNS/deployment/AI Gateway access. [Setup](https://developers.cloudflare.com/workers-ai/get-started/rest-api/)
- **VERIFIED:** published free allowance is 10,000 neurons/day, reset 00:00 UTC; Free-plan operations fail after exhaustion, and some models require paid access. **ASSUMED:** account access, selected-model eligibility, available balance and acceptable story/English-speech quality. No account/token/access check or live inference has run here. [Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [limits](https://developers.cloudflare.com/workers-ai/platform/limits/)
- **ADR-012:** isolate all vendor credentials, SDK/HTTP requests, model prompts/IDs, parsing and price/allowance estimation in adapter files. Generic config selects mock/real mode and a registered adapter ID. Both intended live entries remain deferred; OpenAI research below is preserved as future work.
- **ADR-013:** a zero-dollar request still requires a guard and allowance accounting. Shared boundary reserves before dispatch, validates/canonicalizes outputs, strips transport-only fields, retains uncertain usage and redacts failures. Persistent free-unit metering and actual live transport must be implemented/tested before activation; current registration is not readiness evidence.
- **ADR-014:** per-asset producer/model/origin/creator-edit metadata is separate from review state and replay adapter. Image replacement retains prior sources. Older unknown producers stay unknown rather than inheriting the selected vendor. Restore/JSON/HTML preserve this history.
- **ADR-015:** every registered adapter must supply an offline factory for the same contract suite. Deferred adapters pass explicit rejection tests only. Available live capabilities additionally require deterministic transport/error/allowance tests, opt-in access checks and hosted CI confirmation. SWITCHING_PROVIDERS.md contains the procedure.

Checked 2026-11-10 against official OpenAI docs. **VERIFIED** = documented, not account-tested. **ASSUMED** = estimate or quality/access awaiting validation. No paid API call in M0. Recheck docs/project access before enabling real operations.

## Evidence

| Topic | Label and source | Decision |
| --- | --- | --- |
| File transcription | **VERIFIED:** `gpt-transcribe`, completed recordings/context/language hints; guide documents 25 MB and WebM among supported formats. [Guide](https://developers.openai.com/api/docs/guides/speech-to-text), [model](https://developers.openai.com/api/docs/models/gpt-transcribe) | English MVP only; editable transcript/manual fallback. App limit two minutes/10 MB. |
| English quality | **ASSUMED:** useful on this microphone/accent; not validated by general docs. | Test in M2. |
| Sesotho recognition | **ASSUMED / unverified:** inspected docs do not establish a Sesotho-specific quality benchmark. [Guide](https://developers.openai.com/api/docs/guides/speech-to-text) | Manual text/transcript; no Sesotho voice-to-story claim. |
| Sesotho TTS | **VERIFIED:** absent from inspected TTS language list; voices optimized for English. **ASSUMED:** acceptable pronunciation; absence does not prove impossibility. [TTS](https://developers.openai.com/api/docs/guides/text-to-speech) | Creator-recorded English/Sesotho. No synthetic Sesotho claim. |
| Six-page output | **VERIFIED:** `gpt-5.6-terra` supports Structured Outputs; schema guide supports array bounds. [Model](https://developers.openai.com/api/docs/models/gpt-5.6-terra), [guide](https://developers.openai.com/api/docs/guides/structured-outputs) | Exactly six ordered pages, reference validation. Schema cannot certify accuracy/safety. |
| Sesotho translation | **ASSUMED:** useful draft quality. | Human edit/approval; never machine-verified. |
| Reference images | **VERIFIED:** reference-image edits and `gpt-image-2.6-sunburst` documented. **ASSUMED:** acceptable six-page identity consistency. [Guide](https://developers.openai.com/api/docs/guides/image-generation), [model](https://developers.openai.com/api/docs/models/gpt-image-2.6-sunburst) | Sheet/style/prompt checks/human review. Guide warns about identity drift and latency. |
| Limits/access | **VERIFIED:** bounded backoff/server delays for transient limits, unsuccessful calls affect limits. **ASSUMED:** account model access/actual limits. [Limits](https://developers.openai.com/api/docs/guides/rate-limits) | Check billing/verification first. Ten calls/minute/session, one pending image. No automatic quota/billing/ambiguous timeout retries. |
| Data retention | **VERIFIED:** controls/retention differ by endpoint; local deletion cannot promise deletion of all provider records. [Data controls](https://developers.openai.com/api/docs/guides/your-data) | Future Responses use `store:false`; separate transmission consent; document enabled endpoints. |

## Cost evidence

**VERIFIED rates:** `gpt-5.6-terra` $2/M input + $12/M output ([model](https://developers.openai.com/api/docs/models/gpt-5.6-terra)); Image 2.6 $5/M text input, $8/M image input, $30/M image output ([pricing](https://developers.openai.com/api/docs/pricing)); `gpt-transcribe` $0.0045/minute ([model](https://developers.openai.com/api/docs/models/gpt-transcribe)). These are config defaults, not evidence of account access.

**ASSUMED workload:** all text operations combined 15k input/8k output; sheet + six scenes 28k image output, 12k reference input, 7k prompt tokens; one minute transcription. $0.030 + $0.096 + $0.840 + $0.096 + $0.035 + $0.0045 = **$1.1015/story**, excluding regeneration/tax/unexpected usage. Measure real image usage before promising a price. Creator audio has no API cost; mock replay $0. $2/session and $10 total are app allowances, not provider billing guarantees.

## Architecture records

- **ADR-001:** single local Next.js app/TS/Tailwind. Avoid orchestration; no-auth is appropriate only for loopback/single creator. Public hosting deferred.
- **ADR-002:** Node 24 `node:sqlite` avoids native addon compilation. Local private files outside public. SQLite may emit an experimental warning. No DB is opened during home render/build. Version 1 schema; add explicit migrations before future schema changes.
- **ADR-003:** shared provider interface, labelled fixture mock, fail-closed real boundary in M0. SDK installed for later real adapter. No paid route or silent fallback.
- **ADR-004:** explicit confirmed draft saves; current content/consent approvals for final/shared. Edits invalidate dependencies. Fixture provenance is not human approval.
- **ADR-005:** 24 creator audio clips in M4, deterministic playback/tap-to-continue; no child speech processing.
- **ADR-006:** ZIP desired, JSON + standalone HTML accepted fallback; shared means consented manual export, not a URL service.
- **ADR-007:** provisional text/symbol in M0; real reviewed illustrations in M3, reviewed translations/audio complete pack in M4. No false real-generation claim.

## Toolchain findings

Host Node 18.6 is too old; use available Node 24.22.1 without changing global runtime. [Next installation](https://nextjs.org/docs/app/getting-started/installation). TypeScript 6 matches the parser's declared support; direct deps/lockfile pinned. Next's lint plugins declare ESLint 9 compatibility; ESLint 10 produced peer warnings, so retain compatible 9 despite its deprecation notice. Targeted minimatch overrides address GHSA-g3hv-75wg-m249; audit/lint results in REVIEWS.md. Revisit tooling compatibility in M7 instead of disabling rules.

## M1 decisions — offline/mobile

- **ADR-008:** a single self-contained HTML bundle of the same React journey, rather than relying on a phone reaching localhost or an insecure LAN origin. No public deployment, service worker, trusted certificate or authentication expansion. esbuild produces a browser IIFE with inline CSS/assets ([official API](https://esbuild.github.io/api/)). **VERIFIED:** bundling capability; **ASSUMED until measured:** actual phone file-opening behavior. Creator selected Android/Chrome; required result tracked in MOBILE_OFFLINE_TEST.md.
- **ADR-009:** explicit browser-local Save/Restore for offline drafts. **VERIFIED:** localStorage availability is subject to origin/browser policy, with file URL behavior not guaranteed ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)). Handle errors without losing the in-memory draft; require a real-device save/restore check rather than inferring persistence from desktop.
- **ADR-010:** generated non-speech tone for provisional audio. Never use browser speech synthesis for Sesotho or label tones pronunciation/narration. **VERIFIED:** media play returns a promise that may reject; UI must reflect successful start and handle rejection ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play)). Pause/resume and call-and-response are tested separately from voice quality, which is not evaluated in M1.
- **ADR-011:** separate demo acknowledgements from genuine content approvals. Final approval guard stays intact. Mock exports are explicitly provisional/unreviewed; M1 is not permitted to grant language/cultural verification. Real reviewed audio/text remain M4 work.
