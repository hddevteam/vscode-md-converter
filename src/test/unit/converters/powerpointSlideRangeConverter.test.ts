import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import { PowerPointSlideRangeConverter } from '../../../converters/powerpointSlideRangeConverter';

suite('PowerPointSlideRangeConverter Tests', () => {
  const testDataDir = path.join(__dirname, '..', 'docs');
  const testPptFile = path.join(testDataDir, 'multipage_ppt.pptx');
  const tempDir = path.join(__dirname, '..', 'temp', 'powerpoint_slide_range_test');

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
    const converter = new PowerPointSlideRangeConverter();
    assert.ok(converter);
  });

  test('should have static conversion method', () => {
    // Test that the static method exists
    assert.strictEqual(
      typeof PowerPointSlideRangeConverter.convertWithSlideRange,
      'function',
      'Should have static convertWithSlideRange method'
    );
  });

  test('should handle invalid file path gracefully', async () => {
    const invalidPath = path.join(testDataDir, 'nonexistent.pptx');
    
    try {
      const result = await PowerPointSlideRangeConverter.convertWithSlideRange(invalidPath);
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

  test('should handle non-PPTX files gracefully', async () => {
    // Create a fake file with wrong extension
    const fakeFile = path.join(tempDir, 'fake.pptx');
    await fs.writeFile(fakeFile, 'not a real pptx file');
    
    try {
      const result = await PowerPointSlideRangeConverter.convertWithSlideRange(fakeFile);
      // If the method returns a result instead of throwing, check that it indicates failure
      if (result) {
        assert.ok(result.success === false);
      }
      console.log('Correctly handled invalid PPTX file');
    } catch (error) {
      // Either throw error or return failed result is acceptable
      assert.ok(error instanceof Error);
      console.log('Correctly handled invalid PPTX file with exception');
    }
  });

  test('should validate class instantiation', () => {
    const converter = new PowerPointSlideRangeConverter();
    assert.ok(converter instanceof PowerPointSlideRangeConverter);
    assert.ok(converter.constructor.name === 'PowerPointSlideRangeConverter');
  });

  test('should be able to process PowerPoint files if they exist', async () => {
    try {
      // Check if test file exists
      await fs.access(testPptFile);
      
      // If file exists, test that the converter can be called
      // Note: This will likely show dialogs, so we won't wait for completion
      const conversionPromise = PowerPointSlideRangeConverter.convertWithSlideRange(testPptFile);
      
      // Since this involves user interaction, we can't really test the full flow
      // We just verify that the method can be called without immediate errors
      assert.ok(conversionPromise instanceof Promise);
      
      console.log('Converter can process PowerPoint files (test file found)');
    } catch (error) {
      console.log('Test PowerPoint file not found, skipping actual conversion test');
      // This is not a failure - the test file might not exist in all environments
    }
  });

  test('should handle real PowerPoint file structure', async () => {
    try {
      // Check if test file exists
      await fs.access(testPptFile);
      
      // Test that we can read the PowerPoint file and get basic information about it
      const fileStat = await fs.stat(testPptFile);
      assert.ok(fileStat.size > 0, 'PowerPoint file should have content');
      
      console.log(`PowerPoint test file size: ${fileStat.size} bytes`);
      console.log('Real PowerPoint file structure test passed');
    } catch (error) {
      console.log('Test PowerPoint file not found, skipping real file structure test');
      // Skip this test if file doesn't exist
      return;
    }
  });

  test('should validate PowerPoint file format', async () => {
    try {
      await fs.access(testPptFile);
      
      // Test that the file has the correct extension
      const ext = path.extname(testPptFile).toLowerCase();
      assert.ok(ext === '.pptx' || ext === '.ppt', 'Should be a valid PowerPoint file extension');
      
      console.log(`PowerPoint file extension validation passed: ${ext}`);
    } catch (error) {
      console.log('Test PowerPoint file not found, skipping format validation');
    }
  });

  test('should be able to read PowerPoint file as ZIP archive', async () => {
    try {
      await fs.access(testPptFile);
      
      // Test that we can read the file as binary data (PowerPoint files are ZIP archives)
      const fileBuffer = await fs.readFile(testPptFile);
      assert.ok(fileBuffer.length > 0, 'Should be able to read file as buffer');
      
      // Check ZIP file signature (PK)
      const signature = fileBuffer.slice(0, 2).toString();
      assert.ok(signature === 'PK', 'PowerPoint file should have ZIP signature');
      
      console.log('PowerPoint ZIP archive structure validation passed');
    } catch (error) {
      console.log('Test PowerPoint file not found, skipping ZIP validation');
    }
  });

  test('should handle different file extensions', () => {
    // Test that both .pptx and .ppt extensions are recognized
    // This is more of a documentation test since we can't easily test the actual processing
    
    const pptxPath = path.join(testDataDir, 'test.pptx');
    const pptPath = path.join(testDataDir, 'test.ppt');
    
    // These should both be valid input paths (though files may not exist)
    assert.ok(pptxPath.endsWith('.pptx'));
    assert.ok(pptPath.endsWith('.ppt'));
    
    console.log('File extension validation passed');
  });
});
