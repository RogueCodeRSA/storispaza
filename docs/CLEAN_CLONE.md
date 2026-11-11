# Clean-clone evaluation

Use a new directory with no copied `.env.local`, `data/`, `.tools/`, `node_modules/`, `.next/` or browser profile. The active creator recording server and workspace must stay running unchanged. Node 24.14+ within 24.x is required; `.nvmrc` pins 24.22.1. npm/Git and registry access are installation prerequisites. Browser installation requires network/OS dependencies; mock runtime and default tests need no provider key or paid service.

On the development laptop, use the README’s session-local npm/npx functions as well as the Node PATH selection. A fresh-clone attempt showed that the global npm shim still launched Node 18 despite `node --version` reporting 24, producing `EBADENGINE` warnings; that attempt was interrupted and rerun with the existing npm CLI explicitly launched by Node 24. Do not suppress engine warnings or change the project’s runtime requirement to accommodate an old shim.

## Commands

```sh
git clone --branch codex/m7-hardening <repository-url> storispaza-evaluation
cd storispaza-evaluation
node --version
npm ci
npm run check
npm run verify:public
npx playwright install chromium
npm run test:e2e
npm start
```

Use the submitted repository URL; before publishing, use the source repository's absolute local path. On Linux without browser dependencies, replace browser installation with `npx playwright install --with-deps chromium`. `check` must precede E2E because unit tests generate an ignored synthetic M6 export for the file-origin browser checks. `typecheck` creates Next route declarations and also works before a production build. Nothing copies private creator data or freezes fixtures.

Open `http://127.0.0.1:3000` → **Try the mock journey** → **Start the mock journey** → **Load six-page demo story**. Confirm six pages, visible provisional labels and no credential prompt. `npm start` binds only loopback. Test servers use ports 3100/3200; avoid overlapping runs on those ports. Default databases are temporary or ignored evaluation-only directories. If port 3000 is already the recording server, do not stop it: `npm start '--' --port 3600` starts the new evaluation build separately. Quoting the separator preserves it through the laptop’s PowerShell npm function. Use a separate browser profile so its session/localStorage cannot replace the creator’s review cookie.

Inherited shell configuration can override mock defaults even with no environment file. In that case, set **only in the evaluation process** `AI_PROVIDER=mock`, `ENABLE_LIVE_AI=0`, `NEXT_TELEMETRY_DISABLED=1` and clear provider keys. Do not edit the existing creator’s configuration or unset values globally. For a clean mock evaluation no `.env.local` is necessary; the optional `.env.example` copy has blank credentials and activation off.

## Offline smoke

The build creates `public/offline/storispaza-offline.html` and its hash/size metadata. Open that file directly, turn network off and use **Start the mock journey** → **Load six-page demo story** → **StoriPlay**. Expect a fixed provisional story, attributed reviewed source images, blank/unreviewed Sesotho slots and labelled non-speech audio. The new `/own` final HTML is a different, guarded export; incomplete M4 content must block it.

## Validation record

Executed on **2026-11-11**, Windows/PowerShell, **Node 24.22.1**, existing npm CLI **8.16.0 explicitly launched by Node 24**. Fresh local clone of `codex/m7-hardening` candidate `6d70650` under ignored `.tools/m7-clean-clone`; no hardlinks, copied environment, data, dependencies or generated files. Initially `.env.local`, `data/` and `node_modules/` were all absent. The clone fast-forwarded to `0a82518` for the identified runtime/test-budget fixes; dependency lockfile/application code did not change. Later documentation closeout records these results and the tested quoted-separator invocation.

| Step | Observed result |
| --- | --- |
| `npm ci` under Node 24 | PASS: 398 packages installed, 405 audited, zero reported vulnerabilities. Existing ESLint 9 deprecation warning remains; compatible versions are pinned. The initial Node 18 npm-shim attempt was interrupted, not counted as a successful install. |
| `npm run check` | PASS: lint, route type generation/strict TypeScript, **111 unit/integration tests**, **five paid checks skipped**, production/offline build. Initial cold-disk 24-clip test timed out at five seconds; its explicit 20-second budget preserved all assertions and the full rerun passed. |
| `npm run verify:public` | PASS: **166 files + 46 generated browser/offline artifacts**, no credential/private-path finding. No credential values printed. |
| `npx playwright install chromium` | PASS using the available matching browser installation; no provider key. |
| `npm run test:e2e` | PASS: **36 desktop/mobile/standalone-offline checks**, exit 0, **1.0 minute**. Includes synthetic M6 HTML opened from disk offline and current-consent/revision gates. |
| `npm start '--' --port 3600` | PASS: production server ready on **127.0.0.1 only**. HTTP 200 from `/`, `/studio`, `/play`, `/speak`, `/own`, `/offline/storispaza-offline.html`. Only this validation server was then stopped. The first unquoted-separator invocation failed and is corrected above/README. |
| Clone/private state | Git working tree clean after checks; `.env.local` absent. Runtime/test output stays ignored. No actual creator DB/browser session, review, recording or fixture freeze was used. |
| Documentation links | PASS: 26 local file/screenshot links checked across 11 evaluator documents. |

The nested clone’s Next build/start warned that the parent checkout’s lockfile was outside its Git repository and ignored it; build/server checks still passed. Existing colour-environment warnings in Playwright are informational. No dependency update, app change or global runtime change was needed.

The old standalone mock remains **1,836,031 bytes**, SHA256 `8caddad10fab8ad9cd3662275189ea3b76bc237eaa5f8e5407e7d2b9c21603b7`. It is provisional replay, not a newly frozen M4 fixture pack. Current/final staged secret/path gates are recorded in REVIEWS. Local Windows/browser evidence does **not** establish hosted CI, physical-device/screen-reader acceptance, actual educator feedback, human content approval, pitch rehearsal or a backup video.
