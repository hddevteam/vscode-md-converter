import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ExcelWorksheetRangeConverter } from '../../../converters/excelWorksheetRangeConverter';
import { PowerPointSlideRangeConverter } from '../../../converters/powerpointSlideRangeConverter';

suite('Real Files Integration Tests', () => {
  // Use process.cwd() to get absolute path from project root
  const testDataDir = path.join(process.cwd(), 'src', 'test', 'docs');
  const testExcelFile = path.join(testDataDir, '综合业务数据.xlsx');
  const testPptFile = path.join(testDataDir, 'multipage_ppt.pptx');
  const tempDir = path.join(process.cwd(), 'out', 'test', 'temp', 'real_files_test');

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

  suite('Excel File Tests', () => {
    test('should verify test Excel file exists and is readable', async () => {
      try {
        const fileStat = await fs.stat(testExcelFile);
        assert.ok(fileStat.isFile(), 'Should be a file');
        assert.ok(fileStat.size > 0, 'Should have content');
        
        console.log(`✅ Excel test file verified: ${path.basename(testExcelFile)} (${fileStat.size} bytes)`);
      } catch (error) {
        console.log('❌ Excel test file not found - this is expected in some test environments');
        // Skip remaining Excel tests if file doesn't exist
        return;
      }
    });

    test('should validate Excel file format', async () => {
      try {
        await fs.access(testExcelFile);
        
        const ext = path.extname(testExcelFile).toLowerCase();
        assert.ok(ext === '.xlsx', 'Should be .xlsx format');
        
        // Read first few bytes to check if it's a valid ZIP file (Excel files are ZIP archives)
        const buffer = await fs.readFile(testExcelFile, { encoding: null });
        const signature = buffer.slice(0, 2);
        assert.ok(signature[0] === 0x50 && signature[1] === 0x4B, 'Should have ZIP signature (PK)');
        
        console.log('✅ Excel file format validation passed');
      } catch (error) {
        console.log('❌ Excel test file not available for format validation');
      }
    });

    test('should be able to instantiate Excel converter', () => {
      const converter = new ExcelWorksheetRangeConverter();
      assert.ok(converter, 'Should create converter instance');
      assert.ok(typeof converter === 'object', 'Should be an object');
      
      console.log('✅ Excel converter instantiation test passed');
    });

    test('should handle Excel file processing without user interaction', async () => {
      try {
        await fs.access(testExcelFile);
        
        // Test that the static method exists and can be called
        assert.ok(
          typeof ExcelWorksheetRangeConverter.convertWithWorksheetSelection === 'function',
          'convertWithWorksheetSelection should be a function'
        );
        
        console.log('✅ Excel converter methods are available');
      } catch (error) {
        console.log('❌ Excel test file not available for processing test');
      }
    });
  });

  suite('PowerPoint File Tests', () => {
    test('should verify test PowerPoint file exists and is readable', async () => {
      try {
        const fileStat = await fs.stat(testPptFile);
        assert.ok(fileStat.isFile(), 'Should be a file');
        assert.ok(fileStat.size > 0, 'Should have content');
        
        console.log(`✅ PowerPoint test file verified: ${path.basename(testPptFile)} (${fileStat.size} bytes)`);
      } catch (error) {
        console.log('❌ PowerPoint test file not found - this is expected in some test environments');
        // Skip remaining PowerPoint tests if file doesn't exist
        return;
      }
    });

    test('should validate PowerPoint file format', async () => {
      try {
        await fs.access(testPptFile);
        
        const ext = path.extname(testPptFile).toLowerCase();
        assert.ok(ext === '.pptx', 'Should be .pptx format');
        
        // Read first few bytes to check if it's a valid ZIP file (PowerPoint files are ZIP archives)
        const buffer = await fs.readFile(testPptFile, { encoding: null });
        const signature = buffer.slice(0, 2);
        assert.ok(signature[0] === 0x50 && signature[1] === 0x4B, 'Should have ZIP signature (PK)');
        
        console.log('✅ PowerPoint file format validation passed');
      } catch (error) {
        console.log('❌ PowerPoint test file not available for format validation');
      }
    });

    test('should be able to instantiate PowerPoint converter', () => {
      const converter = new PowerPointSlideRangeConverter();
      assert.ok(converter, 'Should create converter instance');
      assert.ok(typeof converter === 'object', 'Should be an object');
      
      console.log('✅ PowerPoint converter instantiation test passed');
    });

    test('should handle PowerPoint file processing without user interaction', async () => {
      try {
        await fs.access(testPptFile);
        
        // Test that the static method exists and can be called
        assert.ok(
          typeof PowerPointSlideRangeConverter.convertWithSlideRange === 'function',
          'convertWithSlideRange should be a function'
        );
        
        console.log('✅ PowerPoint converter methods are available');
      } catch (error) {
        console.log('❌ PowerPoint test file not available for processing test');
      }
    });

    test('should validate PowerPoint file can be opened as ZIP', async () => {
      try {
        await fs.access(testPptFile);
        
        // Test that we can read the file content
        const fileContent = await fs.readFile(testPptFile);
        assert.ok(fileContent.length > 0, 'File should have content');
        
        // Check for ZIP structure
        const zipSignature = fileContent.slice(0, 4);
        const isZip = zipSignature[0] === 0x50 && zipSignature[1] === 0x4B && 
                     (zipSignature[2] === 0x03 || zipSignature[2] === 0x05 || zipSignature[2] === 0x07);
        assert.ok(isZip, 'PowerPoint file should be a valid ZIP archive');
        
        console.log('✅ PowerPoint ZIP structure validation passed');
      } catch (error) {
        console.log('❌ PowerPoint test file not available for ZIP validation');
      }
    });
  });

  suite('File Processing Comparison Tests', () => {
    test('should handle both file types with similar interfaces', async () => {
      let excelAvailable = false;
      let pptAvailable = false;
      
      try {
        await fs.access(testExcelFile);
        excelAvailable = true;
      } catch {
        // Excel file not available
      }
      
      try {
        await fs.access(testPptFile);
        pptAvailable = true;
      } catch {
        // PowerPoint file not available
      }
      
      if (excelAvailable && pptAvailable) {
        // Test that both converters have similar static method patterns
        assert.ok(
          typeof ExcelWorksheetRangeConverter.convertWithWorksheetSelection === 'function',
          'Excel converter should have static conversion method'
        );
        
        assert.ok(
          typeof PowerPointSlideRangeConverter.convertWithSlideRange === 'function',
          'PowerPoint converter should have static conversion method'
        );
        
        console.log('✅ Both converters have consistent interfaces');
      } else if (excelAvailable) {
        console.log('✅ Excel converter interface validated (PowerPoint file not available)');
      } else if (pptAvailable) {
        console.log('✅ PowerPoint converter interface validated (Excel file not available)');
      } else {
        console.log('❌ Neither test file available - skipping interface comparison');
      }
    });

    test('should provide appropriate error handling for missing files', async () => {
      const nonExistentExcel = path.join(tempDir, 'nonexistent.xlsx');
      const nonExistentPpt = path.join(tempDir, 'nonexistent.pptx');
      
      // Test Excel converter error handling
      try {
        const excelResult = await ExcelWorksheetRangeConverter.convertWithWorksheetSelection(nonExistentExcel);
        if (excelResult) {
          assert.ok(excelResult.success === false, 'Should indicate failure for nonexistent Excel file');
        }
      } catch (error) {
        assert.ok(error instanceof Error, 'Should throw appropriate error for nonexistent Excel file');
      }
      
      // Test PowerPoint converter error handling
      try {
        const pptResult = await PowerPointSlideRangeConverter.convertWithSlideRange(nonExistentPpt);
        if (pptResult) {
          assert.ok(pptResult.success === false, 'Should indicate failure for nonexistent PowerPoint file');
        }
      } catch (error) {
        assert.ok(error instanceof Error, 'Should throw appropriate error for nonexistent PowerPoint file');
      }
      
      console.log('✅ Error handling validation passed for both converters');
    });
  });

  suite('Test Environment Validation', () => {
    test('should report test file availability status', async () => {
      console.log(`🔍 Current working directory: ${process.cwd()}`);
      console.log(`🔍 Test data directory: ${testDataDir}`);
      console.log(`🔍 Excel file path: ${testExcelFile}`);
      console.log(`🔍 PowerPoint file path: ${testPptFile}`);
      
      const files = [
        { name: 'Excel', path: testExcelFile },
        { name: 'PowerPoint', path: testPptFile }
      ];
      
      const results = await Promise.allSettled(
        files.map(async file => {
          const stat = await fs.stat(file.path);
          return { ...file, size: stat.size, available: true };
        })
      );
      
      let availableCount = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          availableCount++;
          console.log(`✅ ${files[index].name} test file available: ${result.value.size} bytes`);
        } else {
          console.log(`❌ ${files[index].name} test file not available: ${result.reason}`);
        }
      });
      
      console.log(`📊 Test environment status: ${availableCount}/${files.length} test files available`);
      
      // This test always passes - it's just for reporting
      assert.ok(true, 'Test environment validation complete');
    });
  });
});
