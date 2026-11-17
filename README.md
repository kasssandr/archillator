# ARCHILLATOR
A browser-based translation tool for academic texts, designed for researchers and humanities scholars who need to translate books, articles, and documents while preserving formatting and ensuring accurate scholarly terminology.

**Part of the [Archilles](https://archilles.org) project.**

## Features

- **Five Translation Providers:** Google Gemini, OpenAI GPT, Anthropic Claude, OpenRouter (free models), and Ollama (local, free)
- **Three Modes:** Passage mode for quick translations, Document mode for entire files, Proofread mode for spelling correction
- **Multiple Input Formats:** DOCX, EPUB, TXT, Markdown (.md)
- **Smart Output:** DOCX/EPUB inputs produce DOCX output (easy Calibre conversion back to EPUB)
- **Checkpoint System:** Automatic progress saving – resume interrupted translations
- **Batch Processing:** Translates multiple paragraphs per API call for efficiency
- **Academic Styles:** Choose between scholarly, neutral, simplified, or literal translation styles
- **Apparatus-Preserving Translation:** The style *Archilles (scholarly, marker-preserving)* translates a document prepared by [Scriptor](https://github.com/kasssandr/archilles-scriptor) and leaves its footnote anchors, page markers, region markers and protected titles exactly where they are (see [Translating a prepared document](#translating-a-prepared-document))
- **PDF Text Cleaning:** Automatically fixes line breaks and hyphenation and detects paragraphs when you paste text copied from a PDF
- **Proofread without Style Changes:** Fix spelling and grammar without unwanted "improvements" (unlike DeepL Write)

## Quick Start

**Online:** open [archilles.org/archillator/](https://archilles.org/archillator/) — no install.

**Local (folder, not a single file):**

1. Clone this repo, or download a ZIP from GitHub (**Code → Download ZIP**)
2. Keep `index.html` and the `js/` folder together
3. Open `index.html` in a modern browser
4. Enter your API key (Gemini, OpenAI, Anthropic, or OpenRouter) — or pick Ollama and use no key at all
5. Choose target language and style → paste text or upload a file → translate

There is no backend. Keys stay in your browser’s localStorage and go only to the API you choose.

### Offline ZIP: GitHub or homepage?

**Prefer GitHub** as the download host:

| Source | Role |
|--------|------|
| **GitHub → Download ZIP** (or a **Release**) | Source of truth, always in sync with the code |
| **Homepage** | Optional “Local use” *link* to that ZIP/Release — don’t maintain a second copy |

See also [docs/STRUCTURE.md](docs/STRUCTURE.md).

## Supported Providers & Models

### Ollama (local, free)
Run open-source models entirely on your own machine — no API key, no costs, no data leaving your computer.

- Any model installed via `ollama pull`, e.g. **llama3.2**, **mistral**, **gemma3**, **phi4**, **qwen2.5**
- Quality varies by model; for academic translation, 7B+ parameter models work best

**Requires setup:** see [Ollama Setup](#ollama-setup) below.

### OpenRouter (free models)
One key, many models — including a rotating selection of free ones.

- **Auto — best available free model** (`openrouter/free`) – Lets OpenRouter pick from whatever is currently free. Survives the constant churn in the free line-up.
- **Nemotron 3 Ultra 550B** (free) and **Gemma 4 31B** (free)
- **Gemini 3.8 Flash** (paid) – if you want quality through the same key

**Caveat worth knowing:** free models are rate-limited (roughly 20 requests per minute) and many of them are *reasoning* models. On a long passage such a model can spend its entire output budget on internal thinking and return nothing at all. Archillator reports this clearly instead of crashing — the fix is to translate a shorter passage or switch models.

### Google Gemini
- **Gemini 3.1 Flash-Lite** – Fast and cheap, recommended default (~$0.04 per 100k chars)
- **Gemini 3.8 Flash** – Stronger, Google's recommended Flash model (~$0.11 per 100k chars; promotional price through 2026, doubles on 1 January 2027)
- **Gemini 4 Argon** – Google's flagship, best quality (~$0.30 per 100k chars)

**Free tier:** since April 2026, only Flash and Flash-Lite still have a free tier — **Pro models and Gemini 4 Argon are paid-only.**
**Note:** Gemini's free tier may use your data for model training. For sensitive content, use the paid tier or another provider.

### OpenAI
- **GPT-6 Luna** – Fast and very cheap (~$0.02 per 100k chars)
- **GPT-6.1 Terra** – Balanced, OpenAI pitches it for natural writing (~$0.15 per 100k chars)
- **GPT-6.1 Sol** – Strong, close to Astra (~$0.30 per 100k chars)
- **GPT-6 Astra** – Current flagship, best quality (~$1.50 per 100k chars)

**Note:** OpenAI has no free tier — an OpenAI key without credit on the account returns "You exceeded your current quota" on every request.

### Anthropic Claude
- **Claude Haiku 5.5** – Fast and very cheap (~$0.02 per 100k chars)
- **Claude Sonnet 5.5** – Balanced quality and cost (recommended, ~$0.30 per 100k chars)
- **Claude Opus 5.5** – Highest quality (~$0.60 per 100k chars; always thinks a little first, run at the lowest effort)

## When to Use Which Provider

| Scenario | Recommended Provider |
|----------|---------------------|
| Zero cost, full privacy | Ollama (local) |
| Zero cost, no local GPU | OpenRouter (free models) |
| Large documents, cost-sensitive | Gemini 3.1 Flash-Lite |
| Sensitive topics (gender, sexuality, politics) | Claude Sonnet 5.5 |
| Best overall quality | Claude Opus 5.5 or GPT-6 Astra |
| Fastest processing | Gemini 3.1 Flash-Lite |

**Note:** Gemini has strict content filters that may block academic texts on sensitive topics. Claude is significantly more tolerant of scholarly content.

## Translation Styles

- **Academic / scholarly** – Preserves technical terminology, formal tone
- **Neutral / general** – Clear, accessible language
- **Simplified / readable** – Avoids jargon, easier to read
- **As literal as possible** – Closest to source text structure
- **Archilles (scholarly, marker-preserving)** – Scholarly register, plus a fixed set of rules that keep the markers of a prepared document in place. For Scriptor-prepared Markdown; see the next section

## Translating a Prepared Document

A *prepared document* is what [archilles-scriptor](https://github.com/kasssandr/archilles-scriptor) makes of a scholarly PDF: Markdown in which every footnote is still attached to its sentence and every page break carries the page number as printed. Translated with an ordinary style, such a text loses exactly that. Models localize `[p. 51]` to `[S. 51]`, translate the titles in the notes, put a plain "see p. 30" in brackets as if it were a marker, and invent note texts where only a reference stands.

The style **Archilles (scholarly, marker-preserving)** is made for these documents.

**Workflow:**

1. In Scriptor, write the translation profile: `scriptor translate-prep book.md --out book.translate.md`. It wraps what is provably bibliographic (URLs, quoted work titles in footnotes) in `<dnt>…</dnt>`.
2. In Archillator, open **Document mode** and upload `book.translate.md`.
3. Choose the style **Archilles (scholarly, marker-preserving)** and the target language, then translate.
4. Download. Markdown in gives Markdown out.

You do not need the briefing file that `translate-prep` writes next to the profile. The style contains its rules. The briefing is for translating the same file somewhere else, in a chat or another tool.

**What stays exactly as it is:**

| Marker | Meaning | What the model does |
|--------|---------|---------------------|
| `[^12]` | Footnote reference | Kept, attached to the same word |
| `[^12]: …` | Footnote definition | Marker and colon kept, the note text translated; never merged into a neighbouring paragraph, never invented |
| `[p. 51]` | Page marker with the printed page label | Kept, not localized, not renumbered, same position in the sentence. A plain "see p. 30" in the text is not a marker and is translated normally |
| `[region: bibliography]` | Region marker | Kept on its own line, the name never translated |
| `<dnt>…</dnt>` | Do not translate: titles, sigla, foreign terms | Tags kept and the text between them reproduced verbatim |
| `#`, `##` | Headings | Hashes kept, heading text translated |
| `_…_` | Emphasis | Underscores kept, the text inside translated |
| `---` block at the top | The document's metadata block | Untouched |

Work titles, proper names and bibliographic references are left verbatim even where they carry no tag, above all inside footnotes. The rule the model is given: when in doubt, do not translate, because bibliographic precision outranks completeness.

**On download** the `<dnt>` tags are removed. They protect titles during translation and are no part of the finished text. While you work they stay visible, so you can see what was protected.

**What the tool does on its own:**

- A footnote definition the model added, although the source paragraph only carries the reference, is dropped. This happens with books whose notes are collected at the end.
- If a batch comes back with the wrong number of paragraphs, its paragraphs are translated again one by one instead of being assigned by guess.
- Overload, rate limits and network failures are waited out and retried, with pauses growing from 10 seconds to 5 minutes. A limit that waiting cannot lift (no credit, a daily cap) stops the run at once.

**What to check after a run.** The markers make a translation checkable, so check it:

- Search the output for `[ERROR` and `[CONTENT FILTER`. A paragraph that failed for good is left in the source language under such a line.
- The footnote references of the translation should be the same set as in the source, and each definition should appear once.
- The sequence of `[p. …]` markers should be identical to the source's.

**What you get.** A translation in which a citation still resolves: page 51 of the translation is page 51 of the printed book, and note 12 is note 12. The wording belongs to the source; page, occurrence and note number survive.

If you keep prepared documents as bundles in an [Archilles](https://github.com/kasssandr/archilles) library, save the translation somewhere else than the book's bundle folder. A bundle folder with two prepared documents in it is not read at all.

## Working with Different File Types

### EPUB files
1. Upload EPUB → Tool translates → Downloads as DOCX
2. Open DOCX in Calibre → Convert back to EPUB

### DOCX files
1. Upload DOCX → Tool translates → Downloads as DOCX
2. The output is the original file with its text replaced: styles, headings and footnotes stay in place, and italics are carried through the translation

### Markdown files
Markdown in gives Markdown out, with its syntax intact. For a Scriptor-prepared document use the Archilles style (see [Translating a prepared document](#translating-a-prepared-document)).

### PDF files
PDF conversion tools (including Calibre) often produce poor results with broken paragraphs and formatting issues. Two ways around that:

**A whole book:** prepare it with [Scriptor](https://github.com/kasssandr/archilles-scriptor) and translate the result as described above. This is the way to keep footnotes and page numbers.

**A passage:** use **Passage mode**:

1. Copy text from PDF page by page or section by section
2. Paste into the input field
3. Use "Clean & Translate"
4. Check the paragraph breaks in the result; where the detection missed one, insert an empty line in the input and run it again

The tool will automatically fix hyphenation, merge broken lines and detect paragraphs.

## Checkpoint System

The tool automatically saves progress during long translations:
- Checkpoints saved after each batch (10 paragraphs)
- If the browser closes or crashes, you can resume
- Checkpoints expire after 24 hours
- For very large documents (>500 paragraphs), only translated text is saved (re-upload original file to resume)

## Three Modes

### Passage Mode
For quick translations of text copied from PDFs or other sources.

**Features:**
- Paste text directly into the input field
- Automatic PDF text cleaning (fixes line breaks, hyphenation, spacing)
- Single line breaks → spaces (flowing text)
- Double line breaks → paragraph breaks
- Hyphenated words at line ends → joined
- **History:** Last 20 translations saved locally (click 📋 to restore)

**Buttons:**
- **Clean only** – Just fix formatting, no translation
- **Translate only** – Translate without cleaning (for already clean text)
- **Clean & Translate** – Both operations

**Paragraph handling.** With **"Detect paragraphs automatically"** checked (the default), the tool finds paragraphs in pasted PDF text and in TXT files by the rules Scriptor uses, as far as they work without page geometry: a short line that ends a sentence closes a paragraph, a first-line indent or a bullet opens one, and no paragraph begins after a line that ends in a hyphen. An empty line always separates paragraphs. Uncheck the box and only empty lines count: *you* mark the paragraphs, and everything else is joined into one flowing paragraph. How the paragraphs then appear in the output is controlled by the **"Blank lines between paragraphs"** checkbox:

- **Checked** – paragraphs are separated by a blank line (double line break)
- **Unchecked** – paragraphs are separated by a single line break

This applies to every output — cleaning, translation, and document mode alike. Internally the tool always keeps the double break, so the model sees an unambiguous paragraph boundary; your setting is applied on the way out, never on the way to the model.

**Best for:** PDF content, short passages, quick lookups

### Document Mode
For translating entire books and documents.

**Features:**
- Upload DOCX, EPUB, TXT, or Markdown files
- Batch processing (10 paragraphs per API call for efficiency)
- Automatic checkpoint saving (resume after interruption)
- Overload, rate limits and network failures are retried with growing pauses instead of leaving the paragraph untranslated
- Progress tracking with detailed log
- DOCX output built from the original file (styles, headings and footnotes kept)
- The Archilles style for Scriptor-prepared Markdown (see [Translating a prepared document](#translating-a-prepared-document))

**Output formats:**
- DOCX input → DOCX output
- EPUB input → DOCX output (convert back to EPUB with Calibre)
- TXT input → TXT output
- Markdown input → Markdown output (preserves formatting syntax)

**Best for:** Books, articles, long documents

### Proofread Mode
For spelling and grammar correction without style changes – a DeepL Write alternative that doesn't "improve" your writing.

**Correction levels:**
- **Spelling only** – Typos, missing umlauts (ä, ö, ü, ß), ALL CAPS → normal capitalization. No other changes.
- **+ Punctuation** – Also fixes commas, periods, quotation marks
- **+ Grammar** – Also fixes grammatical errors, but still no rewording

**History:** Last 20 corrections saved locally (click 📋 to restore)

**Best for:** OCR text with missing umlauts, scanned documents, text in ALL CAPS

**Note:** Unlike DeepL Write, this mode is explicitly instructed NOT to change word choice, sentence structure, or writing style.

## Cost Estimates

Approximate costs per 100,000 characters (input + output). Derived from the providers' token prices as of November 2026 — treat them as a rough order of magnitude, not a quote.

| Model | Cost |
|-------|------|
| Ollama (local) | **Free** |
| OpenRouter free models | **Free** (rate-limited) |
| GPT-6 Luna | ~$0.02 |
| Claude Haiku 5.5 | ~$0.02 |
| Gemini 3.1 Flash-Lite | ~$0.04 |
| Gemini 3.8 Flash | ~$0.11 |
| GPT-6.1 Terra | ~$0.15 |
| GPT-6.1 Sol | ~$0.30 |
| Claude Sonnet 5.5 | ~$0.30 |
| Gemini 4 Argon | ~$0.30 |
| Claude Opus 5.5 | ~$0.60 |
| GPT-6 Astra | ~$1.50 |

A typical 300-page book (~500,000 characters) costs approximately:
- Free with Ollama (local) or OpenRouter's free models
- $0.20 with Gemini 3.1 Flash-Lite
- $1.50 with Claude Sonnet 5.5
- $3.00 with Claude Opus 5.5

## API Keys

### Google Gemini
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Free tier includes generous limits

### OpenAI
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Requires payment method on file

### Anthropic Claude
1. Go to [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Create a new API key
3. Requires payment method on file

### OpenRouter
1. Go to [OpenRouter Keys](https://openrouter.ai/keys)
2. Create a new API key
3. No payment method needed for the `:free` models — but they are rate-limited

**Privacy:** API keys are stored only in your browser's localStorage and sent directly to the respective APIs. They never pass through any third-party server.

---

## Ollama Setup

Ollama lets you run large language models locally — no API key, no costs, no data leaving your machine.

### 1. Install Ollama

Download from [ollama.com](https://ollama.com) and install for your OS (macOS, Linux, Windows).

### 2. Choose a model

*Model recommendations last updated: 2 May 2026.*

The right model depends on your GPU memory (VRAM). Ollama uses Q4_K_M quantization by default — a good balance of quality and size.

**Rule of thumb:** A 3–4B model needs ~2.5–3.5 GB VRAM and runs well on consumer GPUs. 7B models need ~4–4.5 GB and may partially spill into CPU RAM (slower, but still usable).

| Model | Size | VRAM | Best for |
|-------|------|------|----------|
| `qwen2.5:3b` | 3B | ~2.5 GB | **Recommended.** Best multilingual quality in class — DE/EN/FR/IT very natural |
| `translategemma:4b` | 4B | ~3 GB | **Translation-optimized** (Gemma 3 base, fine-tuned for translation) |
| `phi4:mini` | 3.8B | ~3 GB | Strong reasoning → coherent, consistent translations |
| `gemma3:4b` | 4B | ~3.3 GB | Solid all-rounder from Google |
| `llama3.2:3b` | 3B | ~2 GB | Reliable fallback, broad community support |
| `qwen2.5:7b` | 7B | ~4.1 GB | Better quality if your GPU can handle it |

**Start here:** `qwen2.5:3b` or `translategemma:4b` — currently the strongest options for EN/DE/FR/IT translation on modest hardware.

```bash
ollama pull qwen2.5:3b
ollama pull translategemma:4b
```

The VRAM column lists the weights only. A loaded model also needs room for its
KV cache and compute buffers, which is what the next section is about.

### 3. Cap the context window (important on small GPUs)

Ollama loads a model with the context length its manifest declares. For
`translategemma:4b` that is 131,072 tokens. Because the KV cache is sized from
the context, a model listed at ~3 GB of weights can ask for more than 4 GB once
it is loaded. If your card cannot supply that, Ollama does not fail: it moves
the surplus layers into CPU RAM and translation slows down, with nothing in the
UI to tell you why.

Archillator translates paragraph by paragraph and never needs more than a few
thousand tokens of context. Pin a smaller one with a Modelfile:

```bash
printf 'FROM translategemma:4b\nPARAMETER num_ctx 8192\n' > Modelfile
ollama create translategemma:4b-8k -f Modelfile
```

Enter `translategemma:4b-8k` in the Model field. The variant shares its weights
blob with the original, so it occupies no additional disk space.

Two environment variables shrink the cache further and are worth setting once:

```bash
OLLAMA_FLASH_ATTENTION=1
OLLAMA_KV_CACHE_TYPE=q8_0
```

To see what actually happened, run `ollama ps` while a translation is running:

```
NAME                  SIZE     PROCESSOR          CONTEXT
translategemma:4b-8k  4.3 GB   84%/16% CPU/GPU    8192
```

`CONTEXT` confirms the cap took effect. It applies on the OpenAI-compatible
endpoint that Archillator uses, not only on Ollama's native API. `PROCESSOR` is
the number that decides your speed. A high CPU share like the one above means
the model did not fit, so either free the GPU of whatever else is sitting on it
or switch to a smaller model.

### 4. Allow browser access (CORS) — one-time setup

Browsers block requests to `localhost` from web pages by default. The solution is to set an environment variable that tells Ollama to allow this. **Do this once and you never have to think about it again.**

#### Windows (recommended: permanent setting)

1. Press the Windows key → search for **"Umgebungsvariablen"** → click "Umgebungsvariablen für dieses Konto bearbeiten"
2. In the upper section (user variables) → click **New**
3. Variable name: `OLLAMA_ORIGINS`  
   Variable value: `*`
4. Click OK → OK
5. Restart Ollama once (right-click the tray icon → Quit, then reopen)

From now on Ollama always starts with browser access enabled — nothing more to do.

#### macOS / Linux (permanent setting)

Add this line to your shell profile (`~/.zshrc`, `~/.bashrc`, or `~/.profile`):

```bash
export OLLAMA_ORIGINS="*"
```

Then run `source ~/.zshrc` (or restart the terminal) and restart Ollama.

#### Temporary alternative (any OS)

If you only want to enable it for one session, start Ollama manually from a terminal — but this window must stay open while translating:

```bash
# macOS / Linux
OLLAMA_ORIGINS=* ollama serve

# Windows PowerShell
$env:OLLAMA_ORIGINS="*"; ollama serve
```

> **Note:** If Ollama is already running in the background (auto-started at login), quit it first via the system tray before using the temporary method.

### 5. Use in Archillator

1. Select **🦙 Ollama** in the provider tabs
2. Leave the host as `http://localhost:11434` (default) or enter a custom host if running Ollama on another machine
3. Enter the model name exactly as you pulled it (e.g. `qwen2.5:3b`)
4. Translate as usual — no API key required

## Technical Details

- Pure client-side JavaScript – no server required
- **Layout:** `index.html` (UI + translation logic) + `js/docx-bridge.js` (DOCX in/out via ZIP clone) + `js/paragraphs.js` (paragraph detection for PDF text, ported from Scriptor)
- **JSZip** for DOCX and EPUB as ZIP archives
- DOCX export keeps the original package structure (styles, footnotes, headings) where possible
- All processing happens in your browser
- No data is sent anywhere except to the translation API you choose
- Optional Windows hotkey helper: `scripts/archillator_desktop.py` (not the web app; see `requirements.txt`)
- Old single-file / design experiments live under `archive/` and are **not** the product

## Limitations

- EPUB output not directly supported (use Calibre to convert from DOCX)
- Very large files may hit browser memory limits
- API rate limits may slow down translation of large documents
- Checkpoint size limited by localStorage (~5-10 MB)
- **Passage mode sends the pasted text as a single request.** Document mode splits the text into batches, passage mode does not — so a very long passage can exceed the model's output limit. Paste less at a time, or use Document mode. This bites soonest with OpenRouter's free reasoning models, which burn their output budget on thinking.

## Comparison with DeepL

| Feature | Archillator | DeepL Pro |
|---------|-------------|-----------|
| File size limit | Unlimited* | 1 million chars |
| Files per month | Unlimited | 3-5 depending on plan |
| Content filtering | Minimal (Claude) | Moderate |
| Academic terminology | Customizable style | Fixed |
| Cost model | Pay per use | Subscription |
| Privacy | Direct API calls | DeepL servers |

*Limited by browser memory and API rate limits

## License

MIT License – free for personal and commercial use.

## Repo map

| Path | Role |
|------|------|
| `index.html` | Web UI and translation orchestration |
| `js/docx-bridge.js` | Academic DOCX round-trip |
| `js/paragraphs.js` | Paragraph detection for pasted PDF text |
| `tests/` | Automated tests (bridge and paragraph detection) |
| `scripts/` | Helpers (briefing check; optional desktop tool) |
| `archive/` | Retired designs — not shipped as the product |
| `docs/STRUCTURE.md` | Product decisions and layout |

Website sync copies `index.html` and the two files in `js/` to archilles.org. Edit only in **this** repo.

## Contributing

Scriptor prepares, Archilles retrieves, Archillator translates — three tools,
one path: from the printed apparatus to a citable answer, in any language, on
your own machine. Scriptor and Archillator stand alone. Archilles installs
Scriptor as a library, because it reads prepared documents through Scriptor's
own reader instead of keeping a copy of the format. All three
are developed under one fixed charter: **local-first, source-true, the scholar
as the acting subject**. Contributions are welcome within that charter; beyond
it, the license invites forks.

The interchange contract of the family — the *prepared document* — is specified
in [PREPARED_FORMAT_SPEC](https://github.com/kasssandr/archilles-scriptor/blob/main/docs/PREPARED_FORMAT_SPEC.md);
for Archillator its §7 (the `<dnt>` convention) is the binding part; the style
*Archilles (scholarly, marker-preserving)* is where Archillator keeps it. Since
version 0.4.0 two more rules bind it. A heading's printed designator (letters,
digits, roman numerals) is carried over unchanged, while a designator in
words (`Erstes Kapitel`) is text and is translated; a Pandoc identifier `{#…}`
on a heading, should one appear, passes through untouched (§4.4). A citation
address survives translation in its invariant part — page, occurrence, note —
while the wording belongs to the source (§4.7).

For bug reports, feature requests, or contributions, please visit [archilles.org](https://archilles.org).

---

*Built for the humanities research community*
