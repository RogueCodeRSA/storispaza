"use client";

import { useState } from "react";
import Link from "next/link";
import { creativeBriefSchema, type IllustrationProject } from "@/domain/illustration";
import { storySchema } from "@/domain/story";
import { sourceLabel } from "@/domain/provenance";
import "./journey.css";

type Status = { project: IllustrationProject | null; attempts: number; attemptLimit: number; exposureUsd: number; sessionBudgetUsd: number; developmentBudgetUsd: number };
const imageUrl = (id: string) => `/api/illustrations?asset=${encodeURIComponent(id)}`;
export default function IllustrationStudio({ mode }: { mode: "mock" | "real" }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [character, setCharacter] = useState(""); const [setting, setSetting] = useState(""); const [style, setStyle] = useState("");
  const [confirmed, setConfirmed] = useState(false); const [consent, setConsent] = useState(false); const [redistribution, setRedistribution] = useState(false);
  const [scenesConfirmed, setScenesConfirmed] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const project = status?.project;
  async function api(body?: unknown, path = "/api/illustrations"): Promise<Status> {
    const response = await fetch(path, body ? { method: "POST", headers: { "Content-Type": "application/json", "x-ai-consent": consent ? "true" : "false" }, body: JSON.stringify(body) } : undefined);
    const value = await response.json(); if (!response.ok) throw new Error(value.error?.message ?? "The operation failed."); return value;
  }
  function apply(value: Status, replacePrompts = false) {
    setStatus(value);
    if (!value.project) setPrompts([]);
    if (value.project) setPrompts(current => replacePrompts || current.length !== 6 ? value.project!.pagePrompts : current);
  }
  async function run(operation: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await operation(); } catch (error) { setError(error instanceof Error ? error.message : "The operation failed."); try { apply(await api()); } catch { /* Preserve open form on session/network failure. */ } }
    finally { setBusy(false); }
  }
  async function open() {
    await fetch("/api/illustrations/session", { method: "POST" }).then(async response => { if (!response.ok) { const value = await response.json(); throw new Error(value.error?.message ?? "Session unavailable."); } });
    apply(await api(), true);
  }
  async function start() {
    const brief = creativeBriefSchema.parse({ character, setting, style, confirmed });
    const raw = localStorage.getItem("storispaza-live-draft-v1");
    if (!raw) throw new Error("Save your six-page story in StoriStart first, or use the explicit mock example.");
    const saved = JSON.parse(raw);
    const story = storySchema.parse(saved.story ?? saved);
    apply(await api({ action: "start", story, brief, saveConsent: true }), true);
  }
  async function command(action: string, extras: object = {}) { if (project) apply(await api({ action, revision: project.revision, ...extras })); }
  async function sixPages() {
    if (!project) return;
    let current = project;
    // One checked, reference-guided operation at a time. Never retry a failure.
    for (let page = 1; page <= 6; page++) {
      if (current.pages[page - 1]) continue;
      const next = await api({ action: "page", revision: current.revision, page, prompt: prompts[page - 1], sceneConfirmed: scenesConfirmed });
      apply(next); current = next.project!;
      if (current.halted) throw new Error("Image usage is uncertain. Stopped; review the usage report.");
    }
    setMessage("Six-page contact sheet ready. Review identity, context and electrical safety on every page.");
  }
  return <div className="mock-app"><header className="mock-header"><Link href="/" className="mock-brand">Stori<span>Spaza</span></Link><span className="mock-label">{mode === "mock" ? "MOCK — placeholder image rehearsal" : "REAL — paid image workflow"}</span></header>
    <main className="mock-main" id="main"><p className="kicker">StoriCreate · human review at every gate</p><h1>Picture your story</h1>
      <p>Supply your character, Soweto setting and art style. Generate one character sheet, review its real usage and approve it before any pages. All AI output starts unreviewed.</p>
      <p><Link href="/create">Back to StoriStart</Link> · <Link href="/speak">StoriSpeak: review translation and record</Link> · <Link href="/studio">Offline mock journey</Link></p>
      {mode === "mock" && <p className="provisional">Solid-colour placeholders only. No real images, paid calls, safety certification or genuine human approval.</p>}
      <p role="status" aria-live="polite">{busy ? "Working. Keep this tab open; no automatic retries." : message}</p>{error && <p role="alert">{error}</p>}
      <button className="secondary" disabled={busy} onClick={() => void run(open)}>Open / restore private workspace</button>
      {status && <p>Development image attempts: {status.attempts}/{status.attemptLimit}. Accounted exposure: US${status.exposureUsd.toFixed(6)} (includes reservations). Limits: US${status.sessionBudgetUsd}/session, US${status.developmentBudgetUsd}/development. Provider invoices may differ.</p>}
      <label className="check-label"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} />I consent to private local draft storage and {mode === "real" ? "sending complete image prompts and the reference sheet to the configured provider" : "simulated image operations"}. No real-person likenesses or personal data.</label>
      {status && !project && <section className="capture-card"><h2>Your creative brief</h2>
        <label>Character<textarea value={character} onChange={event => setCharacter(event.target.value)} maxLength={2500} /></label>
        <label>Soweto setting<textarea value={setting} onChange={event => setSetting(event.target.value)} maxLength={2500} /></label>
        <label>Art style<textarea value={style} onChange={event => setStyle(event.target.value)} maxLength={2000} /></label>
        <label className="check-label"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />I confirm these details. Any AI suggestions must be identified and confirmed separately.</label>
        <button className="primary" disabled={busy || !consent || !confirmed} onClick={() => void run(start)}>Use saved six-page story and save brief</button>
        {mode === "mock" && <button className="secondary" disabled={busy || !consent || !confirmed} onClick={() => void run(async () => { const story = await fetch("/api/demo/story").then(response => response.json()); apply(await api({ action: "start", story: story.data ?? story, brief: { character, setting, style, confirmed }, saveConsent: true })); })}>Use explicit fixture story</button>}
      </section>}
      {project && <>
        <button className="danger" disabled={busy || !consent} onClick={() => void run(() => command("delete"))}>Delete private workspace and its images</button>
        <details><summary>Creator-confirmed brief</summary><p>{project.brief.character}</p><p>{project.brief.setting}</p><p>{project.brief.style}</p></details>
        {project.halted && <p role="alert">Image work stopped. Usage, budget or provider failure needs review. Existing images are preserved; no automatic retry.</p>}
        <section className="capture-card"><h2>1 · Character sheet and cost measurement</h2>
          {!project.sheet ? <button className="primary" disabled={busy || !consent || project.halted} onClick={() => void run(() => command("sheet"))}>Generate ONE sheet and stop</button> : <>
            {/* Private, session-authorized images cannot use a public optimizer URL. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <a href={imageUrl(project.sheet.assetId)} target="_blank" rel="noreferrer"><img className="character-preview" src={imageUrl(project.sheet.assetId)} alt="Character reference sheet awaiting identity, style and safety review" /></a>
            <p>{sourceLabel(project.sheet.source)} · {project.sheet.approved ? (mode === "real" ? "Creator approved" : "Mock acknowledgement only") : "Unreviewed"}</p>
            <p>Single-image measured tokens: {project.sheet.usage.tokens ? `${project.sheet.usage.tokens.input} input / ${project.sheet.usage.tokens.output} output` : "unavailable"}. Rate-derived image cost: {project.sheet.usage.actualUsd === null ? "unknown; pages blocked" : `US$${project.sheet.usage.actualUsd.toFixed(6)}`}. Prompt screening is accounted separately. This is not an invoice.</p>
            {project.sheet.usage.imageTokens && <p>Token breakdown: {project.sheet.usage.imageTokens.textInput} text input, {project.sheet.usage.imageTokens.imageInput} reference-image input, {project.sheet.usage.imageTokens.imageOutput} image output.</p>}
            {!project.sheet.approved && <button className="primary" disabled={busy || !consent || project.halted} onClick={() => void run(() => command("approve-sheet", { assetId: project.sheet!.assetId, acceptMeasuredCost: true }))}>{mode === "mock" ? "Acknowledge mock sheet and simulated cost" : "Approve sheet identity, context, safety and measured cost"}</button>}
          </>}
        </section>
        <section className="capture-card"><h2>2 · Six-page contact sheet</h2><p>Edit each scene prompt before generation. Suggestions in story descriptions remain unconfirmed until you review them. No child touching electrical infrastructure; powers are fantasy.</p>
          <label className="check-label"><input type="checkbox" checked={scenesConfirmed} onChange={event => setScenesConfirmed(event.target.checked)} />I reviewed and confirm the scene descriptions, including any AI suggestions, cultural details and electrical safety.</label>
          <button className="primary" disabled={busy || !consent || !scenesConfirmed || !project.sheet?.approved || project.halted} onClick={() => void run(sixPages)}>Generate missing six reference-guided pages</button>
          <div className="illustration-contact">{project.story.pages.map((page, index) => { const image = project.pages[index]; const dirty = prompts[index] !== project.pagePrompts[index]; return <article className="edit-card" key={page.number}><h3>Page {page.number}: {page.title}</h3>
            {image ? <a href={imageUrl(image.assetId)} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(image.assetId)} alt={`Page ${page.number} illustration — ${image.approved ? "review acknowledged" : "unreviewed"}`} /></a> : <p>No page image generated.</p>}
            <p>{image ? `${sourceLabel(image.source)} · ${image.frozen ? "Frozen approved copy" : image.approved ? (mode === "real" ? "Approved" : "Mock acknowledgement") : "Unreviewed"}` : "Awaiting sheet approval"}</p>
            <label>Page {page.number} prompt<textarea value={prompts[index] ?? ""} maxLength={3000} disabled={busy} onChange={event => { setScenesConfirmed(false); setPrompts(values => values.map((value, i) => i === index ? event.target.value : value)); }} /></label>
            {dirty && <p className="provisional">Edited prompt: generate and review a new image before approval.</p>}
            <button className="secondary" disabled={busy || !consent || !scenesConfirmed || !project.sheet?.approved || project.halted || !prompts[index]?.trim()} onClick={() => void run(() => command("page", { page: page.number, prompt: prompts[index], sceneConfirmed: scenesConfirmed }))}>{image ? "Regenerate only this page" : "Generate this page"}</button>
            {image && <button className="secondary" disabled={busy || !consent || dirty || image.approved || project.halted} onClick={() => void run(() => command("approve-page", { page: page.number, assetId: image.assetId }))}>{mode === "mock" ? "Acknowledge mock page" : "Approve current image"}</button>}
          </article>; })}</div>
        </section>
        <section className="capture-card"><h2>3 · Freeze after approval</h2><label className="check-label"><input type="checkbox" checked={redistribution} onChange={event => setRedistribution(event.target.checked)} />I approve all current images and consent to their use in the reviewed fixture pack.</label>
          <button className="primary" disabled={busy || !consent || !redistribution || project.halted || project.pages.some(page => !page?.approved) || prompts.some((prompt, i) => prompt !== project.pagePrompts[i])} onClick={() => void run(async () => { await command("freeze", { redistributionConsent: true }); setMessage("Approved images optimized and frozen privately. No publication or repository commit occurred."); })}>Optimize and freeze approved copies</button></section>
      </>}
    </main></div>;
}
