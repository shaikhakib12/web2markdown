/**
 * PageScribe - Popup Controller
 * Manages UI interactions, extraction calls, conversion, clipboard, and file downloads.
 */

/* global PageScribeConverter, PageScribeSanitizer */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  const pageTitleEl = document.getElementById('pageTitle');
  const pageUrlEl = document.getElementById('pageUrl');
  const selectionBadge = document.getElementById('selectionBadge');
  const selectionTextEl = document.getElementById('selectionText');

  const modeArticleBtn = document.getElementById('modeArticle');
  const modeFullTextBtn = document.getElementById('modeFullText');
  const modeSelectionBtn = document.getElementById('modeSelection');

  const loadingView = document.getElementById('loadingView');
  const loadingMessage = document.getElementById('loadingMessage');
  const errorView = document.getElementById('errorView');
  const errorHeading = document.getElementById('errorHeading');
  const errorMessage = document.getElementById('errorMessage');
  const errorRetryBtn = document.getElementById('errorRetryBtn');
  const resultView = document.getElementById('resultView');

  const viewPreviewBtn = document.getElementById('viewPreviewBtn');
  const viewRawBtn = document.getElementById('viewRawBtn');
  const previewContainer = document.getElementById('previewContainer');
  const rawContainer = document.getElementById('rawContainer');
  const rawMarkdownText = document.getElementById('rawMarkdownText');

  const copyTitleBtn = document.getElementById('copyTitleBtn');
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const wordCountEl = document.getElementById('wordCount');
  const charCountEl = document.getElementById('charCount');
  const activeModeBadge = document.getElementById('activeModeBadge');

  const convertBtn = document.getElementById('convertBtn');
  const convertBtnText = document.getElementById('convertBtnText');
  const copyMarkdownBtn = document.getElementById('copyMarkdownBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const downloadBtn = document.getElementById('downloadBtn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // Application State
  let activeTab = null;
  let currentSettings = Object.assign({}, PageScribeConverter.DEFAULT_SETTINGS);
  let activeMode = 'article'; // 'article' | 'fulltext' | 'selection'
  let currentView = 'preview'; // 'preview' | 'raw'
  let currentResult = {
    markdown: '',
    title: '',
    url: '',
    filename: 'pagescribe-article.md',
    wordCount: 0,
    charCount: 0
  };
  let toastTimeout = null;

  /**
   * Displays temporary toast notification
   * @param {string} msg 
   * @param {number} duration 
   */
  function showToast(msg, duration = 2200) {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    toastMessage.textContent = msg;
    toast.classList.remove('hidden');
    toastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, duration);
  }

  /**
   * Applies the theme (system, light, dark) to body
   * @param {string} theme 
   */
  function applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-system');
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else if (theme === 'dark') {
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.add('theme-system');
    }
  }

  /**
   * Safe Clipboard Copy with fallback
   * @param {string} text 
   * @returns {Promise<boolean>}
   */
  async function copyToClipboard(text) {
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      console.warn('[PageScribe] navigator.clipboard failed, attempting fallback:', e);
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch (err) {
      console.error('[PageScribe] Clipboard copy failed:', err);
      return false;
    }
  }

  /**
   * Loads user settings from chrome.storage
   */
  async function loadSettings() {
    try {
      const data = await chrome.storage.sync.get('settings');
      if (data && data.settings) {
        currentSettings = Object.assign({}, PageScribeConverter.DEFAULT_SETTINGS, data.settings);
      }
    } catch (e) {
      try {
        const localData = await chrome.storage.local.get('settings');
        if (localData && localData.settings) {
          currentSettings = Object.assign({}, PageScribeConverter.DEFAULT_SETTINGS, localData.settings);
        }
      } catch (err) {
        console.warn('[PageScribe] Failed to load settings:', err);
      }
    }

    applyTheme(currentSettings.theme || 'system');
    activeMode = currentSettings.extractionMode || 'article';
    currentView = currentSettings.previewMode || 'preview';
    updateModeTabsUI();
    updateViewModeUI();
  }

  /**
   * Updates Mode tabs UI styling
   */
  function updateModeTabsUI() {
    modeArticleBtn.classList.toggle('active', activeMode === 'article');
    modeFullTextBtn.classList.toggle('active', activeMode === 'fulltext');
    modeSelectionBtn.classList.toggle('active', activeMode === 'selection');

    const modeLabels = {
      article: 'Article Mode',
      fulltext: 'Full Text Mode',
      selection: 'Selection Mode'
    };
    activeModeBadge.textContent = modeLabels[activeMode] || 'Article Mode';
  }

  /**
   * Switches preview / raw view
   */
  function updateViewModeUI() {
    if (currentView === 'preview') {
      viewPreviewBtn.classList.add('active');
      viewPreviewBtn.setAttribute('aria-selected', 'true');
      viewRawBtn.classList.remove('active');
      viewRawBtn.setAttribute('aria-selected', 'false');
      previewContainer.classList.remove('hidden');
      rawContainer.classList.add('hidden');
    } else {
      viewRawBtn.classList.add('active');
      viewRawBtn.setAttribute('aria-selected', 'true');
      viewPreviewBtn.classList.remove('active');
      viewPreviewBtn.setAttribute('aria-selected', 'false');
      rawContainer.classList.remove('hidden');
      previewContainer.classList.add('hidden');
    }
  }

  /**
   * Checks if URL is restricted by Chrome
   * @param {string} url 
   * @returns {{ isRestricted: boolean, reason: string }}
   */
  function checkUrlRestricted(url) {
    if (!url) return { isRestricted: true, reason: 'No active webpage URL detected.' };

    if (url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:')) {
      return {
        isRestricted: true,
        reason: 'Chrome does not allow extensions to run on internal browser system pages.'
      };
    }

    if (url.startsWith('chrome-extension://')) {
      return {
        isRestricted: true,
        reason: 'PageScribe cannot extract content from other Chrome extensions.'
      };
    }

    if (url.includes('chromewebstore.google.com') || url.includes('chrome.google.com/webstore')) {
      return {
        isRestricted: true,
        reason: 'Chrome Web Store security policies prohibit script execution on store pages.'
      };
    }

    if (url.startsWith('view-source:')) {
      return {
        isRestricted: true,
        reason: 'PageScribe does not run on view-source pages.'
      };
    }

    return { isRestricted: false, reason: '' };
  }

  /**
   * Injects Readability & Content scripts into the active tab
   */
  async function ensureContentScripts(tabId) {
    try {
      const ping = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
      if (ping && ping.ready) return true;
    } catch (e) {
      // Content script not yet injected
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['lib/readability.js', 'scripts/content.js']
    });
    return true;
  }

  /**
   * Displays an error card
   * @param {string} heading 
   * @param {string} message 
   */
  function showError(heading, message) {
    loadingView.classList.add('hidden');
    resultView.classList.add('hidden');
    errorView.classList.remove('hidden');
    errorHeading.textContent = heading;
    errorMessage.textContent = message;
    convertBtn.disabled = true;
    copyMarkdownBtn.disabled = true;
    downloadBtn.disabled = true;
  }

  /**
   * Restores result view from error or loading
   */
  function showResultView() {
    loadingView.classList.add('hidden');
    errorView.classList.add('hidden');
    resultView.classList.remove('hidden');
    convertBtn.disabled = false;
    copyMarkdownBtn.disabled = false;
    downloadBtn.disabled = false;
  }

  /**
   * Performs conversion on the active tab
   */
  async function executeConversion() {
    if (!activeTab || !activeTab.id) {
      showError('No Webpage Detected', 'Unable to locate an active browser tab.');
      return;
    }

    const restriction = checkUrlRestricted(activeTab.url);
    if (restriction.isRestricted) {
      showError('Restricted Webpage', restriction.reason);
      return;
    }

    // Show loading state
    resultView.classList.add('hidden');
    errorView.classList.add('hidden');
    loadingView.classList.remove('hidden');
    loadingMessage.textContent = `Extracting ${activeMode === 'selection' ? 'selection' : 'page text'}...`;

    try {
      await ensureContentScripts(activeTab.id);

      const extractResponse = await chrome.tabs.sendMessage(activeTab.id, {
        action: 'EXTRACT',
        mode: activeMode
      });

      if (!extractResponse || !extractResponse.success) {
        if (extractResponse && extractResponse.error === 'NO_SELECTION') {
          showError('No Selection Found', 'No text is highlighted on this webpage. Highlight text or switch to Article or Full Text mode.');
          return;
        }
        showError('Extraction Empty', extractResponse ? extractResponse.message : 'No readable content could be extracted from this page.');
        return;
      }

      const rawHtml = extractResponse.html || '';
      const pageTitle = extractResponse.title || activeTab.title || 'Untitled Webpage';
      const pageUrl = extractResponse.url || activeTab.url || '';

      // Perform conversion
      const result = PageScribeConverter.convertHtmlToMarkdown(
        rawHtml,
        {
          title: pageTitle,
          url: pageUrl,
          timestamp: new Date().toISOString()
        },
        currentSettings
      );

      if (!result.markdown.trim()) {
        showError('No Text Output', 'The extracted content produced no text Markdown.');
        return;
      }

      currentResult = {
        markdown: result.markdown,
        title: pageTitle,
        url: pageUrl,
        filename: result.filename,
        wordCount: result.wordCount,
        charCount: result.charCount
      };

      // Update Preview & Raw views
      previewContainer.innerHTML = PageScribeSanitizer.renderSafeMarkdownToHtml(result.markdown);
      rawMarkdownText.value = result.markdown;
      wordCountEl.textContent = result.wordCount.toLocaleString();
      charCountEl.textContent = result.charCount.toLocaleString();

      convertBtnText.textContent = 'Regenerate';
      showResultView();
      showToast('Converted to clean Markdown!');

    } catch (err) {
      console.error('[PageScribe] Extraction error:', err);
      showError('Extraction Failed', 'An error occurred while communicating with the webpage: ' + (err.message || 'Unknown error'));
    }
  }

  // --- Event Listeners ---

  // Mode Tabs
  modeArticleBtn.addEventListener('click', () => {
    activeMode = 'article';
    updateModeTabsUI();
    executeConversion();
  });

  modeFullTextBtn.addEventListener('click', () => {
    activeMode = 'fulltext';
    updateModeTabsUI();
    executeConversion();
  });

  modeSelectionBtn.addEventListener('click', () => {
    activeMode = 'selection';
    updateModeTabsUI();
    executeConversion();
  });

  // View Switcher (Preview vs Raw)
  viewPreviewBtn.addEventListener('click', () => {
    currentView = 'preview';
    updateViewModeUI();
  });

  viewRawBtn.addEventListener('click', () => {
    currentView = 'raw';
    updateViewModeUI();
  });

  // Convert / Regenerate Button
  convertBtn.addEventListener('click', () => {
    executeConversion();
  });

  // Error Retry
  errorRetryBtn.addEventListener('click', () => {
    executeConversion();
  });

  // Copy Markdown Button
  copyMarkdownBtn.addEventListener('click', async () => {
    if (!currentResult.markdown) {
      showToast('No Markdown to copy!');
      return;
    }
    const success = await copyToClipboard(currentResult.markdown);
    if (success) {
      copyBtnText.textContent = 'Copied!';
      showToast('Markdown copied to clipboard!');
      setTimeout(() => {
        copyBtnText.textContent = 'Copy';
      }, 2000);
    } else {
      showToast('Failed to copy to clipboard.');
    }
  });

  // Copy Title Button
  copyTitleBtn.addEventListener('click', async () => {
    const title = currentResult.title || activeTab?.title || '';
    if (!title) return;
    const ok = await copyToClipboard(title);
    if (ok) showToast('Title copied!');
  });

  // Copy URL Button
  copyUrlBtn.addEventListener('click', async () => {
    const url = currentResult.url || activeTab?.url || '';
    if (!url) return;
    const ok = await copyToClipboard(url);
    if (ok) showToast('URL copied!');
  });

  // Download Markdown File Button
  downloadBtn.addEventListener('click', () => {
    if (!currentResult.markdown) {
      showToast('No content to download!');
      return;
    }

    const filename = currentResult.filename || 'pagescribe-note.md';
    const blob = new Blob([currentResult.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    if (chrome.downloads && chrome.downloads.download) {
      chrome.downloads.download(
        {
          url: url,
          filename: filename,
          saveAs: false
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            console.warn('[PageScribe] chrome.downloads error, fallback to anchor click:', chrome.runtime.lastError);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
          }
          showToast(`Downloaded: ${filename}`);
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        }
      );
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      showToast(`Downloaded: ${filename}`);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  });

  // Theme Toggle Button
  themeToggleBtn.addEventListener('click', async () => {
    const currentTheme = currentSettings.theme || 'system';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    currentSettings.theme = nextTheme;
    applyTheme(nextTheme);

    try {
      await chrome.storage.sync.set({ settings: currentSettings });
    } catch (e) {
      await chrome.storage.local.set({ settings: currentSettings });
    }
    showToast(`Theme set to ${nextTheme}`);
  });

  // Options / Settings Button
  optionsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options/options.html'));
    }
  });

  // --- Initializer ---
  await loadSettings();

  // Query current active tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tab;

    if (!activeTab || !activeTab.url) {
      showError('No Webpage Found', 'Open a webpage in Chrome to use PageScribe.');
      return;
    }

    pageTitleEl.textContent = activeTab.title || 'Active Tab';
    pageUrlEl.textContent = activeTab.url;

    const restriction = checkUrlRestricted(activeTab.url);
    if (restriction.isRestricted) {
      showError('Restricted Webpage', restriction.reason);
      return;
    }

    // Check if user has active text selected on the page
    try {
      await ensureContentScripts(activeTab.id);
      const selStatus = await chrome.tabs.sendMessage(activeTab.id, { action: 'CHECK_SELECTION' });
      if (selStatus && selStatus.hasSelection) {
        selectionBadge.classList.remove('hidden');
        selectionTextEl.textContent = `Selection detected (${selStatus.selectedTextLength} chars)`;
      }
    } catch (e) {
      // Content script ping failure is handled on convert
    }

    // Auto-convert on popup open for instant one-click workflow!
    executeConversion();

  } catch (err) {
    console.error('[PageScribe] Initialization error:', err);
    showError('Initialization Error', err.message || 'Unable to initialize extension.');
  }
});
