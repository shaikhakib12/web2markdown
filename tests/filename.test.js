const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { generateMarkdownFilename } = require('../scripts/converter.js');

describe('PageScribe Filename Sanitizer', () => {

  test('Sanitizes illegal characters in filenames', () => {
    const raw = 'How To: Build a "Clean" Web App? (2026/10) <Guide> | Part * 1';
    const filename = generateMarkdownFilename(raw);
    assert.doesNotMatch(filename, /[<>:"/\\|?*]/);
    assert.ok(filename.endsWith('.md'));
    assert.strictEqual(filename, 'how-to-build-a-clean-web-app-2026-10-guide-part-1.md');
  });

  test('Truncates excessively long webpage titles cleanly', () => {
    const longTitle = 'A Comprehensive In-Depth Complete Guide to Advanced Full-Stack Architecture Principles and Systems Design';
    const filename = generateMarkdownFilename(longTitle);
    assert.ok(filename.length <= 64); // 60 chars max name + .md
    assert.ok(filename.endsWith('.md'));
    assert.doesNotMatch(filename, /-$/);
  });

  test('Provides fallback for empty, null, or undefined titles', () => {
    assert.strictEqual(generateMarkdownFilename(''), 'pagescribe-article.md');
    assert.strictEqual(generateMarkdownFilename(null), 'pagescribe-article.md');
    assert.strictEqual(generateMarkdownFilename(undefined), 'pagescribe-article.md');
    assert.strictEqual(generateMarkdownFilename('   ??? *** :::   '), 'pagescribe-article.md');
  });

  test('Preserves hyphens and numbers', () => {
    const title = 'Release Notes - Version 3.12.0';
    const filename = generateMarkdownFilename(title);
    assert.strictEqual(filename, 'release-notes-version-3.12.0.md');
  });

});
