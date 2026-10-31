# Chrome Web Store Publishing Checklist: PageScribe

This checklist guides you through publishing PageScribe to the official Chrome Web Store.

> [!IMPORTANT]
> **User Authorization Boundary:**
> In accordance with security protocols, the AI assistant will **never** access your personal Google credentials, pay registration fees, or submit items without your explicit approval. The package and assets below are 100% prepared on disk so that you can upload and submit in just a few clicks.

---

## Phase 1: Automated Verification (Completed)

- [x] **Unit & Integration Tests:** 31 tests passing (`npm test`).
- [x] **Manifest V3 Validation:** Zero errors (`node scripts/verify-manifest.js`).
- [x] **Local Dependency Check:** Mozilla Readability and Turndown bundled in `lib/` (no CDNs).
- [x] **Strict Text-Only Check:** Verified zero image/media syntax in Markdown output.
- [x] **Release Package Built:** `dist/pagescribe-v1.0.0.zip` (62.93 KB, SHA-256 verified).
- [x] **Visual Assets Prepared:** Screenshots, icon, and promotional tiles ready in `store-assets/`.
- [x] **Privacy Policy Published:** Publicly accessible at `https://github.com/shaikhakib12/web2markdown/blob/main/PRIVACY.md`.

---

## Phase 2: Google Developer Account Setup (Requires User Action)

1. Open your browser and navigate to the **Chrome Developer Dashboard**:
   👉 [https://chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)
2. Sign in with your preferred Google account.
3. If you have not registered as a Chrome Web Store developer yet:
   * Agree to the Chrome Web Store Developer Agreement.
   * Pay the one-time **$5 USD registration fee** directly to Google.
   * Verify your developer email address.

---

## Phase 3: Uploading the Release Package

1. In the Chrome Developer Dashboard, click the blue **"New Item"** button in the upper-right corner.
2. Drag and drop the release archive located at:
   ```
   d:\PageScribe\dist\pagescribe-v1.0.0.zip
   ```
   *(Or click "Browse files" and select `pagescribe-v1.0.0.zip`).*
3. The dashboard will automatically inspect `manifest.json` and create the draft item.

---

## Phase 4: Completing the Store Listing Tab

Open [`store-assets/STORE_LISTING.md`](STORE_LISTING.md) and copy the pre-formatted values into the dashboard:

- [ ] **Description:**
  * **Short description:** Paste the 119-character summary from `STORE_LISTING.md`.
  * **Detailed description:** Paste the complete Markdown description from `STORE_LISTING.md`.
- [ ] **Graphic Assets:**
  * **Store icon (128x128):** Upload `store-assets/store-icon-128.png`.
  * **Screenshots (1280x800):** Upload:
    1. `store-assets/screenshot-1-article-mode.png`
    2. `store-assets/screenshot-2-raw-mode.png`
    3. `store-assets/screenshot-3-settings.png`
  * **Small promo tile (440x280):** Upload `store-assets/promo-small-440x280.png`.
  * **Marquee promo banner (1400x560):** Upload `store-assets/promo-marquee-1400x560.png`.
- [ ] **Categorization:**
  * **Category:** Select `Productivity` (or `Developer Tools`).
  * **Language:** Select `English`.
- [ ] **URLs:**
  * **Homepage URL:** `https://github.com/shaikhakib12/web2markdown`
  * **Support URL:** `https://github.com/shaikhakib12/web2markdown/issues`

---

## Phase 5: Completing the Privacy Practices Tab

Google takes Manifest V3 privacy declarations very seriously. Use the exact answers below from Section 4 & 5 of `STORE_LISTING.md`:

- [ ] **Single Purpose Description:**
  > "PageScribe converts the readable text content of active webpages into clean, text-only Markdown directly inside the user's browser."
- [ ] **Permission Justifications:**
  * Copy the justifications for `activeTab`, `scripting`, `storage`, `contextMenus`, and `downloads` from `STORE_LISTING.md`.
- [ ] **Data Usage Disclosures:**
  * Check **"No, I am not collecting or using user data"** (PageScribe operates 100% in-memory in the client).
  * Check the compliance confirmation certifying that you do not sell user data.
- [ ] **Privacy Policy:**
  * Enter URL: `https://github.com/shaikhakib12/web2markdown/blob/main/PRIVACY.md`

---

## Phase 6: Submitting for Review (Requires Explicit Approval)

1. Review the dashboard summary for any warnings.
2. Click **"Submit for Review"**.
3. Under publishing options:
   * Select **"Publish automatically after review"** (Recommended).
4. Review typically takes **24 to 72 hours** for Manifest V3 extensions with local code.
5. Once approved by Google, PageScribe will be live on the Chrome Web Store for millions of users worldwide!
