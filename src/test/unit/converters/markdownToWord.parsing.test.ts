import * as assert from 'assert';
import { MarkdownToWordConverter } from '../../../converters/markdownToWord';
import * as fs from 'fs';
import * as path from 'path';

/**
 * TDD Tests for Markdown parsing edge cases
 * These tests identify and validate fixes for:
 * 1. Bold formatting in list items
 * 2. Bold formatting in table cells
 * 3. HTML tag handling (<br>, <div>, etc.)
 * 4. Complex nested formatting scenarios
 */
suite('Markdown Parsing Edge Cases - TDD', () => {
  const tempDir = path.join(__dirname, '../../temp');

  suiteSetup(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  suiteTeardown(() => {
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
      if (file.startsWith('edge_case_') && file.endsWith('.docx')) {
        fs.unlinkSync(path.join(tempDir, file));
      }
    });
  });

  suite('Bold Formatting in Lists', () => {
    test('should parse bold text in unordered list items', async () => {
      const mdFile = path.join(tempDir, 'edge_case_bold_list.md');
      const markdown = `# Test Document

## Feature List
- This is a **bold feature** name
- Another **important** item with bold text
- Normal item without bold
- Mixed **bold and** normal text`;

      fs.writeFileSync(mdFile, markdown, 'utf-8');
      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Should generate output file');
      
      const stats = fs.statSync(result.outputPath);
      assert.ok(stats.size > 0, 'Output should contain bold formatting data');

      // Cleanup
      fs.unlinkSync(mdFile);
      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath);
      }
    });

    test('should parse bold text in ordered list items', async () => {
      const mdFile = path.join(tempDir, 'edge_case_bold_ordered_list.md');
      const markdown = `# Instructions

1. First step with **important** note
2. Second **critical** instruction
3. Regular step
4. Final step with **bold emphasis**`;

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

    test('should parse nested formatting in list items (bold + italic)', async () => {
      const mdFile = path.join(tempDir, 'edge_case_nested_list.md');
      const markdown = `# Complex Formatting

- Item with ***bold and italic***
- Item with **bold** and *italic* separately
- Item with ~~strikethrough~~ and **bold**
- Regular item`;

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

  suite('Bold Formatting in Tables', () => {
    test('should parse bold text in table headers', async () => {
      const mdFile = path.join(tempDir, 'edge_case_table_bold_header.md');
      const markdown = `# Table with Bold

| **Feature** | **Status** | Description |
|-----------|----------|-------------|
| Feature 1 | Active | Normal text |
| Feature 2 | **Pending** | With bold |
| Feature 3 | Complete | Another row |`;

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

    test('should parse bold text in table cells', async () => {
      const mdFile = path.join(tempDir, 'edge_case_table_bold_cells.md');
      const markdown = `# Data Table

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| **Important** data | Normal | Value |
| Text | **Bold** value | More |
| Another **bold** | Regular | Final |`;

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

    test('should parse mixed formatting in table cells', async () => {
      const mdFile = path.join(tempDir, 'edge_case_table_mixed.md');
      const markdown = `# Complex Table

| Feature | Description |
|---------|-------------|
| **Bold** and *italic* | Combined formatting |
| \`code\` and **bold** | Mixed types |
| ~~strikethrough~~ **bold** | Multiple styles |`;

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

  suite('HTML Tag Handling', () => {
    test('should handle <br> tags', async () => {
      const mdFile = path.join(tempDir, 'edge_case_html_br.md');
      const markdown = `# HTML Tags

Line 1<br>Line 2
Paragraph with<br>line break

Another line`;

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

    test('should handle <div> tags', async () => {
      const mdFile = path.join(tempDir, 'edge_case_html_div.md');
      const markdown = `# HTML Div

<div class="note">
This is a note section
</div>

Normal paragraph

<div>
Another div block
</div>`;

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

    test('should handle <span> tags with formatting', async () => {
      const mdFile = path.join(tempDir, 'edge_case_html_span.md');
      const markdown = `# HTML Span

Normal text <span style="color: red;">colored text</span> more text

<span class="highlight">Highlighted</span> content

Inline <span>span tag</span> with text`;

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

    test('should handle mixed HTML and Markdown', async () => {
      const mdFile = path.join(tempDir, 'edge_case_mixed_html_md.md');
      const markdown = `# Mixed Content

**Bold** and <br> HTML<br>Multiple lines

- List item with **bold**
- List with <span>span</span>
- Item with <div>div</div>

| Column |
|--------|
| **Bold** in <br> cell |`;

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

  suite('Complex Edge Cases', () => {
    test('should handle multiple bold patterns in single line', async () => {
      const mdFile = path.join(tempDir, 'edge_case_multi_bold.md');
      const markdown = `# Multiple Bold

Line with **first bold** and **second bold** text

- List with **bold1** and **bold2** and **bold3**

| Col1 | Col2 |
|------|------|
| **Bold1** and **Bold2** | **Bold3** |`;

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

    test('should handle bold with special characters', async () => {
      const mdFile = path.join(tempDir, 'edge_case_bold_special.md');
      const markdown = `# Special Characters

- **Feature: v1.0** with colon
- **Item (Important)** with parentheses  
- **Name-of-thing** with hyphens
- **value=123** with equals

Text with **!important** exclamation`;

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

    test('should handle bold at start/end of list items', async () => {
      const mdFile = path.join(tempDir, 'edge_case_bold_edges.md');
      const markdown = `# Bold at Edges

- **Start bold** text end
- Start text **end bold**
- **Only bold**
- **Start** middle **end**
- text **middle** text`;

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
