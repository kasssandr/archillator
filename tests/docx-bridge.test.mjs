import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildMiniDocx, loadGlobals } from "./fixture.mjs";

loadGlobals();
// docx-bridge.js ist ein klassisches Script (kein ES-Modul) -> in den globalen Scope laden.
const src = readFileSync(new URL("../docx-bridge.js", import.meta.url), "utf-8");
new Function(src).call(globalThis);
const { docxToItems } = globalThis;

test("Body-Absaetze werden mit Marker-Text serialisiert", async () => {
  const items = await docxToItems(await buildMiniDocx());
  const body = items.filter((i) => i.source === "body");

  assert.equal(body.length, 2, "leerer Absatz erzeugt kein Item");
  assert.equal(body[0].text, "INTRODUCTION");
  assert.equal(body[0].paraIndex, 0);
  assert.equal(
    body[1].text,
    "Josephus in _The Jewish War_ says so.[^1] And again.[^2]",
  );
  assert.equal(body[1].paraIndex, 1);
  assert.equal(body[1].fnId, null);
});

test("Fussnoten stehen direkt hinter ihrem referenzierenden Absatz", async () => {
  const items = await docxToItems(await buildMiniDocx());

  assert.deepEqual(
    items.map((i) => [i.source, i.fnId]),
    [
      ["body", null], // INTRODUCTION
      ["body", null], // Josephus in _The Jewish War_ ...
      ["footnotes", 1], // direkt dahinter
      ["footnotes", 2],
    ],
  );
  // Die automatische Nummer (<w:footnoteRef/>) darf NICHT im Text stehen.
  assert.equal(items[2].text, "Hadas-Lebel, 1993:51.");
  assert.equal(items[3].text, "Ibid.");
});
