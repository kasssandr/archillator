import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMiniDocx, loadGlobals } from "./fixture.mjs";

loadGlobals();

test("Fixture ist ein lesbares DOCX-ZIP mit Body und Fussnoten", async () => {
  const zip = await buildMiniDocx();
  const doc = await zip.file("word/document.xml").async("string");
  const fn = await zip.file("word/footnotes.xml").async("string");
  assert.match(doc, /INTRODUCTION/);
  assert.equal((doc.match(/<w:footnoteReference /g) || []).length, 2);
  assert.equal((fn.match(/<w:footnote w:id="[12]"/g) || []).length, 2);
  assert.ok(globalThis.DOMParser, "DOMParser global gesetzt");
});
