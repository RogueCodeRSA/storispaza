"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Language } from "@/domain/story";
import type { ReaderBook, ReaderText } from "@/domain/reader";
import { useReaderAudio } from "./reader-audio";
import ReviewStatus from "./ReviewStatus";
import ResponseSpark from "./ResponseSpark";
import "./journey.css";
import "./reader.css";

type Turn = "idle" | "opening" | "waiting" | "response" | "continuation" | "complete";
export default function StoryPlayer({ mode }: { mode: "mock" | "real" }) {
  const [book, setBook] = useState<ReaderBook | null>(null); const [loaded, setLoaded] = useState(false); const [busy, setBusy] = useState(true);
  const [pageIndex, setPageIndex] = useState(0); const [language, setLanguage] = useState<Language>("en");
  const [direction, setDirection] = useState("forward");
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
    setDirection(index < pageIndex ? "backward" : "forward");
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
  const phrase = (value: ReaderText | undefined, role: string) => value?.text.trim() ? value.text : `${role} wording is not available yet.`;
  const phraseReady = phrases && Object.values(phrases).every(value => value.reviewed && value.audio && !value.audio.provisional);
  const reviewer = book?.creator && !/pending|demo creator/i.test(book.creator) ? book.creator : "the creator";
  return <div className="mock-app play-app reading-room">
    <header className="mock-header"><Link className="mock-brand" href="/">Stori<span>Spaza</span></Link><nav aria-label="Story links"><Link href="/studio">Create your own</Link><Link href="/own">Keep this story</Link></nav></header>
    <main className="mock-main" id="main"><div className="reading-intro"><p className="kicker">Read · wonder · respond</p><h1>{book?.title ?? "A story, at your pace."}</h1></div>
      <p className="sr-only" role="status" aria-live="polite">{busy ? "Loading story…" : message}</p>{error && <p role="alert">{error} Text already on screen remains available; refresh when the connection returns.</p>}
      <ReviewStatus badge={page?.text.st.reviewed ? `Sesotho reviewed by ${reviewer}` : "Language review pending"}>
        <p>{(book?.mode ?? mode) === "mock" ? "Mock preview: fixed story, no live generation. Any demo audio is a non-speech signal, never narration or pronunciation." : "Private read-only edition. Reading changes no approvals or consent."}</p>
        <p>M4 content review remains open. Saved scripts: {book?.scriptsApproved ?? 0}/24 approved. Current clips: {book?.clipsApproved ?? 0}/24 approved.</p>
        <p>{text?.reviewed ? "Current text reviewed in app." : "Provisional text — review pending."} {page?.imageReviewed ? "Image association reviewed in app." : "Approved M3 source illustration; the current draft association needs review."}</p>
        <p>{!narration ? "Provisional audio — recording pending; text-only page." : narration.provisional ? "Provisional non-speech demo audio." : "Current adult recording reviewed in app."}</p>
        <p>{phraseReady ? "Creator-reviewed phrases and current recordings." : "Provisional interaction — missing phrase review or recordings."}</p>
        <ul>{text?.flags.map((flag, i) => <li key={i}>{flag}</li>)}</ul>
        <p>Enter wording at <Link href="/speak#interaction-scripts">StoriSpeak → Open / restore → “Your vocabulary and phrases”</Link>: {language}-opening, {language}-response and {language}-continuation. Save and explicitly review each script, then record/listen/approve its adult clip. Missing wording is never invented.</p>
        <p><Link href="/speak">Review words and recordings</Link> · <Link href="/studio">Offline fixture journey</Link></p><button className="secondary" disabled={busy} onClick={() => { setBusy(true); void load(true); }}>Open / refresh private reader</button>
      </ReviewStatus>
      {loaded && !book && <aside className="notice">Open your story in StoriSpeak using the same browser as your recordings, then refresh here.</aside>}
      <audio ref={audioElement} preload="none" aria-label="Reader audio" />
      {book && page && text && <>
        <div className="reader-top"><nav className="reader-progress" aria-label="Reader pages">{book.pages.map((value, index) => <button className="secondary" key={value.number} aria-label={`Page ${value.number}`} aria-current={index === pageIndex ? "page" : undefined} onClick={() => navigate(index)}><span aria-hidden="true" /></button>)}<span className="page-count">{page.number} / {book.pages.length}</span></nav><div className="language-toggle" role="group" aria-label="Reading language">{(["en", "st"] as const).map(code => <button key={code} aria-pressed={language === code} onClick={() => navigate(pageIndex, code)}>{code === "en" ? "English" : "Sesotho"}</button>)}</div></div>
        <h2 className="reading-heading" tabIndex={-1} ref={heading}>Page {page.number} · {label}</h2>
        <div key={`${page.number}-${language}`} className="reader-spread page-turn" data-turn={direction}><figure className="play-illustration">
          {!brokenImages.includes(page.imageUrl) ? /* eslint-disable-next-line @next/next/no-img-element */
            <img src={page.imageUrl} width={1024} height={1024} alt={`Story illustration, page ${page.number}: ${page.title}`} fetchPriority="high" onError={() => setBrokenImages(current => [...current, page.imageUrl])} /> : <p>Illustration unavailable. Continue with the story text.</p>}
        </figure><div className="reader-copy"><p className="kicker">Chapter {page.number}</p><h2>{page.title}</h2>
          <p lang={text.text.trim() ? language : "en"} className={`narrative ${narrationActive && phase === "playing" ? "reading" : ""}`} aria-label={`Page ${page.number} ${label} text`}>{text.text.trim() ? text.text : "Sesotho text will appear here after the creator adds it."}</p>
          <div className="page-navigation"><button className="secondary" disabled={pageIndex === 0} onClick={() => navigate(pageIndex - 1)}>Previous page</button><button className="primary" disabled={pageIndex === book.pages.length - 1} onClick={() => navigate(pageIndex + 1)}>Next page</button></div>
        </div></div>
        <div className="reader-extras"><section className="capture-card" aria-labelledby="listen-heading"><h2 id="listen-heading">Listen along</h2>
          {narration ? <><button className="primary" onClick={() => { setTurn("idle"); if (narrationActive && movingAudio) pause(); else void play(narration, `${label} page ${page.number}`); }}>{narrationActive && movingAudio ? narration.provisional ? "Pause audio sample" : "Pause page audio" : narrationActive && ["paused", "error"].includes(phase) ? narration.provisional ? "Resume audio sample" : "Resume page audio" : narration.provisional ? "Play audio sample" : "Play page audio"}</button>
            <label>Narration position<input type="range" min={0} max={narration.seconds} step={.1} value={narrationActive ? Math.min(elapsed, narration.seconds) : 0} disabled={!narrationActive} onChange={event => seek(Number(event.target.value))} /></label><p className="fine-print">{Math.floor(narrationActive ? elapsed : 0)} / {Math.ceil(narration.seconds)} seconds</p></> : <p>Read aloud together. Audio will appear here when a recording is ready.</p>}
          <p className="audio-status" role="status" aria-live="polite" aria-atomic="true">{notice}</p>
        </section>
        <section className="capture-card" aria-labelledby="vocabulary-heading"><h2 id="vocabulary-heading">Words to explore · {label}</h2><div className="word-buttons">{book.vocabulary[language].filter(word => word.text !== null).map(word => word.audio ? <button className="secondary" key={word.slot} onClick={() => { stopAudio(); setTurn("idle"); void play(word.audio!, `${label} word ${word.text}`); }}>Listen to {word.text}</button> : <span className="word-pending" key={word.slot} lang={language}>{word.text} · read aloud together</span>)}</div>{book.vocabulary[language].every(word => word.text === null) && <p>Words will appear here when they are ready.</p>}</section></div>
        <section className="capture-card reading-turn" aria-labelledby="turn-heading"><ResponseSpark state={turn} /><h2 id="turn-heading">Your reading turn</h2><p>Listen. Join in. Let the story carry on.</p>
          {phrases && Object.values(phrases).some(value => value.text.trim()) ? <>
            <p>Opening: <span lang={phrases.opening.text.trim() ? language : "en"}>{phrase(phrases.opening, "Opening")}</span></p>
            <p>Response: <span lang={phrases.response.text.trim() ? language : "en"}>{phrase(phrases.response, "Response")}</span></p>
            <p>Continuation: <span lang={phrases.continuation.text.trim() ? language : "en"}>{phrase(phrases.continuation, "Continuation")}</span></p>
          </> : <p>Take a turn aloud, then let the story carry on.</p>}
          <div className="button-row"><button className="secondary" onClick={begin}>Start reading turn</button>
            {(turn === "opening" || turn === "continuation") && <button className="secondary" onClick={() => { stopAudio(); if (turn === "opening") waiting(); else setTurn("complete"); }}>Continue with text only</button>}
            {(turn === "waiting" || turn === "response") && <><button className="primary" ref={responseButton} onClick={continueTurn}>I responded — continue without microphone</button>{phrases?.response.audio && <button className="secondary" onClick={() => { stopAudio(); setTurn("response"); void play(phrases.response.audio!, `${label} response example`, waiting, waiting); }}>Play response example</button>}</>}
          </div>
          {(turn === "waiting" || turn === "response") && <p className="response-pause" role="status">Your turn. Respond aloud if you like, then tap or press Enter on Continue. Nothing is recorded.</p>}
          {turn === "complete" && <p className="response-pause" tabIndex={-1} ref={completion} role="status">Reading turn complete. Continue the story when ready.</p>}
        </section>
      </>}
    </main>
  </div>;
}
