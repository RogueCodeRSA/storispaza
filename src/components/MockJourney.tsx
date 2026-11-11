"use client";
/* eslint-disable @next/next/no-img-element -- Exact inline approved assets must also open in the standalone reader. */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DRAFT_KEY, demoExportIssues, mockExportJson, mockReaderHtml, newMockDraft,
  normalizeMockDraft, pageText, regenerateMockImage, setMockMetadata, updateMockPage, updateMockTranslation,
  type Acknowledgement, type MockDraft, type PageField,
} from "@/domain/mock-journey";
import { placeholderTone } from "./mock-media";
import { sourceLabel } from "@/domain/provenance";
import { reviewedFixtureImage, reviewedPageImage } from "@/domain/image-pack";
import ReviewStatus from "./ReviewStatus";
import ResponseSpark from "./ResponseSpark";
import "./journey.css";
import "./reader.css";
import type { Story } from "@/domain/story";

const stages = ["StoriStart", "StoriCreate", "StoriSpeak", "StoriPlay", "StoriOwn"];
const subtitles = ["Tell it", "Picture it", "Make it bilingual", "Read together", "Keep your story"];
type Interaction = "idle" | "opening" | "waiting" | "continuation" | "finished";


export function downloadFile(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export default function MockJourney({ seed, onReturn }: { seed?: Story; onReturn?: () => void } = {}) {
  const [draft, setDraft] = useState<MockDraft>(() => newMockDraft(seed));
  const [started, setStarted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(0);
  const [language, setLanguage] = useState<"en" | "st">("en");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [storageConsent, setStorageConsent] = useState(false);
  const [saveConsent, setSaveConsent] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [interaction, setInteraction] = useState<Interaction>("idle");
  const audio = useRef<HTMLAudioElement>(null);
  const audioIntent = useRef(0);
  const phase = useRef<Interaction>("idle");
  const heading = useRef<HTMLHeadingElement>(null);
  const tone = useMemo(() => placeholderTone(), []);
  const page = draft.story.pages[selected];
  const issues = demoExportIssues(draft);

  useEffect(() => { const element = audio.current; return () => { element?.pause(); }; }, []);

  function report(text: string, failure = false) {
    setMessage(failure ? "" : text); setError(failure ? text : "");
  }
  function changePhase(value: Interaction) { phase.current = value; setInteraction(value); }
  function stopAudio() {
    audioIntent.current++;
    if (audio.current) { audio.current.pause(); audio.current.currentTime = 0; }
    setPlaying(false); setElapsed(0); changePhase("idle");
  }
  function move(nextStep: number) {
    stopAudio(); setStep(nextStep); report("");
    requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start" }); });
  }
  function selectPage(index: number) { stopAudio(); setSelected(index); report(""); }
  async function playAudio() {
    if (!audio.current) return;
    const intent = ++audioIntent.current;
    try { await audio.current.play(); if (intent === audioIntent.current) setPlaying(true); }
    catch { if (intent === audioIntent.current) report("Audio could not start. Tap Play again and check your device volume.", true); }
  }
  function pauseAudio() { audioIntent.current++; audio.current?.pause(); setPlaying(false); }
  function onAudioTime() {
    if (!audio.current) return;
    setElapsed(audio.current.currentTime);
    if (phase.current === "opening" && audio.current.currentTime >= 2) { pauseAudio(); changePhase("waiting"); }
  }
  function startInteraction() {
    stopAudio(); changePhase("opening"); report("Listen, then take your turn."); void playAudio();
  }
  function continueInteraction() {
    if (!audio.current) return;
    audio.current.currentTime = Math.max(2, audio.current.currentTime);
    changePhase("continuation"); void playAudio();
  }
  async function loadFixture(voice = false) {
    setBusy(true); report(voice ? "Loading a fixture transcript; no microphone is used." : "Loading the six-page fixture…");
    await new Promise(resolve => setTimeout(resolve, 300));
    const next = newMockDraft(seed);
    next.idea = voice ? "Fixture transcript: a girl from Soweto helps her community with an imaginary power." : draft.idea;
    next.story.title = draft.story.title;
    next.story.culturalContext = draft.story.culturalContext;
    next.story.educationalObjective = draft.story.educationalObjective;
    setDraft(next); setLoaded(true); setBusy(false); setSelected(0);
    report("Six pages ready. Make the words your own.");
  }
  async function regenerate() {
    setBusy(true); report("Replaying the page's image placeholder. No image API is called.");
    await new Promise(resolve => setTimeout(resolve, 250));
    setDraft(current => regenerateMockImage(current, selected)); setBusy(false);
    report(`Page ${selected + 1} preview refreshed. The approved source image is unchanged.`);
  }
  function editPage(field: PageField, value: string) {
    stopAudio(); setDraft(current => updateMockPage(current, selected, field, value));
  }
  function acknowledge(kind: Acknowledgement, checked: boolean) {
    setDraft(current => ({ ...current, acknowledgements: { ...current.acknowledgements,
      [kind]: current.acknowledgements[kind].map((value, i) => i === selected ? checked : value) } }));
  }
  function saveDraft() {
    if (!saveConsent) return report("Confirm saving this provisional draft on this device.", true);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(normalizeMockDraft(draft)));
      report("Provisional draft saved on this device. It is not published or language-approved.");
    } catch { report("Could not save on this device. Complete the fields, or use the JSON export if browser storage is unavailable.", true); }
  }
  function restoreDraft() {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (!stored) return report("No saved demo draft on this device yet.");
      const restored = normalizeMockDraft(JSON.parse(stored));
      stopAudio(); setDraft(restored); setStarted(true); setLoaded(true); setSelected(0); setStep(0);
      setSaveConsent(false); report("Saved provisional draft restored. All language/media remain unreviewed.");
    } catch { report("Saved draft is unavailable or incompatible. It has not replaced your current work.", true); }
  }
  function clearSavedDraft() {
    try { localStorage.removeItem(DRAFT_KEY); report("Saved demo draft removed from this device. The open draft is still in memory."); }
    catch { report("Browser storage could not be cleared. Use the browser's site-data settings.", true); }
  }
  function deleteRecording() {
    stopAudio(); setDraft(current => ({ ...current, recordingCopy: false }));
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...normalizeMockDraft(JSON.parse(stored)), recordingCopy: false }));
      report("Placeholder recording copy deleted from this draft and any saved demo draft. No human voice was recorded.");
    } catch { report("Copy deleted from the open draft. Saved storage could not be updated; delete the saved draft or clear site data.", true); }
  }
  function exportDraft(reader: boolean) {
    try {
      downloadFile(reader ? "storispaza-provisional-reader.html" : "storispaza-provisional-story.json", reader ? mockReaderHtml(draft) : mockExportJson(draft), reader ? "text/html;charset=utf-8" : "application/json");
      report("Provisional demo export prepared. It contains unreviewed text; no recording copy is included.");
    } catch { report("Complete the demo acknowledgements and required fields before exporting.", true); }
  }

  const pageTabs = <nav className="page-tabs" aria-label="Story pages">{draft.story.pages.map((p, i) => <button key={p.number} type="button" aria-current={selected === i ? "page" : undefined} onClick={() => selectPage(i)} disabled={busy}>Page {p.number}</button>)}</nav>;
  const ack = (kind: Acknowledgement, description: string) => <label className="check-label"><input type="checkbox" checked={draft.acknowledgements[kind][selected]} onChange={e => acknowledge(kind, e.target.checked)} />{description} (demo acknowledgement)</label>;
  const reviewedImage = reviewedFixtureImage(page.illustrationAssetId) ?? reviewedPageImage(page.number).dataUrl;
  const image = <figure className="story-symbol story-art">
    {/* Inline data keeps the exact consented image available in the standalone file. */}
    <img src={reviewedImage} width={1024} height={1024} alt={`Story illustration, page ${page.number}: ${page.title}`} />
  </figure>;


  return <div className="mock-app studio-app">
    <a className="mock-skip" href="#main">Skip to story studio</a>
    <header className="mock-header"><span className="mock-brand">Stori<span>Spaza</span> ✦</span>{onReturn && <button className="quiet" aria-label="Return to reviewed story" onClick={onReturn}>Reviewed story</button>}</header>
    <main id="main" className="mock-main">      <ReviewStatus>
        <p>This is an offline mock journey with a fixed story, not live generation. Text and Sesotho slots are provisional / unreviewed; acknowledgements never approve language or culture.</p>
        <p>All six displayed illustrations use the approved, consented M3 image sources. Preview requests create no new pixels and do not replace them. Edited draft associations still require review.</p>
        <p>Audio is a six-second non-speech tone, never narration or pronunciation. No invented phrases, synthetic Sesotho or microphone capture. Creator recordings and wording have independent reviews.</p>
        <p>Page {page.number} sources — Text: {sourceLabel(page.assetSources.text)} · Image: {sourceLabel(page.assetSources.illustration)} · Translation: {sourceLabel(page.assetSources.translation)} · Audio: {sourceLabel(page.assetSources.narration[language])}.</p>
        <p>Earlier sources: {page.assetHistory.map(sourceLabel).join("; ") || "None recorded"}. Final publication remains blocked; exports are marked provisional.</p>
      </ReviewStatus>

      {!started ? <section className="mock-welcome" aria-labelledby="welcome-heading"><div><p className="kicker">Every story has a place</p><h1 id="welcome-heading">Your idea.<br />A story to share.</h1><p className="welcome-intro">Create a six-page illustrated story, review English and Sesotho side by side, then read and respond together.</p><p>You stay in control of the words, pictures and sharing.</p><button className="primary" onClick={() => { setStarted(true); requestAnimationFrame(() => heading.current?.focus()); }}>Start the mock journey</button><button className="quiet" onClick={restoreDraft}>Restore saved demo draft</button></div><div className="welcome-book" aria-hidden="true"><img src={reviewedPageImage(1).dataUrl} width={1024} height={1024} alt="Palesa in Soweto" /><p>The Girl Who Spoke to Electricity</p><span>Six pages · a world of possibility</span></div></section> : <>
        <nav className="stage-tabs" aria-label="Story stages">{stages.map((name, i) => <button key={name} aria-current={step === i ? "step" : undefined} onClick={() => move(i)} disabled={busy || (!loaded && i > 0)}><span>0{i + 1}</span><strong>{name}</strong><small>{subtitles[i]}</small></button>)}</nav>
        <div className="stage-heading"><div><p className="kicker">Step {step + 1} of 5 · {subtitles[step]}</p><h1 ref={heading} tabIndex={-1}>{stages[step]}</h1></div></div>

        {step === 0 && <section aria-label="Capture and edit story">
          <div className="stage-intro"><h2>A small idea is a beginning.</h2><p>Keep the idea close to home, then make the words your own.</p></div>
          {!loaded && <div className="capture-card">
            <label>Your story idea<textarea value={draft.idea} maxLength={3000} onChange={e => setDraft(current => ({ ...current, idea: e.target.value }))} rows={3} /></label>
            <div className="form-grid"><label>Story title<input value={draft.story.title} maxLength={200} onChange={e => setDraft(current => setMockMetadata(current, "title", e.target.value))} /></label><label>Educational objective<input value={draft.story.educationalObjective} maxLength={1000} onChange={e => setDraft(current => setMockMetadata(current, "educationalObjective", e.target.value))} /></label></div>
            <label>Creator-supplied cultural context<textarea value={draft.story.culturalContext} maxLength={3000} onChange={e => setDraft(current => setMockMetadata(current, "culturalContext", e.target.value))} rows={3} /></label>
            <div className="button-row"><button className="primary" disabled={busy || !draft.idea.trim() || !draft.story.title.trim()} onClick={() => void loadFixture()}>Load six-page demo story</button><button className="secondary" disabled={busy} onClick={() => void loadFixture(true)}>Try fixture voice transcript</button></div><p className="fine-print">Fixture voice transcript uses no microphone, recording or speech recognition. Sesotho voice-to-story is not supported.</p>
          </div>}
          {loaded && <>{pageTabs}<div className="editor-grid"><div className="edit-card"><label>Page title<input value={page.title} maxLength={200} onChange={e => editPage("title", e.target.value)} /></label><label>English narrative<textarea value={page.narrative} maxLength={5000} onChange={e => editPage("narrative", e.target.value)} rows={7} /></label><label>Learning moment<textarea value={page.learningMoment} maxLength={1000} onChange={e => editPage("learningMoment", e.target.value)} rows={3} /></label><p className="fine-print">Character reference: {page.characterRefs.join(", ")}. Image references use the creator-confirmed Palesa brief where available; text remains a provisional draft.</p>{ack("text", "I acknowledge this page's provisional English text")}</div>{image}</div></>}
        </section>}
        {step === 1 && <section aria-label="Illustration fixtures"><div className="stage-intro"><h2>Picture the same character, page by page.</h2><p>Reviewed real-generated image fixtures replay offline where available. Edited drafts still require review. Return to an illustration as often as you like, and shape the story around it.</p></div>{pageTabs}<div className="editor-grid">{image}<div className="edit-card"><h3>Page {page.number}: {page.title}</h3><label>Illustration description<textarea value={page.illustrationDescription} maxLength={3000} rows={6} onChange={e => editPage("illustrationDescription", e.target.value)} /></label><p className="fine-print">Style: {draft.story.sharedStyle}</p><p className="fine-print">Cultural assumptions: {draft.story.culturalAssumptions.join(" ")}</p><button className="secondary" onClick={() => void regenerate()} disabled={busy}>Preview illustration</button>{ack("images", "I acknowledge this image source and draft review status")}</div></div></section>}
        {step === 2 && <section aria-label="Translation and narration fixtures"><div className="stage-intro"><h2>Two languages. Room for correction.</h2><p>Sesotho slots are placeholders, not translations. Enter your own text to rehearse review; it stays unreviewed in this mock demo.</p></div>{pageTabs}<div className="editor-grid"><div className="edit-card"><h3>English · page {page.number}</h3><p className="source-text">{page.narrative}</p></div><div className="edit-card"><label>Sesotho text<textarea aria-label="Sesotho text" lang="st" value={page.translation?.text ?? ""} rows={7} maxLength={5000} onChange={e => { stopAudio(); setDraft(current => updateMockTranslation(current, selected, e.target.value)); }} /></label>{ack("translations", "I acknowledge this Sesotho text needs a fluent review")}</div></div></section>}
        {step === 3 && <section aria-label="Interactive reader"><div className="reader-top"><div><h2>{draft.story.title}</h2><p>Page {page.number} of 6 · {page.title}</p></div><div className="language-toggle" role="group" aria-label="Reader language"><button aria-pressed={language === "en"} onClick={() => { stopAudio(); setLanguage("en"); }}>English</button><button aria-pressed={language === "st"} onClick={() => { stopAudio(); setLanguage("st"); }}>Sesotho</button></div></div><div key={`${selected}-${language}`} className="reader-spread page-turn">{image}<div className="reader-copy"><p lang={language} className={`narrative ${playing ? "reading" : ""}`}>{pageText(page, language)}</p><p className="learning"><strong>Think about it:</strong> {page.learningMoment}</p><div className="page-navigation"><button className="secondary" disabled={selected === 0} onClick={() => selectPage(selected - 1)}>Previous page</button><button className="secondary" disabled={selected === 5} onClick={() => selectPage(selected + 1)}>Next page</button></div></div></div>
          <div className="reader-tools"><div className="edit-card"><h3>Listen along</h3><p>Listen, pause, and carry on at your pace.</p><button className="primary" onClick={() => { if (playing) pauseAudio(); else { if (phase.current !== "idle") { stopAudio(); } void playAudio(); } }}>{playing ? "Pause audio sample" : "Play audio sample"}</button><progress aria-label="Audio sample progress" value={elapsed} max={6} /><p className="fine-print">{Math.floor(elapsed)} / 6 seconds</p><button className="quiet" onClick={() => { stopAudio(); void playAudio(); report("Vocabulary pronunciation is pending. This is a placeholder tone, not a spoken word."); }}>Try a sound sample</button></div><div className="edit-card reading-turn"><ResponseSpark state={interaction} /><h3>Call and response</h3><p>Take a turn aloud, then let the story carry on.</p><button className="secondary" onClick={startInteraction}>Start reading turn</button>{interaction === "waiting" && <div className="response-pause"><p>Opening paused. Say your response, then tap to continue. Nothing is recorded.</p><button className="primary" onClick={continueInteraction}>I responded — continue</button></div>}{interaction === "finished" && <p role="status">Call-and-response demo complete.</p>}</div></div>
        </section>}
        {step === 4 && <section aria-label="Ownership and provisional export"><div className="stage-intro"><h2>Your story. Your say.</h2><p>Save a private demo draft or export a visibly unreviewed copy. Final publication remains blocked for provisional fixtures.</p></div><div className="ownership-grid"><div className="edit-card"><h3>Review all six pages</h3><ul className="review-summary">{draft.story.pages.map((p, i) => <li key={p.number}><strong>Page {p.number}</strong><span>Text {draft.acknowledgements.text[i] ? "✓" : "○"} · Image {draft.acknowledgements.images[i] ? "✓" : "○"} · Sesotho {draft.acknowledgements.translations[i] ? "✓" : "○"}</span></li>)}</ul><p className="fine-print">Checks mean demo acknowledgements only. Original image fixtures may be creator-reviewed; edited drafts, English, audio and Sesotho remain provisional / unreviewed.</p><label className="check-label"><input type="checkbox" checked={draft.culturalAcknowledgement} onChange={e => setDraft(current => ({ ...current, culturalAcknowledgement: e.target.checked }))} />I understand these cultural details are draft assumptions awaiting review.</label><label>Visibility<select value={draft.story.visibility} onChange={e => setDraft(current => ({ ...current, story: { ...current.story, visibility: e.target.value as "private" | "shared", sharingConsent: false } }))}><option value="private">Private — this device</option><option value="shared">Shared — manual demo export only</option></select></label>{draft.story.visibility === "shared" && <label className="check-label"><input type="checkbox" checked={draft.story.sharingConsent} onChange={e => setDraft(current => ({ ...current, story: { ...current.story, sharingConsent: e.target.checked } }))} />I consent to distributing an explicitly provisional, unreviewed demo copy.</label>}
          <div className="notice"><strong>Attribution on every page:</strong> Codex-assisted English draft; original image producers labelled per page; placeholders where indicated; Sesotho text awaiting fluent review; non-speech audio placeholder. You retain your contributions; this demo makes no legal ownership determination.</div></div>
          <div><div className="edit-card"><h3>Save and export</h3><label className="check-label"><input type="checkbox" checked={saveConsent} onChange={e => setSaveConsent(e.target.checked)} />Save this provisional draft on this device, including a placeholder recording copy if added.</label><div className="button-stack"><button className="primary" disabled={!saveConsent} onClick={saveDraft}>Save provisional draft</button><button className="secondary" onClick={restoreDraft}>Restore saved demo draft</button><button className="quiet" onClick={clearSavedDraft}>Delete saved demo draft</button></div><h3>Provisional export readiness</h3>{issues.length ? <ul className="issue-list">{issues.map(issue => <li key={issue}>{issue}</li>)}</ul> : <p>Demo acknowledgements complete. Export will still be marked provisional / unreviewed.</p>}<div className="button-stack"><button className="secondary" disabled={!!issues.length} onClick={() => exportDraft(false)}>Export provisional story JSON</button><button className="secondary" disabled={!!issues.length} onClick={() => exportDraft(true)}>Export provisional HTML reader</button></div><p className="fine-print">Exports exclude the recording copy. Nothing is uploaded or publicly published. Copies you distribute cannot be remotely deleted.</p></div>
          <div className="edit-card recording-card"><h3>Recording consent and deletion</h3><p>This tests a deletable copy of the built-in tone. It is not a human voice or microphone recording.</p>{!draft.recordingCopy ? <><label className="check-label"><input type="checkbox" checked={storageConsent} onChange={e => setStorageConsent(e.target.checked)} />Keep a placeholder recording copy in this draft. It is stored on this device only if I save.</label><button className="secondary" disabled={!storageConsent} onClick={() => { setDraft(current => ({ ...current, recordingCopy: true })); report("Placeholder recording copy added to this draft. No microphone used."); }}>Add placeholder recording copy</button><p>No recording copy attached.</p></> : <><p>Placeholder recording copy attached.</p><div className="button-row"><button className="secondary" onClick={() => { stopAudio(); void playAudio(); }}>Play recording placeholder</button><button className="danger" onClick={deleteRecording}>Delete recording copy</button></div></>}</div></div></div>
        </section>}
        <div className="stage-navigation"><button className="quiet" onClick={() => move(Math.max(0, step - 1))} disabled={busy || step === 0}>Back</button><span>{selected + 1}/6 pages</span>{step < 4 && <button className="primary" onClick={() => move(step + 1)} disabled={busy || !loaded}>Continue to {stages[step + 1]}</button>}</div>
      </>}
      <div className="journey-feedback" aria-live="polite" role="status">{busy && <span className="busy-indicator" aria-hidden="true">● </span>}{message}</div>{error && <p className="journey-error" role="alert">{error}</p>}
      <audio ref={audio} src={tone} preload="metadata" onTimeUpdate={onAudioTime} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); if (phase.current === "continuation") changePhase("finished"); }} onError={() => report("Placeholder audio is unavailable in this browser.", true)} />
    </main>
    <footer className="mock-footer">Every Story Has a Place. </footer>
  </div>;
}
