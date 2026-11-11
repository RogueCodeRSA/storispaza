"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SpeechProject, SpeechScript } from "@/domain/speech";
import { sourceLabel } from "@/domain/provenance";
import { reviewedFixtureImage } from "@/domain/image-pack";
import { normalizeBrowserAudio } from "./capture-audio";
import "./journey.css";

type Status = { project: SpeechProject | null; freezeIssues: string[] };
function download(filename: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function SpeechStudio({ mode }: { mode: "mock" | "real" }) {
  const [status, setStatus] = useState<Status | null>(null); const [selected, setSelected] = useState(1); const [slotId, setSlotId] = useState("en-page-01");
  const [edits, setEdits] = useState<Record<string, string>>({}); const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [storageConsent, setStorageConsent] = useState(false); const [transmissionConsent, setTransmissionConsent] = useState(false); const [adult, setAdult] = useState(false);
  const [freezeConfirmed, setFreezeConfirmed] = useState(false); const [redistribution, setRedistribution] = useState(false); const [shareCorrections, setShareCorrections] = useState(false);
  const [busy, setBusy] = useState(false); const [recording, setRecording] = useState(false); const [listened, setListened] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const [recovery, setRecovery] = useState<{ blob: Blob; url: string; slot: string; version: number } | null>(null);
  const project = status?.project; const slot = project?.scripts.find(script => script.id === slotId);
  const hasUnsavedEdits = project?.scripts.some(script => edits[script.id] !== undefined && edits[script.id] !== script.text) ?? false;
  const slotDirty = !!slot && edits[slot.id] !== undefined && edits[slot.id] !== slot.text;
  const clipApprovalProblems = slot?.clip ? [!adult ? "Confirm the adult-own-voice checkbox." : null, slot.status !== "approved" ? "Approve this script first." : null, slotDirty ? "Save or discard the unsaved script edit." : null, slot.clip.scriptVersion !== slot.version ? "The script changed; record a new clip for its current version." : null, listened !== slot.clip.id ? "Listen to the whole current clip and tick the listening confirmation below." : null].filter(Boolean) : [];
  const recorder = useRef<MediaRecorder | null>(null); const stream = useRef<MediaStream | null>(null); const timer = useRef<ReturnType<typeof setTimeout> | null>(null); const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; if (timer.current) clearTimeout(timer.current); if (recorder.current?.state === "recording") recorder.current.stop(); stream.current?.getTracks().forEach(track => track.stop()); }; }, []);
  useEffect(() => () => { if (recovery) URL.revokeObjectURL(recovery.url); }, [recovery]);
  async function api(body?: unknown, path = "/api/speech", headers?: Record<string, string>) {
    const response = await fetch(path, body instanceof Uint8Array ? { method: "POST", headers, body: body.slice().buffer as ArrayBuffer } : body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
    const value = await response.json(); if (!response.ok) throw new Error(value.error?.message ?? "The operation failed. Your scripts remain editable."); return value;
  }
  function apply(value: Status) { setStatus(value); setFreezeConfirmed(false); setRedistribution(false); }
  async function run(work: () => Promise<void>) { setBusy(true); setMessage(""); setError(""); try { await work(); } catch (error) { setError(error instanceof Error ? error.message : "Operation failed."); try { apply(await api()); } catch { /* Keep open edits if offline. */ } } finally { setBusy(false); } }
  async function open() {
    const session = await fetch("/api/speech/session", { method: "POST" }); if (!session.ok) throw new Error("The local review session could not start.");
    let value = await api(); if (!value.project) value = await api({ action: "start", storageConsent }); apply(value); setEdits({}); setChecks({});
  }
  async function command(action: string, extra = {}) { if (project) apply(await api({ action, revision: project.revision, ...extra })); }
  async function save(script: SpeechScript) { await command("edit", { slot: script.id, text: edits[script.id] ?? script.text }); setEdits(current => { const next = { ...current }; delete next[script.id]; return next; }); setChecks(current => ({ ...current, [script.id]: false, ...(script.kind === "page" && script.language === "en" ? { [`st-page-0${script.page}`]: false } : {}) })); }
  async function upload(blob: Blob, expected?: { slot: string; version: number }) {
    if (!project || !slot || !storageConsent || !adult || slot.status !== "approved") throw new Error("Approve the exact script and confirm adult voice/storage consent first.");
    if (expected && (expected.slot !== slot.id || expected.version !== slot.version)) throw new Error("The recovery belongs to another script version. Download it, or select its unchanged approved script; do not relabel it.");
    if (!blob.size || blob.size > 10 * 1024 * 1024) throw new Error("Choose a nonempty clip smaller than 10 MB.");
    setRecovery({ blob, url: URL.createObjectURL(blob), slot: slot.id, version: slot.version });
    const bytes = await normalizeBrowserAudio(blob);
    try {
      apply(await api(bytes, `/api/speech?slot=${encodeURIComponent(slot.id)}&revision=${project.revision}&version=${slot.version}`, { "Content-Type": "audio/wav", "x-adult-own-voice": "true", "x-storage-consent": "true" })); setRecovery(null); setListened(""); setMessage("Adult recording stored privately, unapproved. Listen fully and confirm it matches the script.");
    } finally { bytes.fill(0); }
  }
  function stop() { if (timer.current) clearTimeout(timer.current); if (recorder.current?.state === "recording") recorder.current.stop(); stream.current?.getTracks().forEach(track => track.stop()); setRecording(false); }
  async function record() {
    if (!slot || !storageConsent || !adult || slot.status !== "approved") return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error("Microphone unavailable. Upload your own adult recording instead.");
    const media = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!mounted.current) { media.getTracks().forEach(track => track.stop()); return; }
    stream.current = media; const chunks: BlobPart[] = []; let total = 0; let tooLarge = false;
    const active = new MediaRecorder(media); recorder.current = active;
    active.ondataavailable = event => { total += event.data.size; if (total > 10 * 1024 * 1024) { tooLarge = true; stop(); } else chunks.push(event.data); };
    active.onstop = () => {
      media.getTracks().forEach(track => track.stop()); if (timer.current) clearTimeout(timer.current);
      const clean = () => { chunks.length = 0; active.ondataavailable = null; active.onstop = null; if (recorder.current === active) recorder.current = null; if (stream.current === media) stream.current = null; };
      if (!mounted.current) { clean(); return; }
      setRecording(false);
      if (tooLarge) { setError("Recording exceeded 10 MB; use a shorter clip."); clean(); }
      else void run(async () => { try { await upload(new Blob(chunks, { type: active.mimeType })); } finally { clean(); } });
    };
    active.start(); setRecording(true); timer.current = setTimeout(stop, Math.max(1, slot.maxSeconds - 1) * 1000);
  }
  function editor(script: SpeechScript) {
    const value = edits[script.id] ?? script.text; const dirty = value !== script.text;
    return <article className="edit-card" key={script.id}><h3>{script.language === "en" ? "English" : "Sesotho"} · {script.id}.wav</h3><p className="provisional">{mode === "mock" && script.status === "approved" ? "Mock acknowledgement only" : script.status === "approved" ? "Explicitly approved in app" : `${script.status} — UNREVIEWED`}</p>
      <p className="fine-print">Source: {sourceLabel(script.source)} · v{script.version} · max {script.maxSeconds} seconds</p>
      <label>{script.id} script<textarea rows={script.kind === "page" ? 7 : 2} lang={script.language} value={value} maxLength={5000} disabled={busy || recording} onChange={event => { setEdits(current => ({ ...current, [script.id]: event.target.value })); setChecks(current => ({ ...current, [script.id]: false })); }} /></label>
      <button className="secondary" disabled={busy || recording || !dirty} onClick={() => void run(() => save(script))}>Save {script.id} correction</button>
      <details open={script.language === "st" && script.kind === "page"}><summary>Uncertain terms / meaning / science to check</summary><ul>{script.flags.map((flag, i) => <li key={i}>{flag}</li>)}</ul></details>
      <label className="check-label"><input type="checkbox" checked={checks[script.id] ?? false} disabled={busy || recording} onChange={event => setChecks(current => ({ ...current, [script.id]: event.target.checked }))} />I reviewed this exact script, uncertain terms, age suitability and electrical safety{script.language === "en" && script.kind === "page" ? "; the existing image matches this narrative" : ""}.</label>
      <button className="primary" disabled={busy || recording || dirty || !value.trim() || !checks[script.id] || script.status === "approved"} onClick={() => void run(() => command("approve-script", { slot: script.id, version: script.version, uncertaintiesReviewed: true, imageMatches: script.language === "en" && script.kind === "page" }))}>{mode === "mock" ? `Acknowledge ${script.id} rehearsal` : `Approve ${script.id} script`}</button>
    </article>;
  }
  return <div className="mock-app"><header className="mock-header"><Link className="mock-brand" href="/">Stori<span>Spaza</span></Link><span className="mock-label">{mode === "real" ? "Private review · explicit approvals" : "MOCK rehearsal · no real language approval"}</span></header><main className="mock-main" id="main">
    <p className="kicker">StoriSpeak</p><h1>Your words. Your voice.</h1><p>Review each English narrative and Sesotho draft. Supply your exact words and interaction phrases. Record only your own consenting adult voice. No synthetic Sesotho, cloning or child recordings.</p>
    <p><Link href="/illustrate">Illustrations</Link> · <Link href="/studio">Offline demo</Link></p><p role="status">{busy ? "Working; no automatic retry or fallback." : message}</p>{error && <p role="alert">{error}</p>}
    <label className="check-label"><input type="checkbox" checked={storageConsent} disabled={recording} onChange={event => setStorageConsent(event.target.checked)} />I consent to unencrypted local storage of scripts, correction history and my adult recordings. No recordings are sent to an AI provider.</label>
    <p className="fine-print">Keep using the same browser for this private workspace. A different browser opens a separate workspace and will not show these recordings.</p>
    <button className="primary" disabled={busy || recording || !!recovery || !storageConsent} onClick={() => void run(open)}>Open / restore StoriSpeak review</button>
    {project && <>
      <p>Source English is the existing Codex-authored draft, not paid API story output. Images retain their M3 producers; all M4 pages, scripts and recordings need explicit in-app review.</p>
      {project.usage && <p>Translation draft usage: {project.usage.tokens ? `${project.usage.tokens.input} input / ${project.usage.tokens.output} output tokens` : "not reported"}; published-rate cost {project.usage.actualUsd === null ? "unknown; reservation retained" : `US$${project.usage.actualUsd.toFixed(6)}`} (not an invoice).</p>}
      {!project.translated && <section className="capture-card"><h2>Draft Sesotho narratives</h2><p>{mode === "mock" ? "Mock returns labelled placeholders, never a genuine Sesotho translation." : "One bounded request drafts all six narratives with per-page uncertainty notes; review one page at a time below. Existing corrections are never silently replaced."}</p><label className="check-label"><input type="checkbox" checked={transmissionConsent} onChange={event => setTransmissionConsent(event.target.checked)} />Send these six English narratives to the configured provider for unapproved Sesotho drafts.</label><button className="secondary" disabled={busy || recording || !transmissionConsent || project.translationAttempted} onClick={() => void run(() => command("translate", { transmissionConsent: true }))}>Draft six Sesotho narratives</button></section>}
      <div className="button-row"><button className="secondary" disabled={busy || recording} onClick={() => void run(async () => download("m4-recording-list.json", await api(undefined, "/api/speech?checklist=1")))}>Download exact 24-clip list</button><button className="secondary" disabled={busy || recording} onClick={() => void run(async () => download("m4-corrections-private.json", await api(undefined, "/api/speech?corrections=1")))}>Download private before/after record</button></div>
      <details><summary>Review page {selected} image association</summary><p>{project.story.pages[selected - 1].title}</p>
        {/* Reviewed local fixture bytes; no public/private optimizer URL. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="character-preview" src={reviewedFixtureImage(project.story.pages[selected - 1].illustrationAssetId) ?? undefined} alt={`Reviewed illustration for page ${selected}; confirm it matches the current text`} />
      </details>
      <section className="stage-intro"><h2>1 · Review page by page</h2><nav className="page-tabs" aria-label="Translation pages">{[1, 2, 3, 4, 5, 6].map(page => <button className="secondary" key={page} disabled={busy || recording} aria-current={selected === page ? "page" : undefined} onClick={() => setSelected(page)}>Page {page}</button>)}</nav><div className="editor-grid">{project.scripts.filter(script => script.kind === "page" && script.page === selected).map(editor)}</div></section>
      <section><h2>2 · Your vocabulary and phrases</h2><p>English concepts selected: light, story, electricity. Supply your exact Sesotho wording. All opening, response and continuation fields start blank; no traditional wording is inferred.</p><div className="illustration-contact">{project.scripts.filter(script => script.kind !== "page").map(editor)}</div></section>
      <section className="capture-card"><h2>3 · Record and review 24 clips</h2><label>Recording filename<select value={slotId} disabled={busy || recording} onChange={event => { setSlotId(event.target.value); setListened(""); }}>{project.scripts.map(script => <option key={script.id} value={script.id}>{script.id}.wav · {script.maxSeconds}s max · {script.status} · {script.clip?.approved && script.clip.scriptVersion === script.version ? "clip approved" : script.clip ? "clip needs review" : "no clip"}</option>)}</select></label>
        {recovery && <aside className="notice"><h3>Recovery draft retained in this browser</h3><p>{recovery.slot}, script v{recovery.version}. Storage failed; this is the original browser file, not an approved clip. Download or discard it before replacing it. Closing this page loses the recovery copy.</p><audio controls src={recovery.url} aria-label="Unapproved recovery recording" /><a className="text-link" href={recovery.url} download={`${recovery.slot}-recovery.${recovery.blob.type.includes("webm") ? "webm" : recovery.blob.type.includes("wav") ? "wav" : "audio"}`}>Download original recovery</a><button className="secondary" disabled={busy || recording || slotDirty || !adult || !storageConsent || slot?.id !== recovery.slot || slot?.version !== recovery.version || slot?.status !== "approved"} onClick={() => void run(() => upload(recovery.blob, recovery))}>Retry stored recovery draft</button><button className="danger" disabled={busy || recording} onClick={() => setRecovery(null)}>Discard browser recovery draft</button></aside>}
        {slot && <><p className="source-text" lang={slot.language}>{slot.text || "Script pending: enter and approve the exact wording first."}</p><p>Cover this script only. Maximum {slot.maxSeconds} seconds. Narration excludes headings and sidebars. Approval does not verify matching speech automatically; you must listen.</p>
          <label className="check-label"><input type="checkbox" checked={adult} disabled={recording} onChange={event => setAdult(event.target.checked)} />This is my own adult voice. No child voice, cloning or synthetic speech.</label>
          <button className="primary" disabled={busy || recording || !!recovery || !adult || !storageConsent || slot.status !== "approved" || (edits[slot.id] !== undefined && edits[slot.id] !== slot.text)} onClick={() => void run(record)}>Record and store adult draft</button><button className="secondary" disabled={!recording} onClick={stop}>Stop adult recording</button>
          <label>Upload own adult recording<input type="file" accept="audio/*" disabled={busy || recording || !!recovery || !adult || !storageConsent || slotDirty || slot.status !== "approved"} onChange={event => { const file = event.target.files?.[0]; if (file) void run(() => upload(file)); event.target.value = ""; }} /></label>
          {slot.clip && <><p className="provisional">{slot.clip.approved ? (mode === "real" ? "Clip explicitly approved" : "Mock acknowledgement") : "Recording UNREVIEWED"} · {slot.clip.seconds.toFixed(2)} seconds{slot.clip.scriptVersion !== slot.version ? " · STALE SCRIPT: re-record" : ""}</p><audio key={slot.clip.id} controls preload="none" src={`/api/speech?clip=${slot.clip.id}`} onEnded={() => setListened(slot.clip!.id)} aria-label="Review own adult recording" /><label className="check-label"><input type="checkbox" checked={listened === slot.clip.id} disabled={busy || recording} onChange={event => setListened(event.target.checked ? slot.clip!.id : "")} />I listened to this whole current clip and it matches the script.</label>{!slot.clip.approved && clipApprovalProblems.length > 0 && <ul aria-label="Before clip approval">{clipApprovalProblems.map(reason => <li key={reason}>{reason}</li>)}</ul>}<div className="button-row"><button className="primary" disabled={busy || recording || slotDirty || !adult || listened !== slot.clip.id || slot.clip.scriptVersion !== slot.version || slot.clip.approved || slot.status !== "approved"} onClick={() => void run(() => command("approve-clip", { slot: slot.id, clipId: slot.clip!.id, listenedAndMatchesScript: true, adultOwnVoice: true }))}>{mode === "real" ? "Approve listened clip against current script" : "Acknowledge mock clip"}</button><button className="danger" disabled={busy || recording} onClick={() => void run(() => command("delete-clip", { slot: slot.id }))}>Delete this stored recording</button></div></>}
        </>}
      </section>
      <section className="capture-card"><h2>4 · Freeze only after every review</h2><p>Scripts approved: {project.scripts.filter(script => script.status === "approved").length}/24. Current clips approved: {project.scripts.filter(script => script.clip?.approved && script.clip.scriptVersion === script.version).length}/24.</p><details><summary>Remaining review requirements ({status.freezeIssues.length})</summary><ul>{status.freezeIssues.map(issue => <li key={issue}>{issue}</li>)}</ul></details>
        <label className="check-label"><input type="checkbox" checked={freezeConfirmed} onChange={event => setFreezeConfirmed(event.target.checked)} />I confirm every current English/Sesotho page, image association, vocabulary/phrase script and all 24 listened adult clips.</label>
        <label className="check-label"><input type="checkbox" checked={redistribution} onChange={event => setRedistribution(event.target.checked)} />I consent to redistributing the reviewed text and my adult recordings in the fixture pack.</label>
        <label className="check-label"><input type="checkbox" checked={shareCorrections} onChange={event => setShareCorrections(event.target.checked)} />Include my before/after corrections in the redistributable pitch evidence (optional; otherwise private).</label>
        <button className="primary" disabled={busy || recording || !!recovery || hasUnsavedEdits || !adult || !freezeConfirmed || !redistribution || !!status.freezeIssues.length} onClick={() => void run(async () => { await command("freeze", { everyPageAndClipConfirmed: true, adultOwnVoice: true, redistributionConsent: true, includeCorrections: shareCorrections }); setMessage("Reviewed pack frozen privately. Export is now available; nothing was published or committed automatically."); })}>Freeze reviewed current pack</button>
        <button className="secondary" disabled={busy || recording || !!recovery || hasUnsavedEdits || !project.frozen} onClick={() => void run(async () => download("storispaza-reviewed-speech.json", await api(undefined, "/api/speech?fixture=1")))}>Download consented reviewed fixture pack</button>
      </section>
      <details><summary>Private correction history ({project.corrections.length})</summary>{project.corrections.map(correction => <article key={correction.id}><h3>{correction.slot} · {new Date(correction.at).toLocaleString()}</h3><p>Before: {correction.before || "[blank]"}</p><p>After: {correction.after || "[blank]"}</p></article>)}</details>
      <button className="danger" disabled={busy || recording || !!recovery} onClick={() => void run(() => command("delete"))}>Delete private StoriSpeak workspace and recordings</button>
    </>}
  </main></div>;
}
