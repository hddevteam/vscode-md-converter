import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import JSZip from 'jszip';
import { MarkdownToWordConverter } from '../../../converters/markdownToWord';

async function getDocumentXml(docxPath: string): Promise<string> {
  const buf = await fs.readFile(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml')!.async('string');
  return xml;
}

suite('MarkdownToWord line breaks and blockquote rendering', () => {
  const projectRoot = path.resolve(__dirname, '../../../../');
  const tempDir = path.join(projectRoot, 'src/test/temp');

  test('should preserve hard line breaks in a markdown paragraph', async () => {
    await fs.mkdir(tempDir, { recursive: true });
    const mdPath = path.join(tempDir, 'linebreaks_paragraph.md');

    const markdown = [
      '# 磁盘备份系统性能验收承诺书',
      '',
      '**文件编号**：【待填写】  ',
      '**承诺日期**：2025年12月17日  ',
      '**履约时限**：2025年12月18日 24:00',
      '',
      '---',
      '',
      '致：【甲方单位名称】'
    ].join('\n');

    await fs.writeFile(mdPath, markdown, 'utf-8');

    const result = await MarkdownToWordConverter.convert(mdPath, { outputDirectory: tempDir });
    assert.strictEqual(result.success, true, `Conversion failed: ${(result as any).error}`);
    assert.ok(result.outputPath);

    const xml = await getDocumentXml(result.outputPath!);

    const idxA = xml.indexOf('文件编号');
    const idxB = xml.indexOf('承诺日期');
    const idxC = xml.indexOf('履约时限');
    assert.ok(idxA !== -1 && idxB !== -1 && idxC !== -1, 'Expected key texts to appear in document.xml');

    const idxBrAfterA = xml.indexOf('<w:br', idxA);
    assert.ok(idxBrAfterA > idxA && idxBrAfterA < idxB, 'Expected a Word line break between 文件编号 and 承诺日期');

    const idxBrAfterB = xml.indexOf('<w:br', idxB);
    assert.ok(idxBrAfterB > idxB && idxBrAfterB < idxC, 'Expected a Word line break between 承诺日期 and 履约时限');
  });

  test('should render blockquote with multiple paragraphs and list items (not collapsed)', async () => {
    await fs.mkdir(tempDir, { recursive: true });
    const mdPath = path.join(tempDir, 'blockquote_render.md');

    const markdown = [
      '# 引用测试',
      '',
      '> ### 延长质保承诺',
      '> ',
      '> **我方无条件为贵方提供备份系统（含软件、硬件及所有组件）延长三年的 7×24 小时原厂上门质保服务**，具体如下：',
      '> ',
      '> 1. **质保期限**：在原合同约定质保期基础上，**免费延长三年**（36 个月）；',
      '> 2. **质保范围**：涵盖备份系统全部软件、硬件、固件、许可证及配套组件；',
      '> 3. **服务级别**：',
      '>    - 7×24 小时原厂技术支持热线',
      '>    - 4 小时故障响应',
      '>    - 8 小时现场上门服务',
      '>    - 关键部件备件库储备'
    ].join('\n');

    await fs.writeFile(mdPath, markdown, 'utf-8');

    const result = await MarkdownToWordConverter.convert(mdPath, { outputDirectory: tempDir });
    assert.strictEqual(result.success, true, `Conversion failed: ${(result as any).error}`);
    assert.ok(result.outputPath);

    const xml = await getDocumentXml(result.outputPath!);

    // Expect blockquote left border to appear multiple times (each paragraph inside quote)
    const borderMatches = xml.match(/CCCCCC/g) || [];
    assert.ok(borderMatches.length >= 2, `Expected multiple blockquote paragraphs with left border, got ${borderMatches.length}`);

    // Expect key texts from inside the quote to exist
    assert.ok(xml.includes('延长质保承诺'), 'Expected blockquote heading text to be present');
    assert.ok(xml.includes('质保期限'), 'Expected ordered list item text to be present');

    // Expect Word numbering properties for list items
    assert.ok(xml.includes('<w:numPr') || xml.includes('w:numPr'), 'Expected list numbering properties to exist in docx XML');
  });
});
