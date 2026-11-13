import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../js/paragraphs.js", import.meta.url), "utf-8");
new Function(src).call(globalThis);
const { splitParagraphs, reflowText, calibrateThreshold } = globalThis.ArchillatorParagraphs;

// Bricht Absätze gierig auf `width` Zeichen um, wie ein Satzspiegel ohne Trennung.
function wrap(paragraph, width, indent = "") {
  const out = [];
  let line = indent;
  for (const word of paragraph.split(" ")) {
    if (line.trim() && (line + " " + word).length > width) {
      out.push(line);
      line = word;
    } else {
      line = line.trim() ? line + " " + word : line + word;
    }
  }
  out.push(line);
  return out;
}

const PARAS = [
  "Die Frage nach dem Ursprung der griechischen Polis beschäftigt die Forschung seit dem neunzehnten Jahrhundert. Fustel de Coulanges sah in ihr eine vor allem religiöse Gemeinschaft, während Eduard Meyer die wirtschaftliche Grundlage stärker betonte und Max Weber den Verband der wehrhaften Grundbesitzer in den Vordergrund seiner Deutung rückte.",
  "Keine dieser Deutungen ist heute ohne Einschränkung haltbar. Die archäologischen Befunde der letzten Jahrzehnte zeigen ein weit vielfältigeres Bild, als es die großen Synthesen des neunzehnten Jahrhunderts erlaubten, und sie zwingen dazu, die Entstehung der Polis als langen und regional sehr verschiedenen Vorgang zu begreifen.",
  "Besonders deutlich wird das an den Siedlungen der Ägäis. Dort entstehen Heiligtümer, Versammlungsplätze und befestigte Mauern nicht gleichzeitig, sondern in einer Reihenfolge, die von Ort zu Ort wechselt und sich keinem einfachen Schema fügt.",
  "Daraus folgt für die Methode zweierlei. Erstens muss jede Untersuchung bei den einzelnen Orten ansetzen und darf das Ergebnis nicht vorwegnehmen; zweitens ist die schriftliche Überlieferung, die fast durchweg aus späterer Zeit stammt, an den Befunden zu messen und nicht umgekehrt.",
];

test("Absätze ohne Leerzeile werden an kurzer Schlusszeile erkannt", () => {
  const text = PARAS.flatMap((p) => wrap(p, 68)).join("\n");
  assert.deepEqual(splitParagraphs(text), PARAS);
});

test("Satzende auf voller Zeile beendet keinen Absatz", () => {
  // Erste Zeile endet genau mit einem Punkt, ist aber voll.
  const p = "Dies ist ein Satz, der genau am Ende einer vollen Zeile aufhört. Danach geht derselbe Absatz noch weiter und weiter, bis er endlich zu einem natürlichen Ende kommt, das kurz ist.";
  const text = [...PARAS.flatMap((x) => wrap(x, 68)), ...wrap(p, 66)].join("\n");
  const lines = wrap(p, 66);
  assert.ok(lines[0].endsWith("."), "Testannahme: erste Zeile endet auf Punkt");
  assert.equal(splitParagraphs(text).at(-1), p);
});

test("Erstzeileneinzug öffnet einen Absatz, auch wenn die Zeile davor voll ist", () => {
  // Der erste Absatz endet auf einer vollen Zeile — nur der Einzug trennt.
  const a = "Dieser Absatz ist so gebaut, dass seine letzte Zeile voll ausläuft und";
  const b = "trotzdem mit einem Punkt endet, also nach Länge nicht erkannt wird.";
  const text = [
    ...PARAS.flatMap((p, i) => wrap(p, 68, i ? "   " : "")),
    "   " + a, b,
    "   Hier beginnt der nächste Absatz mit einem Einzug von drei Zeichen.",
    "Und er läuft auf dem linken Rand weiter bis zum Schluss.",
  ].join("\n");
  const out = splitParagraphs(text);
  assert.equal(out.length, PARAS.length + 2);
  assert.equal(out.at(-2), `${a} ${b}`);
});

test("Trennstrich wird aufgelöst, auch nach Umlaut; Ergänzungsstrich bleibt", () => {
  const text = "Die Bü-\ncher der Vor-\nund Nachgeschichte.";
  assert.deepEqual(splitParagraphs(text), ["Die Bücher der Vor- und Nachgeschichte."]);
});

