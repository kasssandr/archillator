import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildMiniDocx, loadGlobals } from "./fixture.mjs";

loadGlobals();
// docx-bridge.js ist ein klassisches Script (kein ES-Modul) -> in den globalen Scope laden.
const src = readFileSync(new URL("../docx-bridge.js", import.meta.url), "utf-8");
new Function(src).call(globalThis);
const { docxToItems, itemsToDocx } = globalThis;

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

test("Identitaets-Roundtrip: ohne Uebersetzung bleibt alles gleich", async () => {
  const original = await buildMiniDocx();
  const items = await docxToItems(original);
  const translations = items.map(() => null); // nichts uebersetzt

  const { zip } = await itemsToDocx(original, items, translations);
  const after = await zip.file("word/document.xml").async("string");

  // Struktur muss erhalten sein
  assert.equal((after.match(/<w:footnoteReference /g) || []).length, 2);
  assert.match(after, /w:val="Heading1"/);
  assert.match(after, /<w:sectPr>/);
  // Text unveraendert
  assert.match(after, /The Jewish War/);
  assert.match(after, /Josephus in /);
  // Fussnoten unangetastet, inkl. automatischer Nummer
  const fn = await zip.file("word/footnotes.xml").async("string");
  assert.equal((fn.match(/<w:footnoteRef\/>/g) || []).length, 2);
  assert.match(fn, /Hadas-Lebel/);
  // Andere Dateien mitkopiert
  assert.ok(zip.file("word/styles.xml"), "styles.xml uebernommen");
  assert.ok(zip.file("[Content_Types].xml"), "Content_Types uebernommen");
});

test("Rueckbau: Kursiv und Fussnotenreferenzen ueberleben die Uebersetzung", async () => {
  const original = await buildMiniDocx();
  const items = await docxToItems(original);
  const translations = items.map((i) =>
    i.source === "body" && i.text.startsWith("Josephus")
      ? "Josephus in _Der Juedische Krieg_ sagt es.[^1] Und nochmals.[^2]"
      : null,
  );

  const { zip } = await itemsToDocx(original, items, translations);
  const after = await zip.file("word/document.xml").async("string");

  assert.match(after, /Der Juedische Krieg/);
  assert.doesNotMatch(after, /The Jewish War/, "Original ersetzt");
  assert.doesNotMatch(after, /\[\^1\]/, "Marker nicht als Literal im XML");
  assert.equal((after.match(/<w:footnoteReference /g) || []).length, 2, "beide Refs zurueck");
  assert.match(after, /<w:i\/>/, "Kursiv-Run rekonstruiert");
  assert.match(after, /w:val="Heading1"/, "pPr des anderen Absatzes unangetastet");
});

test("Rueckbau einer Fussnote: Nummer bleibt, Text ist nicht hochgestellt", async () => {
  const original = await buildMiniDocx();
  const items = await docxToItems(original);
  const translations = items.map((i) =>
    i.fnId === 1 ? "Hadas-Lebel, 1993:51 (uebersetzt)." : null,
  );

  const { zip } = await itemsToDocx(original, items, translations);
  const fn = await zip.file("word/footnotes.xml").async("string");

  assert.match(fn, /uebersetzt/);
  // Die automatische Nummer muss erhalten bleiben ...
  assert.equal((fn.match(/<w:footnoteRef\/>/g) || []).length, 2);
  // ... und der Textrun darf NICHT den FootnoteReference-Stil erben (sonst hochgestellt).
  const note1 = fn.split('w:id="1"')[1].split("</w:footnote>")[0];
  const styleCount = (note1.match(/w:val="FootnoteReference"/g) || []).length;
  assert.equal(styleCount, 1, "nur die Nummer traegt den hochgestellten Stil");
});

test("Report: fehlende, fehlerhafte und markerkaputte Uebersetzungen", async () => {
  const original = await buildMiniDocx();
  const items = await docxToItems(original);

  const translations = items.map((i, n) => {
    if (n === 0) return null; // nicht uebersetzt
    if (n === 1) return "Josephus sagt es. Und nochmals.[^2]"; // [^1] fehlt
    if (n === 2) return "[ERROR: high demand] Hadas-Lebel"; // API-Fehler
    return "Ebd.";
  });

  const { zip, report } = await itemsToDocx(original, items, translations);

  assert.equal(report.length, 3);
  assert.match(report[0].reason, /nicht uebersetzt/i);
  assert.match(report[1].reason, /Marker/i);
  assert.match(report[2].reason, /ERROR/i);
  assert.ok(report[1].sample.length > 0, "Textbeispiel vorhanden");
  assert.deepEqual(report.map((r) => r.index), [0, 1, 2], "nach Position sortiert");

  // Die drei Faelle behalten ihr Original; NIE eine Fehlermeldung im Dokument.
  const doc = await zip.file("word/document.xml").async("string");
  assert.match(doc, /INTRODUCTION/);
  assert.match(doc, /The Jewish War/, "markerkaputter Absatz bleibt im Original");
  assert.doesNotMatch(doc, /ERROR/, "keine Fehlermeldung im Dokument");
  const fn = await zip.file("word/footnotes.xml").async("string");
  assert.doesNotMatch(fn, /ERROR/);
  assert.match(fn, /Ebd\./, "die intakte Uebersetzung wird eingesetzt");
});
