# PageScribe

<div align="center">

**Turn any webpage into clean Markdown.**

An open-source, privacy-first, text-only Chrome Extension built for students, developers, writers, researchers, and Obsidian/Notion power users.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-success.svg)](manifest.json)
[![Tests](https://img.shields.io/badge/Tests-31%20Passed-brightgreen.svg)](tests/)
[![Privacy: 100% Local](https://img.shields.io/badge/Privacy-100%25%20Local-indigo.svg)](PRIVACY.md)

</div>

---

## Overview

**PageScribe** converts any webpage's meaningful textual content into beautifully formatted, structured Markdown with a single click. 

Unlike cluttered web clippers that download gigabytes of heavy images, track user activity, or send page contents to remote third-party AI APIs, PageScribe executes **entirely in your browser**, adhering to a **strict text-only extraction policy**.

### Target Users
* **Students:** Collect lecture notes, research papers, and study guides in distraction-free Markdown.
* **Developers:** Capture API documentation, error guides, and technical blog posts with syntax-preserved code blocks.
* **Researchers & Writers:** Archive references and articles cleanly for Obsidian, Logseq, Notion, or personal knowledge bases.
* **Minimalists:** Anyone who prefers lightweight, portable, plain-text Markdown notes without advertising banners, cookies, or media bloat.

---

## Strict Text-Only Extraction Policy

PageScribe is intentionally engineered to extract **TEXT ONLY**. It will never download, embed, or export images or media.

### What is Included:
* Webpage title
* Headings (`H1`–`H6`) converted to `#` through `######`
* Paragraphs with clean spacing
* Bold (`**text**`), italic (`*text*`), and strikethrough (`~~text~~`)
* Ordered lists (`1.`) and unordered lists (`-`) with full nesting support
* Blockquotes (`>`)
* Hyperlinks (`[text](url)`)
* Tables converted to GitHub Flavored Markdown (`| col1 | col2 |`)
* Inline code (`` `code` ``) and fenced code blocks (```` ```lang ````)
* Document metadata headers (Title, Source URL, capture timestamp)

### What is Completely Excluded:
* Images (`<img>`, `<picture>`, `<source>`, `<figure>`)
* Image URLs and alt text (no `![]()` syntax generated)
* Videos (`<video>`, YouTube/Vimeo embeds, `<canvas>`)
* Audio players (`<audio>`)
* SVGs and decorative icons
* Advertisements and sponsored widget blocks
* Navigation bars, headers, footers, and sidebars
* Cookie banners, consent popups, and notification modals
* Social sharing buttons and tracking beacons
* Hidden elements (`display: none`, `[hidden]`, `[aria-hidden="true"]`)

---

## Core Features

### 1. One-Click Conversion
Detects the active webpage, cleans interface artifacts, converts the text to Markdown, and displays the result instantly in the popup.

### 2. Three Extraction Modes
* **Article Mode (Default):** Utilizes Mozilla Readability to isolate the primary article body while stripping extraneous layout elements.
* **Full Text Mode:** Extracts all visible, meaningful content across documentation pages, multi-column layouts, and technical references.
* **Selection Mode:** Highlight specific text or paragraphs on any page and click "Selection" (or right-click) to convert only the selected portion.

### 3. Markdown Preview & Raw Modes
* **Preview Mode:** Renders Markdown into safe, readable typography with full XSS sanitization.
* **Raw Mode:** Inspect and edit the plain Markdown source code.
* Real-time **word count** and **character count** indicators.

### 4. Seamless Clipboard & File Export
* **Copy Markdown:** One-click copy with visual feedback, formatted and ready to paste into Obsidian, Notion, Bear, or VS Code.
* **Download `.md`:** Generates clean, sanitized file names based on the webpage title (e.g., `pagescribe-understanding-microservices.md`) with UTF-8 encoding.
* **Copy Title & Copy URL:** Quick-copy buttons for fast citation management.

### 5. Context Menu Integration
Right-click on highlighted webpage text and choose **"Convert selection to Markdown (PageScribe)"** to copy markdown directly without opening the popup.

### 6. Light & Dark Themes
Includes a system-adaptive theme with manual toggles for both light and dark developer aesthetics.

---

## User Interface

```
+-------------------------------------------------------+
|  [PageScribe Icon] PageScribe [Text-Only]   [Theme] [*]|
+-------------------------------------------------------+
|  Understanding Microservices Architecture             |
|  https://example.com/microservices                    |
+-------------------------------------------------------+
|  [ Article ]        [ Full Text ]       [ Selection ] |
+-------------------------------------------------------+
|  [Preview] [Raw Markdown]       [Copy Title] [Copy URL]|
|                                                       |
|  # Understanding Microservices Architecture           |
|  > Source: https://example.com/microservices          |
|                                                       |
|  Microservices are an architectural style that...     |
|                                                       |
|  1,420 words  *  9,850 chars         (Article Mode)   |
+-------------------------------------------------------+
|  [ Convert / Regenerate ]   [ Copy Markdown ] [Download]|
+-------------------------------------------------------+
```

---

## Installation Guide

### Manual Installation (Developer Mode)

You can install PageScribe directly into Chrome in less than 60 seconds:

1. **Clone or Download** this repository:
   ```bash
   git clone https://github.com/shaikhakib12/web2markdown.git
   cd web2markdown
   ```
   *(Or download and extract the ZIP file from GitHub).*

2. Open Google Chrome and enter `chrome://extensions` in the address bar.

3. In the top-right corner, switch the **Developer mode** toggle to **ON**.

4. Click the **Load unpacked** button in the top-left toolbar.

5. Select the `pagescribe` folder (the directory containing `manifest.json`).

6. The PageScribe extension icon will appear in your Chrome toolbar. Click the puzzle icon to pin PageScribe for 1-click access!

---

## Technology Stack

* **Manifest V3:** Adheres to the latest Chrome Extension security standards.
* **Vanilla JavaScript ES6+:** Zero frontend framework bloat; sub-millisecond execution.
* **Mozilla Readability.js:** Industry-standard content extraction engine (bundled locally).
* **Turndown.js & GFM Plugin:** Robust HTML-to-Markdown converter with tables support (bundled locally).
* **CSS3 Custom Properties:** Fluid responsive layouts with system/light/dark theming.
* **Node.js Test Runner:** Built-in test execution via `node --test` with 31 comprehensive unit tests.

---

## Project Structure

```
pagescribe/
│
├── manifest.json              # Chrome Extension Manifest V3 configuration
│
├── popup/                     # Extension popup interface
│   ├── popup.html             # UI structure & accessible buttons
│   ├── popup.css              # Light/dark theme styles & responsive layout
│   └── popup.js               # Conversion controller, clipboard, & export
│
├── scripts/                   # Core business logic
│   ├── content.js             # Tab DOM extractor (Article, Full Text, Selection)
│   ├── background.js          # Service worker for context menus & install
│   ├── converter.js           # Text-only Turndown markdown conversion engine
│   ├── sanitizer.js           # XSS-safe markdown preview renderer
│   ├── bundle-libs.js         # Vendor bundling script
│   └── generate-icons.js      # Crisp PNG icon generator
│
├── lib/                       # Bundled local vendor dependencies
│   ├── readability.js         # Mozilla Readability standalone
│   ├── turndown.js            # Turndown HTML-to-Markdown standalone
│   └── turndown-plugin-gfm.js # GitHub Flavored Markdown tables plugin
│
├── options/                   # Settings page
│   ├── options.html           # Settings interface
│   ├── options.css            # Settings styling
│   └── options.js             # chrome.storage synchronization
│
├── icons/                     # Extension icons
│   ├── icon16.png             # 16x16 toolbar icon
│   ├── icon48.png             # 48x48 extensions management icon
│   └── icon128.png            # 128x128 Chrome Web Store icon
│
├── tests/                     # Automated test suite
│   ├── converter.test.js      # Heading, table, code, and image exclusion tests
│   ├── extraction.test.js     # Readability, full text, and cleaner tests
│   ├── filename.test.js       # Title slugification and sanitization tests
│   └── sanitizer.test.js      # XSS protection and preview rendering tests
│
├── store-assets/              # Chrome Web Store graphics & listing metadata
│   ├── STORE_LISTING.md       # Store metadata, description & permissions declarations
│   ├── PUBLISHING_CHECKLIST.md# Step-by-step developer submission guide
│   ├── store-icon-128.png     # 128x128 store icon
│   ├── promo-small-440x280.png# 440x280 small promo tile
│   ├── promo-marquee-1400x560.png # 1400x560 marquee promo tile
│   └── screenshot-*.png       # 1280x800 high-res store screenshots
│
├── dist/                      # Distribution artifacts
│   ├── pagescribe-v1.0.0.zip  # Release-ready package for Chrome Web Store
│   └── RELEASE_INFO.json      # Checksum, version, and file manifest metadata
│
├── .github/                   # GitHub templates
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md      # Bug report template
│   │   └── feature_request.md # Feature request template
│   └── PULL_REQUEST_TEMPLATE.md
│
├── README.md                  # Project documentation
├── CONTRIBUTING.md            # Open source contribution guide
├── LICENSE                    # MIT License
├── PRIVACY.md                 # Detailed privacy policy & permissions audit
├── .gitignore                 # Git ignore configuration
└── package.json               # Development scripts & test runner
```

---

## Chrome Permissions & Security

PageScribe requests only the minimum necessary permissions:

| Permission | Purpose |
| :--- | :--- |
| `activeTab` | Temporary access to the currently active tab when the extension is invoked. |
| `scripting` | Executes DOM extraction scripts in the current tab. |
| `storage` | Stores user formatting preferences (light/dark theme, default mode). |
| `contextMenus` | Provides right-click "Convert selection to Markdown" option. |
| `downloads` | Downloads the generated `.md` file to your computer. |

PageScribe **never** transmits page content to external servers. No telemetry, analytics, or background crawlers are used. For full details, see [PRIVACY.md](PRIVACY.md).

---

## Development & Automated Testing

### Prerequisites
* Node.js v18.0.0 or later
* npm v9.0.0 or later

### Running Tests
Execute the automated test suite using Node's native test runner:

```bash
npm test
```

### Test Coverage Summary (31 Tests Passing):
* **Article & Full Text Extraction:** Mozilla Readability parsing, semantic `<main>` / `<article>` detection, hidden element removal.
* **Strict Image Exclusion:** Verified zero `<img>`, `<picture>`, `<svg>`, `<canvas>`, or `![]()` markdown output.
* **Formatting Rules:** Headings H1–H6, nested lists, blockquotes, code blocks with syntax languages, GFM tables.
* **XSS Protection:** Escaping of raw HTML, blocking of `javascript:` links, stripping inline event handlers (`onerror`, `onload`).
* **Filename Sanitizer:** Illegal character stripping (`: * ? " < > |`), word boundary truncation, safe defaults.

---

## Troubleshooting

### "Restricted Webpage" Error
* **Cause:** Chrome security policy strictly prevents extensions from executing scripts on internal system pages (`chrome://*`, `edge://*`, `about:blank`) and the Chrome Web Store (`chromewebstore.google.com`).
* **Resolution:** Navigate to any standard website (Wikipedia, news, blog, GitHub, documentation) and invoke PageScribe.

### "No Readable Content Found"
* **Cause:** The page may be heavily protected by canvas-based renderers, empty single-page applications before hydration, or behind authentication overlays.
* **Resolution:** Switch to **Full Text Mode** or highlight text and use **Selection Mode**.

### Clipboard Copy Not Working
* **Cause:** Browser window lost focus or clipboard permissions were blocked.
* **Resolution:** PageScribe automatically triggers an internal fallback. If issue persists, switch to **Raw Markdown Mode**, select all (`Ctrl+A` / `Cmd+A`), and copy manually.

---

## Chrome Web Store Preparation & Distribution

PageScribe includes automated release packaging and pre-formatted store assets:

1. **Verify Extension Compliance:**
   ```bash
   npm run verify
   ```
   *Validates Manifest V3 compliance, icons, file paths, and local dependency integrity.*

2. **Build Distribution Package:**
   ```bash
   npm run package
   ```
   *Generates `dist/pagescribe-v1.0.0.zip` ready for upload to the Chrome Developer Dashboard.*

3. **Store Listing & Review Checklist:**
   * Review metadata and permission justifications in [store-assets/STORE_LISTING.md](store-assets/STORE_LISTING.md).
   * Follow the step-by-step submission guide in [store-assets/PUBLISHING_CHECKLIST.md](store-assets/PUBLISHING_CHECKLIST.md).
   * Ready-to-upload store icon (128x128), promo tiles (440x280, 1400x560), and screenshots (1280x800) are located in `store-assets/`.

---

## Contributing

Contributions are welcomed! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) guide for details on our code of conduct, development workflow, and PR submission guidelines.

---

## License

PageScribe is released under the **[MIT License](LICENSE)**. Feel free to use, modify, and distribute it freely.
