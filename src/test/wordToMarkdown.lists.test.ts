import * as assert from 'assert';
import { WordToMarkdownConverter } from '../converters/wordToMarkdown';

suite('WordToMarkdownConverter.convertHtmlToMarkdown (lists)', () => {
  test('should convert <ol><li> to numbered markdown list items', () => {
    const html = [
      '<ol>',
      '<li>First</li>',
      '<li>Second</li>',
      '<li>Third</li>',
      '</ol>'
    ].join('');

    const convertHtmlToMarkdown = (WordToMarkdownConverter as any).convertHtmlToMarkdown as (html: string) => string;
    const md = convertHtmlToMarkdown(html);

    assert.ok(!md.includes('$1'), 'Should not contain literal "$1" in output');
    assert.strictEqual(md, ['1. First', '2. Second', '3. Third'].join('\n'));
  });

  test('should convert <ul><li> to bullet markdown list items', () => {
    const html = '<ul><li>Apple</li><li>Banana</li></ul>';

    const convertHtmlToMarkdown = (WordToMarkdownConverter as any).convertHtmlToMarkdown as (html: string) => string;
    const md = convertHtmlToMarkdown(html);

    assert.strictEqual(md, ['- Apple', '- Banana'].join('\n'));
  });

  test('should handle line breaks inside list items', () => {
    const html = '<ol><li>Line 1<br/>Line 2</li><li>A<br>B<br>C</li></ol>';

    const convertHtmlToMarkdown = (WordToMarkdownConverter as any).convertHtmlToMarkdown as (html: string) => string;
    const md = convertHtmlToMarkdown(html);

    assert.ok(md.includes('1. Line 1\nLine 2'), 'Expected converted line breaks in first list item');
    assert.ok(md.includes('2. A\nB\nC'), 'Expected converted line breaks in second list item');
    assert.ok(!md.includes('$1'), 'Should not contain literal "$1" in output');
  });
});
