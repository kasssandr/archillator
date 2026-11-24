/*
 * Nachprüfung der Seitenmarken nach der Übersetzung.
 *
 * Eine Seitenmarke [p. 51] steht im Quelltext dort, wo im Buch eine Seite
 * beginnt. Das Modell soll sie unverändert weitergeben – und macht dabei aus
 * gewöhnlichen Seitenangaben („p. 209“, „see p. 30“, „Bd. I, p. 53“) gern
 * ebenfalls Marken. Eine Briefing-Regel dagegen hat nicht getragen (Van der
 * Toorn, de Vries, Lévi). Darum hier deterministisch: Eine Übersetzung darf
 * nur die Marken tragen, die ihr Quellabsatz trägt. Jede weitere Marke wird
 * wieder zur Seitenangabe, also „[p. 209]“ → „p. 209“.
 *
 * Gezählt wird je Wortlaut der Marke. Steht dieselbe Marke im Quellabsatz
 * einmal, bleibt in der Übersetzung ihr erstes Vorkommen stehen.
 */
(function (root) {
  "use strict";

  const PAGE_MARKER = /\[p\. ([^\]\n]+)\]/g;

  /**
   * @returns {{text: string, restored: string[]}} die bereinigte Übersetzung
   *   und die Marken, die zu Seitenangaben zurückgesetzt wurden
   */
  function restorePageRefs(source, translated) {
    const allowed = new Map();
    for (const m of source.matchAll(PAGE_MARKER)) {
      allowed.set(m[0], (allowed.get(m[0]) || 0) + 1);
    }
    const restored = [];
    const text = translated.replace(PAGE_MARKER, (marker, label) => {
      const left = allowed.get(marker) || 0;
      if (left > 0) {
        allowed.set(marker, left - 1);
        return marker;
      }
      restored.push(marker);
      return `p. ${label}`;
    });
    return { text, restored };
  }

  root.ArchillatorMarkers = { restorePageRefs };
})(typeof globalThis !== "undefined" ? globalThis : window);
