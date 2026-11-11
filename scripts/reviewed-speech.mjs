import { createHash } from "node:crypto";

// Reused by the build and index scanner. Read through the supplied function so
// staged validation uses index blobs, never an unstaged consent manifest.
export function reviewedSpeechPack(read) {
  const root = "fixtures/approved-speech/";
  const manifest = JSON.parse(read(`${root}manifest.json`).toString("utf8"));
  const book = JSON.parse(read(`${root}reader.json`).toString("utf8"));
  const fail = () => { throw new Error("Reviewed speech pack failed consent, approval, projection or hash validation."); };
  if (manifest.format !== "storispaza-reviewed-speech-v1" || manifest.approvalMethod !== "explicit-in-app" || manifest.adultCreatorOnly !== true || manifest.redistributionConsent !== true || manifest.corrections?.length !== 0 || manifest.scripts?.length !== 24 || manifest.recordings?.length !== 24 || book.fixtureReplay !== true || book.mode !== "real" || book.scriptsApproved !== 24 || book.clipsApproved !== 24 || book.pages?.length !== 6 || book.title !== manifest.story.title || book.creator !== manifest.story.creator) fail();
  const ids = new Set(); const files = new Map();
  const slots = [...book.pages.flatMap(page => [page.text.en, page.text.st]), ...Object.values(book.interaction).flatMap(Object.values), ...Object.values(book.vocabulary).flat()];
  for (const script of manifest.scripts) {
    if (!/^(en|st)-(page-0[1-6]|word-0[1-3]|opening|response|continuation)$/.test(script.id) || ids.has(script.id) || script.status !== "approved" || !script.text?.trim() || !Number.isInteger(script.version) || script.version < 0 || !Number.isFinite(script.maxSeconds) || script.maxSeconds <= 0 || script.maxSeconds > 60 || script.clip?.approved !== true || script.clip.adultOwnVoice !== true || script.clip.scriptVersion !== script.version || !Number.isFinite(script.clip.seconds) || script.clip.seconds <= 0 || script.clip.seconds > script.maxSeconds) fail();
    ids.add(script.id);
    const recording = manifest.recordings.find(item => item.filename === `${script.id}.wav`);
    if (!recording || recording.creatorApproved !== true || recording.adultOwnVoice !== true || recording.scriptVersion !== script.version || recording.sha256 !== script.clip.sha256) fail();
    const path = `${root}${recording.filename}`; const bytes = read(path);
    if (bytes.length < 46 || bytes.length !== recording.byteLength || createHash("sha256").update(bytes).digest("hex") !== recording.sha256 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 16) !== "WAVEfmt " || bytes.toString("ascii", 36, 40) !== "data" || bytes.readUInt32LE(4) !== bytes.length - 8 || bytes.readUInt32LE(16) !== 16 || bytes.readUInt16LE(20) !== 1 || bytes.readUInt16LE(22) !== 1 || bytes.readUInt32LE(24) !== 16000 || bytes.readUInt32LE(28) !== 32000 || bytes.readUInt16LE(32) !== 2 || bytes.readUInt16LE(34) !== 16 || bytes.readUInt32LE(40) !== bytes.length - 44 || (bytes.length - 44) % 2 || (bytes.length - 44) / 32000 > script.maxSeconds || Math.abs((bytes.length - 44) / 32000 - script.clip.seconds) > .001) fail();
    const slot = slots.find(value => value.audio?.id === script.clip.id);
    if (!slot || slot.text !== script.text || ("reviewed" in slot && slot.reviewed !== true) || slot.audio.provisional !== false || slot.audio.seconds !== script.clip.seconds || slot.audio.url !== `/api/reader?fixtureClip=${script.id}`) fail();
    files.set(path, bytes);
  }
  if (slots.length !== 24 || new Set(slots.map(value => value.audio?.id)).size !== 24 || new Set(manifest.recordings.map(value => value.filename)).size !== 24) fail();
  return { manifest, book, files };
}
