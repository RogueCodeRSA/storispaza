# Clean-clone evaluation

Use a new directory with no copied `.env.local`, `data/`, `.tools/`, `node_modules/`, `.next/` or browser profile. The active creator recording server and workspace must stay running unchanged. Node 24.14+ within 24.x is required; `.nvmrc` pins 24.22.1. npm/Git and registry access are installation prerequisites. Browser installation requires network/OS dependencies; mock runtime and default tests need no provider key or paid service.

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

Open `http://127.0.0.1:3000` → **Try the mock journey** → **Start the mock journey** → **Load six-page demo story**. Confirm six pages, visible provisional labels and no credential prompt. `npm start` binds only loopback. Test servers use ports 3100/3200; avoid overlapping runs on those ports. Default databases are temporary or ignored evaluation-only directories. If port 3000 is already the recording server, do not stop it: `npm start -- --port 3600` starts the new evaluation build separately. Use a separate browser profile so its session/localStorage cannot replace the creator’s review cookie.

Inherited shell configuration can override mock defaults even with no environment file. In that case, set **only in the evaluation process** `AI_PROVIDER=mock`, `ENABLE_LIVE_AI=0`, `NEXT_TELEMETRY_DISABLED=1` and clear provider keys. Do not edit the existing creator’s configuration or unset values globally. For a clean mock evaluation no `.env.local` is necessary; the optional `.env.example` copy has blank credentials and activation off.

## Offline smoke

The build creates `public/offline/storispaza-offline.html` and its hash/size metadata. Open that file directly, turn network off and use **Start the mock journey** → **Load six-page demo story** → **StoriPlay**. Expect a fixed provisional story, attributed reviewed source images, blank/unreviewed Sesotho slots and labelled non-speech audio. The new `/own` final HTML is a different, guarded export; incomplete M4 content must block it.

## Validation record

Part A clean-clone commands/results will be recorded here after execution. A blank or pending field is not a passing check. No actual educator feedback, human content approval, physical-device result or hosted CI success is implied by local clone validation.
