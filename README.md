# ARCHILLATOR
A browser-based translation tool for academic texts, designed for researchers and humanities scholars who need to translate books, articles, and documents while preserving formatting and ensuring accurate scholarly terminology.

**Part of the [Archilles](https://archilles.org) project.**

## Features

- **Four Translation Providers:** Google Gemini, OpenAI GPT, Anthropic Claude, and Ollama (local, free)
- **Three Modes:** Passage mode for quick translations, Document mode for entire files, Proofread mode for spelling correction
- **Multiple Input Formats:** DOCX, EPUB, TXT, Markdown (.md)
- **Smart Output:** DOCX/EPUB inputs produce DOCX output (easy Calibre conversion back to EPUB)
- **Checkpoint System:** Automatic progress saving – resume interrupted translations
- **Batch Processing:** Translates multiple paragraphs per API call for efficiency
- **Academic Styles:** Choose between scholarly, neutral, simplified, or literal translation styles
- **PDF Text Cleaning:** Automatically fixes line breaks, hyphenation, and paragraph spacing when you paste text copied from a PDF
- **Proofread without Style Changes:** Fix spelling and grammar without unwanted "improvements" (unlike DeepL Write)

## Quick Start

1. Open `archillator.html` in any modern browser
2. Enter your API key (Gemini, OpenAI, and/or Anthropic)
3. Choose your target language and style
4. Either paste text (Passage mode, Proofread mode) or upload a file (Document mode)
5. Click translate and download the result

## Supported Providers & Models

### Ollama (local, free)
Run open-source models entirely on your own machine — no API key, no costs, no data leaving your computer.

- Any model installed via `ollama pull`, e.g. **llama3.2**, **mistral**, **gemma3**, **phi4**, **qwen2.5**
- Quality varies by model; for academic translation, 7B+ parameter models work best

**Requires setup:** see [Ollama Setup](#ollama-setup) below.

### Google Gemini
- **Gemini 3 Flash** – Fast and cheap, recommended default (~$0.015 per 100k chars)
- **Gemini 2.5 Flash** – Stable alternative
- **Gemini 2.5 Pro** – Best quality from Google

**Free tier available:** Gemini offers generous free usage limits, making it ideal for testing and smaller projects.
**Note:** Gemini's free tier may use your data for model training. For sensitive content, use the paid tier or another provider.

### OpenAI
- **GPT-4o Mini** – Proven workhorse, fast and cheap (~$0.02 per 100k chars)
- **GPT-5.4 Nano** – New, very cheap option (~$0.01 per 100k chars)
- **GPT-5.4 Mini** – Balanced new option (~$0.025 per 100k chars)
- **GPT-5.5** – Current flagship, best quality (~$0.50 per 100k chars)


### Anthropic Claude
- **Claude Haiku 4.5** – Fast and affordable (~$0.04 per 100k chars)
- **Claude Sonnet 4.6** – Balanced quality and cost (recommended)
- **Claude Opus 4.7** – Highest quality

## When to Use Which Provider

| Scenario | Recommended Provider |
|----------|---------------------|
| Zero cost, full privacy | Ollama (local) |
| Large documents, cost-sensitive | Gemini 3 Flash |
| Sensitive topics (gender, sexuality, politics) | Claude Sonnet |
| Best overall quality | Claude Sonnet or GPT-4o |
| Fastest processing | Gemini 3 Flash |

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

## Two Modes

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

Approximate costs per 100,000 characters (input + output):

| Model | Cost |
|-------|------|
| Ollama (local) | **Free** |
| GPT-5.4 Nano | ~$0.01 |
| Gemini 3 Flash | ~$0.015 |
| GPT-4o Mini | ~$0.02 |
| Gemini 2.5 Flash | ~$0.02 |
| GPT-5.4 Mini | ~$0.025 |
| Claude Haiku 4.5 | ~$0.04 |
| Claude Sonnet 4.6 | ~$0.15 |
| GPT-5.5 | ~$0.50 |
| Claude Opus 4.7 | ~$0.75 |

A typical 300-page book (~500,000 characters) costs approximately:
- Free with Ollama (local)
- $0.08 with Gemini 3 Flash
- $0.75 with Claude Sonnet 4.6
- $7.50 with GPT-5

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

### 3. Start Ollama with browser access (CORS)

Browsers block requests to `localhost` from web pages by default. You need to tell Ollama to allow this:

**macOS / Linux:**
```bash
OLLAMA_ORIGINS=* ollama serve
```

**Windows (PowerShell):**
```powershell
$env:OLLAMA_ORIGINS="*"; ollama serve
```

**Windows (Command Prompt):**
```cmd
set OLLAMA_ORIGINS=* && ollama serve
```

Keep this terminal window open while using the Archillator.

> **Tip:** If Ollama is already running in the background (e.g. started automatically at login), stop it first (`ollama stop` or quit from the system tray), then start it with the command above.

### 4. Use in Archillator

1. Select **🦙 Ollama** in the provider tabs
2. Leave the host as `http://localhost:11434` (default) or enter a custom host if running Ollama on another machine
3. Enter the model name exactly as you pulled it (e.g. `qwen2.5:3b`)
4. Translate as usual — no API key required

## Technical Details

- Pure client-side JavaScript – no server required
- Uses mammoth.js for DOCX reading
- Uses docx.js for DOCX writing
- Uses JSZip for EPUB handling
- All processing happens in your browser
- No data is sent anywhere except to the translation API you choose

## Limitations

- EPUB output not directly supported (use Calibre to convert from DOCX)
- Very large files may hit browser memory limits
- API rate limits may slow down translation of large documents
- Checkpoint size limited by localStorage (~5-10 MB)

## Comparison with DeepL

| Feature | Academic Text Translator | DeepL Pro |
|---------|-------------------------|-----------|
| File size limit | Unlimited* | 1 million chars |
| Files per month | Unlimited | 3-5 depending on plan |
| Content filtering | Minimal (Claude) | Moderate |
| Academic terminology | Customizable style | Fixed |
| Cost model | Pay per use | Subscription |
| Privacy | Direct API calls | DeepL servers |

*Limited by browser memory and API rate limits

## License

MIT License – free for personal and commercial use.

## Contributing

This tool is part of the Archilles project. For bug reports, feature requests, or contributions, please visit [archilles.org](https://archilles.org).

---

*Built with ❤️ for the humanities research community*
