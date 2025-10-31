import * as assert from 'assert';
import { MarkdownToWordConverter } from '../../../converters/markdownToWord';
import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';

/**
 * Integration tests for HTML list Word document structure
 * These tests verify that HTML lists are converted to actual Word list items,
 * not just text with dashes or numbers.
 */
suite('HTML List Word Document Structure Tests', () => {
  const tempDir = path.join(__dirname, '../../temp');

  suiteSetup(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  test('should generate Word list items for <ul> lists', async () => {
    const mdFile = path.join(tempDir, 'verify_ul_structure.md');
    const markdown = `# Test Unordered List

<ul>
<li>Item 1</li>
<li>Item 2</li>
<li>Item 3</li>
</ul>`;

    fs.writeFileSync(mdFile, markdown, 'utf-8');
    const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

    assert.strictEqual(result.success, true, 'Conversion should succeed');
    assert.ok(result.outputPath, 'Should generate output file');
    assert.ok(fs.existsSync(result.outputPath), 'Output file should exist');

    // Verify the docx file contains list structure
    // DOCX files are ZIP archives containing XML
    const docxBuffer = fs.readFileSync(result.outputPath);
    const zip = new JSZip();
    await zip.loadAsync(docxBuffer);

    // Check if document.xml exists and contains bullet list structure
    const documentXmlFile = zip.file('word/document.xml');
    assert.ok(documentXmlFile, 'document.xml should exist in DOCX');
    
    const documentXml = await documentXmlFile!.async('string');
    
    // Look for bullet list indicators in the XML
    // Word uses <w:pStyle w:val="ListBullet"/> for bullet lists
    const hasBulletList = documentXml.includes('ListBullet') || 
                         documentXml.includes('<w:numPr>') || 
                         documentXml.includes('bullet');
    assert.ok(hasBulletList, 'Document should contain bullet list structure');

    // Cleanup
    fs.unlinkSync(mdFile);
    if (result.outputPath && fs.existsSync(result.outputPath)) {
      fs.unlinkSync(result.outputPath);
    }
  });

  test('should generate Word numbered list items for <ol> lists', async () => {
    const mdFile = path.join(tempDir, 'verify_ol_structure.md');
    const markdown = `# Test Ordered List

<ol>
<li>First step</li>
<li>Second step</li>
<li>Third step</li>
</ol>`;

    fs.writeFileSync(mdFile, markdown, 'utf-8');
    const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

    assert.strictEqual(result.success, true, 'Conversion should succeed');
    assert.ok(result.outputPath, 'Should generate output file');
    assert.ok(fs.existsSync(result.outputPath), 'Output file should exist');

    // Verify the docx file contains ordered list structure
    const docxBuffer = fs.readFileSync(result.outputPath);
    const zip = new JSZip();
    await zip.loadAsync(docxBuffer);

    const documentXmlFile = zip.file('word/document.xml');
    assert.ok(documentXmlFile, 'document.xml should exist in DOCX');
    
    const documentXml = await documentXmlFile!.async('string');
    
    // Look for numbered list indicators
    const hasNumberedList = documentXml.includes('ListNumber') || 
                           documentXml.includes('ListContinue') ||
                           documentXml.includes('<w:numPr>');
    assert.ok(hasNumberedList, 'Document should contain numbered list structure');

    // Cleanup
    fs.unlinkSync(mdFile);
    if (result.outputPath && fs.existsSync(result.outputPath)) {
      fs.unlinkSync(result.outputPath);
    }
  });

  test('should maintain formatting in list items', async () => {
    const mdFile = path.join(tempDir, 'verify_formatted_list.md');
    const markdown = `# Formatted List

<ul>
<li><strong>Bold</strong> item</li>
<li><em>Italic</em> item</li>
<li>Normal item</li>
</ul>`;

    fs.writeFileSync(mdFile, markdown, 'utf-8');
    const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: tempDir });

    assert.strictEqual(result.success, true, 'Conversion should succeed');

    // Verify formatting is preserved
    if (!result.outputPath) {
      throw new Error('Output path is undefined');
    }

    const docxBuffer = fs.readFileSync(result.outputPath);
    const zip = new JSZip();
    await zip.loadAsync(docxBuffer);

    const documentXmlFile = zip.file('word/document.xml');
    assert.ok(documentXmlFile, 'document.xml should exist in DOCX');
    
    const documentXml = await documentXmlFile!.async('string');
    
    // Look for bold and italic formatting markers
    const hasBold = documentXml.includes('<w:b/>');
    const hasItalic = documentXml.includes('<w:i/>');
    
    assert.ok(hasBold, 'Document should contain bold formatting');
    assert.ok(hasItalic, 'Document should contain italic formatting');

    // Cleanup
    fs.unlinkSync(mdFile);
    if (fs.existsSync(result.outputPath)) {
      fs.unlinkSync(result.outputPath);
    }
  });
});
