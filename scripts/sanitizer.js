/**
 * PageScribe - Secure Markdown Preview Sanitizer & Renderer
 * 
 * Safely converts Markdown into strictly sanitized HTML for Preview Mode.
 * Guarantees zero script execution, no raw HTML injection, no image rendering,
 * and safe external link handling.
 */

/**
 * Escapes raw HTML characters to prevent XSS injection
 * @param {string} str 
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes URLs to ensure only secure web protocols (http, https) are permitted
 * @param {string} url 
 * @returns {string|null}
 */
function sanitizeUrl(url) {
  if (!url) return null;
  const trimmed = url.trim();
  // Strictly allow http and https protocols only
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Formats inline Markdown syntax (bold, italic, code, strikethrough, links)
 * @param {string} text Already HTML-escaped text
 * @returns {string}
 */
function parseInlineMarkdown(text) {
  if (!text) return '';

  // 1. Inline code: `code` (protect from further replacements, zero markdown characters in placeholder)
  const codePlaceholders = [];
  let parsed = text.replace(/`([^`]+)`/g, (match, codeContent) => {
    const idx = codePlaceholders.length;
    codePlaceholders.push(`<code>${codeContent}</code>`);
    return `@@PAGESCRIBECODETOKEN${idx}@@`;
  });

  // 2. Strict exclusion of images: strip any ![alt](url)
  parsed = parsed.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');

  // 3. Links: [text](url) -> only allow http(s)
  parsed = parsed.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g, (match, linkText, url, title) => {
    const safeUrl = sanitizeUrl(url);
    if (!safeUrl) {
      return linkText;
    }
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${escapeHtml(safeUrl)}"${titleAttr} target="_blank" rel="noopener noreferrer">${linkText}</a>`;
  });

  // 4. Bold: **text** or __text__
  parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  parsed = parsed.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // 5. Italic: *text* or _text_
  parsed = parsed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  parsed = parsed.replace(/_([^_]+)_/g, '<em>$1</em>');

  // 6. Strikethrough: ~~text~~
  parsed = parsed.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Restore inline code blocks
  parsed = parsed.replace(/@@PAGESCRIBECODETOKEN(\d+)@@/g, (match, idx) => {
    return codePlaceholders[Number(idx)] || '';
  });

  return parsed;
}

/**
 * Safely converts Markdown string into sanitized HTML string for preview display
 * @param {string} markdown 
 * @returns {string} Safe HTML string
 */
