import * as assert from 'assert';
import { MarkdownToWordConverter } from '../../../converters/markdownToWord';
import * as fs from 'fs';
import * as path from 'path';

/**
 * TDD Tests for table cell enhancements
 * These tests validate:
 * 1. HTML tags in table cells (<br>, <div>, <span>)
 * 2. Line breaks in table cells
 * 3. List items in table cells
 * 4. Mixed formatting in table cells
 */
suite('Table Cell Enhancement Tests', () => {
  const tempDir = path.join(__dirname, '../../temp');

  suiteSetup(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  suiteTeardown(() => {
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
      if (file.startsWith('table_enhance_') && file.endsWith('.docx')) {
        fs.unlinkSync(path.join(tempDir, file));
      }
    });
  });

  suite('Table with <br> tags', () => {
    test('should convert <br> tags in table cells to line breaks', async () => {
      const mdFile = path.join(tempDir, 'table_enhance_br.md');
      const markdown = `# Table with Line Breaks

| Header 1 | Header 2 |
|----------|----------|
| Line 1<br>Line 2 | Text |
| Cell with<br>multiple<br>lines | Data |`;

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

    test('should handle <br/> self-closing tags in table cells', async () => {
      const mdFile = path.join(tempDir, 'table_enhance_br_self.md');
      const markdown = `# Table with Self-Closing Breaks

| Column A | Column B |
|----------|----------|
| Text<br/>More text | Value |
| Data<br/>Next line<br/>Final | Number |`;

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

  suite('Table with list items', () => {
    test('should convert list markers in table cells to bullets', async () => {
      const mdFile = path.join(tempDir, 'table_enhance_list.md');
      const markdown = `# Table with Lists

| Items | Description |
|-------|-------------|
| - Item 1<br>- Item 2<br>- Item 3 | List in cell |
| - First<br>- Second | Another list |`;

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

    test('should convert numbered lists in table cells', async () => {
      const mdFile = path.join(tempDir, 'table_enhance_numbered_list.md');
      const markdown = `# Table with Numbered Lists

| Steps | Result |
|-------|--------|
| 1. First step<br>2. Second step<br>3. Final | Process |
| 1. Do this<br>2. Then that | Action |`;

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

    test('should support different list markers in table cells', async () => {
      const mdFile = path.join(tempDir, 'table_enhance_list_markers.md');
      const markdown = `# Table with Different List Markers

| Column 1 | Column 2 |
|----------|----------|
| - Dash<br>* Asterisk<br>+ Plus | Mixed markers |
| * Star<br>- Hyphen | Two types |`;

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

  suite('Table with mixed HTML and formatting', () => {
    test('should handle <div> tags in table cells', async () => {
      const mdFile = path.join(tempDir, 'table_enhance_div.md');
      const markdown = `# Table with Div

| Section | Content |
|---------|---------|
| <div>Content</div> | Data |
| <div class="note">Note</div> | Info |`;

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

    test('should handle <span> tags in table cells', async () => {
      const mdFile = path.join(tempDir, 'table_enhance_span.md');
      const markdown = `# Table with Span

| Text | Note |
|------|------|
| Normal <span>inline</span> text | Test |
| <span style="color:red">Styled</span> | Style |`;

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

    test('should handle complex mixed content in table cells', async () => {
      const mdFile = path.join(tempDir, 'table_enhance_complex.md');
      const markdown = `# Complex Table Content

| Feature | Details |
|---------|---------|
| **Bold** with <br>- List item<br>- Another | Mixed |
| *Italic* <span>span</span><br>1. First<br>2. Second | Complex |
| \`Code\` and <br>**bold** with<br>- bullet | All types |`;

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

  suite('Table with formatting preservation', () => {
    test('should preserve formatting with <br> and lists', async () => {
      const mdFile = path.join(tempDir, 'table_enhance_format_preserve.md');
      const markdown = `# Formatting with Breaks and Lists

| Item | Description |
|------|-------------|
| **Bold** text<br>- List<br>- Items | Mixed |
| *Italic*<br>1. First<br>2. Second | Formatted |
| \`Code\`<br>- Item<br>~~Strike~~ | Complete |`;

      fs.writeFileSync(mdFile, markdown, 'utf-8');
      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Should generate output file');

      const stats = fs.statSync(result.outputPath);
      assert.ok(stats.size > 2000, 'Output should be substantial for formatted content');

      // Cleanup
      fs.unlinkSync(mdFile);
      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath);
      }
    });

    test('should handle empty cells with special content', async () => {
      const mdFile = path.join(tempDir, 'table_enhance_empty.md');
      const markdown = `# Table with Various Cells

| Empty | Content | Mixed |
|-------|---------|-------|
|  | Text | - Item |
| Data | <br> | **Bold**<br>Text |
| - List |  | Normal |`;

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

  suite('Paragraph with <br> tags', () => {
    test('should convert <br> in paragraphs to line breaks', async () => {
      const mdFile = path.join(tempDir, 'table_enhance_para_br.md');
      const markdown = `# Paragraph with Breaks

First line<br>Second line<br>Third line

Another paragraph with<br>line breaks<br>in middle`;

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

    test('should handle mixed formatting with <br> in paragraphs', async () => {
      const mdFile = path.join(tempDir, 'table_enhance_para_format.md');
      const markdown = `# Formatted Paragraph with Breaks

**Bold text**<br>*Italic text*<br>\`Code text\`

Paragraph with **bold**<br>and *italic*<br>and \`code\` breaks`;

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