test("Leerzeilen trennen weiterhin immer", () => {
  assert.deepEqual(splitParagraphs("Kurz.\n\nAuch kurz.\n\n\nDritter."), ["Kurz.", "Auch kurz.", "Dritter."]);
});

test("Zu kurzer Text: keine Längenregel, nur Leerzeilen", () => {
  const text = "Eine Zeile.\nNoch eine.\nUnd eine dritte.";
  assert.deepEqual(splitParagraphs(text), ["Eine Zeile. Noch eine. Und eine dritte."]);
});

test("Kurzer Abschnitt (unter 8 Zeilen): 80 % der mittleren Zeile", () => {
  const text = [
    "Die Frage nach dem Ursprung der griechischen Polis beschäftigt die",
    "Forschung seit dem neunzehnten Jahrhundert, und sie ist bis heute",
    "nicht abschließend beantwortet.",
    "Keine dieser Deutungen ist heute ohne Einschränkung haltbar, denn die",
    "Befunde der letzten Jahrzehnte zeigen ein weit vielfältigeres Bild.",
  ].join("\n");
  assert.equal(splitParagraphs(text).length, 2);
});

test("Kleinbuchstabe in der nächsten Zeile: kein Absatzende", () => {
  // Acrobat-Kopie aus Mazzarino: die kurze Zeile endet auf », der Satz läuft weiter.
  const text = [
    "Stilicone, era condotto, proprio per salvare l’unità teodosiana del-",
    "l’impero, a quelle formule di convivenza coi barbari che ne determinarono",
    "quella che comunemente si suole chiamare «la caduta »",
    "e che è, piuttosto, il primo accenno di una coscienza politica spiccatamente",
    "occidentale, e pertanto antibizantina. S’impone perciò la",
  ].join("\n");
  assert.equal(splitParagraphs(text).length, 1);
});

test("detect:false entspricht dem alten Verhalten", () => {
  const text = PARAS.flatMap((p) => wrap(p, 68)).join("\n");
  assert.deepEqual(splitParagraphs(text, { detect: false }), [PARAS.join(" ")]);
});

test("Fußnotenmarke am Zeilenende verdeckt das Satzende nicht", () => {
  const lines = PARAS.flatMap((p) => wrap(p, 68));
  const i = wrap(PARAS[0], 68).length - 1;
  lines[i] = lines[i] + " [12]";
  const out = splitParagraphs(lines.join("\n"));
  assert.equal(out.length, PARAS.length);
  assert.ok(out[0].endsWith("rückte. [12]"));
});

test("Kurze Zeile auf Doppelpunkt trennt die Einleitung vom Zitat", () => {
  const text = [...PARAS.flatMap((p) => wrap(p, 68)), "Dazu können wir in den Elementi lesen:", "Bei genauer Analyse hängt die Stabilität jedes politischen Organismus", "von dem Niveau der Moral ab."].join("\n");
  assert.deepEqual(splitParagraphs(text).slice(-2), [
    "Dazu können wir in den Elementi lesen:",
    "Bei genauer Analyse hängt die Stabilität jedes politischen Organismus von dem Niveau der Moral ab.",
  ]);
});

test("Zusammengeklebte Druckzeilen: kurzer Schluss am Ende einer überlangen Zeile", () => {
  // Der PDF-Viewer hat zwei Druckzeilen an einer Trennung verbunden (wie bei
  // Mazzarino: "tradiziona-" + "lista"); der kurze Schluss hängt hinten dran.
  // Grenze: Ist der Schluss nur ein Wort, bleibt die geklebte Zeile im Bereich
  // normaler voller Zeilen und ist von ihnen nicht zu unterscheiden.
  const a = "Dieser Absatz endet auf einer zusammengeklebten Zeile, die aus einer vollen Druckzeile und dem kurzen Rest besteht.";
  const b = "Danach beginnt ein neuer Absatz, der wieder ganz normal umbrochen ist.";
  const text = [...PARAS.flatMap((p) => wrap(p, 68)), a, b].join("\n");
  assert.deepEqual(splitParagraphs(text).slice(-2), [a, b]);
});

test("Überlange Zeile, deren Rest fast voll ist, beendet keinen Absatz", () => {
  const lines = PARAS.flatMap((p) => wrap(p, 68));
  const full = "Diese Zeile ist voll, und auch die angeklebte zweite Zeile ist fast so";
  const text = [...lines, `${full} lang wie eine ganze Druckzeile, endet aber auf »Punkt.«`, "und läuft weiter."].join("\n");
  assert.ok(splitParagraphs(text).at(-1).endsWith("»Punkt.« und läuft weiter."));
});

