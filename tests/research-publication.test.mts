import test from "node:test";
import assert from "node:assert/strict";
import * as publicationModule from "../src/lib/research-publication.ts";
import * as exportModule from "../src/app/api/research/publication/route.ts";
const publication = ("default" in publicationModule ? publicationModule.default : publicationModule) as typeof publicationModule;
const { GET } = ("default" in exportModule ? exportModule.default : exportModule) as typeof exportModule;

test("publication exports the same cited text and access ledger", async () => {
  const jsonResponse = GET(new Request("https://example.test/api/research/publication"));
  const json = await jsonResponse.json();
  assert.deepEqual(json.publication, publication.RESEARCH_PUBLICATION);
  assert.deepEqual(json.references, publication.RESEARCH_REFERENCES);
  const markdown = await GET(new Request("https://example.test/api/research/publication?format=markdown")).text();
  assert.equal(markdown, publication.researchPublicationMarkdown());
  const ids = new Set(publication.RESEARCH_REFERENCES.map(reference => reference.id));
  for (const section of publication.RESEARCH_PUBLICATION.sections) {
    for (const paragraph of section.paragraphs) {
      assert.ok(markdown.includes(paragraph));
      for (const match of paragraph.matchAll(/\[(\d+)\]/g)) assert.ok(ids.has(Number(match[1])), `Unresolved citation ${match[1]}`);
    }
  }
  assert.equal(GET(new Request("https://example.test/api/research/publication?format=html")).status, 400);
});
