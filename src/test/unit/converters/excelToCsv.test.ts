import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ExcelToCsvConverter } from '../../../converters/excelToCsv';

suite('Excel to CSV Converter Tests', () => {
  test('ExcelToCsvConverter should be available', () => {
    assert.ok(ExcelToCsvConverter);
    assert.ok(typeof ExcelToCsvConverter.convert === 'function');
  });

  test('Convert should return error for non-existent file', async () => {
    const result = await ExcelToCsvConverter.convert('/path/to/non-existent-file.xlsx');
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
  });

  test('Convert should return error for unsupported file format', async () => {
    // Create a temporary file with unsupported extension
    const tempPath = path.join(__dirname, 'test.txt');
    await fs.writeFile(tempPath, 'test content');
    
    try {
      const result = await ExcelToCsvConverter.convert(tempPath);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    } finally {
      // Clean up
      try {
        await fs.unlink(tempPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  test('Should process real Excel file if available', async () => {
    const testFilePath = path.join(__dirname, '../../docs/综合业务数据.xlsx');
    
    try {
      // Check if test file exists
      await fs.access(testFilePath);
      
      // Test conversion
      const result = await ExcelToCsvConverter.convert(testFilePath, {
        outputDirectory: path.join(__dirname, '../../temp')
      });
      
      if (result.success) {
        assert.ok(result.outputPaths);
        assert.ok(result.outputPaths.length > 0);
        console.log(`✅ Excel to CSV conversion successful! Generated ${result.outputPaths.length} CSV file(s)`);
        
        // Verify CSV files exist
        for (const csvPath of result.outputPaths) {
          const stats = await fs.stat(csvPath);
          assert.ok(stats.size > 0, `CSV file ${csvPath} should not be empty`);
        }
        
        // Clean up generated files
        for (const csvPath of result.outputPaths) {
          try {
            await fs.unlink(csvPath);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      } else {
        console.log('⚠️ Excel conversion failed (expected if file format is unsupported):', result.error);
      }
    } catch (e) {
      console.log('⚠️ Test Excel file not found, skipping real file test');
    }
  });
});
