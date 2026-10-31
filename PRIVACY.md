# PageScribe Privacy Policy

**Last Updated:** October 2026  
**Commitment:** 100% Local, Zero Telemetry, Strict Text-Only.

PageScribe was designed from day one with a strict, uncompromising **privacy-first architecture**. We believe your reading habits, study materials, research notes, and personal browsing history belong exclusively to you.

---

## 1. Core Privacy Guarantees

* **Zero Data Transmission:** PageScribe never transmits, uploads, relays, or syncs your webpage content or personal data to any external server or cloud service.
* **No External AI APIs:** PageScribe does not communicate with external AI servers, LLM APIs, or cloud parsers. All parsing and conversion are executed entirely in-browser.
* **No Telemetry or Tracking:** PageScribe contains no analytics scripts, tracking pixels, crash reporting beacons, or user identification tokens.
* **No Account Required:** You do not need to register, log in, or provide an email address or API key to use PageScribe.
* **No Remote Executable Code:** In compliance with Chrome Extension Manifest V3 security rules, PageScribe bundles all code locally and never loads external JavaScript from CDNs.

---

## 2. What Information PageScribe Accesses

When you actively click the PageScribe extension icon or select a context menu action, PageScribe accesses:

1. **Active Webpage Content:** PageScribe reads the DOM (Document Object Model) of the currently active browser tab solely to extract visible text and headings.
2. **Webpage URL & Title:** PageScribe reads the URL and title of the active tab to generate source attribution headers and sanitized markdown file names.
3. **Selected Text:** In Selection Mode, PageScribe reads only the text you explicitly highlighted on the page.

---

## 3. How Data Is Processed

All content extraction and conversion occur **in real-time memory within your browser sandbox**:
1. The DOM is cloned in-memory.
2. Non-text elements (images, videos, audio, SVGs, canvas, ads, navigation bars, cookie banners, tracking scripts) are discarded.
3. Mozilla Readability and Turndown parse the text into clean Markdown.
4. The output is displayed in your extension popup.
5. Once closed, in-memory data is discarded. No permanent history of visited websites is retained.

---

## 4. What Information Is Stored Locally

PageScribe uses `chrome.storage.sync` (with fallback to `chrome.storage.local`) exclusively to save your **personal formatting preferences**:
* Default extraction mode (`article` or `fulltext`)
* Metadata toggles (include title, include source URL, include timestamp)
* Formatting toggles (preserve links, preserve tables, preserve code blocks, remove blank lines)
* Interface preferences (preview vs. raw mode, light/dark theme)

If you use the right-click context menu, PageScribe temporarily stores the single latest conversion result in `chrome.storage.local` so you can view it when opening the popup.

---

## 5. Chrome Permissions and Justification

PageScribe requests only the minimum necessary permissions required for its functionality:

| Permission | Justification |
| :--- | :--- |
| `activeTab` | Grants temporary access to the active webpage only when you explicitly invoke the extension. It does not grant access to background tabs or unvisited tabs. |
| `scripting` | Enables PageScribe to inject local DOM extraction scripts into the current tab to parse text content. |
| `storage` | Allows PageScribe to remember your user preferences (such as light/dark mode and table formatting) across browser sessions. |
| `contextMenus` | Enables the "Convert selection to Markdown" right-click menu item for selected text. |
| `downloads` | Enables saving the converted Markdown note as a `.md` file to your computer's Downloads directory. |

---

## 6. Open Source Transparency

PageScribe is free and open-source software under the MIT License. The complete source code is publicly accessible on GitHub for auditing, inspection, and verification:
[https://github.com/shaikhakib12/web2markdown](https://github.com/shaikhakib12/web2markdown)

---

## 7. Contact & Security Reports

If you discover a security concern or have questions regarding our privacy practices, please open an issue on our GitHub repository:
[https://github.com/shaikhakib12/web2markdown/issues](https://github.com/shaikhakib12/web2markdown/issues)
