const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  escapeHtml,
  sanitizeUrl,
  parseInlineMarkdown,
  renderSafeMarkdownToHtml
} = require('../scripts/sanitizer.js');

describe('PageScribe Sanitizer - XSS Prevention and Safe Preview Rendering', () => {

  test('escapeHtml escapes dangerous HTML characters', () => {
    const dangerous = '<script>alert("XSS & \'hack\'")</script>';
    const escaped = escapeHtml(dangerous);
    assert.strictEqual(escaped, '&lt;script&gt;alert(&quot;XSS &amp; &#39;hack&#39;&quot;)&lt;/script&gt;');
    assert.doesNotMatch(escaped, /<script>/);
  });

  test('sanitizeUrl allows http and https while blocking javascript: and data: schemes', () => {
    assert.strictEqual(sanitizeUrl('https://example.com/test'), 'https://example.com/test');
    assert.strictEqual(sanitizeUrl('http://example.com'), 'http://example.com');
    assert.strictEqual(sanitizeUrl('javascript:alert(1)'), null);
    assert.strictEqual(sanitizeUrl('data:text/html,<script>alert(1)</script>'), null);
    assert.strictEqual(sanitizeUrl('vbscript:msgbox(1)'), null);
    assert.strictEqual(sanitizeUrl('file:///etc/passwd'), null);
  });

  test('renderSafeMarkdownToHtml prevents raw script tag execution in preview', () => {
    const maliciousMd = '# Title\n\n<script>alert("hacked")</script>\n\nSafe text.';
    const html = renderSafeMarkdownToHtml(maliciousMd);
    assert.doesNotMatch(html, /<script>/i);
    assert.match(html, /&lt;script&gt;alert\(&quot;hacked&quot;\)&lt;\/script&gt;/);
  });

  test('renderSafeMarkdownToHtml prevents inline event handlers (onerror, onload)', () => {
    const maliciousMd = '<img src="x" onerror="alert(1)">\n<svg onload="alert(1)">';
    const html = renderSafeMarkdownToHtml(maliciousMd);
    assert.doesNotMatch(html, /<img/i);
    assert.doesNotMatch(html, /<svg/i);
    assert.doesNotMatch(html, /onerror=/i);
    assert.doesNotMatch(html, /onload=/i);
  });

  test('renderSafeMarkdownToHtml prevents malicious javascript: links', () => {
    const md = 'Click [here](javascript:alert("XSS")) to claim prize.';
    const html = renderSafeMarkdownToHtml(md);
    assert.doesNotMatch(html, /href="javascript:/i);
    // Link text should be preserved without active dangerous link
    assert.match(html, /here/);
  });

  test('STRICT ZERO-IMAGE: markdown image syntax is NEVER rendered as an img tag', () => {
    const md = '# Note\n\nHere is an image: ![A cute kitten](https://example.com/kitten.jpg)\n\nEnd.';
    const html = renderSafeMarkdownToHtml(md);
    assert.doesNotMatch(html, /<img/i);
    assert.doesNotMatch(html, /src="https:\/\/example\.com\/kitten\.jpg"/i);
  });

  test('Renders valid markdown elements cleanly into safe HTML', () => {
    const md = `
# Main Header

## Sub Header

This is **bold**, *italic*, and \`inline code\`.

> An important quote

- List item 1
- List item 2

1. First
2. Second

\`\`\`javascript
const answer = 42;
\`\`\`

| Key | Value |
| --- | --- |
| A | 1 |
| B | 2 |
    `.trim();

    const html = renderSafeMarkdownToHtml(md);
    assert.match(html, /<h1>Main Header<\/h1>/);
    assert.match(html, /<h2>Sub Header<\/h2>/);
    assert.match(html, /<strong>bold<\/strong>/);
    assert.match(html, /<em>italic<\/em>/);
    assert.match(html, /<code>inline code<\/code>/);
    assert.match(html, /<blockquote>An important quote<\/blockquote>/);
    assert.match(html, /<ul>.*<li>List item 1<\/li>.*<\/ul>/s);
    assert.match(html, /<ol>.*<li>First<\/li>.*<\/ol>/s);
    assert.match(html, /<pre><code class="language-javascript">const answer = 42;<\/code><\/pre>/);
    assert.match(html, /<table>.*<th>Key<\/th>.*<th>Value<\/th>.*<td>A<\/td>.*<td>1<\/td>.*<\/table>/s);
  });

});
