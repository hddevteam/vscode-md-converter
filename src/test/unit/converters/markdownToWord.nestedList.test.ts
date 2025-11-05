import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import JSZip from 'jszip';
import { MarkdownToWordConverter } from '../../../converters/markdownToWord';

suite('MarkdownToWord nested list tests', () => {
  const projectRoot = path.resolve(__dirname, '../../../../');
  const tempDir = path.join(projectRoot, 'src/test/temp');

  test('unordered nested list with * at level 2 should result in ilvl=1', async () => {
    await fs.mkdir(tempDir, { recursive: true });
    const mdPath = path.join(tempDir, 'nested-list.md');

    const markdown = [
      '- Parent A',
      '  * Child A1',
      '  * Child A2',
      '- Parent B'
    ].join('\n');

    await fs.writeFile(mdPath, markdown, 'utf-8');

    const result = await MarkdownToWordConverter.convert(mdPath, { outputDirectory: tempDir });
    assert.strictEqual(result.success, true, `Conversion failed: ${(result as any).error}`);
    assert.ok(result.outputPath);

    const docxBuffer = await fs.readFile(result.outputPath!);
    const zip = await JSZip.loadAsync(docxBuffer);
    const documentXml = await zip.file('word/document.xml')!.async('string');

    // Count ilvl occurrences for level 1 (nested items)
    const ilvl1Matches = documentXml.match(/<w:ilvl[^>]*w:val="1"\/?>(?=<|\s)/g) ||
                         documentXml.match(/w:ilvl\s+w:val="1"/g) || [];

    assert.ok(ilvl1Matches.length >= 2, `Expected at least 2 nested list items (ilvl=1), got ${ilvl1Matches.length}\n${documentXml}`);

    // Optional sanity: level 0 also exists
    const ilvl0Matches = documentXml.match(/<w:ilvl[^>]*w:val="0"\/?>(?=<|\s)/g) ||
                         documentXml.match(/w:ilvl\s+w:val="0"/g) || [];
    assert.ok(ilvl0Matches.length >= 2, 'Expected some top-level list items');
  });
});
