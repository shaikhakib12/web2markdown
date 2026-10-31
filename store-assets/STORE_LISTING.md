# Chrome Web Store Listing Package: PageScribe

This document contains all official store metadata, descriptions, permissions justifications, and privacy declarations required when submitting PageScribe to the Chrome Web Store Developer Dashboard.

---

## 1. Store Metadata

| Field | Value | Constraints / Notes |
| :--- | :--- | :--- |
| **Extension Name** | `PageScribe - Clean Web to Markdown` | 34 / 45 characters max |
| **Short Description** | `Turn any webpage into clean, text-only Markdown with one click. Privacy-first, 100% local, no images, ads, or trackers.` | 119 / 132 characters max |
| **Primary Category** | `Productivity` | Alternative: `Developer Tools` |
| **Primary Language** | `English` | |
| **Homepage URL** | `https://github.com/shaikhakib12/web2markdown` | |
| **Support / Issues URL**| `https://github.com/shaikhakib12/web2markdown/issues` | |
| **Privacy Policy URL** | `https://github.com/shaikhakib12/web2markdown/blob/main/PRIVACY.md` | Publicly accessible HTTPS URL |

---

## 2. Detailed Store Description

*Copy and paste the text below into the "Detailed description" field on the Chrome Developer Dashboard:*

```markdown
Turn any webpage into clean, structured Markdown with a single click.

PageScribe is an open-source, privacy-first, text-only Chrome Extension designed for students, developers, writers, researchers, and Obsidian/Notion users.

Unlike heavy clippers that download gigabytes of unwanted images, execute background tracking, or send your sensitive reading data to external cloud AI services, PageScribe works 100% locally in your browser.

==================================================
STRICT TEXT-ONLY EXTRACTION POLICY
==================================================
PageScribe extracts TEXT ONLY. It will never download, embed, or export images or media.

WHAT IS INCLUDED:
* Webpage title and headings (H1–H6)
* Clean paragraphs and blockquotes
* Bold, italic, and strikethrough text
* Ordered and unordered lists (with nested list support)
* Hyperlinks (clean [text](url) format)
* GitHub Flavored Markdown (GFM) tables
* Fenced code blocks with language detection and inline code
* Document source attribution headers (URL and capture timestamp)

WHAT IS COMPLETELY EXCLUDED:
* Images, picture tags, and SVG vectors
* Image URLs and alt text (no ![]() syntax)
* Videos, audio players, and canvas elements
* Navigation bars, headers, footers, and sidebars
* Cookie consent banners, popups, and notification modals
* Advertisements and sponsored widget blocks
* Social sharing buttons and tracking scripts
* Hidden elements and website UI chrome

==================================================
CORE FEATURES
==================================================
1. ONE-CLICK CONVERSION:
Instantly detect the active webpage, filter out noise, and convert readable text into structured Markdown.

2. THREE EXTRACTION MODES:
* Article Mode: Powered by Mozilla Readability to extract clean article and blog post bodies.
* Full Text Mode: Captures all visible content across technical documentation, manuals, and multi-column layouts.
* Selection Mode: Highlight specific paragraphs on any page and convert only the selected text.

3. MARKDOWN PREVIEW & RAW MODES:
* Preview Mode: High-readability rendered view with built-in XSS protection.
* Raw Mode: Monospaced source editor for direct editing.
* Real-time word count and character count statistics.

4. SEAMLESS CLIPBOARD & FILE EXPORT:
* One-click "Copy Markdown" with fallback support.
* Download as clean UTF-8 .md files with sanitized filenames (e.g., pagescribe-understanding-microservices.md).
* Quick-copy buttons for page titles and source URLs.

5. CONTEXT MENU INTEGRATION:
Highlight any text on the web, right-click, and select "Convert selection to Markdown (PageScribe)" to instantly copy clean Markdown to your clipboard.

6. MODERN LIGHT & DARK THEMES:
Adaptive system theme with developer-friendly Light and Dark modes.

==================================================
100% PRIVATE & LOCAL
==================================================
* Zero External Servers: PageScribe never transmits webpage content to external servers.
* No Remote AI APIs: All parsing is executed by local algorithms inside your browser.
* No Analytics or Tracking: Zero telemetry, tracking pixels, or diagnostic beacons.
* No Account Required: Free and open-source under the MIT License.

Repository: https://github.com/shaikhakib12/web2markdown
```

---

## 3. Single Purpose Statement

*Enter into the "Single Purpose" compliance prompt:*

> "PageScribe converts the readable text content of active webpages into clean, text-only Markdown directly inside the user's browser."

---

## 4. Permissions Justifications

*Copy into the "Permission Justification" fields on the Developer Dashboard:*

### `activeTab`
> "Required to access the Document Object Model (DOM) of the user's currently active webpage when they explicitly click the PageScribe extension icon or trigger a context menu action. PageScribe does not access background tabs or unvisited pages."

### `scripting`
> "Required to execute the local content extraction script within the active tab to parse readable text nodes into clean Markdown."

### `storage`
> "Required to persist the user's formatting preferences across browser sessions (e.g., default extraction mode, table preservation, metadata header options, and Light/Dark theme selection) using chrome.storage."

### `contextMenus`
> "Required to add the 'Convert selection to Markdown (PageScribe)' context menu item when users highlight text on a webpage."

### `downloads`
> "Required to allow users to save their converted Markdown documents directly to their computer's Downloads folder as UTF-8 encoded .md files."

---

## 5. Privacy Practices Declarations

When completing the Chrome Web Store Privacy tab, select the following declarations:

1. **User Data Collection:**
   * Does your extension collect any user data? -> **No** (PageScribe processes all content locally in memory and transmits nothing).
2. **Data Transfers:**
   * Does your extension transfer data to third-party servers? -> **No**.
3. **Data Sale:**
   * Do you sell or transfer user data? -> **No**.
4. **Credit / Authentication:**
   * Does the extension require credentials or payment? -> **No**.
5. **Code Execution:**
   * Does the extension load any external or remote executable scripts (e.g. from CDNs)? -> **No** (all libraries are bundled locally in compliance with Manifest V3).

---

## 6. Store Visual Assets Reference

All verified graphic assets are located in `store-assets/`:

| Asset File | Dimensions | Purpose |
| :--- | :--- | :--- |
| `store-icon-128.png` | 128 x 128 px | Official Store Icon |
| `promo-small-440x280.png` | 440 x 280 px | Small Promo Tile (Search & Category listings) |
| `promo-marquee-1400x560.png`| 1400 x 560 px | Marquee Promo Tile (Featured header banner) |
| `screenshot-1-article-mode.png` | 1280 x 800 px | Screenshot 1: Article Mode Conversion |
| `screenshot-2-raw-mode.png` | 1280 x 800 px | Screenshot 2: Raw Markdown & Syntax |
| `screenshot-3-settings.png` | 1280 x 800 px | Screenshot 3: Settings & Privacy Options |
