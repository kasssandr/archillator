# ARCHILLATOR
A browser-based translation tool for academic texts, designed for researchers and humanities scholars who need to translate books, articles, and documents while preserving formatting and ensuring accurate scholarly terminology.

**Part of the [Archilles](https://archilles.org) project.**

## Features

- **Three Translation Providers:** Google Gemini, OpenAI GPT, and Anthropic Claude
- **Three Modes:** Passage mode for quick translations, Document mode for entire files, Proofread mode for spelling correction
- **Multiple Input Formats:** DOCX, EPUB, TXT
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

### Google Gemini
- **Gemini 3 Flash** – Fastest, very cheap (~$0.02 per 100k chars)
- **Gemini 2.5 Flash** – Fast and affordable (~$0.02 per 100k chars)
- **Gemini 3 Pro** – Best quality from Google

**Free tier available:** Gemini offers generous free usage limits, making it ideal for testing and smaller projects.
**Note:** Gemini's free tier may use your data for model training. For sensitive content, use the paid tier or another provider.

### OpenAI
- **GPT-4o Mini** – Fast and cheap (~$0.02 per 100k chars)
- **GPT-4o** – High quality
- **GPT-4 Turbo** – Alternative high-quality option

### Anthropic Claude
- **Claude 3.5 Haiku** – Fast and affordable (~$0.04 per 100k chars)
- **Claude Sonnet 4** – Balanced quality and cost (recommended)
- **Claude Opus 4** – Highest quality

## When to Use Which Provider

| Scenario | Recommended Provider |
|----------|---------------------|
| Large documents, cost-sensitive | Gemini 3 Flash |
| Sensitive topics (gender, sexuality, politics) | Claude Sonnet 4 |
| Best overall quality | Claude Sonnet 4 or GPT-4o |
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
- Upload DOCX, EPUB, or TXT files
- Batch processing (10 paragraphs per API call for efficiency)
- Automatic checkpoint saving (resume after interruption)
- Progress tracking with detailed log
- DOCX output (preserves paragraph structure)

**Output formats:**
- DOCX input → DOCX output
- EPUB input → DOCX output (convert back to EPUB with Calibre)
- TXT input → TXT output

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
| Gemini 3 Flash | ~$0.015 |
| Gemini 2.5 Flash | ~$0.02 |
| GPT-4o Mini | ~$0.02 |
| Claude 3.5 Haiku | ~$0.04 |
| Claude Sonnet 4 | ~$0.15 |
| GPT-4o | ~$0.30 |
| Claude Opus 4 | ~$0.75 |

A typical 300-page book (~500,000 characters) costs approximately:
- $0.08 with Gemini 3 Flash
- $0.75 with Claude Sonnet 4
- $3.75 with Claude Opus 4

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
