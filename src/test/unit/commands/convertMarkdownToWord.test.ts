import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import { MarkdownToWordConverter } from '../../../converters/markdownToWord';

/**
 * Integration tests for Markdown to Word conversion command
 * Tests the full conversion pipeline: read -> convert -> write
 */
suite('Markdown to Word Conversion Command Integration Tests', () => {
  const projectRoot = path.resolve(__dirname, '../../../../');
  const tempDir = path.join(projectRoot, 'src/test/temp');

  // Setup
  suiteSetup(async () => {
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (e) {
      // Directory may already exist
    }
  });

  // Cleanup
  suiteTeardown(async () => {
    try {
      const files = await fs.readdir(tempDir);
      for (const file of files) {
        if (file.startsWith('test_') && file.endsWith('.docx')) {
          await fs.unlink(path.join(tempDir, file));
        }
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  suite('Basic File Conversion', () => {
    test('should handle non-existent markdown file', async () => {
      const result = await MarkdownToWordConverter.convert('/path/to/non-existent-file.md');
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    test('should reject non-markdown files', async () => {
      const tempPath = path.join(tempDir, 'test_invalid.txt');
      await fs.writeFile(tempPath, '# Test Content');

      try {
        const result = await MarkdownToWordConverter.convert(tempPath);
        assert.strictEqual(result.success, false);
        assert.ok(result.error);
      } finally {
        await fs.unlink(tempPath).catch(() => {});
      }
    });
  });

  suite('Simple Markdown Conversion', () => {
    test('should convert simple markdown with heading', async () => {
      const mdContent = `# Test Document

This is a test paragraph.`;
      const mdPath = path.join(tempDir, 'test_simple.md');
      
      try {
        await fs.writeFile(mdPath, mdContent);
        const result = await MarkdownToWordConverter.convert(mdPath);
        
        assert.strictEqual(result.success, true);
        assert.ok(result.outputPath);
        
        // Verify output file exists
        const stat = await fs.stat(result.outputPath!);
        assert.ok(stat.size > 0, 'Output file should not be empty');
        
        // Clean up
        await fs.unlink(result.outputPath!).catch(() => {});
      } finally {
        await fs.unlink(mdPath).catch(() => {});
      }
    });

    test('should convert markdown with multiple paragraphs', async () => {
      const mdContent = `# Main Title

First paragraph with some content.

Second paragraph with different content.

Third paragraph to test spacing.`;
      const mdPath = path.join(tempDir, 'test_paragraphs.md');
      
      try {
        await fs.writeFile(mdPath, mdContent);
        const result = await MarkdownToWordConverter.convert(mdPath);
        
        assert.strictEqual(result.success, true);
        assert.ok(result.outputPath);
        assert.ok(result.duration && result.duration > 0);
        
        await fs.unlink(result.outputPath!).catch(() => {});
      } finally {
        await fs.unlink(mdPath).catch(() => {});
      }
    });
  });

  suite('Complex Markdown Features', () => {
    test('should convert markdown with formatting (bold, italic)', async () => {
      const mdContent = `# Title

This text contains **bold** and *italic* and ***bold italic***.

Another line with \`inline code\` and ~~strikethrough~~.`;
      const mdPath = path.join(tempDir, 'test_formatting.md');
      
      try {
        await fs.writeFile(mdPath, mdContent);
        const result = await MarkdownToWordConverter.convert(mdPath);
        
        assert.strictEqual(result.success, true);
        assert.ok(result.outputPath);
        
        await fs.unlink(result.outputPath!).catch(() => {});
      } finally {
        await fs.unlink(mdPath).catch(() => {});
      }
    });

    test('should convert markdown with lists', async () => {
      const mdContent = `# Title

## Unordered List
- Item 1
- Item 2
- Item 3

## Ordered List
1. First
2. Second
3. Third`;
      const mdPath = path.join(tempDir, 'test_lists.md');
      
      try {
        await fs.writeFile(mdPath, mdContent);
        const result = await MarkdownToWordConverter.convert(mdPath);
        
        assert.strictEqual(result.success, true);
        assert.ok(result.outputPath);
        
        await fs.unlink(result.outputPath!).catch(() => {});
      } finally {
        await fs.unlink(mdPath).catch(() => {});
      }
    });

    test('should convert markdown with code block', async () => {
      const mdContent = `# Code Example

Here is some code:

\`\`\`javascript
const x = 10;
console.log(x);
\`\`\`

And some Python:

\`\`\`python
x = 10
print(x)
\`\`\``;
      const mdPath = path.join(tempDir, 'test_codeblock.md');
      
      try {
        await fs.writeFile(mdPath, mdContent);
        const result = await MarkdownToWordConverter.convert(mdPath);
        
        assert.strictEqual(result.success, true);
        assert.ok(result.outputPath);
        
        await fs.unlink(result.outputPath!).catch(() => {});
      } finally {
        await fs.unlink(mdPath).catch(() => {});
      }
    });

    test('should convert markdown with table', async () => {
      const mdContent = `# Table Example

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`;
      const mdPath = path.join(tempDir, 'test_table.md');
      
      try {
        await fs.writeFile(mdPath, mdContent);
        const result = await MarkdownToWordConverter.convert(mdPath);
        
        assert.strictEqual(result.success, true);
        assert.ok(result.outputPath);
        
        await fs.unlink(result.outputPath!).catch(() => {});
      } finally {
        await fs.unlink(mdPath).catch(() => {});
      }
    });

    test('should convert markdown with blockquote', async () => {
      const mdContent = `# Blockquote Example

> This is a blockquote
> with multiple lines
> of content

Regular paragraph after blockquote.`;
      const mdPath = path.join(tempDir, 'test_blockquote.md');
      
      try {
        await fs.writeFile(mdPath, mdContent);
        const result = await MarkdownToWordConverter.convert(mdPath);
        
        assert.strictEqual(result.success, true);
        assert.ok(result.outputPath);
        
        await fs.unlink(result.outputPath!).catch(() => {});
      } finally {
        await fs.unlink(mdPath).catch(() => {});
      }
    });
  });

  suite('Output Configuration', () => {
    test('should use specified output directory', async () => {
      const mdContent = '# Test';
      const mdPath = path.join(tempDir, 'test_outdir.md');
      const customOutDir = path.join(tempDir, 'custom_out');
      
      try {
        await fs.mkdir(customOutDir, { recursive: true });
        await fs.writeFile(mdPath, mdContent);
        
        const result = await MarkdownToWordConverter.convert(mdPath, {
          outputDirectory: customOutDir
        });
        
        assert.strictEqual(result.success, true);
        assert.ok(result.outputPath);
        assert.ok(result.outputPath!.includes('custom_out'));
        
        await fs.unlink(result.outputPath!).catch(() => {});
      } finally {
        await fs.unlink(mdPath).catch(() => {});
      }
    });
  });

  suite('File Handling', () => {
    test('should generate unique output filename if file exists', async () => {
      const mdContent = '# Test';
      const mdPath = path.join(tempDir, 'test_unique.md');
      
      try {
        await fs.writeFile(mdPath, mdContent);
        
        // First conversion
        const result1 = await MarkdownToWordConverter.convert(mdPath);
        assert.strictEqual(result1.success, true);
        
        // Second conversion should generate different filename
        const result2 = await MarkdownToWordConverter.convert(mdPath);
        assert.strictEqual(result2.success, true);
        
        // Paths should be different
        assert.notStrictEqual(result1.outputPath, result2.outputPath);
        
        // Clean up
        await fs.unlink(result1.outputPath!).catch(() => {});
        await fs.unlink(result2.outputPath!).catch(() => {});
      } finally {
        await fs.unlink(mdPath).catch(() => {});
      }
    });

    test('should handle markdown files with various encodings', async () => {
      const mdContent = `# 中文标题

中文内容测试。

English content.

日本語テスト。`;
      const mdPath = path.join(tempDir, 'test_unicode.md');
      
      try {
        await fs.writeFile(mdPath, mdContent, 'utf-8');
        const result = await MarkdownToWordConverter.convert(mdPath);
        
        assert.strictEqual(result.success, true);
        assert.ok(result.outputPath);
        
        await fs.unlink(result.outputPath!).catch(() => {});
      } finally {
        await fs.unlink(mdPath).catch(() => {});
      }
    });
  });

  suite('Error Handling', () => {
    test('should handle conversion errors gracefully', async () => {
      // Create a corrupted/unusual markdown file
      const mdContent = '\0\0\0'; // Null bytes
      const mdPath = path.join(tempDir, 'test_error.md');
      
      try {
        await fs.writeFile(mdPath, mdContent);
        const result = await MarkdownToWordConverter.convert(mdPath);
        
        // Should handle error without throwing
        assert.strictEqual(result.success, false);
        assert.ok(result.error);
      } finally {
        await fs.unlink(mdPath).catch(() => {});
      }
    });

    test('should handle readonly filesystem errors', async () => {
      // This test is platform-dependent and may need adjustment
      const mdContent = '# Test';
      const mdPath = path.join(tempDir, 'test_readonly.md');
      
      try {
        await fs.writeFile(mdPath, mdContent);
        // On most systems, we can't easily test readonly mode
        // This is a placeholder for the concept
        const result = await MarkdownToWordConverter.convert(mdPath);
        
        assert.ok(result.success || result.error); // Either succeeds or has error
      } finally {
        await fs.unlink(mdPath).catch(() => {});
      }
    });
  });

  suite('Performance', () => {
    test('should convert markdown in reasonable time', async () => {
      const mdContent = `# Performance Test

${'Paragraph with content.\n\n'.repeat(50)}`;
      const mdPath = path.join(tempDir, 'test_performance.md');
      
      try {
        await fs.writeFile(mdPath, mdContent);
        const result = await MarkdownToWordConverter.convert(mdPath);
        
        assert.strictEqual(result.success, true);
        assert.ok(result.duration);
        assert.ok(result.duration < 5000, 'Conversion should complete within 5 seconds');
        
        await fs.unlink(result.outputPath!).catch(() => {});
      } finally {
        await fs.unlink(mdPath).catch(() => {});
      }
    });

    test('should handle large markdown files', async () => {
      let mdContent = '# Large Document\n\n';
      for (let i = 0; i < 200; i++) {
        mdContent += `## Section ${i}\n\nContent for section ${i}.\n\n`;
      }
      
      const mdPath = path.join(tempDir, 'test_large.md');
      
      try {
        await fs.writeFile(mdPath, mdContent);
        const result = await MarkdownToWordConverter.convert(mdPath);
        
        assert.strictEqual(result.success, true);
        assert.ok(result.outputPath);
        
        const stat = await fs.stat(result.outputPath!);
        assert.ok(stat.size > 10000, 'Output file should be substantial');
        
        await fs.unlink(result.outputPath!).catch(() => {});
      } finally {
        await fs.unlink(mdPath).catch(() => {});
      }
    });
  });

  suite('Complete Document Examples', () => {
    test('should convert a complete markdown document', async () => {
      const mdContent = `# Complete Example Document

## Introduction

This is a comprehensive example document that tests all features.

### Features
- Feature 1
- Feature 2
- Feature 3

## Code Examples

\`\`\`javascript
function example() {
  return "code example";
}
\`\`\`

## Data Table

| Feature | Status | Priority |
|---------|--------|----------|
| Feature A | ✓ Done | High |
| Feature B | ⊘ Pending | Medium |

## Conclusion

> Remember to test everything!

---

End of document.`;
      const mdPath = path.join(tempDir, 'test_complete.md');
      
      try {
        await fs.writeFile(mdPath, mdContent);
        const result = await MarkdownToWordConverter.convert(mdPath);
        
        assert.strictEqual(result.success, true);
        assert.ok(result.outputPath);
        assert.ok(result.duration);
        
        const stat = await fs.stat(result.outputPath!);
        assert.ok(stat.size > 5000, 'Complete document should generate substantial file');
        
        console.log(`✅ Conversion completed in ${result.duration}ms`);
        console.log(`✅ Output file size: ${stat.size} bytes`);
        
        await fs.unlink(result.outputPath!).catch(() => {});
      } finally {
        await fs.unlink(mdPath).catch(() => {});
      }
    });
  });
});
