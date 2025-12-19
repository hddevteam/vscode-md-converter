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

function getParagraphXmlContainingText(documentXml: string, text: string): string {
  const idx = documentXml.indexOf(text);
  assert.ok(idx !== -1, `Expected text to appear in document.xml: ${text}`);

  // Must locate the paragraph start tag (<w:p> or <w:p ...>), not <w:pPr> / <w:pBdr>
  const start1 = documentXml.lastIndexOf('<w:p>', idx);
  const start2 = documentXml.lastIndexOf('<w:p ', idx);
  const start = Math.max(start1, start2);
  assert.ok(start !== -1, `Failed to locate <w:p> for text: ${text}`);

  const end = documentXml.indexOf('</w:p>', idx);
  assert.ok(end !== -1, `Failed to locate </w:p> for text: ${text}`);

  return documentXml.slice(start, end + '</w:p>'.length);
}

function extractNumIdFromParagraphXml(paragraphXml: string): string | undefined {
  const m = paragraphXml.match(/<w:numId[^>]*w:val="(\d+)"/);
  return m?.[1];
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

  test('should restart numbering for separate ordered lists', async () => {
    await fs.mkdir(tempDir, { recursive: true });
    const mdPath = path.join(tempDir, 'ordered_list_restart.md');

    const markdown = [
      '# Numbering Restart',
      '',
      '1. First A',
      '2. First B',
      '',
      'Some paragraph between lists.',
      '',
      '1. Second A',
      '2. Second B'
    ].join('\n');

    await fs.writeFile(mdPath, markdown, 'utf-8');

    const result = await MarkdownToWordConverter.convert(mdPath, { outputDirectory: tempDir });
    assert.strictEqual(result.success, true, `Conversion failed: ${(result as any).error}`);
    assert.ok(result.outputPath);

    const xml = await getDocumentXml(result.outputPath!);

    // Collect all numbering IDs used in the document
    const numIdMatches = [...xml.matchAll(/<w:numId[^>]*w:val="(\d+)"/g)].map(m => m[1]);
    const uniqueNumIds = Array.from(new Set(numIdMatches));

    // We expect two separate ordered lists to use different numbering instances/numId,
    // otherwise Word will continue numbering across the entire document.
    assert.ok(uniqueNumIds.length >= 2, `Expected at least 2 distinct numId values for separate ordered lists, got ${uniqueNumIds.length}: ${uniqueNumIds.join(', ')}`);
  });

  test('should NOT restart numbering within the same ordered list when nested bullets exist', async () => {
    await fs.mkdir(tempDir, { recursive: true });
    const mdPath = path.join(tempDir, 'ordered_list_nested_bullets.md');

    const markdown = [
      '#### 测试项目要求',
      '',
      '每台设备均需完成以下测试：',
      '',
      '1. **60 分钟连续顺序写测试**：',
      '   - 持续吞吐 ≥ 13.9GB/s',
      '   - 无明显掉速（允许短时波动不超过 10%）',
      '   - 使用 Direct I/O（绕过操作系统缓存）',
      '   - 测试数据不可压缩、不可去重',
      '',
      '2. **60 分钟连续顺序读测试**：',
      '   - 持续吞吐 ≥ 13.9GB/s',
      '   - 无明显掉速（允许短时波动不超过 10%）',
      '   - 使用 Direct I/O（绕过操作系统缓存）'
    ].join('\n');

    await fs.writeFile(mdPath, markdown, 'utf-8');
    const result = await MarkdownToWordConverter.convert(mdPath, { outputDirectory: tempDir });
    assert.strictEqual(result.success, true, `Conversion failed: ${(result as any).error}`);
    assert.ok(result.outputPath);

    const xml = await getDocumentXml(result.outputPath!);

    const p1 = getParagraphXmlContainingText(xml, '60 分钟连续顺序写测试');
    const p2 = getParagraphXmlContainingText(xml, '60 分钟连续顺序读测试');
    const numId1 = extractNumIdFromParagraphXml(p1);
    const numId2 = extractNumIdFromParagraphXml(p2);

    assert.ok(numId1 && numId2, 'Expected both ordered list items to have numId');
    assert.strictEqual(numId1, numId2, `Expected same numId for items in the same ordered list, got ${numId1} vs ${numId2}`);
  });

  test('should NOT continue numbering from main list into blockquote list', async () => {
    await fs.mkdir(tempDir, { recursive: true });
    const mdPath = path.join(tempDir, 'ordered_list_blockquote_restart.md');

    const markdown = [
      '### 第三条 未完成或未达标的责任承诺',
      '',
      '我方明确承诺，如 **任一台设备** 发生以下任一情形：',
      '',
      '1. 我方未在规定时限（含经贵方同意的延期时限）内提交该台设备的测试结果；',
      '2. 我方提交的该台设备测试结果不符合第二条合格判定标准；',
      '3. 我方提交的该台设备测试结果缺少关键证据材料（如监控日志、原始输出文件等），导致贵方无法复核；',
      '',
      '**则视为我方未履行原合同约定的性能指标，我方将无条件对该台设备承担以下责任**：',
      '',
      '> ### 延长质保承诺',
      '> ',
      '> 1. **质保期限**：在原合同约定质保期基础上，**免费延长三年**（36 个月）；',
      '> 2. **质保范围**：涵盖备份系统全部软件、硬件、固件、许可证及配套组件；',
      '> 3. **服务级别**：',
      '>    - 7×24 小时原厂技术支持热线',
      '> 4. **费用承担**：延长质保期内所有备件更换、人工服务、差旅费用、备件物流费用均由我方全额承担，贵方无需支付任何额外费用；'
    ].join('\n');

    await fs.writeFile(mdPath, markdown, 'utf-8');
    const result = await MarkdownToWordConverter.convert(mdPath, { outputDirectory: tempDir });
    assert.strictEqual(result.success, true, `Conversion failed: ${(result as any).error}`);
    assert.ok(result.outputPath);

    const xml = await getDocumentXml(result.outputPath!);

    const pMain = getParagraphXmlContainingText(xml, '不符合第二条合格判定标准');
    const pQuote = getParagraphXmlContainingText(xml, '质保期限');
    const mainNumId = extractNumIdFromParagraphXml(pMain);
    const quoteNumId = extractNumIdFromParagraphXml(pQuote);

    assert.ok(mainNumId && quoteNumId, 'Expected both main list item and quote list item to have numId');
    assert.notStrictEqual(mainNumId, quoteNumId, `Expected different numId for main list vs blockquote list, got same numId=${mainNumId}`);
  });
});
