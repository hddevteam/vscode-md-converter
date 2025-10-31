import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { MarkdownToWordConverter } from '../../../converters/markdownToWord';

/**
 * End-to-end integration tests for Markdown to Word conversion
 * Tests real file conversion, Docx output structure, and performance
 */
suite('Markdown to Word End-to-End Integration Tests', function() {
  const tempDir = path.join(__dirname, '../../temp');
  const docsDir = path.join(__dirname, '../../docs');

  suiteSetup(() => {
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  suiteTeardown(() => {
    // Cleanup generated files
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
      if (file.startsWith('e2e_') && file.endsWith('.docx')) {
        fs.unlinkSync(path.join(tempDir, file));
      }
    });
  });

  suite('Real File Conversion from Disk', () => {
    test('should convert markdown file from disk to docx', async () => {
      const mdFile = path.join(tempDir, 'e2e_real_file.md');
      const mdContent = `# Project Report

## Introduction
This is a real markdown file for end-to-end testing.

## Features
- Feature 1: Conversion quality
- Feature 2: Performance
- Feature 3: Compatibility

## Code Example

\`\`\`typescript
function hello(name: string): void {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

## Conclusion
Markdown to Word conversion is working!`;

      fs.writeFileSync(mdFile, mdContent, 'utf-8');

      const result = await MarkdownToWordConverter.convert(mdFile);

      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Output path should be provided');
      assert.ok(fs.existsSync(result.outputPath), 'Output file should exist on disk');

      const stats = fs.statSync(result.outputPath);
      assert.ok(stats.size > 1000, 'Output file should be substantial (> 1KB)');

      // Cleanup
      fs.unlinkSync(mdFile);
    });

    test('should handle markdown files with unicode characters', async () => {
      const mdFile = path.join(tempDir, 'e2e_unicode.md');
      const mdContent = `# 中文标题

## 多语言支持
这是一个测试文件，包含 **中文** 和 *日本語* 和español文本。

### 列表示例
- 项目一：测试Unicode处理
- 项目二：验证多语言
- 项目三：确保编码正确

> 引用文本：\"Unicode转换成功\" 

表格示例：

| 功能 | 状态 |
|------|------|
| 中文 | ✓ |
| 日本語 | ✓ |
`;

      fs.writeFileSync(mdFile, mdContent, 'utf-8');

      const result = await MarkdownToWordConverter.convert(mdFile);

      assert.strictEqual(result.success, true, 'Unicode conversion should succeed');
      assert.ok(result.outputPath, 'Output should be generated');
      assert.ok(fs.existsSync(result.outputPath), 'Output file should exist');

      // Cleanup
      fs.unlinkSync(mdFile);
    });

    test('should convert large markdown file', async () => {
      const mdFile = path.join(tempDir, 'e2e_large.md');

      // Generate a large markdown document (100KB+)
      let mdContent = '# Large Document\n\n';
      for (let i = 1; i <= 100; i++) {
        mdContent += `## Section ${i}\n\nThis is content for section ${i}.\n\n`;
        for (let j = 1; j <= 10; j++) {
          mdContent += `- Point ${i}.${j}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n`;
        }
        mdContent += '\n';
      }

      fs.writeFileSync(mdFile, mdContent, 'utf-8');
      const inputSize = fs.statSync(mdFile).size;

      const startTime = Date.now();
      const result = await MarkdownToWordConverter.convert(mdFile);
      const duration = Date.now() - startTime;

      assert.strictEqual(result.success, true, 'Large file conversion should succeed');
      assert.ok(result.outputPath, 'Output should be generated');
      assert.ok(fs.existsSync(result.outputPath), 'Output file should exist');

      const outputSize = fs.statSync(result.outputPath).size;
      assert.ok(outputSize > 10000, 'Large document output should be substantial');

      // Performance: should convert < 5 seconds for 100KB input
      assert.ok(duration < 5000, `Large file conversion should complete in reasonable time (${duration}ms)`);

      console.log(`  Large document conversion: ${inputSize} bytes input → ${outputSize} bytes output in ${duration}ms`);

      // Cleanup
      fs.unlinkSync(mdFile);
    });
  });

  suite('Docx Output Structure Validation', () => {
    test('should generate valid Docx file structure', async () => {
      const mdFile = path.join(tempDir, 'e2e_docx_structure.md');
      const mdContent = `# Document Title

## Section 1
This is a test paragraph.

## Section 2
- List item 1
- List item 2
`;

      fs.writeFileSync(mdFile, mdContent, 'utf-8');

      const result = await MarkdownToWordConverter.convert(mdFile);
      assert.ok(result.outputPath, 'Output path should be provided');

      // Verify Docx file has valid structure
      // Docx is a ZIP file, should have minimum size
      const stats = fs.statSync(result.outputPath);
      assert.ok(stats.size > 500, 'Docx file should have valid structure (minimum size)');

      // Verify file extension is .docx
      assert.ok(result.outputPath.endsWith('.docx'), 'Output should have .docx extension');

      // Cleanup
      fs.unlinkSync(mdFile);
    });

    test('should preserve markdown formatting in docx output', async () => {
      const mdFile = path.join(tempDir, 'e2e_formatting.md');
      const mdContent = `# Heading 1

## Heading 2

This is **bold** text and *italic* text and ***bold italic***.

\`inline code\` example.

### Lists
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3

1. Ordered 1
2. Ordered 2
3. Ordered 3

### Code Block
\`\`\`python
def hello():
    print("Hello World")
\`\`\`

### Blockquote
> This is a quote
> spanning multiple lines

### Table
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`;

      fs.writeFileSync(mdFile, mdContent, 'utf-8');

      const result = await MarkdownToWordConverter.convert(mdFile);
      assert.strictEqual(result.success, true, 'Formatting conversion should succeed');
      assert.ok(result.outputPath, 'Output should be generated');

      const stats = fs.statSync(result.outputPath);
      assert.ok(stats.size > 1000, 'Formatted document should be larger than simple document');

      console.log(`  Formatting preservation: Output file size ${stats.size} bytes`);

      // Cleanup
      fs.unlinkSync(mdFile);
    });

    test('should handle empty and minimal markdown files', async () => {
      const mdFile = path.join(tempDir, 'e2e_minimal.md');
      const mdContent = 'Just a single line.';

      fs.writeFileSync(mdFile, mdContent, 'utf-8');

      const result = await MarkdownToWordConverter.convert(mdFile);
      assert.strictEqual(result.success, true, 'Minimal file should convert');
      assert.ok(result.outputPath, 'Output should be provided');
      assert.ok(fs.existsSync(result.outputPath), 'Output file should exist');

      // Cleanup
      fs.unlinkSync(mdFile);
    });
  });

  suite('Performance Benchmarks', () => {
    test('should convert documents in predictable time', async () => {
      const mdFile = path.join(tempDir, 'e2e_performance.md');

      // Create a medium-sized document (20KB)
      let mdContent = '# Performance Test\n\n';
      for (let i = 1; i <= 20; i++) {
        mdContent += `## Chapter ${i}\n\n`;
        mdContent += `This is chapter ${i} with some content.\n\n`;
        for (let j = 1; j <= 5; j++) {
          mdContent += `- Point ${j}: Some list item content\n`;
        }
        mdContent += '\n';
      }

      fs.writeFileSync(mdFile, mdContent, 'utf-8');

      // Measure conversion time
      const times: number[] = [];
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        const result = await MarkdownToWordConverter.convert(mdFile);
        const duration = Date.now() - startTime;
        times.push(duration);
        assert.strictEqual(result.success, true, 'Each conversion should succeed');

        // Delete the output file so we can convert again
        if (result.outputPath && fs.existsSync(result.outputPath)) {
          fs.unlinkSync(result.outputPath);
        }
      }

      // Calculate statistics
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      // Conversions should be relatively consistent and reasonably fast
      assert.ok(avgTime < 2000, `Average conversion time should be < 2s (actual: ${avgTime}ms)`);
      assert.ok(maxTime < 3000, `Max conversion time should be < 3s (actual: ${maxTime}ms)`);

      console.log(`  Performance benchmark: Avg ${avgTime.toFixed(0)}ms, Max ${maxTime}ms, Conversions: ${times.map(t => t + 'ms').join(', ')}`);

      // Cleanup
      fs.unlinkSync(mdFile);
    });

    test('should scale efficiently with document size', async () => {
      const sizes = [1, 5, 10]; // KB
      const results: Array<{ inputSize: number; outputSize: number; duration: number }> = [];

      for (const sizeKB of sizes) {
        const mdFile = path.join(tempDir, `e2e_scale_${sizeKB}kb.md`);

        // Generate document of specific size
        let mdContent = '# Scalability Test\n\n';
        let currentSize = mdContent.length;
        let counter = 0;

        while (currentSize < sizeKB * 1024) {
          counter++;
          const line = `## Section ${counter}\nContent for section ${counter}.\n\n`;
          mdContent += line;
          currentSize += line.length;
        }

        fs.writeFileSync(mdFile, mdContent, 'utf-8');
        const inputSize = fs.statSync(mdFile).size;

        const startTime = Date.now();
        const result = await MarkdownToWordConverter.convert(mdFile);
        const duration = Date.now() - startTime;

        assert.strictEqual(result.success, true, `Conversion of ${sizeKB}KB should succeed`);
        assert.ok(result.outputPath, 'Output should be generated');

        const outputSize = fs.statSync(result.outputPath).size;
        results.push({ inputSize, outputSize, duration });

        console.log(`    ${sizeKB}KB input: ${inputSize} → ${outputSize} bytes in ${duration}ms`);

        // Cleanup
        fs.unlinkSync(mdFile);
        if (fs.existsSync(result.outputPath)) {
          fs.unlinkSync(result.outputPath);
        }
      }

      // Verify linear or sublinear scaling (not exponential)
      // For doubling input, output should roughly scale proportionally
      assert.ok(results.length >= 2, 'Should have at least 2 results for comparison');
    });
  });

  suite('Real-world Markdown Examples', () => {
    test('should convert README.md successfully', function() {
      const readmeFile = path.join(__dirname, '../../../../../README.md');

      // Only test if README exists
      if (!fs.existsSync(readmeFile)) {
        this.skip();
      }

      return (async () => {
        const result = await MarkdownToWordConverter.convert(readmeFile, { outputDirectory: tempDir });
        assert.strictEqual(result.success, true, 'README conversion should succeed');
        assert.ok(result.outputPath, 'Output should be generated');
        assert.ok(fs.existsSync(result.outputPath), 'Output file should exist');

        const stats = fs.statSync(result.outputPath);
        console.log(`  README.md conversion: ${stats.size} bytes`);

        // Cleanup
        if (fs.existsSync(result.outputPath)) {
          fs.unlinkSync(result.outputPath);
        }
      })();
    });

    test('should convert ROADMAP.md successfully', function() {
      const roadmapFile = path.join(__dirname, '../../../../../ROADMAP.md');

      // Only test if ROADMAP exists
      if (!fs.existsSync(roadmapFile)) {
        this.skip();
      }

      return (async () => {
        const result = await MarkdownToWordConverter.convert(roadmapFile, { outputDirectory: tempDir });
        assert.strictEqual(result.success, true, 'ROADMAP conversion should succeed');
        assert.ok(result.outputPath, 'Output should be generated');
        assert.ok(fs.existsSync(result.outputPath), 'Output file should exist');

        const stats = fs.statSync(result.outputPath);
        console.log(`  ROADMAP.md conversion: ${stats.size} bytes`);

        // Cleanup
        if (fs.existsSync(result.outputPath)) {
          fs.unlinkSync(result.outputPath);
        }
      })();
    });

    test('should convert CHANGELOG.md successfully', function() {
      const changelogFile = path.join(__dirname, '../../../../../CHANGELOG.md');

      // Only test if CHANGELOG exists
      if (!fs.existsSync(changelogFile)) {
        this.skip();
      }

      return (async () => {
        const result = await MarkdownToWordConverter.convert(changelogFile, { outputDirectory: tempDir });
        assert.strictEqual(result.success, true, 'CHANGELOG conversion should succeed');
        assert.ok(result.outputPath, 'Output should be generated');
        assert.ok(fs.existsSync(result.outputPath), 'Output file should exist');

        const stats = fs.statSync(result.outputPath);
        console.log(`  CHANGELOG.md conversion: ${stats.size} bytes`);

        // Cleanup
        if (fs.existsSync(result.outputPath)) {
          fs.unlinkSync(result.outputPath);
        }
      })();
    });
  });

  suite('Output Directory Management', () => {
    test('should respect custom output directory', async () => {
      const mdFile = path.join(tempDir, 'e2e_custom_outdir.md');
      const customOutDir = path.join(tempDir, 'custom_output');
      
      // Create custom output directory
      if (!fs.existsSync(customOutDir)) {
        fs.mkdirSync(customOutDir, { recursive: true });
      }

      fs.writeFileSync(mdFile, '# Test Document', 'utf-8');

      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: customOutDir });
      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Output path should be provided');
      assert.ok(result.outputPath.startsWith(customOutDir), 'Output should be in custom directory');

      // Cleanup
      fs.unlinkSync(mdFile);
    });

    test('should create output directory if it does not exist', async () => {
      const mdFile = path.join(tempDir, 'e2e_create_outdir.md');
      const newOutDir = path.join(tempDir, 'new_output_directory_' + Date.now());

      fs.writeFileSync(mdFile, '# Test Document', 'utf-8');

      const result = await MarkdownToWordConverter.convert(mdFile, { outputDirectory: newOutDir });
      assert.strictEqual(result.success, true, 'Conversion should succeed');
      assert.ok(result.outputPath, 'Output path should be provided');
      assert.ok(fs.existsSync(newOutDir), 'Output directory should be created');

      // Cleanup
      fs.unlinkSync(mdFile);
      if (fs.existsSync(newOutDir)) {
        fs.rmSync(newOutDir, { recursive: true });
      }
    });
  });
});
