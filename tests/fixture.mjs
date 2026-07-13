import JSZip from "jszip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

export function loadGlobals() {
  globalThis.DOMParser = DOMParser;
  globalThis.XMLSerializer = XMLSerializer;
  globalThis.JSZip = JSZip;
}

const W =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

// Absatz 0: Heading1. Absatz 1: Fliesstext mit Kursiv + 2 Fussnoten. Absatz 2: leer.
const DOCUMENT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${W}><w:body>
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
  <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>I</w:t></w:r>
  <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:tab/></w:r>
  <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>INTRODUCTION</w:t></w:r>
</w:p>
<w:p>
  <w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve">Josephus in </w:t></w:r>
  <w:r><w:rPr><w:i/><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve">The </w:t></w:r>
  <w:r><w:rPr><w:i/><w:sz w:val="24"/></w:rPr><w:t>Jewish War</w:t></w:r>
  <w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve"> says so.</w:t></w:r>
  <w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteReference w:id="1"/></w:r>
  <w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve"> And again.</w:t></w:r>
  <w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteReference w:id="2"/></w:r>
</w:p>
<w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr>
</w:body></w:document>`;

const FOOTNOTES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:footnotes ${W}>
<w:footnote w:type="separator" w:id="-1"><w:p><w:r><w:separator/></w:r></w:p></w:footnote>
<w:footnote w:type="continuationSeparator" w:id="0"><w:p><w:r><w:continuationSeparator/></w:r></w:p></w:footnote>
<w:footnote w:id="1"><w:p><w:pPr><w:pStyle w:val="FootnoteText"/></w:pPr>
  <w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteRef/></w:r>
  <w:r><w:t xml:space="preserve"> Hadas-Lebel, 1993:51.</w:t></w:r>
</w:p></w:footnote>
<w:footnote w:id="2"><w:p><w:pPr><w:pStyle w:val="FootnoteText"/></w:pPr>
  <w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteRef/></w:r>
  <w:r><w:t xml:space="preserve"> Vgl. </w:t></w:r>
  <w:hyperlink r:id="rId1"><w:r><w:t>Acts 23:11</w:t></w:r></w:hyperlink>
  <w:r><w:t xml:space="preserve"> und Ibid.</w:t></w:r>
</w:p></w:footnote>
</w:footnotes>`;

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/>
</Types>`;

export async function buildMiniDocx() {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES);
  zip.file("word/document.xml", DOCUMENT_XML);
  zip.file("word/footnotes.xml", FOOTNOTES_XML);
  zip.file("word/styles.xml", `<?xml version="1.0"?><w:styles ${W}/>`);
  return zip;
}
