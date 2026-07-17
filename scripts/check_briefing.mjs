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