test("Kurze Versalzeile steht für sich", () => {
  const text = ["VORWORT", ...PARAS.flatMap((p) => wrap(p, 68)), "SANTO MAZZARINO"].join("\n");
  assert.deepEqual(splitParagraphs(text), ["VORWORT", ...PARAS, "SANTO MAZZARINO"]);
});

test("Anmerkungsziffer hinter dem Satzzeichen verdeckt das Satzende nicht", () => {
  // Acrobat holt die hochgestellte Ziffer auf die Zeile: "Belgian Rome.”2".
  const lines = PARAS.flatMap((p) => wrap(p, 68));
  const i = wrap(PARAS[0], 68).length - 1;
  lines[i] = lines[i] + "2";
  const out = splitParagraphs(lines.join("\n"));
  assert.equal(out.length, PARAS.length);
  assert.ok(out[0].endsWith("rückte.2"));
});

test("Jahreszahl am Zeilenende ist keine Anmerkungsziffer", () => {
  const lines = PARAS.flatMap((p) => wrap(p, 68));
  const text = [...lines, "Die Stadt wurde geplündert im Jahre 410", "und danach wieder aufgebaut."].join("\n");
  assert.ok(splitParagraphs(text).at(-1).endsWith("Jahre 410 und danach wieder aufgebaut."));
});

test("Kurze Zeile ohne Satzzeichen am Absatzanfang ist eine Überschrift", () => {
  const text = [...PARAS.flatMap((p) => wrap(p, 68)), "Zu viel Geschichte", ...wrap(PARAS[0], 68)].join("\n");
  assert.deepEqual(splitParagraphs(text), [...PARAS, "Zu viel Geschichte", PARAS[0]]);
});

test("Schließendes Anführungszeichen ohne Satzzeichen davor endet keinen Satz", () => {
  const lines = PARAS.flatMap((p) => wrap(p, 68));
  const text = [...lines, "Die neue Hauptstadt hieß bald „Neues Rom,“", "„Junges Rom.“ Danach kam das Ende."].join("\n");
  assert.ok(splitParagraphs(text).at(-1).endsWith("„Neues Rom,“ „Junges Rom.“ Danach kam das Ende."));
});

test("Griechischer Satz nach kurzer Zeile beginnt einen Absatz, auch klein", () => {
  const lines = PARAS.flatMap((p) => wrap(p, 68));
  const text = [...lines, "So schreibt es der Historiker selbst.", "ἔπειτα δὲ οὐδὲ ὅσια ταῦτα ἐστίν, ὡς λέγουσιν οἱ πολλοὶ τῶν ἀνθρώπων."].join("\n");
  assert.equal(splitParagraphs(text).at(-2), "So schreibt es der Historiker selbst.");
});

test("Aufzählungszeichen öffnet einen Absatz", () => {
  const text = [...PARAS.flatMap((p) => wrap(p, 68)), "Es gibt zwei Fälle, die man unterscheiden muss, und zwar", "• den ersten Fall", "• den zweiten Fall"].join("\n");
  assert.deepEqual(splitParagraphs(text).slice(-3), [
    "Es gibt zwei Fälle, die man unterscheiden muss, und zwar",
    "• den ersten Fall",
    "• den zweiten Fall",
  ]);
});

test("Schon umbrochener Text: jede Zeile ist ein Absatz", () => {
  assert.deepEqual(splitParagraphs(PARAS.join("\n")), PARAS);
});

test("Kalibrierung: Schwelle liegt unter dem Gipfel der vollen Zeilen", () => {
  const lengths = [66, 67, 68, 65, 68, 67, 66, 64, 68, 67, 30, 41, 12];
  const t = calibrateThreshold(lengths);
  assert.ok(t > 41 && t < 64, `Schwelle ${t}`);
  assert.equal(calibrateThreshold([60, 61]), null);
  assert.equal(calibrateThreshold([60, 70, 62]), 49);  // unter 8 Zeilen: 80 % des Medians
});

test("reflowText trennt mit Leerzeile", () => {
  const text = PARAS.flatMap((p) => wrap(p, 68)).join("\n");
  assert.equal(reflowText(text), PARAS.join("\n\n"));
});
