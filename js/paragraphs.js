/*
 * Absatzerkennung für Text, der aus einem PDF kopiert wurde.
 *
 * Portiert aus Scriptor (archilles-scriptor, src/scriptor/reflow/core.py und
 * textlines.py), soweit das ohne Seitengeometrie geht:
 *
 *   1. calibrate_threshold: Das Histogramm der Zeilenlängen hat einen Gipfel bei
 *      der vollen Satzbreite. Wo es links davon unter 25 % der Gipfelhöhe fällt,
 *      liegt die Schwelle; kürzere Zeilen sind „verdächtig kurz“.
 *   2. Absatzende = kurze Zeile + Satzendzeichen (SENT_END), Fußnotenmarken
 *      am Zeilenende zählen nicht mit.
 *   3. mark_indent_breaks: Ein Erstzeileneinzug (hier: führende Leerzeichen
 *      gegenüber einem stabilen linken Rand) öffnet einen Absatz, außer die
 *      Zeile davor ist eine volle, offene Zeile auf demselben Einzug (Blockzitat).
 *   4. Ein Aufzählungszeichen öffnet einen Absatz; nach einem Trennstrich
 *      beginnt nie ein neuer.
 *
 * Eine Leerzeile beendet immer einen Absatz, wie bisher. Abweichend von Scriptor
 * wird das Histogramm geglättet: Ein eingefügter Abschnitt hat Dutzende Zeilen,
 * kein Buch Tausende, und ungeglättet reißt eine einzige fehlende Länge den
 * Gipfel auseinander.
 *
 * Klassisches Script, kein ES-Modul: läuft im Browser per <script>, in Node über
 * new Function(src).
 */
