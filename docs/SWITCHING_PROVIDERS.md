# Adding or switching an AI provider

## Current state and boundary

M2 activates OpenAI for story structuring and English transcription after creator authorization, hosted-CI confirmation and bounded access checks. Cloudflare remains a **deferred placeholder**; its free-account setup below is optional future work. The OpenAI adapter implements strict output, usage conversion and no retry/fallback. Every registered adapter runs the reusable offline contract suite; only explicitly opted-in paid smoke tests use a real network. Later translation/image/narration operations are unavailable.

For authorized local M2, preserve existing ignored `.env.local` credentials and set `AI_PROVIDER=real`, `AI_ADAPTER=openai`, `ENABLE_LIVE_AI=1`. Approved model defaults are in the blank `.env.example`; changing models requires revised price estimates/tests before dispatch. `/create` is the live editor; `/studio` and the standalone download remain the mock delivery path in mock mode. Keep the app on loopback. Default tests never call a provider.

`AI_PROVIDER=mock` remains the default offline mode. Live-mode selection uses `AI_PROVIDER=real` plus generic `AI_ADAPTER=<registered-id>`. Unknown/missing IDs and mode mismatches fail; never silently switch to mock or another vendor. Routes/UI/domain schemas contain no vendor endpoints, SDKs, keys, model IDs or response parsing. Registration and all vendor-specific credential loading, transport, prompts, response conversion and price/allowance estimation belong only under `src/server/providers/adapters/`.

The public contract is StoryProvider/ProviderResult. Adapter capabilities distinguish available, unavailable and unsupported operations; a deferred entry passing rejection tests does **not** establish live readiness. Provider IDs are metadata strings, not a vendor enum in story/schema/UI code.

## Set up the free account and local credentials

