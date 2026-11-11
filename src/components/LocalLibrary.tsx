"use client";
/* eslint-disable @next/next/no-img-element -- Approved inline image also works in the offline file. */
import { useEffect, useState } from "react";
import type { ReaderBook } from "@/domain/reader";
import type { Story } from "@/domain/story";
import { type MockDraft } from "@/domain/mock-journey";
import { LIBRARY_KEY, exampleStories, libraryCopy, readLibrary, type LibraryStory } from "@/domain/library";
import { reviewedPageImage } from "@/domain/image-pack";
import MockJourney from "./MockJourney";
import StoryPlayer from "./StoryPlayer";
import "./library.css";

export default function LocalLibrary({ book, story, startInReader = false }: { book: ReaderBook; story: Story; startInReader?: boolean }) {
  const [view, setView] = useState<"library" | "demo" | "create" | LibraryStory>(startInReader ? "demo" : "library");
  const [saved, setSaved] = useState<LibraryStory[]>([]); const [ready, setReady] = useState(false);
  const [message, setMessage] = useState(""); const [page, setPage] = useState(0);
  useEffect(() => {
    const refresh = () => { try { setSaved(readLibrary(localStorage.getItem(LIBRARY_KEY))); setReady(true); } catch { setSaved([]); setReady(false); setMessage("Library storage is unavailable or invalid. Existing data was not overwritten. Built-in stories remain available."); } };
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener("storage", refresh);
    return () => { clearTimeout(timer); window.removeEventListener("storage", refresh); };
  }, []);
  function save(draft: MockDraft, consent: boolean) {
    if (!ready) throw new Error("Library storage is unavailable; use the existing draft save/export controls.");
    const next = [...readLibrary(localStorage.getItem(LIBRARY_KEY)), libraryCopy(draft, consent, crypto.randomUUID())];
    if (next.length > 10) throw new Error("This small library holds ten local stories. Remove a card first.");
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(next)); setSaved(next); setView("library"); setMessage("Story saved on this device as unreviewed. No publication approval or public URL was created.");
  }
  function remove(id: string) {
    try { const next = readLibrary(localStorage.getItem(LIBRARY_KEY)).filter(value => value.id !== id); localStorage.setItem(LIBRARY_KEY, JSON.stringify(next)); setSaved(next); setView("library"); setMessage("Local library copy removed. Other saved drafts and exported copies are unchanged."); }
    catch { setMessage("Could not remove the story. Stored data is unchanged."); }
  }
  if (view === "demo") return <StoryPlayer mode="real" initialBook={book} onCreateCopy={() => setView("create")} onLibrary={() => setView("library")} />;
  if (view === "create") return <MockJourney seed={story} onReturn={() => setView("demo")} onLibrary={() => setView("library")} onSaveToLibrary={save} />;
  const open = (value: LibraryStory) => { setPage(0); setView(value); };
  return <div className="mock-app library-app"><header className="mock-header"><span className="mock-brand">Stori<span>Spaza</span></span><nav aria-label="Library navigation"><button className="secondary" onClick={() => setView("library")}>Library</button><button className="primary" onClick={() => setView("create")}>Add your story</button></nav></header><main id="main" className="mock-main">
    <p role="status" aria-live="polite">{message}</p>
    {view === "library" ? <><p className="kicker">Stories on this device</p><h1>Your local library</h1><p>Read together. New stories stay private until you explicitly consent to a local library copy. No accounts, uploads or public links.</p><div className="library-grid">
      <button className="library-card" onClick={() => setView("demo")}><img src={reviewedPageImage(1).dataUrl} width="1024" height="1024" alt="" /><span className="library-card-copy"><strong>{book.title}</strong><span>English · Sesotho</span><span>Creator credit: {/pending|demo creator/i.test(book.creator) ? "the consenting creator (name pending)" : book.creator}</span><small>Reviewed fixture · redistribution consent saved</small></span></button>
      {[...exampleStories, ...saved].filter(value => value.sharingConsent === true).map((value, index) => <button className={`library-card colour-${index % 2}`} key={value.id} onClick={() => open(value)}><span className="library-colour-cover" aria-hidden="true">{value.title}</span><span className="library-card-copy"><strong>{value.title}</strong><span>English{value.pages.some(page => page.st) ? " · Sesotho (unreviewed)" : " only"}</span><span>Creator credit: {value.creator}</span><small>{value.example ? "Example · unreviewed · not a community submission" : "Local copy · unreviewed"}</small></span></button>)}
    </div></> : <article className="local-text-reader"><p className="kicker">{view.example ? "Example · unreviewed · not a community submission" : "Local copy · unreviewed"}</p><h1>{view.title}</h1><p>Creator credit: {view.creator}</p><p>Text only. No approved narration is attached. Final publication remains subject to the existing review and consent gates.</p><section className={`library-reading-panel colour-${page % 2}`}><p>Page {page + 1} / {view.pages.length}</p><h2>{view.pages[page].title}</h2><p lang="en">{view.pages[page].en}</p>{view.pages[page].st && <><p>Sesotho · unreviewed</p><p lang="st">{view.pages[page].st}</p></>}</section><div className="button-row"><button className="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous page</button><button className="primary" disabled={page === view.pages.length - 1} onClick={() => setPage(page + 1)}>Next page</button></div>{!view.example && <button className="secondary" onClick={() => remove(view.id)}>Remove local library copy</button>}</article>}
  </main></div>;
}
