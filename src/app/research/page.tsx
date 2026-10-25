import type { Metadata } from "next";
import { RESEARCH_PUBLICATION as publication, RESEARCH_REFERENCES } from "../../lib/research-publication";
import "./research.css";

export const metadata: Metadata = {
  title: "Reading pressure at Thailand’s borders — research and methods",
  description: publication.subtitle,
};

function CitedParagraph({ text }: { text: string }) {
  return <p>{text.split(/(\[\d+\])/g).map((part, i) => /^\[\d+\]$/.test(part)
    ? <a key={i} className="publication-citation" href={`#reference-${part.slice(1, -1)}`} aria-label={`Reference ${part.slice(1, -1)}`}>{part}</a>
    : part)}</p>;
}

export default function ResearchPublicationPage() {
  return (
    <main className="research-publication-page">
      <header className="publication-navigation">
        <a href="/" className="publication-identity">Thailand Geopolitical Watch</a>
        <nav aria-label="Research destinations"><a href="/">Map</a><a href="/?research=1">Evidence</a></nav>
      </header>
      <article id="publication-body">
        <header>
          <p className="publication-meta">Research &amp; methods · Reviewed <time dateTime={publication.reviewedAt}>{publication.reviewedAt}</time></p>
          <h1>{publication.title}</h1>
          <p className="publication-deck">{publication.subtitle}</p>
          <p className="publication-scope">{publication.scope}</p>
          <p><strong>Research question.</strong> {publication.question}</p>
          <p className="publication-meta">{publication.authorship}</p>
          <p><a href="/api/research/publication?format=markdown" download>Download the cited research note (Markdown)</a></p>
        </header>
        <details className="publication-contents">
          <summary>Contents · {publication.sections.length} sections</summary>
          <nav aria-label="Publication contents"><ol>{publication.sections.map(section => (
            <li key={section.id}><a href={`#${section.id}`}>{section.heading}</a></li>
          ))}<li><a href="#references">References and access ledger</a></li></ol></nav>
        </details>
        {publication.sections.map(section => <section key={section.id} id={section.id}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((text, i) => <CitedParagraph key={i} text={text} />)}
        </section>)}
        <section id="references">
          <h2>References and access ledger</h2>
          <p>Each numbered citation identifies the publisher material used, the section inspected and its access limit. All entries were checked on {publication.reviewedAt}. No claim of completeness or independent peer review is made. Linked source material retains its own rights.</p>
          <ol className="publication-references">{[...RESEARCH_REFERENCES].sort((a, b) => a.id - b.id).map(reference => (
            <li key={reference.id} value={reference.id} id={`reference-${reference.id}`}>
              <p><strong>{reference.publisher}.</strong> <a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title}</a></p>
              <p>{reference.locator}. {reference.date}.</p>
              <p className="publication-access">{reference.checked === "document-read" ? "Document inspected" : "Partial access: publisher index only"}. {reference.boundary}</p>
              <p className="publication-url">{reference.url}</p>
            </li>
          ))}</ol>
        </section>
        <footer>
          <p>Version {publication.version}. <a href="/api/research/publication?format=json">Inspect the structured publication and source ledger</a>. These exports contain the research note, not an archival snapshot of live feeds.</p>
          <p><a href="/?research=1">Open the evidence desk</a> to inspect available reports. Missing historical data remains unavailable.</p>
        </footer>
      </article>
    </main>
  );
}
