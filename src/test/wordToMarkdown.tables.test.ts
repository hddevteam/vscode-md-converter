import * as assert from 'assert';
import { WordToMarkdownConverter } from '../converters/wordToMarkdown';

suite('WordToMarkdownConverter.convertHtmlToMarkdown (tables)', () => {
  test('should convert an HTML table to a Markdown table', () => {
    const html = [
      '<table>',
      '<tr><th>Name</th><th>Score</th></tr>',
      '<tr><td>Alice</td><td>95</td></tr>',
      '<tr><td>Bob</td><td>88</td></tr>',
      '</table>'
    ].join('');

    const convertHtmlToMarkdown = (WordToMarkdownConverter as any).convertHtmlToMarkdown as (html: string) => string;
    const md = convertHtmlToMarkdown(html);

    assert.strictEqual(md, [
      '| Name | Score |',
      '| --- | --- |',
      '| Alice | 95 |',
      '| Bob | 88 |'
    ].join('\n'));
  });

  test('should convert mammoth table cells that contain paragraphs without trailing breaks', () => {
    const html = [
      '<table>',
      '<tr><td><p>时间段</p></td><td><p>主要任务</p></td></tr>',
      '<tr><td><p>08:00 - 10:00</p></td><td><p>高效工作/学习</p></td></tr>',
      '</table>'
    ].join('');

    const convertHtmlToMarkdown = (WordToMarkdownConverter as any).convertHtmlToMarkdown as (html: string) => string;
    const md = convertHtmlToMarkdown(html);

    assert.strictEqual(md, [
      '| 时间段 | 主要任务 |',
      '| --- | --- |',
      '| 08:00 - 10:00 | 高效工作/学习 |'
    ].join('\n'));
  });
});
