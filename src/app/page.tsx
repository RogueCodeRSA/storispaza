import Image from "next/image";
import Link from "next/link";
import { demoStory } from "../../fixtures/demo-story";
import { readConfig } from "@/server/config";

export const dynamic = "force-dynamic";
const stages = [
  ["StoriStart", "Tell your story"], ["StoriCreate", "Picture the possibilities"],
  ["StoriSpeak", "Make room for your language"], ["StoriPlay", "Read and respond"], ["StoriOwn", "Review and take it with you"],
];
export default function Home() {
  const mode = readConfig().AI_PROVIDER;
  return <>
    <header className="site-header"><Link href="/" className="brand" aria-label="StoriSpaza home">Stori<span>Spaza</span><span className="brand-mark" aria-hidden="true">✦</span></Link><span className="mode-badge">{mode === "mock" ? "Mock mode · offline fixtures" : "Real mode · unavailable in M0"}</span></header>
    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <div><p className="eyebrow">A place for the stories we carry</p><h1 id="hero-title">Every story<br />has a place.</h1><p className="intro">Turn an idea into an illustrated story. Make room for English and Sesotho. Keep your voice, your choices, and your story.</p><p className="tagline">Tell it. Create it. Own it.</p><a className="button" href="#demo">Meet our first story <span aria-hidden="true">↗</span></a></div>
        <div className="book-panel"><Image src="/fixtures/placeholder.svg" width={800} height={600} alt="Open-book symbol standing in for an illustration that has not been created yet" priority /><p>Illustration placeholder · creator review pending</p></div>
      </section>
      <section className="journey" aria-labelledby="journey-title"><h2 id="journey-title">One story. Five connected stages.</h2><ol>{stages.map(([name, description], i) => <li key={name}><span className="stage-number">0{i + 1}</span><h3>{name}</h3><p>{description}</p></li>)}</ol><p className="small">Foundation preview: the interactive journey arrives in M1.</p></section>
      <section id="demo" className="demo" aria-labelledby="demo-title"><div><p className="eyebrow">The first chapter</p><h2 id="demo-title">{demoStory.title}</h2><p>A fictional girl in Soweto discovers an imaginary power—and a very real reason to help her community.</p><blockquote>{demoStory.pages[0].narrative}</blockquote><a className="text-link" href="/api/demo/story">Inspect the provisional six-page fixture →</a></div><aside aria-label="Review status"><h3>A creator stays in control.</h3><ul><li>Six provisional English pages</li><li>Sesotho translation awaits your review</li><li>Illustrations and recordings are not ready</li><li>Private by default; nothing is published</li></ul><p className="small">No claim of Sesotho voice-to-story or synthetic Sesotho speech.</p></aside></section>
    </main>
    <footer>StoriSpaza <span aria-hidden="true">✦</span> Creator-led stories. Human-reviewed language. <span className="small">M0 foundation · not a completed demo</span></footer>
  </>;
}
