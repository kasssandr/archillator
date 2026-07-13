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

  async function docxToItems(zip) {
    var docXml = parseXml(await zip.file("word/document.xml").async("string"));
    var paragraphs = docXml.getElementsByTagNameNS(W, "p");

    var items = [];
    for (var i = 0; i < paragraphs.length; i++) {
      if (!hasText(paragraphs[i])) continue;
      items.push({
        text: serializeParagraph(paragraphs[i]),
        source: "body",
        paraIndex: i,
        fnId: null,
      });
    }
    return items;
  }

  root.docxToItems = docxToItems;
  root.serializeParagraph = serializeParagraph;
})(typeof globalThis !== "undefined" ? globalThis : window);