1. Sign up at [Cloudflare](https://dash.cloudflare.com/sign-up), verify your email, and select your account. Use Workers Free for this strategy; do not opt into paid inference or prepaid credits during setup.
2. Open Workers AI in the dashboard, choose its REST API setup, and use its token-creation action. For a custom token, grant **Account → Workers AI → Read** and **Account → Workers AI → Edit**, scoped to **only this account**. Do not add DNS, zone, Worker deployment, account-admin or AI Gateway permissions for this direct inference setup. Review the token scope before creation. The documented REST setup specifies both AI permissions. [Official setup](https://developers.cloudflare.com/workers-ai/get-started/rest-api/)
3. Copy the account ID from the same setup screen. Edit existing `.env.local` (or create it if absent), storing **both real values only there**:

```dotenv
AI_PROVIDER=mock
# Selecting real/cloudflare does not enable a live adapter yet.
AI_ADAPTER=cloudflare
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-token
```

Do not paste either real value into chat, source, docs, shell arguments/history, issues, screenshots or CI output. Never add NEXT_PUBLIC_ to credential variables. `.env.example` contains blank names only; `.env.local` is ignored. Keep the existing file rather than overwriting it with an example. User creates/signs into the account and manages the token; Codex has not created or verified an account/token.

**VERIFIED:** published Workers Free allocation is 10,000 neurons/day, resetting at 00:00 UTC (02:00 SAST). On Free, further operations fail when allocation is exhausted; some models require paid access. **ASSUMED/unverified:** your account access, model eligibility, available balance and quality. Do not infer a free story count from this allowance. [Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)

## Implement one adapter

1. Confirm hosted CI outcome with the creator and pass the bounded, explicit-opt-in access/usage check before branching into live M2. Stop on auth, billing, model-access or allowance failures; no fallback. Existing M0/M1 acceptance is not a live-model test.
2. Add a server-only `*.adapter.ts` file under the adapter directory and register its ID there. Read that provider's env variables only in this file. Do not change generic route/UI/schema logic to add a vendor.
3. Implement each supported operation behind StoryProvider. Keep unsupported capabilities explicitly unavailable/unsupported. Validate input, consent and product-language policy before transmission. Convert raw SDK responses into the shared result; do not return raw response bodies, headers, request prompts or diagnostic dumps. No prompt/recording/transcript logging.
4. Return exactly six ordered story pages and validated character references. Default all output to private/unreviewed; do not grant approval or cultural verification. No synthetic Sesotho or Sesotho voice-to-story claims. Model availability does not establish language quality.
5. Populate providerId, generated/mock provenance, per-output assets and usage. Report actual token counts when provided. Use null for unavailable measurements; never invent zeros or charge estimates as actual billing. The output boundary strips undeclared transport fields and rejects mismatched producer IDs, asset IDs, counts, malformed output and missing accounting.

## Budget and free allowance

All live capabilities require an explicit ProviderAllowanceGuard: reserve before dispatch, settle measured usage, retain unknown reservations on failed/ambiguous outcomes. This rule also applies when dollars are zero. The boundary rejects a zero-dollar live result with no allowance metadata. A free call consumes finite quota.

The existing SQLite dollar ledger is not an account-aware daily allowance ledger. Before enabling the free adapter, implement persistent unit-based accounting with atomic reservations, conservative worst-case model estimates, session and account/day caps, a defined reset policy and one image operation. Keep counters across sessions/restarts; a new browser session must not reset the account allowance. Obtain the configured unit/reset policy from the adapter rather than putting vendor-specific rules in routes or schemas. Remember other tools can consume the same account allocation; app estimates cannot establish the provider's remaining balance.

Keep the account on the free plan and stop on exhaustion; no automatic paid upgrade or cross-provider fallback. If implementing a paid provider later, retain the approved US$2/session and US$10 development caps until changed by the creator. Unknown actual cost or usage keeps its reservation. Retry only explicitly retryable failures within the same guard and total attempt limit; do not duplicate ambiguous generation requests.

The M2 SQLite dollar guard and OpenAI text/audio transport are implemented and tested. Account-aware daily free-unit metering and Cloudflare transport remain unimplemented. The app ledger cannot account for spend from other tools/accounts or guarantee provider billing.

## Provenance when switching

Each page stores independent text, illustration, translation and narration sources: asset ID, producer ID, model (nullable if unknown), origin and creator-edit marker. The adapter that replays a fixture is not necessarily the producer of its assets. Current English fixtures are labelled codex-authoring with model unknown; symbols, text slots and tones are local-placeholder fixtures.

When replacing an illustration, provide the new asset ID and source to replaceIllustration; preserve the previous source in assetHistory and invalidate illustration approval. Source text and unrelated assets retain their original producers. Creator edits are marked separately rather than pretending a provider generated the edit. Restore/save/JSON/HTML exports preserve sources/history. Legacy drafts without source metadata load as unknown, never as the currently selected vendor. Review-status labels remain separate from producer provenance.

## Required tests and activation

- Register an offline factory in `tests/provider-contract.test.ts` and run the reusable suite in `tests/contracts/provider-contract.ts`. Inject a deterministic transport for live adapters: default CI/tests must never use real keys or call a vendor. The registry completeness test fails when an adapter lacks a suite entry.
- Available operations must pass output/usage/provenance, initial privacy/review state, six-page/translation, consent/language and mutation-isolation checks. Unavailable operations must reject explicitly; this is rejection coverage, not evidence of a functioning integration.
- Test transport-specific auth/refusal/429/allowance exhaustion, malformed output, unknown usage, timeout and SDK-error redaction inside adapter tests. Generic boundary tests already cover required guards, denial before dispatch, empty reservations, malformed results, unknown accounting and transport-field stripping.
- Test the persistent allowance implementation: exhaustion, shared-account/session counters, concurrent reservations, reset boundary, restart persistence, no paid fallback and ambiguous outcomes. Do not enable a live adapter with only a stub guard.
- Test mixed-producer asset replacement/history, old drafts, creator edits and both exports. Run lint, typecheck, unit/integration tests, production/offline build and the eight offline browser checks. Recheck asset labels visually. The architecture test rejects vendor-specific src code outside adapter files.
- Live smoke/paid tests require explicit opt-in, a bounded request count and allowance/cost ceiling. Record safe operation IDs, model IDs, token/allowance usage and measured/estimated cost distinctly; never log keys, raw prompts or transcripts. Record refusals and missing metrics honestly. Require a creator review of language/audio quality separately.
- Update DECISIONS, AI_SAFETY, ARCHITECTURE, REVIEWS and CODEX_WORKFLOW with evidence. Switch configuration only after approval/access/CI gates pass; keep offline mock mode working and stop at the milestone report.
