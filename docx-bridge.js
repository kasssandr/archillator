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

  // Runs eines <w:p> zu markiertem Text: _kursiv_, [^n] fuer Fussnotenreferenzen.
  function serializeParagraph(pEl) {
    var out = "";
    childElements(pEl).forEach(function (child) {
      if (tag(child) !== "r") return;
      var text = "";
      var refs = "";
      var isNumberRun = false;
      childElements(child).forEach(function (node) {
        var name = tag(node);
        if (name === "t") text += node.textContent || "";
        else if (name === "footnoteReference") {
          refs += "[^" + node.getAttribute("w:id") + "]";
        } else if (name === "footnoteRef") {
          isNumberRun = true; // automatische Fussnotennummer, kein Inhalt
        }
      });
      if (isNumberRun) text = "";
      if (text) out += isItalic(child) ? "_" + text + "_" : text;
      out += refs;
    });
    return out;
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
      var translated = translations[i];
      if (!translated) continue; // ohne Uebersetzung bleibt das Original stehen
      var target =
        item.source === "body" ? bodyParas[item.paraIndex] : fnParas[item.paraIndex];
      if (!target) continue;
      rebuildParagraph(target, translated, item.source === "footnotes");
    }

    out.file("word/document.xml", serializeXml(docXml));
    if (fnXml) out.file("word/footnotes.xml", serializeXml(fnXml));
    return { zip: out, report: report };
  }

  // "Text _kursiv_ mehr[^3]" -> Segmente
  function parseMarkedText(text) {
    var segments = [];
    var re = /_([^_]+)_|\[\^(\d+)\]/g;
    var last = 0;
    var m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) {
        segments.push({ kind: "normal", text: text.slice(last, m.index) });
      }
      if (m[1] !== undefined) segments.push({ kind: "italic", text: m[1] });
      else segments.push({ kind: "footnoteRef", id: parseInt(m[2], 10) });
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
    var runs = childElements(pEl).filter(function (c) {
      return tag(c) === "r";
    });
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

    var t = doc.createElementNS(W, "w:t");
    t.setAttribute("xml:space", "preserve");
    t.appendChild(doc.createTextNode(segment.text));
    run.appendChild(t);
    return run;
  }

  function rebuildParagraph(pEl, text, isFootnote) {
    var doc = pEl.ownerDocument;
    var rPrTemplate = templateRPr(pEl);

    // Alte Runs entfernen. Bei Fussnoten bleibt der Nummern-Run stehen, sonst
    // verschwindet die Fussnotennummer. w:pPr wird nie angefasst - damit ueberleben
    // Style (Heading1), Ausrichtung, Abstaende, Einzuege.
    childElements(pEl).forEach(function (child) {
      if (tag(child) !== "r") return;
      if (isFootnote && isFootnoteRefRun(child)) return;
      pEl.removeChild(child);
    });

    // Fussnotentext beginnt konventionell mit einem Leerzeichen nach der Nummer.
    var body = isFootnote ? " " + text : text;
    parseMarkedText(body).forEach(function (segment) {
      pEl.appendChild(makeRun(doc, rPrTemplate, segment));
    });
  }

  root.docxToItems = docxToItems;
  root.itemsToDocx = itemsToDocx;
  root.serializeParagraph = serializeParagraph;
})(typeof globalThis !== "undefined" ? globalThis : window);
