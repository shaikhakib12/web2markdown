const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const {
  convertHtmlToMarkdown,
  createTurndownService,
  preCleanHtml,
  postProcessMarkdown,
  DEFAULT_SETTINGS
} = require('../scripts/converter.js');

describe('PageScribe Converter - Text-Only Markdown Conversion', () => {

  test('Headings H1-H6 are converted properly to ATX style', () => {
    const html = `
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
      <h4>Heading 4</h4>
      <h5>Heading 5</h5>
      <h6>Heading 6</h6>
    `;
    const result = convertHtmlToMarkdown(html, {}, { includeTitle: false, includeSourceUrl: false });
    assert.match(result.markdown, /^# Heading 1/m);
    assert.match(result.markdown, /^## Heading 2/m);
    assert.match(result.markdown, /^### Heading 3/m);
    assert.match(result.markdown, /^#### Heading 4/m);
    assert.match(result.markdown, /^##### Heading 5/m);
    assert.match(result.markdown, /^###### Heading 6/m);
  });

  test('Paragraphs and inline formatting (bold, italic, strikethrough)', () => {
    const html = '<p>This is <strong>bold</strong>, <em>italic</em>, and <del>strikethrough</del> text.</p>';
    const result = convertHtmlToMarkdown(html, {}, { includeTitle: false, includeSourceUrl: false });
    assert.match(result.markdown, /\*\*bold\*\*/);
    assert.match(result.markdown, /\*italic\*/);
    assert.match(result.markdown, /~strikethrough~/);
  });

  test('Ordered and unordered lists with nesting', () => {
    const html = `
      <ul>
        <li>First item</li>
        <li>Second item
          <ul>
            <li>Nested sub-item A</li>
            <li>Nested sub-item B</li>
          </ul>
        </li>
      </ul>
      <ol>
        <li>Ordered 1</li>
        <li>Ordered 2</li>
      </ol>
    `;
    const result = convertHtmlToMarkdown(html, {}, { includeTitle: false, includeSourceUrl: false });
    assert.match(result.markdown, /-   First item/);
    assert.match(result.markdown, /-   Second item/);
    assert.match(result.markdown, /Nested sub-item A/);
    assert.match(result.markdown, /1\.  Ordered 1/);
    assert.match(result.markdown, /2\.  Ordered 2/);
  });

  test('Blockquotes are converted with > prefix', () => {
    const html = '<blockquote><p>Knowledge is power.</p></blockquote>';
    const result = convertHtmlToMarkdown(html, {}, { includeTitle: false, includeSourceUrl: false });
    assert.match(result.markdown, /> Knowledge is power\./);
  });

  test('Inline code and fenced code blocks with language', () => {
    const html = `
      <p>Use the <code>npm test</code> command.</p>
      <pre class="language-javascript"><code>function add(a, b) {\n  return a + b;\n}</code></pre>
    `;
    const result = convertHtmlToMarkdown(html, {}, { includeTitle: false, includeSourceUrl: false });
    assert.match(result.markdown, /`npm test`/);
    assert.match(result.markdown, /```javascript\nfunction add\(a, b\) \{\n  return a \+ b;\n\}\n```/);
  });

  test('Tables are converted to GFM markdown tables when preserveTables is true', () => {
    const html = `
      <table>
        <thead>
          <tr><th>Feature</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr><td>Markdown</td><td>Supported</td></tr>
          <tr><td>Images</td><td>Excluded</td></tr>
        </tbody>
      </table>
    `;
    const result = convertHtmlToMarkdown(html, {}, { includeTitle: false, includeSourceUrl: false, preserveTables: true });
    assert.match(result.markdown, /\|\s*Feature\s*\|\s*Status\s*\|/);
    assert.match(result.markdown, /\|\s*---\s*\|\s*---\s*\|/);
    assert.match(result.markdown, /\|\s*Markdown\s*\|\s*Supported\s*\|/);
    assert.match(result.markdown, /\|\s*Images\s*\|\s*Excluded\s*\|/);
  });

  test('Tables are flattened when preserveTables is false', () => {
    const html = `
      <table>
        <tr><td>Data A</td><td>Data B</td></tr>
      </table>
    `;
    const result = convertHtmlToMarkdown(html, {}, { includeTitle: false, includeSourceUrl: false, preserveTables: false });
    assert.doesNotMatch(result.markdown, /\|/);
    assert.match(result.markdown, /Data A/);
    assert.match(result.markdown, /Data B/);
  });

  test('CRITICAL REQUIREMENT: Strict Image & Media Exclusion', () => {
    const html = `
      <article>
        <h1>Article With Media</h1>
        <p>Before image paragraph.</p>
        <img src="https://example.com/photo.jpg" alt="A beautiful landscape" title="Photo" />
        <picture>
          <source srcset="image.webp" type="image/webp">
          <img src="fallback.jpg" alt="Fallback picture" />
        </picture>
        <figure>
          <img src="chart.png" alt="Sales Chart" />
          <figcaption>Figure 1: Quarterly Sales</figcaption>
        </figure>
        <svg width="100" height="100"><circle cx="50" cy="50" r="40" /></svg>
        <canvas id="myCanvas"></canvas>
        <video controls><source src="movie.mp4"></video>
        <audio controls><source src="song.mp3"></audio>
        <p>After media paragraph.</p>
      </article>
    `;

    const result = convertHtmlToMarkdown(html, {}, { includeTitle: false, includeSourceUrl: false });

    // Ensure NO markdown image syntax exists
    assert.doesNotMatch(result.markdown, /!\[.*?\]\(.*?\)/, 'Must not produce markdown image syntax');
    assert.doesNotMatch(result.markdown, /https:\/\/example\.com\/photo\.jpg/, 'Must not include image URL');
    assert.doesNotMatch(result.markdown, /fallback\.jpg/, 'Must not include picture source');
    assert.doesNotMatch(result.markdown, /chart\.png/, 'Must not include chart image');
    assert.doesNotMatch(result.markdown, /movie\.mp4/, 'Must not include video source');
    assert.doesNotMatch(result.markdown, /song\.mp3/, 'Must not include audio source');

    // Text content must be preserved
    assert.match(result.markdown, /Before image paragraph\./);
    assert.match(result.markdown, /After media paragraph\./);
  });

  test('Links wrapping images are cleanly handled', () => {
    const html = `
      <div>
        <!-- Link with ONLY an image -> should be stripped completely -->
        <a href="https://example.com/logo-link"><img src="logo.png" alt="Company Logo" /></a>
        <!-- Link with image AND text -> text link should be preserved, image removed -->
        <a href="https://example.com/home"><img src="icon.png" alt="Home" /> Homepage Link</a>
      </div>
    `;

    const result = convertHtmlToMarkdown(html, {}, { includeTitle: false, includeSourceUrl: false });
    assert.doesNotMatch(result.markdown, /logo-link/, 'Pure image link should be removed');
    assert.match(result.markdown, /\[Homepage Link\]\(https:\/\/example\.com\/home\)/);
    assert.doesNotMatch(result.markdown, /!\[.*?\]/);
  });

  test('Hyperlinks settings: preserveHyperlinks=false converts links to plain text', () => {
    const html = '<p>Check out <a href="https://pagescribe.org">PageScribe</a> today.</p>';
    const result = convertHtmlToMarkdown(html, {}, { includeTitle: false, includeSourceUrl: false, preserveHyperlinks: false });
    assert.strictEqual(result.markdown.trim(), 'Check out PageScribe today.');
    assert.doesNotMatch(result.markdown, /\[.*?\]\(.*?\)/);
  });

  test('Avoids duplicate H1 title when includeTitle is enabled', () => {
    const html = '<h1>PageScribe Guide</h1><p>Welcome to PageScribe.</p>';
    const metadata = { title: 'PageScribe Guide', url: 'https://example.com/guide' };
    const result = convertHtmlToMarkdown(html, metadata, { includeTitle: true, includeSourceUrl: false });

    // There should be only ONE "# PageScribe Guide"
    const occurrences = (result.markdown.match(/# PageScribe Guide/g) || []).length;
    assert.strictEqual(occurrences, 1, 'Duplicate title heading should be removed');
  });

  test('Excessive blank lines are collapsed', () => {
    const html = '<p>Line 1</p><br><br><br><br><p>Line 2</p>';
    const result = convertHtmlToMarkdown(html, {}, { includeTitle: false, includeSourceUrl: false, removeBlankLines: true });
    assert.doesNotMatch(result.markdown, /\n{3,}/, 'Should not have 3 or more consecutive newlines');
  });

  test('Word and character count calculations', () => {
    const html = '<p>The quick brown fox jumps over the lazy dog.</p>';
    const result = convertHtmlToMarkdown(html, {}, { includeTitle: false, includeSourceUrl: false });
    assert.strictEqual(result.wordCount, 9);
    assert.ok(result.charCount > 30);
  });

});
