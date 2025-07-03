import * as assert from 'assert';
import { WordToMarkdownConverter } from '../converters/wordToMarkdown';

/**
 * Test cases for the cleanupMarkdown functionality
 * This tests the fixes for reported issues:
 * 1. Removal of unwanted HTML tags like <a id="OLE_LINK5"></a>
 * 2. Fixing unnecessary backslash escaping after numbers
 */
suite('WordToMarkdownConverter.cleanupMarkdown', () => {
  
  test('should remove OLE link tags', () => {
    const input = 'This is a test <a id="OLE_LINK5"></a>with OLE link tags.';
    const expected = 'This is a test with OLE link tags.';
    const result = WordToMarkdownConverter.cleanupMarkdown(input);
    assert.strictEqual(result, expected);
  });

  test('should remove multiple OLE link tags', () => {
    const input = 'Text <a id="OLE_LINK1"></a>with <a id="OLE_LINK22"></a>multiple tags.';
    const expected = 'Text with multiple tags.';
    const result = WordToMarkdownConverter.cleanupMarkdown(input);
    assert.strictEqual(result, expected);
  });

  test('should fix unnecessary backslash escaping after numbers', () => {
    const input = 'This is point 1\\ and this is 123\\ in the text.';
    const expected = 'This is point 1 and this is 123 in the text.';
    const result = WordToMarkdownConverter.cleanupMarkdown(input);
    assert.strictEqual(result, expected);
  });

  test('should fix backslash at end of line', () => {
    const input = 'Line ending with number 42\\';
    const expected = 'Line ending with number 42';
    const result = WordToMarkdownConverter.cleanupMarkdown(input);
    assert.strictEqual(result, expected);
  });

  test('should remove empty anchor tags', () => {
    const input = 'Text with <a href="#"></a>empty anchor and <a class="test"></a>more.';
    const expected = 'Text with empty anchor and more.';
    const result = WordToMarkdownConverter.cleanupMarkdown(input);
    assert.strictEqual(result, expected);
  });

  test('should remove unwanted span and div tags', () => {
    const input = '<span style="color:red">Colored text</span> and <div>div content</div>.';
    const expected = 'Colored text and div content.';
    const result = WordToMarkdownConverter.cleanupMarkdown(input);
    assert.strictEqual(result, expected);
  });

  test('should fix common escape characters', () => {
    const input = 'Fix these\\: semicolon\\, comma\\. period and\\; another semicolon';
    const expected = 'Fix these: semicolon, comma. period and; another semicolon';
    const result = WordToMarkdownConverter.cleanupMarkdown(input);
    assert.strictEqual(result, expected);
  });

  test('should fix plus sign and other symbol escaping', () => {
    const input = 'AI\\+教育深度融合\\, 技术\\*创新\\= 未来\\& 智能\\# 发展\\!';
    const expected = 'AI+教育深度融合, 技术*创新= 未来& 智能# 发展!';
    const result = WordToMarkdownConverter.cleanupMarkdown(input);
    assert.strictEqual(result, expected);
  });

  test('should handle mixed escape characters in real content', () => {
    const input = 'Web3\\.0\\+ 区块链技术\\* 数字经济\\= 新时代\\& 创新发展\\!';
    const expected = 'Web3.0+ 区块链技术* 数字经济= 新时代& 创新发展!';
    const result = WordToMarkdownConverter.cleanupMarkdown(input);
    assert.strictEqual(result, expected);
  });

  test('should clean up multiple blank lines', () => {
    const input = 'Paragraph 1\n\n\n\nParagraph 2\n\n\n\nParagraph 3';
    const expected = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3';
    const result = WordToMarkdownConverter.cleanupMarkdown(input);
    assert.strictEqual(result, expected);
  });

  test('should remove trailing spaces from lines', () => {
    const input = 'Line with trailing spaces   \nAnother line    \nClean line';
    const expected = 'Line with trailing spaces\nAnother line\nClean line';
    const result = WordToMarkdownConverter.cleanupMarkdown(input);
    assert.strictEqual(result, expected);
  });

  test('should handle complex real-world example', () => {
    const input = `
This is a document <a id="OLE_LINK5"></a>with various issues.

Point 1\\ needs fixing.
Point 2\\ also needs work.

<span>Some</span> <div>formatted</div> text\\, here\\.

AI\\+教育深度融合\\* 技术创新

End of line 123\\
    `.trim();
    
    const expected = `This is a document with various issues.

Point 1 needs fixing.
Point 2 also needs work.

Some formatted text, here.

AI+教育深度融合* 技术创新

End of line 123`;
    
    const result = WordToMarkdownConverter.cleanupMarkdown(input);
    assert.strictEqual(result, expected);
  });
});