(function (root) {
  "use strict";

  // Scriptor: SENT_END, _TRAILING_MARKERS, BULLET_RE, KEEP_HYPHEN_BEFORE.
  // Abweichend mit Doppelpunkt: Scriptor erkennt das folgende Blockzitat an der
  // Geometrie, im eingefügten Text steht der einleitende Satz sonst mit ihm in
  // einem Absatz ("Dazu können wir in den Elementi lesen:", Meisel).
  const SENT_END = /[.:!?»“”"’']$/;
  const TRAILING_MARKERS = /(\s*\[\d{1,4}\])+$/;
  // Anmerkungsziffer, die die Kopie aus der Hochstellung holt: "Belgian Rome.”2",
  // "disintegrated.4". Nur hinter einem Satzzeichen, damit "in 455" bleibt.
  const TRAILING_NOTE_NUMBER = /([.!?»“”"’'])\d{1,3}$/;
  // Endet eine Zeile so, schließt sie keine Überschrift ab.
  const OPEN_END = /[.,;:!?»“”"’'\-–—(]$/;
  const BULLET_RE = /^[•▪◦‣]\s*\S/;
  const KEEP_HYPHEN_BEFORE = /^(und|oder|bis|sowie|wie|als|zur?|zum?|noch|aber)\b/i;
  // Trennstrich: Buchstabe + "-" am Zeilenende (Scriptor: stripped[-2].isalpha()).
  const LINE_HYPHEN = /\p{L}-$/u;
  // Scriptor: _CLOSED — eine Zeile, die einen Satz oder Teilsatz schließt.
  const CLOSED = /[.:;!?]["'’”»)\]]*$/;
  const LOWER_START = /^\p{Ll}/u;

  const PEAK_FRACTION = 0.25;    // Scriptor: calibrate_threshold(peak_fraction)
  const MIN_CALIB_LINES = 8;     // darunter gibt es keinen Gipfel, nur Rauschen
  const MIN_FEW_LINES = 3;       // darunter auch kein Median, der etwas sagt
  const EDGE_MIN_LINES = 5;      // Scriptor: EDGE_MIN_LINES
  const INDENT_MIN = 1;          // Einzugsband in Zeichen (Scriptor: 4–18 pt)
  const INDENT_MAX = 8;
  const FULL_LINE = 0.8;         // Scriptor: FULL_LINE
  const TAB_WIDTH = 4;
  // Länger setzt kein Buch eine Zeile. Liegt der Median darüber, ist der Text
  // schon umbrochen (Word, Webseite): jede Zeile ist ein Absatz.
  const MAX_PRINTED_LINE = 160;
  // Wer mehr als so viele Gipfelbreiten über der Satzbreite liegt, ist aus
  // mehreren Druckzeilen geklebt.
  const MERGED_LINE = 2;
  // Längste Überschrift ohne Versalien, als Anteil der Satzbreite.
  const HEADING_MAX = 0.65;

  function leadingWidth(line) {
    let w = 0;
    for (const ch of line) {
      if (ch === " ") w += 1;
      else if (ch === "\t") w += TAB_WIDTH;
      else break;
    }
    return w;
  }

  function median(values) {
    if (!values.length) return 0;
    const s = [...values].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  }

  /**
   * Schwelle für „kurze Zeile“ aus den Zeilenlängen, oder null, wenn der Text
   * zu wenige Zeilen hat, um einen Gipfel zu zeigen.
   */
  function calibrateThreshold(lengths) {
    const c = calibrate(lengths);
    return c ? c.threshold : null;
  }

  /** { threshold, width } — width ist die volle Satzbreite (Gipfel), oder null. */
  function calibrate(lengths) {
    // Zu wenige Zeilen für ein Histogramm: Scriptors FULL_LINE-Maß, kurz ist,
    // was unter 80 % der mittleren Zeile bleibt.
    if (lengths.length < MIN_CALIB_LINES) {
      if (lengths.length < MIN_FEW_LINES) return null;
      const width = median(lengths);
      return { threshold: Math.floor(FULL_LINE * width), width };
    }
    const max = Math.max(...lengths);
    const raw = new Array(max + 2).fill(0);
    for (const n of lengths) raw[n] += 1;

    // Glättungsbreite wächst mit der Zeilenbreite: ±2 bei ~70 Zeichen.
    const r = Math.max(1, Math.round(median(lengths) / 35));
    const smooth = raw.map((_, i) => {
      let s = 0;
      for (let d = -r; d <= r; d++) s += raw[i + d] || 0;
      return s;
    });

    let mode = 0;
    for (let i = 1; i < smooth.length; i++) {
      if (smooth[i] >= smooth[mode]) mode = i;  // Gleichstand: die längere Zeile
    }
    const cutoff = smooth[mode] * PEAK_FRACTION;
    for (let n = mode; n > 0; n--) {
      if (smooth[n] < cutoff) return { threshold: n, width: mode };
    }
    return null;
  }

  /**
   * Manche PDF-Viewer kleben beim Kopieren Druckzeilen zusammen, meist an einer
   * Trennung ("tradiziona-" + "lista"). Die kurze Schlusszeile eines Absatzes
   * steckt dann am Ende einer überlangen Zeile. Ihre Länge wird geschätzt:
   * Gesamtlänge minus die vollen Zeilen davor. Jede abgezogene Zeile streut um
   * eine Gipfelbreite, also wird die Schwelle um ebenso viel strenger.
   */
  function shortTail(len, cal) {
    const spread = cal.width - cal.threshold;
    // Eine einzelne Druckzeile reicht so weit über den Gipfel hinaus wie unter ihn.
    if (len <= cal.width + MERGED_LINE * spread) return len <= cal.threshold;
    const before = Math.ceil(len / cal.width) - 1;
    const tail = len - before * cal.width;
    return tail <= cal.threshold - before * spread;
  }

  // Eine kurze Zeile ganz in Versalien, ohne Satzzeichen am Ende, ist eine
  // Überschrift oder Unterschrift ("PREFAZIONE", "SANTO MAZZARINO") und steht
  // für sich. Mit Satzzeichen könnte sie der Schluss eines Absatzes sein ("(UNO).").
  function capsLine(line) {
    return /\p{Lu}.*\p{Lu}/u.test(line) && !/\p{Ll}/u.test(line)
      && !/[.,;:!?»“”"’'-]$/.test(line);
  }

  /** Text → Liste von Absätzen (Zeilen schon zusammengefügt, Trennungen aufgelöst). */
  function splitParagraphs(text, options = {}) {
    const detect = options.detect !== false;
    const lines = String(text).replace(/\r\n?/g, "\n").split("\n").map((l) => l.replace(/\s+$/, ""));

    const content = lines.filter((l) => l.trim());
    const longText = detect && median(content.map((l) => l.trim().length)) > MAX_PRINTED_LINE;

    // Kalibrierung: alle Zeilen außer der letzten vor einer Leerzeile bzw. dem
    // Textende — die ist fast immer kurz (Scriptor nimmt die letzte Zeile jeder
    // Seite aus demselben Grund heraus).
    const calib = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() && i + 1 < lines.length && lines[i + 1].trim()) {
        calib.push(lines[i].trim().length);
      }
    }
    const cal = detect ? calibrate(calib) : null;

    // Linker Rand: der häufigste Einzug, wenn genug Zeilen darauf stehen.
    const indents = lines.map((l) => (l.trim() ? leadingWidth(l) : null));
    let edge = null;
    let full = Infinity;
    if (detect) {
      const counts = new Map();
      for (const x of indents) if (x !== null) counts.set(x, (counts.get(x) || 0) + 1);
      let best = null;
      for (const [x, c] of counts) {
        if (!best || c > best[1] || (c === best[1] && x < best[0])) best = [x, c];
      }
      if (best && best[1] >= EDGE_MIN_LINES) {
        edge = best[0];
        full = FULL_LINE * median(lines.filter((l, i) => indents[i] === edge).map((l) => l.trim().length));
      }
    }

    const paragraphs = [];
    let cur = "";
    let pendingHyphen = false;

    const end = () => {
      const t = cur.replace(/[ \t]+/g, " ").trim();
      if (t) paragraphs.push(t);
      cur = "";
      pendingHyphen = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        end();
        continue;
      }
      if (longText) {
        end();
        cur = line;
        end();
        continue;
      }
      const next = lines[i + 1] ? lines[i + 1].trim() : "";

      // Eine kurze Zeile ohne Satzzeichen am Ende, ganz in Versalien oder am
      // Anfang eines Absatzes vor einer groß beginnenden Zeile, ist eine
      // Überschrift ("Too Much History, Not Enough History"). Ein Absatz beginnt
      // nie mit einer kurzen Zeile, außer er ist selbst nur eine Zeile lang.
      // Deutlich kurz, weil im Deutschen jedes Substantiv groß beginnt und die
      // erste Zeile eines Absatzes knapp unter der Schwelle bleiben kann.
      const heading = !cur && cal && line.length <= HEADING_MAX * cal.width
        && !OPEN_END.test(line) && /^\p{Lu}/u.test(next);
      if (cal && !pendingHyphen && line.length <= cal.threshold && (capsLine(line) || heading)) {
        end();
        cur = line;
        end();
        continue;
      }

      if (cur && !pendingHyphen) {
        // Aufzählungszeichen öffnet einen Absatz.
        if (detect && BULLET_RE.test(line)) end();
        // Erstzeileneinzug öffnet einen Absatz — außer ein Zitat läuft weiter.
        else if (edge !== null) {
          const x = indents[i];
          const prev = lines[i - 1] ? lines[i - 1].trim() : "";
          const quoteGoesOn = indents[i - 1] === x && prev.length >= full && !CLOSED.test(prev);
          if (x - edge >= INDENT_MIN && x - edge <= INDENT_MAX && !quoteGoesOn) end();
        }
      }

      let ends = LINE_HYPHEN.test(line);
      if (ends && next && KEEP_HYPHEN_BEFORE.test(next)) ends = false;
      const piece = ends ? line.slice(0, -1) : line;

      cur = pendingHyphen ? cur + piece : (cur ? cur + " " + piece : piece);
      pendingHyphen = ends;

      // Ein Absatz beginnt nicht klein: "«la caduta »" / "e che è, piuttosto".
      if (!ends && cal && !LOWER_START.test(next)) {
        const bare = line.replace(TRAILING_MARKERS, "").replace(TRAILING_NOTE_NUMBER, "$1");
        if (SENT_END.test(bare) && shortTail(bare.length, cal)) end();
      }
    }
    end();
    return paragraphs;
  }

  /** Wie splitParagraphs, Absätze durch eine Leerzeile getrennt. */
  function reflowText(text, options) {
    return splitParagraphs(text, options).join("\n\n");
  }

  root.ArchillatorParagraphs = { splitParagraphs, reflowText, calibrateThreshold };
})(typeof globalThis !== "undefined" ? globalThis : window);
