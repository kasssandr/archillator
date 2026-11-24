import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../js/markers.js", import.meta.url), "utf-8");
new Function(src).call(globalThis);
const { restorePageRefs } = globalThis.ArchillatorMarkers;

test("Seitenangabe im Apparat wird wieder zur Angabe (Lévi, Note 2)", () => {
  const source = "[^2]: *Les sources de l’histoire de France*, 1901, t. I, p. 209.";
  const de = "[^2]: *Les sources de l’histoire de France*, 1901, Bd. I, [p. 209].";
  const r = restorePageRefs(source, de);
  assert.equal(r.text, "[^2]: *Les sources de l’histoire de France*, 1901, Bd. I, p. 209.");
  assert.deepEqual(r.restored, ["[p. 209]"]);
});

test("echte Seitenmarke bleibt, wo die Quelle sie hat", () => {
  const source = "lui faire reconnaître d’énormes [p. 198] privilèges, authentiquer";
  const de = "ihm enorme [p. 198] Privilegien anerkennen zu lassen";
  const r = restorePageRefs(source, de);
  assert.equal(r.text, de);
  assert.deepEqual(r.restored, []);
});

test("Marke und gleichlautende Angabe im selben Absatz: nur die überzählige fällt", () => {
  const source = "Text [p. 51] weiter, vgl. p. 30.";
  const de = "Text [p. 51] weiter, siehe [p. 30] und [p. 51].";
  const r = restorePageRefs(source, de);
  assert.equal(r.text, "Text [p. 51] weiter, siehe p. 30 und p. 51.");
  assert.deepEqual(r.restored, ["[p. 30]", "[p. 51]"]);
});

test("römische und Bereichsangaben", () => {
  const source = "Demaison, t. I, p. CCXXXV et suiv. ; Paris, p. 90-91.";
  const de = "Demaison, Bd. I, [p. CCXXXV] ff.; Paris, [p. 90-91].";
  assert.equal(restorePageRefs(source, de).text, "Demaison, Bd. I, p. CCXXXV ff.; Paris, p. 90-91.");
});

test("ohne Marken unverändert", () => {
  const de = "Ein Absatz ohne Seitenmarke, mit S. 12 und [^3].";
  assert.equal(restorePageRefs("Un paragraphe, p. 12 [^3].", de).text, de);
});
