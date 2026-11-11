"use client";
import Link from "next/link";
import { useState } from "react";
import { ownershipExplanation, type Ownership } from "@/domain/ownership";
import { sourceLabel, type AssetSources } from "@/domain/provenance";
import "./journey.css";

interface Status { revision: number; title: string; culturalContext: string; culturalAssumptions: string[]; educationalObjective: string; ownership: Ownership; issues: string[]; recordingCount: number; pages: { number: number; title: string; narrative: string; translatedText: string; learningMoment: string; approvals: { text: boolean; illustration: boolean }; translation: string; provenance: AssetSources }[] }
export default function OwnershipStudio({ mode }: { mode: "mock" | "real" }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [ownership, setOwnership] = useState<Ownership | null>(null);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const [finalConfirmed, setFinalConfirmed] = useState(false); const [includeNarration, setIncludeNarration] = useState(false); const [voiceConsent, setVoiceConsent] = useState(false); const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const dirty = !!status && JSON.stringify(ownership) !== JSON.stringify(status.ownership);
  async function command(value: object) {
    const response = await fetch("/api/ownership", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
    if (!response.ok) { const body = await response.json(); throw new Error(body.error?.message ?? "Request failed. Refresh and try again."); }
    return response;
  }
  async function act(action: "status" | "settings" | "delete-recordings") {
    setBusy(true); setError(""); setMessage(""); setFinalConfirmed(false); setVoiceConsent(false);
    try {
      await fetch("/api/speech/session", { method: "POST" });
      const response = await command({ action, revision: status?.revision, ownership, confirmed: deleteConfirmed });
      const next: Status = await response.json(); setStatus(next); setOwnership(next.ownership); setDeleteConfirmed(false);
      setMessage(action === "delete-recordings" ? "All workspace recordings deleted. Audio approvals and voice redistribution consent cleared. Exported copies are not recalled." : "Current edition loaded. Review the checklist before export.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load this edition."); } finally { setBusy(false); }
  }
  async function download(format: "json" | "html") {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await command({ action: "export", revision: status!.revision, format, finalConfirmed, includeNarration, voiceExportConsent: voiceConsent });
      const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `storispaza-story.${format}`; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
      setMessage(`Downloaded ${format.toUpperCase()} · ${ownership!.visibility} edition. No public link was created.`);
    } catch (reason) { setFinalConfirmed(false); setError(reason instanceof Error ? reason.message : "Export failed."); } finally { setBusy(false); }
  }
  function change(value: Partial<Ownership>) { setOwnership(current => current ? { ...current, ...value } : current); setFinalConfirmed(false); }
  const blocked = busy || !status || dirty || !!status.issues.length || !finalConfirmed || (includeNarration && !voiceConsent);
  return <div className="mock-app"><header className="mock-header"><Link className="mock-brand" href="/">Stori<span>Spaza</span></Link><span className="mock-label">{mode === "mock" ? "MOCK · approvals remain provisional" : "Private StoriOwn"}</span></header>
    <main className="mock-main" id="main"><p className="kicker">StoriOwn · review and take it with you</p><h1>Your story. Your choice.</h1><p>Children’s stories stay private by default. Shared exports are files you choose to give someone. There is no public URL or gallery.</p>
      <p><Link href="/play">Preview in StoriPlay</Link> · <Link href="/speak">Edit, review and manage individual recordings in StoriSpeak</Link></p>
      <button className="secondary" disabled={busy} onClick={() => void act("status")}>Open / refresh private edition</button><p role="status" aria-live="polite">{busy ? "Working on your private edition…" : message}</p>{error && <p role="alert">{error}</p>}
      <section className="capture-card"><h2>Ownership and attribution</h2><p>{ownershipExplanation}</p><p>AI output stays editable and unreviewed until you explicitly approve it. Attribution describes who made each asset; it does not certify language quality or transfer someone else’s rights.</p></section>
      {status && ownership && <><h2>{status.title}</h2><section className="capture-card"><h2>Choose this edition</h2><p>Context: {status.culturalContext}</p><p>Learning objective: {status.educationalObjective}</p><ul>{status.culturalAssumptions?.map((assumption, index) => <li key={index}>{assumption}</li>)}</ul>
        <label>Creator / attribution name<input maxLength={100} value={ownership.creator} onChange={event => change({ creator: event.target.value })} /></label>
        <label>Export visibility<select value={ownership.visibility} onChange={event => change({ visibility: event.target.value as Ownership["visibility"], sharingConsent: false })}><option value="private">Private · for my device</option><option value="shared">Shared · manual file handoff</option></select></label>
        {ownership.visibility === "shared" && <label className="check-label"><input type="checkbox" checked={ownership.sharingConsent} onChange={event => change({ sharingConsent: event.target.checked })} />I have permission from relevant contributors and guardians to share this story, including any children’s information.</label>}
        <label className="check-label"><input type="checkbox" checked={ownership.assumptionsConfirmed} onChange={event => change({ assumptionsConfirmed: event.target.checked })} />I reviewed the cultural assumptions, science and context for this edition.</label>
        <button className="secondary" disabled={busy || !ownership.creator.trim()} onClick={() => void act("settings")}>Save edition choices</button>{dirty && <p role="status">Save your choices, then review the updated checklist.</p>}
      </section><section className="capture-card"><h2>Final approval checklist</h2><p>Review English, Sesotho and image associations in StoriSpeak. Missing narration remains text-only. This does not close M4 or freeze speech fixtures.</p>
        {status.issues.length ? <><p>Export blocked until the following are complete:</p><ul>{status.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul></> : <p>Current required content approvals are complete. Confirm this edition below.</p>}
        {status.pages.map(page => <details key={page.number}><summary>Page {page.number}: {page.title} · {page.approvals.text && page.approvals.illustration && page.translation === "approved" ? "reviewed" : "review pending"}</summary><p lang="en" className="source-text">{page.narrative}</p><p lang="st" className="source-text">{page.translatedText}</p><p>Learning moment: {page.learningMoment}</p><p>Text: {sourceLabel(page.provenance.text)}<br />Translation: {sourceLabel(page.provenance.translation)}<br />Image: {sourceLabel(page.provenance.illustration)}<br />English narration: {sourceLabel(page.provenance.narration.en)}<br />Sesotho narration: {sourceLabel(page.provenance.narration.st)}</p></details>)}
      </section><section className="capture-card"><h2>Export your approved story</h2><p>Download both files. The JSON includes the story, embedded images and provenance. The standalone HTML opens offline by itself, with English and Sesotho on each page. Raw source recordings are always excluded.</p>
        <label className="check-label"><input type="checkbox" checked={includeNarration} onChange={event => { setIncludeNarration(event.target.checked); setVoiceConsent(false); setFinalConfirmed(false); }} />Include available current approved adult page narration (optional)</label>
        {includeNarration && <label className="check-label"><input type="checkbox" checked={voiceConsent} onChange={event => { setVoiceConsent(event.target.checked); setFinalConfirmed(false); }} />I consent to copying my approved adult narration into this export. For a shared edition, I consent to its redistribution. Missing or unapproved clips stay text-only.</label>}
        <label className="check-label"><input type="checkbox" checked={finalConfirmed} disabled={busy || dirty || !!status.issues.length} onChange={event => setFinalConfirmed(event.target.checked)} />I reviewed this current edition, attribution and visibility, and approve its export.</label>
        <div className="button-row"><button className="primary" disabled={blocked} onClick={() => void download("json")}>Download story JSON + provenance</button><button className="primary" disabled={blocked} onClick={() => void download("html")}>Download offline HTML reader</button></div>
      </section><section className="capture-card"><h2>Voice consent and deletion</h2><p>{status.recordingCount} retained recording(s) in this workspace. StoriSpeak requires adult own-voice and storage consent before recording; no child voices or voice cloning. Delete removes local recording bytes and references and clears audio approvals. Text and images remain. SQLite deletion is logical; exported copies and backups are not erased.</p>
        <label className="check-label"><input type="checkbox" checked={deleteConfirmed} onChange={event => setDeleteConfirmed(event.target.checked)} />Delete all retained workspace recordings and withdraw their redistribution consent.</label><button className="secondary" disabled={busy || !deleteConfirmed} onClick={() => void act("delete-recordings")}>Delete all recordings</button>
      </section></>}
    </main></div>;
}
