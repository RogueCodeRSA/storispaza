import Image from "next/image";
import Link from "next/link";
import { demoStory } from "../../fixtures/demo-story";
import { readConfig } from "@/server/config";
import cover from "../../fixtures/approved-images/page-1.webp";
import ReviewStatus from "@/components/ReviewStatus";

export const dynamic = "force-dynamic";
const stages = [
  ["StoriStart", "Tell your story"], ["StoriCreate", "Picture the possibilities"],
  ["StoriSpeak", "Make room for your language"], ["StoriPlay", "Read and respond"], ["StoriOwn", "Review and take it with you"],
];
export default function Home() {
  const settings = readConfig(); const mode = settings.AI_PROVIDER;
  return <>
    <header className="site-header"><Link href="/" className="brand" aria-label="StoriSpaza home">Stori<span>Spaza</span><span className="brand-mark" aria-hidden="true">✦</span></Link><Link className="header-link" href="/library">Library</Link><Link className="header-link" href={mode === "real" && settings.ENABLE_LIVE_AI ? "/create" : "/studio"}>Your story starts here</Link></header>
    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <div><p className="eyebrow">A place for the stories we carry</p><h1 id="hero-title">Every story<br />has a place.</h1><p className="intro">Meet a girl with an extraordinary spark. Read her Soweto adventure, then make room for a story of your own.</p><p className="tagline">Tell it. Create it. Own it.</p><div className="hero-actions"><Link className="button" href="/play">Read the story <span aria-hidden="true">↗</span></Link><Link className="button button-secondary" href={mode === "real" && settings.ENABLE_LIVE_AI ? "/create" : "/studio"}>Create your own</Link></div><p className="small"><a className="text-link" href="/offline/storispaza-offline.html" download>Download offline journey</a></p></div>
        <figure className="book-panel"><Image src={cover} alt="Palesa and her grandmother at home in Soweto, with an imagined golden glow above her hand" priority sizes="(max-width: 700px) 100vw, 55vw" /><figcaption>The Girl Who Spoke to Electricity</figcaption></figure>
      </section>
      <section className="journey" aria-labelledby="journey-title"><h2 id="journey-title">One story. Five connected stages.</h2><ol>{stages.map(([name, description], i) => <li key={name}><span className="stage-number">0{i + 1}</span><h3>{name}</h3><p>{description}</p></li>)}</ol><p className="small"><Link href="/play">Read and respond together</Link> · <Link href="/own">Keep and share your story</Link></p></section>
      <section id="demo" className="demo" aria-labelledby="demo-title"><div><p className="eyebrow">The first chapter</p><h2 id="demo-title">{demoStory.title}</h2><p>A fictional girl in Soweto discovers an imaginary power—and a very real reason to help her community.</p><blockquote>{demoStory.pages[0].narrative}</blockquote><Link className="text-link" href="/play">Step into the story →</Link></div><aside><h3>A creator stays in control.</h3><p>Your words. Your language. Your choice of who receives your story.</p><p>Private by default, with human review before final sharing.</p></aside></section>
      <ReviewStatus><p>{mode === "mock" ? "Mock mode · offline fixtures. No live generation during replay." : "Private workspace; new generation requires separate consent."}</p><p>M3 illustrations are approved source assets. English, Sesotho and recordings keep their independent current reviews. M4 content review remains open; missing audio stays text-only.</p><p>Final exports require current approvals. No Sesotho recognition, synthetic speech or public gallery.</p></ReviewStatus>
    </main>
    <footer>StoriSpaza <span aria-hidden="true">✦</span> Every story has a place.</footer>
  </>;
}
