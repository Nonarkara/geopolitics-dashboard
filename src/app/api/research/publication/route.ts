import { RESEARCH_PUBLICATION, RESEARCH_REFERENCES, researchPublicationMarkdown } from "../../../../lib/research-publication";

export function GET(request: Request) {
  const format = new URL(request.url).searchParams.get("format") ?? "json";
  if (format !== "json" && format !== "markdown") {
    return Response.json({ error: "Use format=json or format=markdown." }, { status: 400 });
  }
  const headers = {
    "cache-control": "public, max-age=0, s-maxage=86400",
    "x-publication-version": RESEARCH_PUBLICATION.version,
    "x-content-type-options": "nosniff",
  };
  if (format === "markdown") return new Response(researchPublicationMarkdown(), {
    headers: { ...headers, "content-type": "text/markdown; charset=utf-8", "content-disposition": 'attachment; filename="border-pressure-research.md"' },
  });
  return Response.json({ publication: RESEARCH_PUBLICATION, references: RESEARCH_REFERENCES }, { headers });
}
