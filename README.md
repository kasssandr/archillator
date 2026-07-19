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
- **PDF Text Cleaning:** Automatically fixes line breaks, hyphenation, and paragraph spacing when you paste text copied from a PDF
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
- **Nemotron 3 Super 120B** (free) and **Gemma 4 31B** (free)
- **Gemini 3.5 Flash** (paid) – if you want quality through the same key

**Caveat worth knowing:** free models are rate-limited (roughly 20 requests per minute) and many of them are *reasoning* models. On a long passage such a model can spend its entire output budget on internal thinking and return nothing at all. Archillator reports this clearly instead of crashing — the fix is to translate a shorter passage or switch models.

### Google Gemini
- **Gemini 3.1 Flash-Lite** – Fast and cheap, recommended default (~$0.04 per 100k chars)
- **Gemini 3.5 Flash** – Stronger, built for agentic and coding work (~$0.26 per 100k chars)
- **Gemini 3.1 Pro** – Best quality from Google (~$0.35 per 100k chars)

**Free tier:** since April 2026, only Flash and Flash-Lite still have a free tier — **Pro models are paid-only.**
**Note:** Gemini's free tier may use your data for model training. For sensitive content, use the paid tier or another provider.

### OpenAI
- **GPT-5.6 Luna** – Fast and cheap (~$0.18 per 100k chars)
- **GPT-5.6 Terra** – Balanced (~$0.44 per 100k chars)
- **GPT-5.6 Sol** – Current flagship, best quality (~$0.88 per 100k chars)

**Note:** OpenAI has no free tier — an OpenAI key without credit on the account returns "You exceeded your current quota" on every request.

### Anthropic Claude
- **Claude Haiku 4.5** – Fast and affordable (~$0.15 per 100k chars)
- **Claude Sonnet 5** – Balanced quality and cost (recommended)
- **Claude Opus 4.8** – Highest quality (~$0.75 per 100k chars)

## When to Use Which Provider

| Scenario | Recommended Provider |
|----------|---------------------|
| Zero cost, full privacy | Ollama (local) |
| Zero cost, no local GPU | OpenRouter (free models) |
| Large documents, cost-sensitive | Gemini 3.1 Flash-Lite |
| Sensitive topics (gender, sexuality, politics) | Claude Sonnet 5 |
| Best overall quality | Claude Opus 4.8 or GPT-5.6 Sol |
| Fastest processing | Gemini 3.1 Flash-Lite |

**Note:** Gemini has strict content filters that may block academic texts on sensitive topics. Claude is significantly more tolerant of scholarly content.

## Translation Styles

- **Academic / scholarly** – Preserves technical terminology, formal tone
- **Neutral / general** – Clear, accessible language
- **Simplified / readable** – Avoids jargon, easier to read
- **As literal as possible** – Closest to source text structure

## Working with Different File Types

### EPUB files
1. Upload EPUB → Tool translates → Downloads as DOCX
2. Open DOCX in Calibre → Convert back to EPUB

### DOCX files
1. Upload DOCX → Tool translates → Downloads as DOCX
2. Formatting preserved (paragraphs, spacing)

### PDF files
PDF conversion tools (including Calibre) often produce poor results with broken paragraphs and formatting issues. Instead, use **Passage mode**:

1. Copy text from PDF page by page or section by section
2. Paste into the input field
3. Mark paragraph breaks manually with double line breaks (empty line)
4. Use "Clean & Translate"

The tool will automatically fix hyphenation and merge broken lines.

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

**Paragraph handling.** There is no automatic paragraph detection, and that is deliberate — guessing where a paragraph ends is exactly what other tools get wrong. *You* mark the paragraphs by inserting a double line break (an empty line); everything else is treated as one flowing paragraph and joined. How those paragraphs then appear in the output is controlled by the **"Blank lines between paragraphs"** checkbox:

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
- Progress tracking with detailed log
- DOCX output (preserves paragraph structure)

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

Approximate costs per 100,000 characters (input + output). Derived from the providers' token prices as of July 2026 — treat them as a rough order of magnitude, not a quote.

| Model | Cost |
|-------|------|
| Ollama (local) | **Free** |
| OpenRouter free models | **Free** (rate-limited) |
| Gemini 3.1 Flash-Lite | ~$0.04 |
| Claude Haiku 4.5 | ~$0.15 |
| GPT-5.6 Luna | ~$0.18 |
| Gemini 3.5 Flash | ~$0.26 |
| Gemini 3.1 Pro | ~$0.35 |
| GPT-5.6 Terra | ~$0.44 |
| Claude Sonnet 5 | ~$0.45 |
| Claude Opus 4.8 | ~$0.75 |
| GPT-5.6 Sol | ~$0.88 |

A typical 300-page book (~500,000 characters) costs approximately:
- Free with Ollama (local) or OpenRouter's free models
- $0.20 with Gemini 3.1 Flash-Lite
- $2.25 with Claude Sonnet 5
- $4.40 with GPT-5.6 Sol

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

### 3. Allow browser access (CORS) — one-time setup

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

### 4. Use in Archillator

1. Select **🦙 Ollama** in the provider tabs
2. Leave the host as `http://localhost:11434` (default) or enter a custom host if running Ollama on another machine
3. Enter the model name exactly as you pulled it (e.g. `qwen2.5:3b`)
4. Translate as usual — no API key required

## Technical Details

- Pure client-side JavaScript – no server required
- **Layout:** `index.html` (UI + translation logic) + `js/docx-bridge.js` (DOCX in/out via ZIP clone)
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
| `tests/` | Automated tests (mainly the bridge) |
| `scripts/` | Helpers (briefing check; optional desktop tool) |
| `archive/` | Retired designs — not shipped as the product |
| `docs/STRUCTURE.md` | Product decisions and layout |

Website sync copies `index.html` and `js/docx-bridge.js` to archilles.org. Edit only in **this** repo.

## Contributing

Scriptor prepares, Archilles retrieves, Archillator translates — three tools,
one path: from the printed apparatus to a citable answer, in any language, on
your own machine. Each tool stands alone; none requires the others. All three
are developed under one fixed charter: **local-first, source-true, the scholar
as the acting subject**. Contributions are welcome within that charter; beyond
it, the license invites forks.

The interchange contract of the family — the *prepared document* — is specified
in [PREPARED_FORMAT_SPEC](https://github.com/kasssandr/archilles-scriptor/blob/main/docs/PREPARED_FORMAT_SPEC.md);
for Archillator its §7 (the `<dnt>` convention) is the binding part.

For bug reports, feature requests, or contributions, please visit [archilles.org](https://archilles.org).

---

*Built for the humanities research community*
