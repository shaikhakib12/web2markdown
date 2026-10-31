# Contributing to PageScribe

Thank you for your interest in contributing to **PageScribe**! We welcome community contributions from developers, designers, technical writers, and open-source enthusiasts.

---

## 1. Guiding Principles

PageScribe is built around three core pillars:
1. **Privacy-First:** All processing must remain strictly local. No telemetry, tracking, or remote network calls.
2. **Strict Text-Only:** Never extract, embed, download, or generate Markdown for images, videos, audio, SVGs, or media. Keep outputs clean, lightweight, and distraction-free.
3. **Zero External Runtime CDNs:** In accordance with Chrome Extension Manifest V3 rules, all libraries must be bundled locally.

---

## 2. Development Setup

### Prerequisites
* Node.js v18.0.0 or higher
* npm v9.0.0 or higher
* Google Chrome (or any Chromium-based browser like Brave, Edge, or Vivaldi)

### Installation
1. Fork the repository on GitHub:
   ```bash
   git clone https://github.com/<your-username>/pagescribe.git
   cd pagescribe
   ```

2. Install development dependencies:
   ```bash
   npm install
   ```

3. Ensure vendor libraries are bundled:
   ```bash
   npm run build:libs
   ```

4. Run the automated test suite:
   ```bash
   npm test
   ```

---

## 3. Loading the Extension in Chrome

To test changes in real-time in Google Chrome:
1. Open Chrome and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `pagescribe` root directory (`d:\PageScribe` or your cloned path).
5. The PageScribe icon will appear in your Chrome toolbar. Pin it for quick testing.
6. Whenever you modify extension code, click the **Reload** (circular arrow) icon on the PageScribe extension card in `chrome://extensions`.

---

## 4. Branching Strategy

* Create feature and bugfix branches from the `main` branch.
* Use clear, descriptive branch names:
  * `feat/add-timestamp-custom-format`
  * `fix/code-block-language-parser`
  * `docs/update-installation-guide`

---

## 5. Coding Standards

* **Vanilla JavaScript ES6+:** Keep the extension lightweight. Avoid heavyweight frameworks (React/Vue) for popup/options pages.
* **XSS Prevention:** Never inject unsanitized HTML into DOM elements. Use `escapeHtml()` and `renderSafeMarkdownToHtml()` for rendering.
* **Preserve Comments:** Maintain existing docstrings and explanatory comments.
* **Modular Structure:** Keep conversion rules in `scripts/converter.js`, DOM crawlers in `scripts/content.js`, preview rendering in `scripts/sanitizer.js`, and UI controllers in `popup/` and `options/`.

---

## 6. Running Tests

Before submitting any Pull Request, ensure that all automated unit and integration tests pass:

```bash
npm test
```

If you introduce a new feature or fix a bug, please write corresponding tests in `tests/`:
* Converter rules: `tests/converter.test.js`
* Extraction & DOM pre-cleaning: `tests/extraction.test.js`
* Filename formatting: `tests/filename.test.js`
* Sanitizer & XSS protection: `tests/sanitizer.test.js`

---

## 7. Submitting a Pull Request

1. Push your branch to your GitHub fork:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Navigate to [https://github.com/pagescribe/pagescribe](https://github.com/pagescribe/pagescribe) and click **New Pull Request**.
3. Fill out the PR template completely with:
   * A clear summary of the change.
   * Motivation and context.
   * Verification steps and test evidence.
4. Link any relevant issue numbers (e.g., `Fixes #12`).

---

## 8. Reporting Bugs & Feature Requests

* **Bug Reports:** Use our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md). Include the URL of the problem webpage, expected vs. actual Markdown output, and browser version.
* **Feature Requests:** Use our [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md). Explain the problem it solves and why it fits within PageScribe's text-only vision.

---

## 9. License

By contributing to PageScribe, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
