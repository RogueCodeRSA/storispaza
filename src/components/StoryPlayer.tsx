"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Language } from "@/domain/story";
import type { ReaderBook, ReaderText } from "@/domain/reader";
import { useReaderAudio } from "./reader-audio";
import "./journey.css";
import "./reader.css";

type Turn = "idle" | "opening" | "waiting" | "response" | "continuation" | "complete";
export default function StoryPlayer({ mode }: { mode: "mock" | "real" }) {
  const [book, setBook] = useState<ReaderBook | null>(null); const [loaded, setLoaded] = useState(false); const [busy, setBusy] = useState(true);
  const [pageIndex, setPageIndex] = useState(0); const [language, setLanguage] = useState<Language>("en");
  const [turn, setTurn] = useState<Turn>("idle"); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const [brokenImages, setBrokenImages] = useState<string[]>([]);
  const heading = useRef<HTMLHeadingElement | null>(null); const responseButton = useRef<HTMLButtonElement | null>(null);
  const completion = useRef<HTMLParagraphElement | null>(null); const requestNumber = useRef(0);
  const { element: audioElement, phase, track: activeTrack, elapsed, notice, play, pause, stop: stopAudio, seek } = useReaderAudio();
  const page = book?.pages[pageIndex]; const text = page?.text[language]; const narration = text?.audio;
  const phrases = book?.interaction[language];
  const narrationActive = !!narration && activeTrack?.id === narration.id;
  const movingAudio = ["loading", "playing", "buffering"].includes(phase);
  const label = language === "en" ? "English" : "Sesotho";
  const load = useCallback(async (open = false, initialResponse?: Response) => {
    const attempt = ++requestNumber.current;
    stopAudio(); setTurn("idle");
    try {
      if (open) { const session = await fetch("/api/speech/session", { method: "POST" }); if (!session.ok) throw new Error("Could not restore the private session. Keep using the same browser as M4."); }
      const response = initialResponse ?? await fetch("/api/reader", { cache: "no-store" }); const value = await response.json();
      if (!response.ok) throw new Error(value.error?.message ?? "Reader unavailable; your review data is unchanged.");
      if (attempt !== requestNumber.current) return;
      setError(""); setBook(value.book); setLoaded(true); setMessage("Reader refreshed. No review or consent was changed.");
    } catch (error) { if (attempt === requestNumber.current) setError(error instanceof Error ? error.message : "Reader unavailable."); }
    finally { if (attempt === requestNumber.current) setBusy(false); }
  }, [stopAudio]);
  const cancelPending = useCallback(() => { requestNumber.current++; }, []);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/reader", { cache: "no-store", signal: controller.signal }).then(response => {
      if (!controller.signal.aborted) void load(false, response);
    }).catch(() => { if (!controller.signal.aborted) { setBusy(false); setError("Reader unavailable. Refresh when the local connection returns."); } });
    const refresh = () => { if (document.visibilityState === "visible") { setBusy(true); void load(); } };
    document.addEventListener("visibilitychange", refresh);
    return () => { controller.abort(); cancelPending(); document.removeEventListener("visibilitychange", refresh); };
  }, [load, cancelPending]);
  useEffect(() => {
    if (turn === "waiting") responseButton.current?.focus();
    if (turn === "complete") completion.current?.focus();
  }, [turn]);
  useEffect(() => {
    const next = book?.pages[pageIndex + 1]; if (!next) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType ?? "")) return;
    const image = new Image(); image.src = next.imageUrl;
    const nextAudio = next.text[language].audio;
    const preload = nextAudio ? new Audio(nextAudio.url) : null;
    if (preload) { preload.preload = "metadata"; preload.load(); }
    return () => { image.removeAttribute("src"); if (preload) { preload.pause(); preload.removeAttribute("src"); preload.load(); } };
  }, [book, pageIndex, language]);
  function navigate(index: number, nextLanguage = language) {
    stopAudio(); setTurn("idle"); setPageIndex(index); setLanguage(nextLanguage); setMessage(`Page ${index + 1}, ${nextLanguage === "en" ? "English" : "Sesotho"}.`);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function waiting() { setTurn("waiting"); }
  function begin() {
    stopAudio(); setTurn("opening");
    if (phrases?.opening.audio) void play(phrases.opening.audio, `${label} opening`, waiting, waiting);
    else waiting();
  }
  function continueTurn() {
    stopAudio(); setTurn("continuation");
    if (phrases?.continuation.audio) void play(phrases.continuation.audio, `${label} continuation`, () => setTurn("complete"), () => setTurn("complete"));
    else setTurn("complete");
  }
  const phrase = (value: ReaderText | undefined, role: string) => value?.text.trim() ? value.text : `[${role} phrase pending — provisional placeholder]`;
  const phraseReady = phrases && Object.values(phrases).every(value => value.reviewed && value.audio && !value.audio.provisional);
  return <div className="mock-app play-app">
    <header className="mock-header"><Link className="mock-brand" href="/">Stori<span>Spaza</span></Link><span className="mock-label">{mode === "mock" ? "MOCK · provisional reader rehearsal" : "Private StoriPlay · M4 review OPEN"}</span></header>
    <main className="mock-main" id="main"><p className="kicker">StoriPlay · read and respond together</p><h1>A story, at your pace.</h1>
      <p>Read in English or Sesotho. Listen where a current reviewed recording exists, or keep reading with text. No microphone is needed.</p>
      <p><Link href="/speak">Review words and recordings in StoriSpeak</Link> · <Link href="/own">StoriOwn · review and export</Link> · <Link href="/studio">Offline fixture journey</Link></p>
      <div className="button-row"><button className="secondary" disabled={busy} onClick={() => { setBusy(true); void load(true); }}>Open / refresh private reader</button></div>
      <p role="status" aria-live="polite">{busy ? "Loading private reader…" : message}</p>{error && <p role="alert">{error} Text already on screen remains available; refresh when the connection returns.</p>}
      {loaded && !book && <aside className="notice">No M4 workspace is available in this browser session. Use the same Chrome browser as your recordings, restore StoriSpeak, then return here. This reader does not create or approve content.</aside>}
      <audio ref={audioElement} preload="none" aria-label="Reader audio" />
      {book && page && text && <>
        <aside className="notice"><strong>M4 content review remains open.</strong> Saved scripts: {book.scriptsApproved}/24 approved. Current clips: {book.clipsApproved}/24 approved. These counts are existing app state; reading never approves or freezes anything.{book.mode === "mock" && <p>All mock content and audio remain provisional. Demo audio is a non-speech signal, never narration or pronunciation.</p>}</aside>
        <div className="reader-top"><div><h2>{book.title}</h2><p>Page {page.number} of {book.pages.length}</p></div><div className="language-toggle" role="group" aria-label="Reading language">{(["en", "st"] as const).map(code => <button key={code} aria-pressed={language === code} onClick={() => navigate(pageIndex, code)}>{code === "en" ? "English" : "Sesotho"}</button>)}</div></div>
        <nav className="page-tabs" aria-label="Reader pages">{book.pages.map((value, index) => <button className="secondary" key={value.number} aria-current={index === pageIndex ? "page" : undefined} onClick={() => navigate(index)}>Page {value.number}</button>)}</nav>
        <h2 className="reading-heading" tabIndex={-1} ref={heading}>Page {page.number} · {label}</h2>
        <div className="reader-spread"><figure className="play-illustration">
          {!brokenImages.includes(page.imageUrl) ? /* eslint-disable-next-line @next/next/no-img-element */
            <img src={page.imageUrl} width={1024} height={1024} alt={`Story illustration, page ${page.number}: ${page.title}`} fetchPriority="high" onError={() => setBrokenImages(current => [...current, page.imageUrl])} /> : <p>Illustration unavailable. Continue with the story text.</p>}
          <figcaption>{page.imageReviewed ? "Image association reviewed in app" : "Provisional image association — review pending"}</figcaption>
        </figure><div className="reader-copy"><p className="fine-print">English page heading: {page.title}</p>
          <p className="provisional">{text.reviewed ? "Text reviewed in app" : "Provisional text — review pending"} · {!narration ? "Provisional audio — recording pending; text-only page" : narration.provisional ? "Provisional non-speech demo audio" : "Current adult recording reviewed in app"}</p>
          <p lang={text.text.trim() ? language : "en"} className={`narrative ${narrationActive && phase === "playing" ? "reading" : ""}`} aria-label={`Page ${page.number} ${label} text`}>{text.text.trim() ? text.text : "[Sesotho narrative pending — provisional placeholder]"}</p>
          <details><summary>Language and science review notes</summary><ul>{text.flags.map((flag, i) => <li key={i}>{flag}</li>)}</ul></details>
          <div className="page-navigation"><button className="secondary" disabled={pageIndex === 0} onClick={() => navigate(pageIndex - 1)}>Previous page</button><button className="primary" disabled={pageIndex === book.pages.length - 1} onClick={() => navigate(pageIndex + 1)}>Next page</button></div>
        </div></div>
        <section className="capture-card" aria-labelledby="listen-heading"><h2 id="listen-heading">Listen along</h2><p>Page-level read-along highlights the whole passage while playing. No word-timing accuracy is claimed.</p>
          {narration ? <><button className="primary" onClick={() => { setTurn("idle"); if (narrationActive && movingAudio) pause(); else void play(narration, `${label} page ${page.number}`); }}>{narrationActive && movingAudio ? "Pause page audio" : narrationActive && ["paused", "error"].includes(phase) ? "Resume page audio" : "Play page audio"}</button>
            <label>Narration position<input type="range" min={0} max={narration.seconds} step={.1} value={narrationActive ? Math.min(elapsed, narration.seconds) : 0} disabled={!narrationActive} onChange={event => seek(Number(event.target.value))} /></label><p className="fine-print">{Math.floor(narrationActive ? elapsed : 0)} / {Math.ceil(narration.seconds)} seconds</p></> : <p>No current approved narration. Read the text above; there is no audio player to load.</p>}
          <p className="audio-status" role="status" aria-live="polite" aria-atomic="true">{notice}</p>
          <p className="fine-print">Pause keeps your position for this visit. Moving between pages/languages stops playback; returning can resume the same unchanged recording. Next-page image/audio metadata preload when reduced-data settings allow it. No automatic playback or persistent recording download.</p>
        </section>
        <section className="capture-card" aria-labelledby="vocabulary-heading"><h2 id="vocabulary-heading">Reviewed vocabulary · {label}</h2><p>Only approved script items appear. Pronunciation taps become available after their current adult clips are approved.</p><div className="word-buttons">{book.vocabulary[language].filter(word => word.text !== null).map(word => word.audio ? <button className="secondary" key={word.slot} onClick={() => { stopAudio(); setTurn("idle"); void play(word.audio!, `${label} word ${word.text}`); }}>Listen to {word.text}{word.audio.provisional ? " · provisional mock signal" : ""}</button> : <span className="word-pending" key={word.slot} lang={language}>{word.text} · provisional audio, recording pending</span>)}</div><p className="fine-print">{book.vocabulary[language].filter(word => word.text === null).length} vocabulary item(s) awaiting script review; no pronunciation button is supplied for them.</p></section>
        <section className="capture-card" aria-labelledby="turn-heading"><h2 id="turn-heading">Your reading turn</h2><p className="provisional">{phraseReady ? "Creator-reviewed phrases and current recordings" : "Provisional interaction — missing phrase review or recordings"}</p>
          <p>Opening: <span lang={phrases?.opening.text.trim() ? language : "en"}>{phrase(phrases?.opening, "Opening")}</span></p>
          <p>Response: <span lang={phrases?.response.text.trim() ? language : "en"}>{phrase(phrases?.response, "Response")}</span></p>
          <p>Continuation: <span lang={phrases?.continuation.text.trim() ? language : "en"}>{phrase(phrases?.continuation, "Continuation")}</span></p>
          <p className="fine-print">Enter yours at <Link href="/speak#interaction-scripts">StoriSpeak → Open / restore → “Your vocabulary and phrases”</Link>: {language}-opening, {language}-response and {language}-continuation. Save and explicitly review each script, then record/listen/approve its adult clip. Missing phrases here are UI placeholders, not suggested traditional wording.</p>
          <div className="button-row"><button className="secondary" onClick={begin}>Start reading turn</button>
            {(turn === "opening" || turn === "continuation") && <button className="secondary" onClick={() => { stopAudio(); if (turn === "opening") waiting(); else setTurn("complete"); }}>Continue with text only</button>}
            {(turn === "waiting" || turn === "response") && <><button className="primary" ref={responseButton} onClick={continueTurn}>I responded — continue without microphone</button>{phrases?.response.audio && <button className="secondary" onClick={() => { stopAudio(); setTurn("response"); void play(phrases.response.audio!, `${label} response example`, waiting, waiting); }}>Play response example</button>}</>}
          </div>
          {(turn === "waiting" || turn === "response") && <p className="response-pause" role="status">Your turn. Respond aloud if you like, then tap or press Enter on Continue. Nothing is recorded.</p>}
          {turn === "complete" && <p className="response-pause" tabIndex={-1} ref={completion} role="status">Reading turn complete. {phraseReady ? "Continue the story when ready." : "This was a provisional/text-only interaction; M4 content still needs completion."}</p>}
        </section>
      </>}
    </main>
  </div>;
}
