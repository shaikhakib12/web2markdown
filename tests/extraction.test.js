const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const Readability = require('@mozilla/readability').Readability;
const { preCleanHtml, convertHtmlToMarkdown } = require('../scripts/converter.js');

describe('PageScribe Extraction & Pre-Cleaning', () => {

  test('Pre-clean strips navigation, headers, footers, and sidebars', () => {
    const rawHtml = `
      <header><div class="logo">Site Logo</div><nav><a href="/home">Home</a></nav></header>
      <main>
        <article>
          <h1>Actual Article</h1>
          <p>This is the real content.</p>
        </article>
      </main>
      <aside class="sidebar"><h3>Related Posts</h3><ul><li>Post 1</li></ul></aside>
      <footer><p>&copy; 2026 Company Inc. All rights reserved.</p></footer>
    `;

    const cleaned = preCleanHtml(rawHtml);
    assert.doesNotMatch(cleaned, /<nav/i);
    assert.doesNotMatch(cleaned, /<header/i);
    assert.doesNotMatch(cleaned, /<footer/i);
    assert.doesNotMatch(cleaned, /<aside/i);
    assert.match(cleaned, /Actual Article/);
    assert.match(cleaned, /This is the real content\./);
  });

  test('Pre-clean strips ads, cookie banners, modals, and tracking widgets', () => {
    const rawHtml = `
      <div class="cookie-banner"><p>We use cookies.</p><button>Accept</button></div>
      <div class="advertisement"><ins class="adsbygoogle">Buy this product</ins></div>
      <div class="modal"><p>Subscribe to our newsletter!</p></div>
      <article>
        <h2>Clean Content</h2>
        <p>Valuable research data here.</p>
      </article>
      <div class="share-buttons"><button>Share on Twitter</button></div>
    `;

    const cleaned = preCleanHtml(rawHtml);
    assert.doesNotMatch(cleaned, /cookie-banner/i);
    assert.doesNotMatch(cleaned, /advertisement/i);
    assert.doesNotMatch(cleaned, /adsbygoogle/i);
    assert.doesNotMatch(cleaned, /modal/i);
    assert.doesNotMatch(cleaned, /share-buttons/i);
    assert.match(cleaned, /Clean Content/);
    assert.match(cleaned, /Valuable research data here\./);
  });

  test('Strips hidden elements and aria-hidden nodes', () => {
    const rawHtml = `
      <div>
        <p>Visible paragraph.</p>
        <div aria-hidden="true"><p>Screen reader hidden note</p></div>
        <div hidden><p>Hidden with hidden attribute</p></div>
        <p class="hidden">Hidden by CSS class</p>
      </div>
    `;

    const cleaned = preCleanHtml(rawHtml);
    assert.match(cleaned, /Visible paragraph\./);
    assert.doesNotMatch(cleaned, /Screen reader hidden note/);
    assert.doesNotMatch(cleaned, /Hidden with hidden attribute/);
    assert.doesNotMatch(cleaned, /Hidden by CSS class/);
  });

  test('Handles malformed and unclosed HTML gracefully without throwing', () => {
    const malformed = '<div><h1>Unclosed Header<p>Paragraph with <b>unclosed bold <i>tags<table><tr><td>Cell 1';
    assert.doesNotThrow(() => {
      const result = convertHtmlToMarkdown(malformed, { title: 'Malformed Test' });
      assert.ok(result.markdown);
      assert.match(result.markdown, /Unclosed Header/);
      assert.match(result.markdown, /Cell 1/);
    });
  });

  test('Handles empty and whitespace-only content gracefully', () => {
    const empty1 = '';
    const empty2 = '   <div><span>   </span></div>   ';
    const result1 = convertHtmlToMarkdown(empty1);
    const result2 = convertHtmlToMarkdown(empty2);

    assert.strictEqual(result1.markdown, '');
    assert.strictEqual(result1.wordCount, 0);
    assert.strictEqual(result2.markdown, '');
    assert.strictEqual(result2.wordCount, 0);
  });

  test('Readability simulation correctly extracts article from document', () => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Understanding Microservices</title></head>
        <body>
          <div class="top-nav"><a href="#">Menu</a></div>
          <div class="content-wrapper">
            <h1>Understanding Microservices Architecture</h1>
            <p class="byline">By John Doe &bull; Published Oct 2026</p>
            <p>Microservices are an architectural style that structures an application as a collection of services that are independently deployable, loosely coupled, and organized around business capabilities.</p>
            <p>They enable the continuous delivery/deployment of large, complex applications and allow organizations to evolve their technology stack.</p>
            <ul>
              <li>High maintainability and testability</li>
              <li>Independently deployable</li>
              <li>Capable of being developed by a small team</li>
            </ul>
          </div>
          <div class="sidebar">Popular posts...</div>
          <footer>Copyright 2026</footer>
        </body>
      </html>
    `, { url: 'https://example.com/microservices' });

    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    assert.ok(article, 'Readability should parse the article');
    assert.match(article.title, /Understanding Microservices/);
    assert.ok(article.content.length > 50);

    const converted = convertHtmlToMarkdown(article.content, {
      title: article.title,
      url: 'https://example.com/microservices'
    });

    assert.match(converted.markdown, /Understanding Microservices/);
    assert.match(converted.markdown, /independently deployable/);
    assert.match(converted.markdown, /-   High maintainability and testability/);
    assert.doesNotMatch(converted.markdown, /Menu/);
    assert.doesNotMatch(converted.markdown, /Copyright/);
  });

  test('Full Text extraction correctly targets main visible container', () => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Full Text Target Test</title></head>
        <body>
          <header><nav><a href="/">Site Navigation</a></nav></header>
          <main id="main-content">
            <h1>Documentation Header</h1>
            <p>First paragraph of documentation explaining how to install PageScribe.</p>
            <p>Second paragraph with code examples and instructions.</p>
            <div style="display:none" class="hidden">Hidden secret notes</div>
          </main>
          <footer>Footer links and copyright</footer>
        </body>
      </html>
    `, { url: 'https://example.com/docs' });

    const mainEl = dom.window.document.querySelector('main');
    const cleaned = preCleanHtml(mainEl.innerHTML, dom.window.document);
    const converted = convertHtmlToMarkdown(cleaned, { title: 'Documentation Header', url: 'https://example.com/docs' });

    assert.match(converted.markdown, /Documentation Header/);
    assert.match(converted.markdown, /First paragraph of documentation/);
    assert.doesNotMatch(converted.markdown, /Site Navigation/);
    assert.doesNotMatch(converted.markdown, /Footer links/);
    assert.doesNotMatch(converted.markdown, /Hidden secret notes/);
  });

});