function renderSafeMarkdownToHtml(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return '<div class="pagescribe-empty">No content to preview</div>';
  }

  // Pre-clean raw markdown input: strictly strip raw images, svgs, and event handlers
  let cleanedMarkdown = markdown
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<svg\b[^>]*>.*?<\/svg>/gis, '')
    .replace(/<svg\b[^>]*>/gi, '')
    .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // Pre-escape all input to prevent raw HTML execution
  const lines = cleanedMarkdown.split(/\r?\n/);
  const output = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines = [];
  let inTable = false;
  let tableHeaderParsed = false;
  let tableRows = [];
  let inBlockquote = false;
  let blockquoteLines = [];
  let inList = false;
  let listType = 'ul'; // 'ul' | 'ol'

  function flushList() {
    if (inList) {
      output.push(`</${listType}>`);
      inList = false;
    }
  }

  function flushBlockquote() {
    if (inBlockquote) {
      const bqContent = blockquoteLines.map(l => parseInlineMarkdown(escapeHtml(l))).join('<br>');
      output.push(`<blockquote>${bqContent}</blockquote>`);
      inBlockquote = false;
      blockquoteLines = [];
    }
  }

  function flushTable() {
    if (inTable) {
      if (tableRows.length > 0) {
        let tableHtml = '<div class="table-container"><table>';
        tableRows.forEach((row, i) => {
          const isHeader = i === 0 && tableHeaderParsed;
          const tag = isHeader ? 'th' : 'td';
          const rowHtml = row.map(cell => `<${tag}>${parseInlineMarkdown(escapeHtml(cell))}</${tag}>`).join('');
          if (isHeader) {
            tableHtml += `<thead><tr>${rowHtml}</tr></thead><tbody>`;
          } else {
            tableHtml += `<tr>${rowHtml}</tr>`;
          }
        });
        if (tableHeaderParsed) {
          tableHtml += '</tbody>';
        }
        tableHtml += '</table></div>';
        output.push(tableHtml);
      }
      inTable = false;
      tableHeaderParsed = false;
      tableRows = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // 1. Code blocks (``` or ~~~)
    const codeFenceMatch = rawLine.match(/^```([a-zA-Z0-9_-]*)/);
    if (codeFenceMatch) {
      if (inCodeBlock) {
        // End of code block
        const escapedCode = escapeHtml(codeBlockLines.join('\n'));
        const langClass = codeBlockLang ? ` class="language-${escapeHtml(codeBlockLang)}"` : '';
        output.push(`<pre><code${langClass}>${escapedCode}</code></pre>`);
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLang = '';
      } else {
        // Start of code block
        flushList();
        flushBlockquote();
        flushTable();
        inCodeBlock = true;
        codeBlockLang = codeFenceMatch[1] || '';
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    const trimmed = rawLine.trim();

    // 2. Blank line handling
    if (!trimmed) {
      flushList();
      flushBlockquote();
      flushTable();
      continue;
    }

    // 3. Tables: | col1 | col2 |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      flushBlockquote();
      // Check if separator line: | --- | :---: |
      if (/^\|(?:\s*:?-+:?\s*\|)+$/.test(trimmed)) {
        tableHeaderParsed = true;
        inTable = true;
        continue;
      }
      // Table row
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());
      inTable = true;
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

    // 4. Blockquotes: > text
    if (trimmed.startsWith('>')) {
      flushList();
      flushTable();
      inBlockquote = true;
      blockquoteLines.push(trimmed.replace(/^>\s?/, ''));
      continue;
    } else {
      flushBlockquote();
    }

    // 5. Horizontal rule: --- or ***
    if (/^(?:---|\*\*\*|___)$/.test(trimmed)) {
      flushList();
      flushTable();
      flushBlockquote();
      output.push('<hr>');
      continue;
    }

    // 6. Headings: # H1 to ###### H6
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      flushTable();
      flushBlockquote();
      const level = headingMatch[1].length;
      const headingContent = parseInlineMarkdown(escapeHtml(headingMatch[2]));
      output.push(`<h${level}>${headingContent}</h${level}>`);
      continue;
    }

    // 7. Unordered list: - item or * item
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      flushTable();
      flushBlockquote();
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
        output.push('<ul>');
      }
      const itemContent = parseInlineMarkdown(escapeHtml(ulMatch[1]));
      output.push(`<li>${itemContent}</li>`);
      continue;
    }

    // 8. Ordered list: 1. item
    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      flushTable();
      flushBlockquote();
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
        output.push('<ol>');
      }
      const itemContent = parseInlineMarkdown(escapeHtml(olMatch[2]));
      output.push(`<li>${itemContent}</li>`);
      continue;
    }

    // Regular paragraph
    flushList();
    flushTable();
    flushBlockquote();

    const pContent = parseInlineMarkdown(escapeHtml(trimmed));
    output.push(`<p>${pContent}</p>`);
  }

  // Final flushes
  if (inCodeBlock) {
    const escapedCode = escapeHtml(codeBlockLines.join('\n'));
    output.push(`<pre><code>${escapedCode}</code></pre>`);
  }
  flushList();
  flushBlockquote();
  flushTable();

  return output.join('\n');
}

// Module export for Node.js / tests and global registration for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHtml,
    sanitizeUrl,
    parseInlineMarkdown,
    renderSafeMarkdownToHtml
  };
}

if (typeof globalThis !== 'undefined') {
  globalThis.PageScribeSanitizer = {
    escapeHtml,
    sanitizeUrl,
    parseInlineMarkdown,
    renderSafeMarkdownToHtml
  };
}
