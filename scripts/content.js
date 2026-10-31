/**
 * PageScribe - Content Script
 * Injected into webpages to perform DOM extraction (Article Mode, Full Text Mode, Selection Mode).
 * Strictly filters out images, media, scripts, hidden nodes, and website chrome.
 */

(function () {
  // Prevent duplicate execution
  if (window.__pagescribe_content_injected) {
    return;
  }
  window.__pagescribe_content_injected = true;

  /**
   * Helper: checks if a DOM node is visibly hidden
   * @param {Element} el 
   * @returns {boolean}
   */
  function isElementHidden(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') {
      return true;
    }
    try {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return true;
      }
    } catch (e) {
      // getComputedStyle may fail on disconnected elements
    }
    return false;
  }

  /**
   * Removes media, scripts, styles, forms, ads, and UI chrome from a DOM element
   * @param {Element} container 
   */
  function cleanExtractedDOM(container) {
    if (!container) return;

    // Strict media & non-text tag removals
    const tagsToRemove = [
      'img', 'picture', 'source', 'figure', 'svg', 'canvas', 'video', 'audio',
      'track', 'embed', 'object', 'iframe', 'map', 'area',
      'script', 'style', 'noscript', 'template',
      'button', 'input', 'select', 'textarea', 'dialog', 'form'
    ];

    for (const tag of tagsToRemove) {
      const els = container.getElementsByTagName(tag);
      while (els.length > 0) {
        els[0].parentNode.removeChild(els[0]);
      }
    }

    // Selectors for navigation, ads, cookie banners, tracking
    const selectorsToRemove = [
      'nav', 'header', 'footer', 'aside',
      '[role="banner"]', '[role="navigation"]', '[role="search"]',
      '[role="dialog"]', '[role="alertdialog"]', '[aria-hidden="true"]',
      '.advertisement', '.ad', '.ads', '.ad-box', '.ad-banner', 'ins.adsbygoogle',
      '.cookie-banner', '.cookie-notice', '#cookie-consent', '#cookie-banner',
      '.modal', '.popup', '.share-buttons', '.social-share', '.newsletter-signup',
      '.comments-area', '.sidebar', '.widget'
    ];

    for (const selector of selectorsToRemove) {
      try {
        const matches = container.querySelectorAll(selector);
        matches.forEach(el => el.parentNode && el.parentNode.removeChild(el));
      } catch (e) {
        // Ignore pseudo-selector issues
      }
    }

    // Remove empty anchors
    const anchors = container.getElementsByTagName('a');
    for (let i = anchors.length - 1; i >= 0; i--) {
      const a = anchors[i];
      if (!(a.textContent || '').trim()) {
        a.parentNode && a.parentNode.removeChild(a);
      }
    }
  }

  /**
   * Mode 1: Article Mode via Mozilla Readability
   */
  function extractArticleMode() {
    // Check if Readability is loaded
    const ReadabilityClass = window.Readability || globalThis.Readability;

    if (!ReadabilityClass) {
      console.warn('[PageScribe] Mozilla Readability not loaded in tab, falling back to Full Text');
      return extractFullTextMode();
    }

    try {
      // Clone document to avoid modifying the active webpage DOM
      const docClone = document.cloneNode(true);
      const reader = new ReadabilityClass(docClone, {
        charThreshold: 20,
        keepClasses: false
      });

      const article = reader.parse();

      if (article && article.content) {
        // Wrap and clean the parsed article HTML
        const wrapper = document.createElement('div');
        wrapper.innerHTML = article.content;
        cleanExtractedDOM(wrapper);

        return {
          success: true,
          mode: 'article',
          title: article.title || document.title || 'Untitled Webpage',
          byline: article.byline || '',
          url: window.location.href,
          html: wrapper.innerHTML,
          excerpt: article.excerpt || ''
        };
      }
    } catch (err) {
      console.warn('[PageScribe] Readability parsing failed:', err);
    }

    // Graceful fallback to Full Text mode if Readability produces nothing
    return extractFullTextMode();
  }

  /**
   * Mode 2: Full Text Mode
   */
  function extractFullTextMode() {
    try {
      // Prioritize semantic content containers
      const candidates = [
        document.querySelector('main'),
        document.querySelector('article'),
        document.querySelector('[role="main"]'),
        document.querySelector('#content'),
        document.querySelector('#main-content'),
        document.querySelector('.main-content'),
        document.querySelector('.post-content'),
        document.querySelector('.article-content'),
        document.body
      ];

      const target = candidates.find(el => el && el.textContent.trim().length > 100) || document.body;

      if (!target || !target.textContent.trim()) {
        return {
          success: false,
          error: 'NO_CONTENT',
          message: 'No readable text content found on this webpage.'
        };
      }

      const clone = target.cloneNode(true);

      // Remove hidden elements
      const allDescendants = clone.querySelectorAll('*');
      allDescendants.forEach(el => {
        if (isElementHidden(el)) {
          el.parentNode && el.parentNode.removeChild(el);
        }
      });

      cleanExtractedDOM(clone);

      const html = clone.innerHTML;
      if (!html || !clone.textContent.trim()) {
        return {
          success: false,
          error: 'NO_CONTENT',
          message: 'Page content was empty after filtering non-text elements.'
        };
      }

      return {
        success: true,
        mode: 'fulltext',
        title: document.title || 'Untitled Webpage',
        url: window.location.href,
        html: html
      };
    } catch (err) {
      return {
        success: false,
        error: 'EXTRACTION_FAILED',
        message: err.message || 'Failed to extract webpage text.'
      };
    }
  }

  /**
   * Mode 3: Selection Mode
   */
  function extractSelectionMode() {
    try {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        return {
          success: false,
          error: 'NO_SELECTION',
          message: 'No text selected on webpage. Highlight some text first.'
        };
      }

      const range = selection.getRangeAt(0);
      const container = document.createElement('div');
      container.appendChild(range.cloneContents());

      cleanExtractedDOM(container);

      const text = container.textContent.trim();
      if (!text) {
        return {
          success: false,
          error: 'EMPTY_SELECTION',
          message: 'Selected content contained no meaningful text.'
        };
      }

      return {
        success: true,
        mode: 'selection',
        title: document.title || 'Selection from Webpage',
        url: window.location.href,
        html: container.innerHTML
      };
    } catch (err) {
      return {
        success: false,
        error: 'SELECTION_ERROR',
        message: err.message || 'Failed to capture selection.'
      };
    }
  }

  /**
   * Check if user has active selection on the page
   */
  function checkSelectionStatus() {
    const selection = window.getSelection();
    const hasSelection = !!(selection && !selection.isCollapsed && selection.toString().trim().length > 0);
    const selectedTextLength = hasSelection ? selection.toString().trim().length : 0;
    return {
      hasSelection,
      selectedTextLength
    };
  }

  // Listen for messages from popup or background service worker
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'PING') {
      sendResponse({ status: 'PONG', ready: true });
      return true;
    }

    if (request.action === 'CHECK_SELECTION') {
      sendResponse(checkSelectionStatus());
      return true;
    }

    if (request.action === 'EXTRACT') {
      const mode = request.mode || 'article';
      let result;

      if (mode === 'selection') {
        result = extractSelectionMode();
      } else if (mode === 'fulltext') {
        result = extractFullTextMode();
      } else {
        result = extractArticleMode();
      }

      sendResponse(result);
      return true;
    }

    return false;
  });
})();
