import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../index.html", import.meta.url), "utf-8");
const checks = [
  ["ARCHILLES_BRIEFING-Konstante", /const ARCHILLES_BRIEFING\s*=/, 1],
  ["Profil in styleInstructions (beide Builder)", /'archilles-scholarly':/g, 2],
  ["UI-Option", /value="archilles-scholarly"/, 1],
  ["Marker ^n^ gebrieft", /\^n\^/, 1],
  ["Marker ⟦…⟧ gebrieft", /⟦…⟧/, 1],
  ["DNT-Marker <dnt>…</dnt> gebrieft", /<dnt>…<\/dnt>/, 1],
  ["Markdown-Fussnotenmarker [^n] gebrieft", /\[\^n\]/, 1],
  ["Markdown-Seitenmarker [p. n] gebrieft", /\[p\. n\]/, 1],
  ["Verbot der Lokalisierung von [p. n]", /not "\[S\. 51\]"/, 1],
  ["Regionsmarker [region: name] gebrieft", /\[region: name\]/, 1],
  ["YAML-Kopf gebrieft", /YAML metadata block/, 1],
  ["DNT-Tags vor dem Download entfernt", /function stripDnt\(/, 1],
  ["Build-Platzhalter fuer den Sync-Stempel", /<span data-build>local<\/span>/, 1],
  ["Regel gegen doppelt ausgegebene Absaetze", /Output every paragraph exactly once/, 1],
  ["Regel gegen uebernommene HTML-Kommentare", /HTML comments \(<!-- … -->\) are working notes/, 1],
  ["Regel gegen erfundene Fussnotendefinitionen", /Never ADD a definition that is not in the source/, 1],
  ["Regel gegen Seitenangaben als [p. n]", /plain page reference in the running text/, 1],
  ["Erfundene Definitionen werden entfernt", /function dropInventedNoteDefs\(/, 1],
  ["Falsche Absatzzahl im Batch faellt auf Einzeluebersetzung zurueck", /Paragraph count mismatch/, 1],
  ["Ueberlast wird abgewartet", /async function withRetry\(/, 1],
  ["docx-bridge eingebunden", /<script src="js\/docx-bridge\.js"><\/script>/, 1],
  ["DOCX-Export nutzt itemsToDocx (kein Neubau)", /itemsToDocx\(originalDocxZip/, 1],
  ["DOCX-Import nutzt docxToItems (kein extractRawText)", /docxToItems\(originalDocxZip\)/, 1],
];
let ok = true;
for (const [name, re, min] of checks) {
  const m = html.match(re);
  const count = m ? m.length : 0;
  if (count < min) { ok = false; console.error("FEHLT/zu wenige:", name, "(", count, "<", min, ")"); }
  else console.log("ok:", name, `(${count}×)`);
}
process.exit(ok ? 0 : 1);
