/**
 * PageScribe - Converter Engine
 * Converts HTML into clean, text-only Markdown.
 * Strict Text-Only Policy: Completely excludes images, svgs, media, ads, and UI artifacts.
 */

// Universal dependency resolver (Node.js vs Browser)
let TurndownServiceModule;
let turndownPluginGfmModule;

if (typeof require !== 'undefined') {
  try {
    TurndownServiceModule = require('turndown');
    turndownPluginGfmModule = require('turndown-plugin-gfm');
  } catch (e) {
    // Handled in browser environment
  }
}

if (!TurndownServiceModule && typeof globalThis !== 'undefined') {
  TurndownServiceModule = globalThis.TurndownService;
  turndownPluginGfmModule = globalThis.turndownPluginGfm;
}

const DEFAULT_SETTINGS = {
  extractionMode: 'article', // 'article' | 'fulltext' | 'selection'
  includeTitle: true,
  includeSourceUrl: true,
  includeTimestamp: false,
  preserveHyperlinks: true,
  preserveTables: true,
  preserveCodeBlocks: true,
  removeBlankLines: true,
  previewMode: 'preview', // 'preview' | 'raw'
  theme: 'system' // 'system' | 'light' | 'dark'
};

/**
 * Sanitizes and generates a clean filename from a webpage title
 * @param {string} title 
 * @returns {string}
 */
