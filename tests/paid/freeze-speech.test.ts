import { resolve } from "node:path";
import { expect, it } from "vitest";
import { readConfig } from "@/server/config";
import { openDatabase } from "@/server/storage";
import { speechProjectSchema, speechFreezeIssues } from "@/domain/speech";
import { writeReviewedSpeechFixtures } from "@/server/speech-fixtures";

it.skipIf(process.env.FREEZE_REVIEWED_SPEECH !== "1")("freeze only the fully approved real in-app adult recording workspace; no network", () => {
  if (process.env.CI) throw new Error("Local-only fixture maintenance.");
  const db = openDatabase(readConfig().DATA_DIR);
  try {
    const rows = db.prepare("SELECT session_id,payload FROM speech_projects WHERE busy=0").all();
    const ready = rows.filter(row => { const project = speechProjectSchema.parse(JSON.parse(String(row.payload))); return project.mode === "real" && project.frozen && project.redistributionConsent && !speechFreezeIssues(project).length; });
    if (ready.length !== 1) throw new Error("Exactly one fully reviewed, frozen, consented workspace is required. Complete every page/script/clip approval in the app first.");
    const result = writeReviewedSpeechFixtures(db, String(ready[0].session_id), resolve("fixtures/approved-speech"));
    console.log(JSON.stringify({ fixtureFreeze: "creator-approved-adult-recordings", ...result, networkRequests: 0 })); expect(result.clips).toBe(24);
  } finally { db.close(); }
});
