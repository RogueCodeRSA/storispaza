"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { storySchema, type Story } from "@/domain/story";
import { sourceLabel } from "@/domain/provenance";
import { normalizeBrowserAudio } from "./capture-audio";
import "./journey.css";

const DRAFT = "storispaza-live-draft-v1";
type Result<T> = { data: T; assets: { providerId: string; model: string | null }[]; usage: { actualUsd: number | null; tokens: { input: number; output: number } | null } };
async function responseData<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) throw new Error(typeof body.error?.message === "string" ? body.error.message : "The operation failed. Your text is still editable.");
  return body as T;
}

export default function CaptureStudio({ enabled }: { enabled: boolean }) {
  const [idea, setIdea] = useState("");
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("Soweto; specific details will be supplied and reviewed by the creator.");
  const [objective, setObjective] = useState("Cooperation and curiosity");
  const [language, setLanguage] = useState<"en" | "st">("en");
  const [textConsent, setTextConsent] = useState(false);
  const [captureConsent, setCaptureConsent] = useState(false);
  const [audioConsent, setAudioConsent] = useState(false);
  const [saveConsent, setSaveConsent] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [story, setStory] = useState<Story | null>(null);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<Result<unknown>["usage"] | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const objectUrl = useRef("");
  const generation = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
      stream.current?.getTracks().forEach(track => track.stop());
      if (recorder.current?.state === "recording") recorder.current.stop();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);
  function report(text: string, failure = false) { setMessage(failure ? "" : text); setError(failure ? text : ""); }
  function attachAudio(value: Blob) {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(value); setAudioUrl(objectUrl.current); setBlob(value); setTranscript(""); setAudioConsent(false);
  }
  function stopRecording() {
    if (timer.current) clearTimeout(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
    setRecording(false);
  }
  function deleteAudio() {
    generation.current++; stopRecording(); setBlob(null); setAudioUrl(""); setAudioConsent(false);
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = "";
    report("Recording removed from this browser session. Any editable transcript remains until you clear it.");
  }
  async function startRecording() {
    if (!captureConsent) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return report("Microphone capture is unavailable. Upload an English voice note or type your idea.", true);
    const intent = ++generation.current;
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current || intent !== generation.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      const chunks: BlobPart[] = []; let total = 0; let tooLarge = false;
      const active = new MediaRecorder(media); recorder.current = active;
      active.ondataavailable = event => { if (!mounted.current || intent !== generation.current) return; total += event.data.size; if (total > 10 * 1024 * 1024) { tooLarge = true; stopRecording(); } else chunks.push(event.data); };
      active.onstop = () => {
        media.getTracks().forEach(track => track.stop());
        if (mounted.current && intent === generation.current) {
          setRecording(false);
          if (tooLarge) report("Recording exceeded 10 MB. Use a shorter note or manual text.", true);
          else { attachAudio(new Blob(chunks, { type: active.mimeType })); report("Recording held only in this browser session. Review it before transmission."); }
        }
      };
      active.onerror = () => { media.getTracks().forEach(track => track.stop()); if (mounted.current && intent === generation.current) { generation.current++; stopRecording(); report("Recording failed. Your typed idea is unchanged; use manual text or an upload.", true); } };
      active.start(1000); setRecording(true); report("Recording English voice — stops automatically at two minutes.");
      timer.current = setTimeout(stopRecording, 120_000);
    } catch { stream.current?.getTracks().forEach(track => track.stop()); report("Microphone permission was denied or capture failed. Use manual text or upload an English note.", true); }
  }
  async function session() { await responseData(await fetch("/api/capture/session", { method: "POST" })); }
  async function transcribe() {
    if (!blob || !audioConsent || busy || recording) return;
    setBusy(true); report("Transcribing English audio. The server will not retain a recording file.");
    let bytes: Uint8Array | undefined;
    try {
      bytes = await normalizeBrowserAudio(blob);
      await session();
      const result = await responseData<Result<string>>(await fetch("/api/capture/transcribe", { method: "POST", headers: { "Content-Type": "audio/wav", "X-Audio-Consent": "true", "X-Audio-Language": "en" }, body: bytes.buffer as ArrayBuffer }));
      setTranscript(result.data); setUsage(result.usage);
      report("Editable transcript ready. Correct it, then explicitly use it as your story idea. No recording was saved on the server.");
    } catch (e) { report(e instanceof Error ? e.message : "Transcription failed. Use manual text.", true); }
    finally { bytes?.fill(0); setBusy(false); }
  }
  async function generate() {
    if (!textConsent || busy) return;
    setBusy(true); report("Structuring six pages. Your existing draft stays in place until a valid result arrives.");
    try {
      await session();
      const result = await responseData<Result<Story>>(await fetch("/api/capture/story", { method: "POST", headers: { "Content-Type": "application/json", "X-AI-Consent": "true" }, body: JSON.stringify({ idea, title, culturalContext: context, educationalObjective: objective, sourceLanguage: language }) }));
      setStory(storySchema.parse(result.data)); setSelected(0); setUsage(result.usage); setSaveConsent(false);
      report("Six editable pages ready. All text, science and cultural details still need human review.");
    } catch (e) { report(e instanceof Error ? e.message : "Story generation failed. Your input is unchanged.", true); }
    finally { setBusy(false); }
  }
  function editPage(field: "title" | "narrative" | "illustrationDescription" | "learningMoment" | "characterRefs", value: string) {
    setStory(current => {
      if (!current) return current;
      const next = structuredClone(current); const page = next.pages[selected];
      if (field === "characterRefs") page.characterRefs = value.split(",").map(ref => ref.trim());
      else page[field] = value;
      page.assetSources.text.editedByCreator = true;
      page.approvals = { text: false, illustration: false, audio: false };
      if (field === "narrative" && page.translation) page.translation.status = "machine-translated";
      return next;
    });
  }
  function save() {
    if (!saveConsent || !story) return;
    try { localStorage.setItem(DRAFT, JSON.stringify(storySchema.parse(story))); report("Unreviewed story draft saved on this device. No recording or raw transcript was saved with it."); }
    catch { report("Could not save. Complete the page fields and check browser storage availability.", true); }
  }
  function restore() {
    try {
      const saved = localStorage.getItem(DRAFT); if (!saved) return report("No saved live draft on this device.");
      setStory(storySchema.parse(JSON.parse(saved))); setSelected(0); setSaveConsent(false); report("Saved story restored with its asset producers/history.");
    } catch { report("Saved draft is incompatible or storage is blocked. Existing work has not been replaced.", true); }
  }
  const page = story?.pages[selected];
  return <div className="mock-app"><header className="mock-header"><Link className="mock-brand" href="/">Stori<span>Spaza</span> ✦</Link><span className="mock-label">Real story capture · human review required</span></header><main id="main" className="mock-main">
    <div className="stage-heading"><div><p className="kicker">StoriStart</p><h1>Your idea, in six pages.</h1></div><span className="provisional">Unreviewed AI assistance</span></div>
    <p><Link href="/illustrate">StoriCreate: review your brief and character sheet</Link> · Save your current story draft before continuing.</p>
    {!enabled && <p className="notice">Live capture is disabled on the server. You can type and edit an idea here, or <a href="/studio">try the offline mock journey</a>.</p>}
    <div className="editor-grid capture-layout"><section className="edit-card" aria-label="Story idea"><h2>Tell your story</h2><label>Story idea<textarea maxLength={3000} rows={5} value={idea} onChange={e => setIdea(e.target.value)} /></label><div className="form-grid"><label>Optional title<input maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></label><label>Story text language<select value={language} onChange={e => setLanguage(e.target.value as "en" | "st")}><option value="en">English</option><option value="st">Sesotho text — fluent review required</option></select></label></div><label>Creator cultural context<textarea maxLength={3000} rows={3} value={context} onChange={e => setContext(e.target.value)} /></label><label>Educational objective<input maxLength={1000} value={objective} onChange={e => setObjective(e.target.value)} /></label><p className="fine-print">Grade R–3. Use fictional people and avoid personal details. Continue to StoriCreate for reviewed images. Translation and narration require later milestones.</p><label className="check-label"><input type="checkbox" checked={textConsent} onChange={e => setTextConsent(e.target.checked)} />Send this idea and context to the configured AI provider. I will review all output.</label><button className="primary" disabled={!enabled || busy || recording || !textConsent || idea.trim().length < 3 || !context.trim() || !objective.trim()} onClick={() => void generate()}>Create six-page story</button><button className="quiet" disabled={busy} onClick={restore}>Restore saved story</button></section>
    <section className="edit-card" aria-label="English voice capture"><h2>Or speak in English</h2><p>Record or upload a voice note, review the transcript, then choose when to use it. Sesotho input is typed/manual only.</p><label className="check-label"><input type="checkbox" checked={captureConsent} disabled={recording} onChange={e => setCaptureConsent(e.target.checked)} />I consent to temporarily hold an English recording in this browser session.</label><div className="button-row"><button className="secondary" disabled={!enabled || !captureConsent || busy || recording} onClick={() => void startRecording()}>Start English recording</button><button className="secondary" disabled={!recording} onClick={stopRecording}>Stop recording</button></div><label>Upload English voice note (10 MB / 2 min maximum)<input type="file" accept="audio/*" disabled={!enabled || !captureConsent || recording || busy} onChange={e => { const file = e.target.files?.[0]; if (file) { if (file.size > 10 * 1024 * 1024) report("Choose a file smaller than 10 MB.", true); else attachAudio(file); } e.target.value = ""; }} /></label>
    {audioUrl && <><audio src={audioUrl} controls aria-label="Review English recording" /><button className="danger" disabled={busy} onClick={deleteAudio}>Delete recording</button></>}
    <label className="check-label"><input type="checkbox" checked={audioConsent} disabled={!blob || busy} onChange={e => setAudioConsent(e.target.checked)} />Send this audio to the configured AI provider for English transcription. The server does not retain the recording.</label><button className="secondary" disabled={!enabled || !blob || !audioConsent || recording || busy} onClick={() => void transcribe()}>Transcribe English audio</button><label>Editable English transcript<textarea rows={5} maxLength={20000} value={transcript} onChange={e => setTranscript(e.target.value)} /></label><div className="button-row"><button className="secondary" disabled={!transcript.trim() || busy || transcript.length > 3000} onClick={() => { setIdea(transcript); setLanguage("en"); report("Edited transcript copied to your idea. It will not be sent for story generation until you choose Create."); }}>Use edited transcript as idea</button><button className="quiet" onClick={() => setTranscript("")}>Clear transcript</button></div><p className="fine-print">If recording or transcription fails, type your story idea. Audio stays only in memory until you delete it or leave this page. No voice cloning.</p></section></div>
    {story && page && <section className="capture-story" aria-label="Editable generated story"><h2>{story.title}</h2><p className="notice">All six pages are unreviewed. Text source: {sourceLabel(page.assetSources.text)}. Draft assumptions: {story.culturalAssumptions.join("; ") || "No assumptions listed; still review carefully."}</p><nav className="page-tabs" aria-label="Generated story pages">{story.pages.map((p, i) => <button key={p.number} aria-current={i === selected ? "page" : undefined} onClick={() => setSelected(i)}>Page {p.number}</button>)}</nav><div className="edit-card"><label>Page title<input maxLength={200} value={page.title} onChange={e => editPage("title", e.target.value)} /></label><label>Page narrative<textarea rows={6} maxLength={5000} value={page.narrative} onChange={e => editPage("narrative", e.target.value)} /></label><label>Illustration description<textarea rows={3} maxLength={3000} value={page.illustrationDescription} onChange={e => editPage("illustrationDescription", e.target.value)} /></label><label>Character references (comma separated)<input value={page.characterRefs.join(", ")} onChange={e => editPage("characterRefs", e.target.value)} /></label><p className="fine-print">Available characters: {story.characters.map(c => `${c.id}: ${c.description}`).join("; ")}</p><label>Learning moment<textarea rows={2} maxLength={1000} value={page.learningMoment} onChange={e => editPage("learningMoment", e.target.value)} /></label><label className="check-label"><input type="checkbox" checked={saveConsent} onChange={e => setSaveConsent(e.target.checked)} />Save the current unreviewed story draft on this device. No audio or raw transcript is included.</label><button className="primary" disabled={!saveConsent || busy} onClick={save}>Save unreviewed story draft</button><button className="quiet" onClick={() => { try { localStorage.removeItem(DRAFT); report("Saved live story draft deleted. The open draft remains in memory."); } catch { report("Storage could not be cleared. Use browser site-data controls.", true); } }}>Delete saved story draft</button></div></section>}
    {usage && <p className="fine-print">Last operation: {usage.tokens ? `${usage.tokens.input} input / ${usage.tokens.output} output tokens` : "Token count not reported"}; published-rate cost {usage.actualUsd === null ? "unknown; reservation retained" : `US$${usage.actualUsd.toFixed(6)}`}. This is not an independently verified invoice.</p>}
    <p role="status" className="journey-feedback">{message}{busy ? " Please wait; do not submit again." : ""}</p>{error && <p role="alert" className="journey-error">{error}</p>}
  </main></div>;
}