function generateMarkdownFilename(title) {
  if (!title || typeof title !== 'string') {
    return 'pagescribe-article.md';
  }

  // Remove control characters and illegal filename characters (\ / : * ? " < > |)
  let clean = title
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Convert to lowercase slug or preserve case, replace spaces with hyphens
  clean = clean
    .toLowerCase()
    .replace(/[^a-z0-9\s-_.]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-'); // Collapse multiple consecutive hyphens

  // Remove leading/trailing hyphens or dots
  clean = clean.replace(/^[.-]+|[.-]+$/g, '');

  // Truncate to reasonable length (max 60 characters)
  if (clean.length > 60) {
    clean = clean.substring(0, 60).replace(/-[^-]*$/, '');
  }

  if (!clean) {
    clean = 'pagescribe-article';
  }

  return `${clean}.md`;
}

/**
 * Pre-cleans HTML string or DOM node to eliminate all non-text, media, and interactive UI
 * @param {string|Node} input 
 * @param {Document} [docContext] 
 * @returns {string}
 */
function preCleanHtml(input, docContext) {
  let doc;
  if (docContext) {
    doc = docContext;
  } else if (typeof document !== 'undefined') {
    doc = document;
  } else if (typeof require !== 'undefined') {
    const { JSDOM } = require('jsdom');
    doc = new JSDOM('').window.document;
  } else {
    throw new Error('No DOM Document available for HTML parsing');
  }

  const container = doc.createElement('div');
  if (typeof input === 'string') {
    container.innerHTML = input;
  } else if (input && input.nodeType) {
    container.appendChild(input.cloneNode(true));
  } else {
    return '';
  }

  // 1. Elements to strictly remove: media, scripts, styles, forms, decorative/embedded content, navigation & chrome
  const strictExcludeTags = [
    'img', 'picture', 'source', 'figure', 'svg', 'canvas', 'video', 'audio',
    'track', 'embed', 'object', 'iframe', 'map', 'area',
    'script', 'style', 'noscript', 'template',
    'button', 'input', 'select', 'textarea', 'dialog', 'form',
    'nav', 'header', 'footer', 'aside'
  ];

  for (const tag of strictExcludeTags) {
    const elements = container.getElementsByTagName(tag);
    while (elements.length > 0) {
      elements[0].parentNode.removeChild(elements[0]);
    }
  }

  // 2. Selectors to remove: ads, navigation, modals, cookie notices, trackers
  const excludeSelectors = [
    '[role="banner"]',
    '[role="navigation"]',
    '[role="search"]',
    '[role="dialog"]',
    '[role="alertdialog"]',
    '[aria-hidden="true"]',
    '.advertisement', '.ad', '.ads', '.ad-box', '.ad-banner', 'ins.adsbygoogle',
    '.cookie-notice', '.cookie-banner', '#cookie-banner', '#cookie-consent',
    '.modal', '.popup', '.share-buttons', '.social-share', '.newsletter-signup',
    '.hidden', '[hidden]'
  ];

  for (const selector of excludeSelectors) {
    try {
      const matched = container.querySelectorAll(selector);
      matched.forEach(el => el.parentNode && el.parentNode.removeChild(el));
    } catch (e) {
      // Ignore selector syntax failures if custom pseudo-selectors appear
    }
  }

  // 3. Clean anchors: remove empty links or links that were only wrapping removed images
  const anchors = container.getElementsByTagName('a');
  for (let i = anchors.length - 1; i >= 0; i--) {
    const a = anchors[i];
    const text = (a.textContent || '').trim();
    if (!text) {
      a.parentNode && a.parentNode.removeChild(a);
    }
  }

  return container.innerHTML;
}

/**
 * Creates and configures a TurndownService with PageScribe's strict text-only rules
 * @param {Object} settings 
 * @returns {TurndownService}
 */
function createTurndownService(settings = {}) {
  const options = Object.assign({}, DEFAULT_SETTINGS, settings);
  const Turndown = TurndownServiceModule || (typeof globalThis !== 'undefined' ? globalThis.TurndownService : null);

  if (!Turndown) {
    throw new Error('TurndownService is not loaded');
  }

  const service = new Turndown({
    headingStyle: 'atx', // # H1, ## H2
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined'
  });

  // Apply GFM tables plugin if available and enabled
  const gfmPlugin = turndownPluginGfmModule || (typeof globalThis !== 'undefined' ? globalThis.turndownPluginGfm : null);
  if (options.preserveTables && gfmPlugin && gfmPlugin.tables) {
    service.use(gfmPlugin.tables);
  } else if (!options.preserveTables) {
    // Table stripping rule: extract plain text per row
    service.addRule('stripTables', {
      filter: ['table'],
      replacement: function (content, node) {
        return '\n\n' + (node.textContent || '').trim() + '\n\n';
      }
    });
  }

  // Apply strikethrough plugin if available
  if (gfmPlugin && gfmPlugin.strikethrough) {
    service.use(gfmPlugin.strikethrough);
  }

  // RULE 1: Strict image & media exclusion - never output image markdown
  service.addRule('strictNoImages', {
    filter: ['img', 'picture', 'svg', 'canvas', 'video', 'audio', 'source', 'track', 'figure', 'figcaption'],
    replacement: function () {
      return '';
    }
  });

  // RULE 2: Clean hyperlinks
  service.addRule('cleanLinks', {
    filter: function (node, opts) {
      return (
        opts.linkStyle === 'inlined' &&
        node.nodeName === 'A' &&
        node.getAttribute('href')
      );
    },
    replacement: function (content, node) {
      const text = content.replace(/\n+/g, ' ').trim();
      if (!text) return '';

      if (!options.preserveHyperlinks) {
        return text;
      }

      let href = (node.getAttribute('href') || '').trim();
      if (href.startsWith('javascript:') || href === '#') {
        return text;
      }

      const titleAttr = node.getAttribute('title');
      const title = titleAttr ? ` "${titleAttr.replace(/"/g, '\\"')}"` : '';
      return `[${text}](${href}${title})`;
    }
  });

  // RULE 3: Code blocks with language detection
  service.addRule('cleanFencedCodeBlock', {
    filter: function (node) {
      return (
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      );
    },
    replacement: function (content, node) {
      if (!options.preserveCodeBlocks) {
        return '\n\n' + node.textContent.trim() + '\n\n';
      }

      const codeNode = node.firstChild;
      const className = (codeNode.getAttribute('class') || '') + ' ' + (node.getAttribute('class') || '');
      const langMatch = className.match(/(?:lang|language)-([a-zA-Z0-9_-]+)/);
      const language = langMatch ? langMatch[1] : '';

      const code = codeNode.textContent || '';
      return '\n\n```' + language + '\n' + code.replace(/\n+$/, '') + '\n```\n\n';
    }
  });

  // RULE 4: Discard empty elements
  service.addRule('removeEmptySpans', {
    filter: function (node) {
      return (
        (node.nodeName === 'SPAN' || node.nodeName === 'DIV') &&
        !node.textContent.trim() &&
        !node.children.length
      );
    },
    replacement: function () {
      return '';
    }
  });

  return service;
}

/**
 * Post-processes Markdown output for consistent spacing, removing excessive blank lines,
 * and eliminating duplicate title headings.
 * @param {string} markdown 
 * @param {string} title 
 * @param {Object} options 
 * @returns {string}
 */
function postProcessMarkdown(markdown, title, options = {}) {
  let md = markdown || '';

  // 1. Remove trailing spaces from every line
  md = md.replace(/[ \t]+$/gm, '');

  // 2. Collapse 3 or more consecutive newlines into 2 (one blank line between blocks)
  if (options.removeBlankLines !== false) {
    md = md.replace(/\n{3,}/g, '\n\n');
  }

  // 3. Remove leading/trailing newlines
  md = md.trim();

  // 4. Check duplicate H1 heading at start if title was already included in metadata
  if (options.includeTitle && title && md) {
    const cleanTitle = title.trim();
    const firstLineMatch = md.match(/^(?:#\s+)?([^\n]+)/);
    if (firstLineMatch) {
      const firstLineText = firstLineMatch[1].trim();
      if (firstLineText.toLowerCase() === cleanTitle.toLowerCase()) {
        // Strip the duplicate first heading and any blank lines following it
        md = md.replace(/^(?:#+\s+)?[^\n]+\n+/, '').trim();
      }
    }
  }

  return md;
}

/**
 * Builds the top header block (Title, Source URL, Timestamp)
 * @param {Object} metadata { title, url, timestamp }
 * @param {Object} options 
 * @returns {string}
 */
function buildHeaderBlock(metadata = {}, options = {}) {
  const parts = [];
  const title = (metadata.title || '').trim();
  const url = (metadata.url || '').trim();
  const timestamp = metadata.timestamp || new Date().toISOString();

  if (options.includeTitle && title) {
    parts.push(`# ${title}\n`);
  }

  const metaLines = [];
  if (options.includeSourceUrl && url) {
    metaLines.push(`> **Source:** [${url}](${url})`);
  }
  if (options.includeTimestamp) {
    metaLines.push(`> **Captured:** ${timestamp}`);
  }

  if (metaLines.length > 0) {
    parts.push(metaLines.join('  \n') + '\n\n---\n');
  }

  return parts.join('\n');
}

/**
 * Main conversion function: takes HTML, metadata, and settings, returns clean Markdown.
 * @param {string|Node} html 
 * @param {Object} metadata { title, url, timestamp }
 * @param {Object} userSettings 
 * @param {Document} [docContext] 
 * @returns {{ markdown: string, wordCount: number, charCount: number, filename: string }}
 */
function convertHtmlToMarkdown(html, metadata = {}, userSettings = {}, docContext = null) {
  const settings = Object.assign({}, DEFAULT_SETTINGS, userSettings);
  const title = (metadata.title || '').trim();
  const url = (metadata.url || '').trim();

  // 1. Pre-clean HTML
  const cleanedHtml = preCleanHtml(html, docContext);

  if (!cleanedHtml || !cleanedHtml.trim()) {
    return {
      markdown: '',
      wordCount: 0,
      charCount: 0,
      filename: generateMarkdownFilename(title)
    };
  }

  // 2. Turndown conversion
  const turndownService = createTurndownService(settings);
  const rawMarkdown = turndownService.turndown(cleanedHtml);

  // 3. Post-process Markdown body
  const processedBody = postProcessMarkdown(rawMarkdown, title, settings);

  // 4. Prepend Header block
  const header = buildHeaderBlock(metadata, settings);
  let finalMarkdown = '';

  if (header && processedBody) {
    finalMarkdown = `${header}\n${processedBody}\n`;
  } else if (header) {
    finalMarkdown = `${header}\n`;
  } else if (processedBody) {
    finalMarkdown = `${processedBody}\n`;
  }

  // 5. Calculate statistics
  const plainText = finalMarkdown.replace(/[*_#`[\]()>-]/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const charCount = finalMarkdown.length;
  const filename = generateMarkdownFilename(title);

  return {
    markdown: finalMarkdown,
    wordCount,
    charCount,
    filename
  };
}

// Module export for Node.js / tests and global registration for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_SETTINGS,
    generateMarkdownFilename,
    preCleanHtml,
    createTurndownService,
    postProcessMarkdown,
    buildHeaderBlock,
    convertHtmlToMarkdown
  };
}

if (typeof globalThis !== 'undefined') {
  globalThis.PageScribeConverter = {
    DEFAULT_SETTINGS,
    generateMarkdownFilename,
    preCleanHtml,
    createTurndownService,
    postProcessMarkdown,
    buildHeaderBlock,
    convertHtmlToMarkdown
  };
}
