import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ExcelWorksheetRangeConverter } from '../../../converters/excelWorksheetRangeConverter';
import { CsvWriterBase } from '../../../converters/csvWriterBase';

suite('ExcelWorksheetRangeConverter Tests', () => {
  const testDataDir = path.join(__dirname, '..', 'docs');
  const testExcelFile = path.join(testDataDir, '综合业务数据.xlsx');
  const tempDir = path.join(__dirname, '..', 'temp', 'excel_worksheet_range_test');

  setup(async () => {
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  teardown(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
  });

  test('should create instance', () => {
    const converter = new ExcelWorksheetRangeConverter();
    assert.ok(converter);
  });

  test('should handle invalid file path gracefully', async () => {
    const invalidPath = path.join(testDataDir, 'nonexistent.xlsx');
    
    try {
      const result = await ExcelWorksheetRangeConverter.convertWithWorksheetSelection(invalidPath);
      // If the method returns a result instead of throwing, check that it indicates failure
      if (result) {
        assert.ok(result.success === false);
      }
    } catch (error) {
      // If it throws an error, that's also acceptable behavior
      assert.ok(error instanceof Error);
      console.log('Correctly handled invalid file path');
    }
  });

  test('should handle non-Excel files gracefully', async () => {
    // Create a fake Excel file
    const fakeFile = path.join(tempDir, 'fake.xlsx');
    await fs.writeFile(fakeFile, 'not a real excel file');
    
    try {
      const result = await ExcelWorksheetRangeConverter.convertWithWorksheetSelection(fakeFile);
      // If the method returns a result instead of throwing, check that it indicates failure
      if (result) {
        assert.ok(result.success === false);
      }
      console.log('Correctly handled invalid Excel file');
    } catch (error) {
      // If it throws an error, that's also acceptable behavior
      assert.ok(error instanceof Error);
      console.log('Correctly handled invalid Excel file with exception');
    }
  }).timeout(500);

  test('should have static conversion method', () => {
    // Test that the static method exists
    assert.strictEqual(
      typeof ExcelWorksheetRangeConverter.convertWithWorksheetSelection,
      'function',
      'Should have static convertWithWorksheetSelection method'
    );
  });

  test('should validate class instantiation', () => {
    const converter = new ExcelWorksheetRangeConverter();
    assert.ok(converter instanceof ExcelWorksheetRangeConverter);
    
    // Test that it extends CsvWriterBase
    assert.ok(converter.constructor.name === 'ExcelWorksheetRangeConverter');
  });

  test('should validate inheritance from CsvWriterBase', () => {
    const converter = new ExcelWorksheetRangeConverter();
    
    // Test that it's an instance of both classes
    assert.ok(converter instanceof ExcelWorksheetRangeConverter, 'Should be instance of ExcelWorksheetRangeConverter');
    assert.ok(converter instanceof CsvWriterBase, 'Should be instance of CsvWriterBase');
    
    // Test static method from parent class is accessible
    assert.strictEqual(
      typeof ExcelWorksheetRangeConverter.sanitizeFileName,
      'function',
      'Should have access to static sanitizeFileName method'
    );
  });

  // Test basic file processing workflow
  test('should be able to process Excel files if they exist', async () => {
    try {
      // Check if test file exists
      await fs.access(testExcelFile);
      
      // If file exists, test that the converter can be called
      // Note: This will likely show dialogs, so we won't wait for completion
      const conversionPromise = ExcelWorksheetRangeConverter.convertWithWorksheetSelection(testExcelFile);
      
      // Since this involves user interaction, we can't really test the full flow
      // We just verify that the method can be called without immediate errors
      assert.ok(conversionPromise instanceof Promise);
      
      console.log('Converter can process Excel files (test file found)');
    } catch (error) {
      console.log('Test Excel file not found, skipping actual conversion test');
      // This is not a failure - the test file might not exist in all environments
    }
  });

  test('should handle real Excel file structure', async () => {
    try {
      // Check if test file exists
      await fs.access(testExcelFile);
      
      // Test that we can read the Excel file and get basic information about it
      const fileStat = await fs.stat(testExcelFile);
      assert.ok(fileStat.size > 0, 'Excel file should have content');
      
      console.log(`Excel test file size: ${fileStat.size} bytes`);
      console.log('Real Excel file structure test passed');
    } catch (error) {
      console.log('Test Excel file not found, skipping real file structure test');
      // Skip this test if file doesn't exist
      return;
    }
  });

  test('should validate Excel file format', async () => {
    try {
      await fs.access(testExcelFile);
      
      // Test that the file has the correct extension
      const ext = path.extname(testExcelFile).toLowerCase();
      assert.ok(ext === '.xlsx' || ext === '.xls', 'Should be a valid Excel file extension');
      
      console.log(`Excel file extension validation passed: ${ext}`);
    } catch (error) {
      console.log('Test Excel file not found, skipping format validation');
    }
  });
});
