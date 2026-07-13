import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import JSZip from "jszip";
import { loadGlobals } from "./fixture.mjs";

loadGlobals();
const src = readFileSync(new URL("../docx-bridge.js", import.meta.url), "utf-8");
new Function(src).call(globalThis);
const { docxToItems, itemsToDocx } = globalThis;

// Integrationstest an einem echten, fussnotenreichen Dokument. Die Datei liegt
// absichtlich nicht im Repo (fremdes Paper, oeffentliches Repo) - der Test ueberspringt
// sich, wenn sie fehlt. Eigenes Dokument einhaengen:
//   ARCHILLATOR_TEST_DOCX="/pfad/zu/dokument.docx" npm test
const JOSEPHUS = process.env.ARCHILLATOR_TEST_DOCX || "";

test("Josephus: Identitaets-Roundtrip erhaelt 85 Fussnoten und 7 Ueberschriften", async (t) => {
  if (!existsSync(JOSEPHUS)) return t.skip("Josephus-DOCX nicht vorhanden");

  const zip = await JSZip.loadAsync(readFileSync(JOSEPHUS));
  const items = await docxToItems(zip);

  const fnItems = items.filter((i) => i.source === "footnotes");
  assert.equal(fnItems.length, 85, "85 Fussnoten als Items");
  assert.deepEqual(
    fnItems.map((i) => i.fnId),
    Array.from({ length: 85 }, (_, n) => n + 1),
    "Fussnoten in Referenz-Reihenfolge 1..85",
  );

  // Identitaets-Roundtrip: nichts uebersetzt -> Original bleibt Original.
  const { zip: out, report } = await itemsToDocx(zip, items, items.map(() => null));
  assert.equal(report.length, items.length, "ohne Uebersetzung: alles im Report");

  const doc = await out.file("word/document.xml").async("string");
  assert.equal((doc.match(/<w:footnoteReference /g) || []).length, 85);
  assert.equal((doc.match(/w:val="Heading1"/g) || []).length, 7);
  const fn = await out.file("word/footnotes.xml").async("string");
  assert.equal((fn.match(/<w:footnoteRef\/>/g) || []).length, 85);
});

test("Josephus: uebersetzter Absatz behaelt Kursiv und Fussnotenreferenz", async (t) => {
  if (!existsSync(JOSEPHUS)) return t.skip("Josephus-DOCX nicht vorhanden");

  const zip = await JSZip.loadAsync(readFileSync(JOSEPHUS));
  const items = await docxToItems(zip);

  const idx = items.findIndex((i) => i.source === "body" && i.text.includes("[^49]"));
  assert.ok(idx >= 0, "Absatz mit [^49] gefunden");
  const original = items[idx].text;
  // Marker des Originals uebernehmen - so bleibt die Uebersetzung sauber.
  const markers = original.match(/\[\^\d+\]/g).join(" ");
  const translations = items.map((i, n) =>
    n === idx ? `Uebersetzt _Der Juedische Krieg_ ${markers}` : null,
  );

  const { zip: out, report } = await itemsToDocx(zip, items, translations);
  const doc = await out.file("word/document.xml").async("string");

  assert.ok(!report.some((r) => r.index === idx), "der uebersetzte Absatz ist sauber");
  assert.match(doc, /Der Juedische Krieg/);
  assert.equal((doc.match(/<w:footnoteReference /g) || []).length, 85, "kein Ref verloren");
  assert.equal((doc.match(/w:val="Heading1"/g) || []).length, 7, "Ueberschriften intakt");
});
