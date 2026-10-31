/**
 * PageScribe - Background Service Worker (Manifest V3)
 * Handles context menus, extension installation, and background conversions.
 */

import { convertHtmlToMarkdown, DEFAULT_SETTINGS } from './converter.js';

// Setup on extension installation or update
chrome.runtime.onInstalled.addListener(async (details) => {
  // 1. Initialize default settings if not already present
  try {
    const existing = await chrome.storage.sync.get('settings');
    if (!existing || !existing.settings) {
      await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    }
  } catch (err) {
    console.warn('[PageScribe] Storage sync error, falling back to local storage:', err);
    try {
      await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    } catch (e) {
      // Ignore
    }
  }

  // 2. Setup Context Menu for text selection
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'pagescribe-convert-selection',
      title: 'Convert selection to Markdown (PageScribe)',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'pagescribe-convert-article',
      title: 'Convert article to Markdown',
      contexts: ['page']
    });
  });
});

/**
 * Ensures required scripts (readability & content.js) are injected into the tab
 * @param {number} tabId 
 */
async function ensureScriptsInjected(tabId) {
  try {
    // Try pinging content script
    const response = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
    if (response && response.ready) {
      return true;
    }
  } catch (e) {
    // Content script not ready; inject scripts
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['lib/readability.js', 'scripts/content.js']
  });
  return true;
}

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id || !tab.url) return;

  // Disallow restricted pages
  if (
    tab.url.startsWith('chrome://') ||
    tab.url.startsWith('edge://') ||
    tab.url.startsWith('about:') ||
    tab.url.startsWith('chrome-extension://') ||
    tab.url.includes('chromewebstore.google.com') ||
    tab.url.includes('chrome.google.com/webstore')
  ) {
    return;
  }

  try {
    await ensureScriptsInjected(tab.id);

    const mode = info.menuItemId === 'pagescribe-convert-selection' ? 'selection' : 'article';
    const extractResponse = await chrome.tabs.sendMessage(tab.id, {
      action: 'EXTRACT',
      mode: mode
    });

    if (!extractResponse || !extractResponse.success || !extractResponse.html) {
      return;
    }

    // Retrieve settings
    let settings = DEFAULT_SETTINGS;
    try {
      const stored = await chrome.storage.sync.get('settings');
      if (stored && stored.settings) {
        settings = Object.assign({}, DEFAULT_SETTINGS, stored.settings);
      }
    } catch (e) {
      const stored = await chrome.storage.local.get('settings');
      if (stored && stored.settings) {
        settings = Object.assign({}, DEFAULT_SETTINGS, stored.settings);
      }
    }

    // Convert to Markdown
    const result = convertHtmlToMarkdown(
      extractResponse.html,
      {
        title: extractResponse.title,
        url: extractResponse.url,
        timestamp: new Date().toISOString()
      },
      settings
    );

    // Save latest conversion to local storage for popup inspection
    await chrome.storage.local.set({
      lastConversion: {
        markdown: result.markdown,
        title: extractResponse.title,
        url: extractResponse.url,
        wordCount: result.wordCount,
        charCount: result.charCount,
        filename: result.filename,
        mode: mode,
        timestamp: Date.now()
      }
    });

    // Copy to clipboard via scripting injection in active tab
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (textToCopy) => {
        try {
          navigator.clipboard.writeText(textToCopy);
        } catch (e) {
          const ta = document.createElement('textarea');
          ta.value = textToCopy;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
      },
      args: [result.markdown]
    });

    // Visual feedback on extension badge
    chrome.action.setBadgeText({ tabId: tab.id, text: 'COPIED' });
    chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#10B981' });
    setTimeout(() => {
      chrome.action.setBadgeText({ tabId: tab.id, text: '' });
    }, 2500);

  } catch (err) {
    console.error('[PageScribe] Context menu conversion error:', err);
    chrome.action.setBadgeText({ tabId: tab.id, text: 'ERR' });
    chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#EF4444' });
    setTimeout(() => {
      chrome.action.setBadgeText({ tabId: tab.id, text: '' });
    }, 2500);
  }
});
