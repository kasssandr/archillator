# Struktur und Produktentscheidungen

Stand: Juli 2026 (Branch `chore/structure-cleanup`).

## Entscheidung

| Thema | Entscheidung |
|-------|----------------|
| Öffentliche Seite + akademische Story | **Vollständig und klar** — das ist die Untergrenze |
| Single-File-HTML als Dogma | **Vorerst beerdigt** — zu starr bei DOCX-Bridge, Sync, Tests |
| Portabilität | Ordner/ZIP mit den nötigen Dateien, nicht „eine magische HTML“ |
| Erweiterungen (z. B. Scriptor-Pipeline) | Keine künstlichen Hürden; JS-Module und klare Ordner sind ok |

## Öffentliches Produkt (was Nutzer brauchen)

```
index.html          UI + App-Logik (Browser)
js/docx-bridge.js   DOCX rein/raus ohne Markdown-Umweg
```

Online: [archilles.org/archillator/](https://archilles.org/archillator/)  
Sync: `.github/workflows/sync-to-website.yml` kopiert **beide** Dateien (bzw. den `js/`-Baum).

Lokal ohne Installation: Repo klonen oder ZIP von GitHub, `index.html` im Browser öffnen.  
API-Keys bleiben im Browser (localStorage); kein Backend.

## Repo-Layout

```
archillator/
  index.html                 Einstieg (Web)
  js/
    docx-bridge.js           DOCX-Serialisierung / Roundtrip
  tests/                     Node-Tests (vor allem Bridge)
  scripts/
    check_briefing.mjs       Hilfsskript Prompt/Briefing
    archillator_desktop.py   Optional: Windows-Hotkey → Gemini (eigenständig)
  archive/                   Alte Designs — nicht Produkt
  docs/
    STRUCTURE.md             Diese Datei
  .github/workflows/         Sync nach archilles.org
```

## Offline-Download (ZIP)

**Empfehlung: GitHub hostet den Download.**

| Option | Wann |
|--------|------|
| **GitHub → Code → Download ZIP** | Immer aktueller Stand von `main`, null Pflege |
| **GitHub Releases** | Wenn du versionierte „Archillator 1.x“-Pakete willst |
| **Homepage (archilles.org)** | Optional später: Link *auf* GitHub, keine zweite Kopie pflegen |

Homepage als zweite Hosting-Stelle für denselben ZIP verdoppelt Arbeit und Drift-Risiko.  
Besser: Seite verlinkt „Lokal nutzen“ → GitHub ZIP oder Release.

## Orchester (Kontext, keine enge Kopplung)

Archillator sitzt neben:

- **Archilles** — Datenbank / Projekt-Ökosystem  
- **Scriptor** — PDF und andere Formate → maschinenlesbar (Markdown, DOCX)

Erfordernisse aus Scriptor können später hier ankommen (Marker, Formate, Batch).  
Die Multi-Datei-Struktur und getrennte Bridge sind dafür vorbereitet — ohne dass heute schon alles spekulativ gebaut wird.

## Desktop-Skript

`scripts/archillator_desktop.py` ist ein **separates** Windows-Hilfsmittel (Hotkey, Clipboard, Gemini).  
Es ist **nicht** feature-gleich mit der Web-App und kein Teil des öffentlichen Syncs.  
Abhängigkeiten: `requirements.txt` im Repo-Root.

## Was bewusst *nicht* im Root liegt

- Alte Single-File- / Fancy-Designs → `archive/legacy/`  
- Tests und Node-Dependencies → `tests/`  
- Claude/Editor-Lokalzeug → `.gitignore`
