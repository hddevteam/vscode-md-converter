import * as assert from 'assert';
import { MarkdownToWordConverter } from '../../../converters/markdownToWord';
import * as fs from 'fs';
import * as path from 'path';

/**
 * TDD Tests for HTML list handling
 * These tests validate:
 * 1. <ul><li> to Markdown unordered lists
 * 2. <ol><li> to Markdown ordered lists
 * 3. Mixed HTML and Markdown lists
 * 4. Nested HTML lists
 */
suite('HTML List Handling Tests', () => {
  const tempDir = path.join(__dirname, '../../temp');

  suiteSetup(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  suiteTeardown(() => {
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
      if (file.startsWith('html_list_') && file.endsWith('.docx')) {
        fs.unlinkSync(path.join(tempDir, file));
      }
    });
  });

  suite('HTML Unordered Lists', () => {
    test('should convert simple <ul><li> to markdown list', async () => {
      const mdFile = path.join(tempDir, 'html_list_simple_ul.md');
      const markdown = `# HTML Unordered List

<ul>
<li>Item 1</li>
<li>Item 2</li>
<li>Item 3</li>
</ul>`;

      fs.writeFileSync(mdFile, markdown, 'utf-8');
      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Should generate output file');
      
      const stats = fs.statSync(result.outputPath);
      assert.ok(stats.size > 0, 'Output file should not be empty');

      // Cleanup
      fs.unlinkSync(mdFile);
      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath);
      }
    });

    test('should handle <ul> with formatting in list items', async () => {
      const mdFile = path.join(tempDir, 'html_list_ul_format.md');
      const markdown = `# Formatted HTML List

<ul>
<li><strong>Bold</strong> item</li>
<li><em>Italic</em> item</li>
<li><b>Bold</b> and <i>italic</i></li>
</ul>`;

      fs.writeFileSync(mdFile, markdown, 'utf-8');
      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Should generate output file');

      // Cleanup
      fs.unlinkSync(mdFile);
      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath);
      }
    });

    test('should handle <ul> with attributes', async () => {
      const mdFile = path.join(tempDir, 'html_list_ul_attr.md');
      const markdown = `# HTML List with Attributes

<ul class="list" style="margin: 10px;">
<li>Item A</li>
<li>Item B</li>
<li>Item C</li>
</ul>`;

      fs.writeFileSync(mdFile, markdown, 'utf-8');
      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Should generate output file');

      // Cleanup
      fs.unlinkSync(mdFile);
      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath);
      }
    });
  });

  suite('HTML Ordered Lists', () => {
    test('should convert simple <ol><li> to markdown numbered list', async () => {
      const mdFile = path.join(tempDir, 'html_list_simple_ol.md');
      const markdown = `# HTML Ordered List

<ol>
<li>First step</li>
<li>Second step</li>
<li>Third step</li>
</ol>`;

      fs.writeFileSync(mdFile, markdown, 'utf-8');
      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Should generate output file');

      // Cleanup
      fs.unlinkSync(mdFile);
      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath);
      }
    });

    test('should handle <ol> with formatting in list items', async () => {
      const mdFile = path.join(tempDir, 'html_list_ol_format.md');
      const markdown = `# Formatted Ordered List

<ol>
<li><strong>Important</strong> step</li>
<li><em>Emphasized</em> step</li>
<li><code>Code</code> step</li>
</ol>`;

      fs.writeFileSync(mdFile, markdown, 'utf-8');
      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Should generate output file');

      // Cleanup
      fs.unlinkSync(mdFile);
      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath);
      }
    });

    test('should handle <ol> with start attribute', async () => {
      const mdFile = path.join(tempDir, 'html_list_ol_start.md');
      const markdown = `# Ordered List with Start

<ol start="5">
<li>Fifth item</li>
<li>Sixth item</li>
<li>Seventh item</li>
</ol>`;

      fs.writeFileSync(mdFile, markdown, 'utf-8');
      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Should generate output file');

      // Cleanup
      fs.unlinkSync(mdFile);
      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath);
      }
    });
  });

  suite('Mixed and Complex HTML Lists', () => {
    test('should handle document with both <ul> and <ol>', async () => {
      const mdFile = path.join(tempDir, 'html_list_mixed.md');
      const markdown = `# Mixed Lists

## Unordered
<ul>
<li>Point A</li>
<li>Point B</li>
</ul>

## Ordered
<ol>
<li>Step 1</li>
<li>Step 2</li>
</ol>`;

      fs.writeFileSync(mdFile, markdown, 'utf-8');
      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Should generate output file');

      // Cleanup
      fs.unlinkSync(mdFile);
      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath);
      }
    });

    test('should handle HTML list in table cells', async () => {
      const mdFile = path.join(tempDir, 'html_list_table.md');
      const markdown = `# List in Table

| Column 1 | Column 2 |
|----------|----------|
| <ul><li>Item 1</li><li>Item 2</li></ul> | Data |
| Text | <ol><li>First</li><li>Second</li></ol> |`;

      fs.writeFileSync(mdFile, markdown, 'utf-8');
      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Should generate output file');

      // Cleanup
      fs.unlinkSync(mdFile);
      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath);
      }
    });

    test('should handle HTML list with line breaks', async () => {
      const mdFile = path.join(tempDir, 'html_list_with_br.md');
      const markdown = `# List with Breaks

<ul>
<li>Item 1<br>with line break</li>
<li>Item 2<br>also with<br>multiple breaks</li>
<li>Item 3</li>
</ul>`;

      fs.writeFileSync(mdFile, markdown, 'utf-8');
      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Should generate output file');

      // Cleanup
      fs.unlinkSync(mdFile);
      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath);
      }
    });

    test('should handle complex HTML list with all formatting', async () => {
      const mdFile = path.join(tempDir, 'html_list_complex.md');
      const markdown = `# Complex HTML List

<ul>
<li><strong>Bold text</strong> with <em>italic</em> and <code>code</code></li>
<li>Line 1<br>Line 2<br><strong>Line 3</strong></li>
<li><b>Another</b> <i>item</i> with <span>span</span></li>
</ul>

More content:

<ol>
<li><strong>First</strong> ordered<br>with break</li>
<li><em>Second</em> with <strong>bold</strong></li>
<li>Simple <code>code</code> item</li>
</ol>`;

      fs.writeFileSync(mdFile, markdown, 'utf-8');
      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Should generate output file');

      const stats = fs.statSync(result.outputPath);
      assert.ok(stats.size > 2000, 'Output should be substantial for complex content');

      // Cleanup
      fs.unlinkSync(mdFile);
      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath);
      }
    });
  });

  suite('Edge Cases with HTML Lists', () => {
    test('should handle empty list items', async () => {
      const mdFile = path.join(tempDir, 'html_list_empty.md');
      const markdown = `# List with Empty Items

<ul>
<li>Item 1</li>
<li></li>
<li>Item 2</li>
<li> </li>
<li>Item 3</li>
</ul>`;

      fs.writeFileSync(mdFile, markdown, 'utf-8');
      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Should generate output file');

      // Cleanup
      fs.unlinkSync(mdFile);
      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath);
      }
    });

    test('should handle list with mixed whitespace and formatting', async () => {
      const mdFile = path.join(tempDir, 'html_list_whitespace.md');
      const markdown = `# List with Whitespace

<ul>
<li>  Item with spaces  </li>
<li>
Item with newline
</li>
<li>Normal item</li>
</ul>`;

      fs.writeFileSync(mdFile, markdown, 'utf-8');
      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Should generate output file');

      // Cleanup
      fs.unlinkSync(mdFile);
      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath);
      }
    });

    test('should handle list with nested HTML tags', async () => {
      const mdFile = path.join(tempDir, 'html_list_nested_tags.md');
      const markdown = `# Nested HTML Tags in List

<ul>
<li><div>Content in div</div></li>
<li><span>Content in span</span></li>
<li><p>Content in p</p></li>
<li><strong><em>Nested formatting</em></strong></li>
</ul>`;

      fs.writeFileSync(mdFile, markdown, 'utf-8');
      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Should generate output file');

      // Cleanup
      fs.unlinkSync(mdFile);
      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath);
      }
    });
  });
});
