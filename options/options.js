/**
 * PageScribe - Options Page Controller
 * Manages configuration preferences and chrome.storage synchronization.
 */

/* global PageScribeConverter */

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settingsForm');
  const statusBanner = document.getElementById('statusBanner');
  const statusMessage = document.getElementById('statusMessage');
  const resetBtn = document.getElementById('resetBtn');

  // Input elements
  const extractionMode = document.getElementById('extractionMode');
  const includeTitle = document.getElementById('includeTitle');
  const includeSourceUrl = document.getElementById('includeSourceUrl');
  const includeTimestamp = document.getElementById('includeTimestamp');
  const preserveHyperlinks = document.getElementById('preserveHyperlinks');
  const preserveTables = document.getElementById('preserveTables');
  const preserveCodeBlocks = document.getElementById('preserveCodeBlocks');
  const removeBlankLines = document.getElementById('removeBlankLines');
  const previewMode = document.getElementById('previewMode');
  const themeSelect = document.getElementById('themeSelect');

  let bannerTimeout = null;

  function showStatus(msg) {
    if (bannerTimeout) {
      clearTimeout(bannerTimeout);
    }
    statusMessage.textContent = msg;
    statusBanner.classList.remove('hidden');
    bannerTimeout = setTimeout(() => {
      statusBanner.classList.add('hidden');
    }, 2800);
  }

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

  function populateUI(settings) {
    extractionMode.value = settings.extractionMode || 'article';
    includeTitle.checked = settings.includeTitle !== false;
    includeSourceUrl.checked = settings.includeSourceUrl !== false;
    includeTimestamp.checked = !!settings.includeTimestamp;
    preserveHyperlinks.checked = settings.preserveHyperlinks !== false;
    preserveTables.checked = settings.preserveTables !== false;
    preserveCodeBlocks.checked = settings.preserveCodeBlocks !== false;
    removeBlankLines.checked = settings.removeBlankLines !== false;
    previewMode.value = settings.previewMode || 'preview';
    themeSelect.value = settings.theme || 'system';

    applyTheme(themeSelect.value);
  }

  function gatherSettingsFromUI() {
    return {
      extractionMode: extractionMode.value,
      includeTitle: includeTitle.checked,
      includeSourceUrl: includeSourceUrl.checked,
      includeTimestamp: includeTimestamp.checked,
      preserveHyperlinks: preserveHyperlinks.checked,
      preserveTables: preserveTables.checked,
      preserveCodeBlocks: preserveCodeBlocks.checked,
      removeBlankLines: removeBlankLines.checked,
      previewMode: previewMode.value,
      theme: themeSelect.value
    };
  }

  async function saveSettings(settings, message = 'Settings saved successfully.') {
    try {
      await chrome.storage.sync.set({ settings });
    } catch (e) {
      try {
        await chrome.storage.local.set({ settings });
      } catch (err) {
        console.error('[PageScribe] Save error:', err);
      }
    }
    applyTheme(settings.theme);
    showStatus(message);
  }

  // Load saved settings
  let currentSettings = Object.assign({}, PageScribeConverter.DEFAULT_SETTINGS);
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
      console.warn('[PageScribe] Storage load error:', err);
    }
  }

  populateUI(currentSettings);

  // Form submit handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newSettings = gatherSettingsFromUI();
    saveSettings(newSettings);
  });

  // Auto-save on any change
  form.addEventListener('change', () => {
    const newSettings = gatherSettingsFromUI();
    saveSettings(newSettings, 'Settings updated.');
  });

  // Reset to defaults
  resetBtn.addEventListener('click', () => {
    populateUI(PageScribeConverter.DEFAULT_SETTINGS);
    saveSettings(PageScribeConverter.DEFAULT_SETTINGS, 'Settings reset to factory defaults.');
  });
});
