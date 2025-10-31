import * as assert from 'assert';
import { MarkdownToWordConverter } from '../../../converters/markdownToWord';
import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';

/**
 * Test for HTML lists in table cells
 */
suite('HTML Lists in Table Cells', () => {
  const tempDir = path.join(__dirname, '../../temp');

  suiteSetup(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  test('should convert HTML list in table cell to Word list', async () => {
    const mdFile = path.join(tempDir, 'table_with_html_list.md');
    const markdown = `# Table with HTML List

| 时长 | 模块 | 内容要点 |
| :--- | :--- | :--- |
| 10分钟 | **模块一** | <ul><li>什么是智能体</li><li>与聊天的区别</li><li>应用场景</li></ul> |
| 20分钟 | **模块二** | <ol><li>第一步</li><li>第二步</li></ol> |`;

    fs.writeFileSync(mdFile, markdown, 'utf-8');
    const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

    assert.strictEqual(result.success, true, 'Conversion should succeed');
    assert.ok(result.outputPath, 'Should generate output file');

    // Verify the docx contains list structure
    const docxBuffer = fs.readFileSync(result.outputPath);
    const zip = new JSZip();
    await zip.loadAsync(docxBuffer);

    const documentXmlFile = zip.file('word/document.xml');
    assert.ok(documentXmlFile, 'document.xml should exist');
    
    const documentXml = await documentXmlFile!.async('string');
    
    // Check for table structure and bullet lists
    const hasTable = documentXml.includes('<w:tbl>');
    const hasBulletList = documentXml.includes('ListBullet') || documentXml.includes('<w:numPr>');
    
    assert.ok(hasTable, 'Document should contain table');
    assert.ok(hasBulletList, 'Document should contain list items');

    // Cleanup
    fs.unlinkSync(mdFile);
    if (fs.existsSync(result.outputPath)) {
      fs.unlinkSync(result.outputPath);
    }
  });

  test('should convert ALL HTML list items in table cells (not just first item)', async () => {
    // 用户报告的问题：表格中只有第一个列表项被转换为Word列表，
    // 其他项显示为 - 减号 而不是列表格式
    const mdFile = path.join(tempDir, 'table_all_list_items.md');
    const markdown = `# 四、 培训大纲（120分钟）

| 时长 | 模块 | 内容要点 |
| :--- | :--- | :--- |
| 10分钟 | **模块一：开启智能体新时代** | <ul><li>什么是AI智能体(Agent)？它与普通聊天有何不同？</li><li>案例类比：从"百科全书"到"懂你业务的专业顾问"</li><li>探索Copilot的潜力：我们能用它做什么？</li></ul> |`;

    fs.writeFileSync(mdFile, markdown, 'utf-8');
    const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

    assert.strictEqual(result.success, true, 'Conversion should succeed');
    assert.ok(result.outputPath, 'Should generate output file');

    const docxBuffer = fs.readFileSync(result.outputPath);
    const zip = new JSZip();
    await zip.loadAsync(docxBuffer);

    const documentXmlFile = zip.file('word/document.xml');
    const documentXml = await documentXmlFile!.async('string');

    // Extract table to analyze list items
    const tableMatch = documentXml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/);
    assert.ok(tableMatch, 'Should find table in XML');

    const tableXml = tableMatch![0];
    
    // Count <w:numPr> occurrences - each list item should have one
    // BUG: If only first item converts to list, we'd see only 1 <w:numPr>
    // FIXED: All 3 items should have <w:numPr>, so we expect 3
    const numPrMatches = tableXml.match(/<w:numPr>/g) || [];
    
    // Verify all 3 list items are present
    assert.ok(documentXml.includes('什么是AI智能体'), 'Item 1 should be present');
    assert.ok(documentXml.includes('案例类比'), 'Item 2 should be present');
    assert.ok(documentXml.includes('探索Copilot的潜力'), 'Item 3 should be present');

    // CRITICAL: Verify ALL 3 list items are formatted as lists
    assert.ok(
      numPrMatches.length >= 3,
      `Expected at least 3 list items with <w:numPr> markers, but found ${numPrMatches.length}. ` +
      `This indicates a regression: only the first list item is being converted to Word list format.`
    );

    // Cleanup
    fs.unlinkSync(mdFile);
    if (fs.existsSync(result.outputPath)) {
      fs.unlinkSync(result.outputPath);
    }
  });
});
