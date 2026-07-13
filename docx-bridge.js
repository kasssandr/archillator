/* docx-bridge.js — DOCX rein, DOCX raus, ohne Markdown-Umweg.
 *
 * Folgt dem Muster von downloadAsEpub(): Original-ZIP klonen, nur die Textknoten an
 * ihrer gemerkten Position ersetzen. Alles Uebrige (Styles, Kopfzeilen, Deckblatt,
 * sectPr) bleibt unangetastet im ZIP liegen und muss nicht verstanden werden.
 *
 * Klassisches Script, kein ES-Modul: laeuft im Browser per <script>, in Node ueber
 * new Function(src). Nutzt DOMParser/XMLSerializer/JSZip aus globalThis.
 */
(function (root) {
  "use strict";

  var W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

  function tag(el) {
    return el.localName || String(el.nodeName).replace(/^.*:/, "");
  }

  function childElements(el) {
    var out = [];
    for (var i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === 1) out.push(el.childNodes[i]);
    }
    return out;
  }

  function parseXml(text) {
    return new root.DOMParser().parseFromString(text, "application/xml");
  }

  function serializeXml(doc) {
    return new root.XMLSerializer().serializeToString(doc);
  }

  // Ist der Run kursiv? (<w:i/> ohne w:val="0")
  function isItalic(runEl) {
    var rPr = null;
    childElements(runEl).forEach(function (c) {
      if (tag(c) === "rPr") rPr = c;
    });
    if (!rPr) return false;
    var italic = false;
    childElements(rPr).forEach(function (c) {
      if (tag(c) === "i" && c.getAttribute("w:val") !== "0") italic = true;
    });
    return italic;
  }

  // Alle Runs eines <w:p> in Dokumentreihenfolge - auch die in Wrappern.
  // Runs stecken nicht immer direkt unter <w:p>: <w:hyperlink> (im Josephus in einer
  // Fussnote), <w:smartTag>, <w:ins> umschliessen sie. Wer nur die direkten Kinder
  // liest, unterschlaegt deren Text - und laesst sie beim Rueckbau als Leiche stehen.
  function runsOf(pEl) {
    var runs = pEl.getElementsByTagNameNS(W, "r");
    var out = [];
    for (var i = 0; i < runs.length; i++) out.push(runs[i]);
    return out;
  }

  // Runs eines <w:p> zu markiertem Text: _kursiv_, [^n] fuer Fussnotenreferenzen,
  // \t fuer Tabulatoren.
  //
  // Word zerlegt zusammenhaengenden Text staendig in mehrere Runs (Rechtschreib- und
  // Revisionsmarken). Zwei aufeinanderfolgende kursive Runs duerfen NICHT je einzeln
  // ausgezeichnet werden - sonst entsteht "_A. __Introduction_" statt
  // "_A. Introduction_". Solche Doppel-Unterstriche verwirren das Uebersetzungsmodell
  // und der Kursivsatz geht verloren, sobald es sie normalisiert. Darum: benachbarte
  // Runs gleicher Auszeichnung erst zusammenfassen, dann markieren.
  function serializeParagraph(pEl) {
    var parts = []; // {italic: bool, text: string} - Refs als eigene Teile

    runsOf(pEl).forEach(function (child) {
      var text = "";
      var refs = "";
      var isNumberRun = false;
      childElements(child).forEach(function (node) {
        var name = tag(node);
        if (name === "t") text += node.textContent || "";
        else if (name === "tab") text += "\t";
        else if (name === "footnoteReference") {
          refs += "[^" + node.getAttribute("w:id") + "]";
        } else if (name === "footnoteRef") {
          isNumberRun = true; // automatische Fussnotennummer, kein Inhalt
        }
      });
      if (isNumberRun) text = "";

      if (text) {
        var italic = isItalic(child);
        var last = parts[parts.length - 1];
        if (last && last.italic === italic && !last.isRef) last.text += text;
        else parts.push({ italic: italic, text: text, isRef: false });
      }
      if (refs) parts.push({ italic: false, text: refs, isRef: true });
    });

    return parts
      .map(function (part) {
        return part.italic && !part.isRef ? "_" + part.text + "_" : part.text;
      })
      .join("");
  }

  // Traegt der Absatz uebersetzbaren Text (mindestens ein nichtleeres w:t)?
  function hasText(pEl) {
    var nodes = pEl.getElementsByTagNameNS(W, "t");
    for (var i = 0; i < nodes.length; i++) {
      if ((nodes[i].textContent || "").trim()) return true;
    }
    return false;
  }

  // Fussnoten-IDs in Referenz-Reihenfolge eines Absatzes.
  function footnoteIdsOf(pEl) {
    var ids = [];
    var refs = pEl.getElementsByTagNameNS(W, "footnoteReference");
    for (var i = 0; i < refs.length; i++) {
      ids.push(parseInt(refs[i].getAttribute("w:id"), 10));
    }
    return ids;
  }

  async function docxToItems(zip) {
    var docXml = parseXml(await zip.file("word/document.xml").async("string"));
    var paragraphs = docXml.getElementsByTagNameNS(W, "p");

    // footnotes.xml ist optional (nicht jedes DOCX hat Fussnoten).
    var fnFile = zip.file("word/footnotes.xml");
    var fnParaIdxById = {}; // fnId -> Index des <w:p> in footnotes.xml
    var fnTextById = {}; // fnId -> markierter Text
    if (fnFile) {
      var fnXml = parseXml(await fnFile.async("string"));
      var notes = fnXml.getElementsByTagNameNS(W, "footnote");
      var allFnParas = fnXml.getElementsByTagNameNS(W, "p");
      for (var n = 0; n < notes.length; n++) {
        var id = parseInt(notes[n].getAttribute("w:id"), 10);
        if (isNaN(id) || id < 1) continue; // separator / continuationSeparator
        var p = notes[n].getElementsByTagNameNS(W, "p")[0];
        if (!p || !hasText(p)) continue;
        for (var k = 0; k < allFnParas.length; k++) {
          if (allFnParas[k] === p) fnParaIdxById[id] = k;
        }
        fnTextById[id] = serializeParagraph(p).trim();
      }
    }

    var items = [];
    for (var i = 0; i < paragraphs.length; i++) {
      if (!hasText(paragraphs[i])) continue;
      items.push({
        text: serializeParagraph(paragraphs[i]),
        source: "body",
        paraIndex: i,
        fnId: null,
      });
      // Die Fussnote gehoert direkt hinter ihren Absatz: Das Modell sieht sie im
      // Zusammenhang ("Ebd." bezieht sich auf das eben Gelesene) und es entsteht
      // kein Block kontextloser Kurzbelege, den Modelle zu verweigern neigen.
      footnoteIdsOf(paragraphs[i]).forEach(function (fnId) {
        if (!(fnId in fnTextById)) return;
        items.push({
          text: fnTextById[fnId],
          source: "footnotes",
          paraIndex: fnParaIdxById[fnId],
          fnId: fnId,
        });
      });
    }
    return items;
  }

  // ---------------------------------------------------------------- Export

  // Klont das Original-ZIP vollstaendig. Alles, was wir nicht anfassen, ueberlebt:
  // Styles, Kopfzeilen, Deckblatt, Bilder, sectPr - nichts davon muss verstanden werden.
  async function cloneZip(zip) {
    var out = new root.JSZip();
    var names = Object.keys(zip.files);
    for (var i = 0; i < names.length; i++) {
      var entry = zip.files[names[i]];
      if (entry.dir) {
        out.folder(names[i]);
      } else {
        out.file(names[i], await entry.async("arraybuffer"));
      }
    }
    return out;
  }

  async function itemsToDocx(zip, items, translations) {
    var out = await cloneZip(zip);
    var report = [];

    var docXml = parseXml(await zip.file("word/document.xml").async("string"));
    var bodyParas = docXml.getElementsByTagNameNS(W, "p");

    var fnFile = zip.file("word/footnotes.xml");
    var fnXml = fnFile ? parseXml(await fnFile.async("string")) : null;
    var fnParas = fnXml ? fnXml.getElementsByTagNameNS(W, "p") : [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var problem = checkTranslation(item, translations[i]);
      if (problem) {
        // Original stehen lassen. Niemals eine Fehlermeldung ins Dokument schreiben -
        // im fertigen DOCX faellt sie niemandem auf.
        report.push({
          index: i,
          reason: problem,
          sample: item.text.slice(0, 70), // suchbares Textbeispiel
        });
        continue;
      }
      var target =
        item.source === "body" ? bodyParas[item.paraIndex] : fnParas[item.paraIndex];
      if (!target) continue;
      rebuildParagraph(target, translations[i], item.source === "footnotes");
    }

    out.file("word/document.xml", serializeXml(docXml));
    if (fnXml) out.file("word/footnotes.xml", serializeXml(fnXml));
    return { zip: out, report: report };
  }

  // "Text _kursiv_ mehr[^3]\tTab" -> Segmente
  function parseMarkedText(text) {
    var segments = [];
    var re = /_([^_]+)_|\[\^(\d+)\]|\t/g;
    var last = 0;
    var m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) {
        segments.push({ kind: "normal", text: text.slice(last, m.index) });
      }
      if (m[1] !== undefined) segments.push({ kind: "italic", text: m[1] });
      else if (m[2] !== undefined) segments.push({ kind: "footnoteRef", id: parseInt(m[2], 10) });
      else segments.push({ kind: "tab" });
      last = re.lastIndex;
    }
    if (last < text.length) segments.push({ kind: "normal", text: text.slice(last) });
    return segments;
  }

  // Schema-Reihenfolge in w:rPr. Bei falscher Reihenfolge verweigert Word die Datei.
  var RPR_ORDER = ["rStyle", "rFonts", "b", "bCs", "i", "iCs", "caps", "smallCaps",
    "strike", "dstrike", "outline", "shadow", "emboss", "imprint", "noProof",
    "snapToGrid", "vanish", "webHidden", "color", "spacing", "w", "kern", "position",
    "sz", "szCs", "highlight", "u", "effect", "bdr", "shd", "fitText", "vertAlign",
    "rtl", "cs", "em", "lang", "eastAsianLayout", "specVanish", "oMath"];

  function insertOrdered(rPr, child) {
    var idx = RPR_ORDER.indexOf(tag(child));
    var kids = childElements(rPr);
    for (var i = 0; i < kids.length; i++) {
      var pos = RPR_ORDER.indexOf(tag(kids[i]));
      if (pos > idx) {
        rPr.insertBefore(child, kids[i]);
        return;
      }
    }
    rPr.appendChild(child);
  }

  // Ist das der Run mit der automatischen Fussnotennummer (<w:footnoteRef/>)?
  function isFootnoteRefRun(runEl) {
    return runEl.getElementsByTagNameNS(W, "footnoteRef").length > 0;
  }

  // Vorlage-rPr: erster Run mit w:t-Text. Bei Fussnoten ausdruecklich NICHT der
  // Nummern-Run - dessen Stil ist hochgestellt und wuerde den ganzen Text hochstellen.
  function templateRPr(pEl) {
    var runs = runsOf(pEl);
    for (var i = 0; i < runs.length; i++) {
      if (isFootnoteRefRun(runs[i])) continue;
      if (runs[i].getElementsByTagNameNS(W, "t").length === 0) continue;
      var rPr = childElements(runs[i]).filter(function (c) {
        return tag(c) === "rPr";
      })[0];
      return rPr ? rPr.cloneNode(true) : null;
    }
    return null;
  }

  function makeRun(doc, rPrTemplate, segment) {
    var run = doc.createElementNS(W, "w:r");

    if (segment.kind === "footnoteRef") {
      // Referenz-Run: eigener Stil, keine geerbte Textformatierung.
      var refPr = doc.createElementNS(W, "w:rPr");
      var style = doc.createElementNS(W, "w:rStyle");
      style.setAttribute("w:val", "FootnoteReference");
      refPr.appendChild(style);
      run.appendChild(refPr);
      var ref = doc.createElementNS(W, "w:footnoteReference");
      ref.setAttribute("w:id", String(segment.id));
      run.appendChild(ref);
      return run;
    }

    var rPr = rPrTemplate ? rPrTemplate.cloneNode(true) : doc.createElementNS(W, "w:rPr");
    if (segment.kind === "italic") {
      var hasItalic = childElements(rPr).some(function (c) {
        return tag(c) === "i";
      });
      if (!hasItalic) insertOrdered(rPr, doc.createElementNS(W, "w:i"));
    }
    if (childElements(rPr).length) run.appendChild(rPr);

    if (segment.kind === "tab") {
      run.appendChild(doc.createElementNS(W, "w:tab"));
      return run;
    }

    var t = doc.createElementNS(W, "w:t");
    t.setAttribute("xml:space", "preserve");
    t.appendChild(doc.createTextNode(segment.text));
    run.appendChild(t);
    return run;
  }

  function rebuildParagraph(pEl, text, isFootnote) {
    var doc = pEl.ownerDocument;
    var rPrTemplate = templateRPr(pEl);

    // Alte Inhalte entfernen: Runs UND ihre Wrapper (<w:hyperlink>, <w:smartTag>,
    // <w:ins> ...). Ein stehengebliebener Wrapper wuerde seinen Text doppelt und an
    // falscher Stelle ins Dokument bringen. Die Verlinkung selbst geht dabei verloren,
    // der Text ueberlebt uebersetzt - Textverlust waere das schwerere Uebel.
    // Bei Fussnoten bleibt der Nummern-Run stehen, sonst verschwindet die Nummer.
    // w:pPr wird nie angefasst - damit ueberleben Style (Heading1), Ausrichtung,
    // Abstaende, Einzuege.
    childElements(pEl).forEach(function (child) {
      var name = tag(child);
      if (name === "pPr") return;
      if (isFootnote && name === "r" && isFootnoteRefRun(child)) return;
      if (name === "r" || child.getElementsByTagNameNS(W, "r").length > 0) {
        pEl.removeChild(child);
      }
    });

    // Fussnotentext beginnt konventionell mit einem Leerzeichen nach der Nummer.
    var body = isFootnote ? " " + text : text;
    parseMarkedText(body).forEach(function (segment) {
      pEl.appendChild(makeRun(doc, rPrTemplate, segment));
    });
  }

  function markersOf(text) {
    return (text.match(/\[\^\d+\]/g) || []).sort().join(",");
  }

  // Grund, warum die Uebersetzung nicht eingesetzt werden darf - oder null.
  function checkTranslation(item, translated) {
    if (!translated || !String(translated).trim()) return "nicht uebersetzt";
    // Der Archillator schreibt bei API-Fehlern "[ERROR: ...]" + den Originaltext in den
    // Absatz. Das darf nie ins Dokument geraten.
    if (translated.indexOf("[ERROR:") !== -1) return "ERROR-Block der Uebersetzung";
    if (translated.indexOf("[CONTENT FILTER") !== -1) return "ERROR: Content-Filter";
    if (markersOf(translated) !== markersOf(item.text)) {
      return (
        "Fussnoten-Marker weichen ab (erwartet: " + (markersOf(item.text) || "keine") + ")"
      );
    }
    if ((translated.match(/_/g) || []).length % 2 !== 0) {
      return "unbalancierte _-Auszeichnung";
    }
    return null;
  }

  // Nach Dokumentposition sortiert, je Eintrag ein suchbares Textbeispiel -
  // interne Indizes sind im Textverarbeiter unsichtbar.
  function formatReport(report) {
    if (!report.length) return "Keine Beanstandungen. Alle Absaetze uebersetzt.\n";
    var lines = ["Pruefbericht - " + report.length + " Stelle(n), Original eingesetzt:", ""];
    report.forEach(function (entry) {
      lines.push("Abs. " + entry.index + "  " + entry.reason);
      lines.push('   "' + entry.sample + '"');
    });
    return lines.join("\n") + "\n";
  }

  root.docxToItems = docxToItems;
  root.itemsToDocx = itemsToDocx;
  root.serializeParagraph = serializeParagraph;
  root.checkTranslation = checkTranslation;
  root.formatReport = formatReport;
})(typeof globalThis !== "undefined" ? globalThis : window);
