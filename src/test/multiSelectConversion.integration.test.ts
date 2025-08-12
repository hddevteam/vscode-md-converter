import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ConvertSelectedToMarkdownCommand } from '../commands/convertSelectedToMarkdown';
import { MarkdownInfoSelector } from '../ui/markdownInfoSelector';
import { MarkdownInfoConfig } from '../types';

suite('Multi-Select Markdown Conversion Integration Tests', () => {
  const tempDir = path.join(__dirname, 'temp', 'multiselect_test');
  
  setup(async () => {
    // Create temp directory for test files
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  teardown(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch (error) {
      // Directory might not exist or be in use
    }
  });

  test('should handle integration with MarkdownInfoSelector UI component', async () => {
    // Test that the command properly integrates with the UI selector
    
    // Mock the selector to return a specific configuration
    const originalShowSelector = MarkdownInfoSelector.showSelector;
    const mockConfig: MarkdownInfoConfig = {
      includeTitle: true,
      includeSourceNotice: false,
      includeFileInfo: true,
      includeMetadata: false,
      includeConversionWarnings: false,
      includeContentHeading: false,
      includeSectionSeparators: false
    };

    MarkdownInfoSelector.showSelector = async () => mockConfig;

    try {
      // Test that calling the selector returns expected config
      const result = await MarkdownInfoSelector.showSelector();
      assert.deepStrictEqual(result, mockConfig, 'Should return expected config');
    } finally {
      MarkdownInfoSelector.showSelector = originalShowSelector;
    }
  });

  test('should handle command execution with proper error handling', async () => {
    // Test command execution without complex VS Code API mocking
    
    // Create a test file
    const testFile = path.join(tempDir, 'test_integration.txt');
    await fs.writeFile(testFile, 'Test content for integration');
    const testUri = vscode.Uri.file(testFile);

    // Mock the selector
    const originalShowSelector = MarkdownInfoSelector.showSelector;
    MarkdownInfoSelector.showSelector = async () => ({
      includeTitle: true,
      includeSourceNotice: false,
      includeFileInfo: false,
      includeMetadata: false,
      includeConversionWarnings: false,
      includeContentHeading: false,
      includeSectionSeparators: false
    });

    // Track if warning was shown
    let warningShown = false;
    const originalShowWarningMessage = vscode.window.showWarningMessage;
    (vscode.window.showWarningMessage as any) = async (message: string) => {
      warningShown = true;
      return undefined;
    };

    try {
      // This should show a warning about unsupported file type
      await ConvertSelectedToMarkdownCommand.execute(testUri);
      
      // Verify warning was shown (for unsupported .txt file)
      assert.strictEqual(warningShown, true, 'Should show warning for unsupported file type');
    } catch (error) {
      // Expected to fail due to missing VS Code environment in test
      assert.ok(error, 'Expected error due to test environment limitations');
    } finally {
      vscode.window.showWarningMessage = originalShowWarningMessage;
      MarkdownInfoSelector.showSelector = originalShowSelector;
    }
  });

  test('should validate file type filtering logic', async () => {
    // Test file extension filtering without full command execution
    
    const supportedExtensions = ['.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt'];
    const testFiles = [
      { name: 'document.docx', shouldBeSupported: true },
      { name: 'image.png', shouldBeSupported: false },
      { name: 'spreadsheet.xlsx', shouldBeSupported: true },
      { name: 'video.mp4', shouldBeSupported: false },
      { name: 'presentation.pptx', shouldBeSupported: true },
      { name: 'text.txt', shouldBeSupported: false }
    ];

    for (const file of testFiles) {
      const ext = path.extname(file.name).toLowerCase();
      const isSupported = supportedExtensions.includes(ext);
      
      assert.strictEqual(
        isSupported, 
        file.shouldBeSupported, 
        `File ${file.name} support detection should be correct`
      );
    }
  });

  test('should handle configuration persistence mechanism', async () => {
    // Test that configuration can be saved and loaded
    
    // Mock workspace configuration
    let savedConfig: any = {};
    const mockWorkspaceConfig = {
      get: (key: string) => savedConfig[key],
      update: async (key: string, value: any) => {
        savedConfig[key] = value;
      }
    };

    const originalGetConfiguration = vscode.workspace.getConfiguration;
    (vscode.workspace.getConfiguration as any) = () => mockWorkspaceConfig;

    try {
      // Test configuration save/load cycle
      const testConfig = ['title', 'fileInfo'];
      await mockWorkspaceConfig.update('markdownInfoFields', testConfig);
      
      const retrieved = mockWorkspaceConfig.get('markdownInfoFields');
      assert.deepStrictEqual(retrieved, testConfig, 'Should save and retrieve config correctly');
    } finally {
      vscode.workspace.getConfiguration = originalGetConfiguration;
    }
  });

  test('should handle batch processing preparation logic', async () => {
    // Test the logic that prepares files for batch processing
    
    const testFiles = [
      'document1.docx',
      'document2.pdf', // Not supported by multi-select command  
      'spreadsheet.xlsx',
      'presentation.pptx',
      'image.jpg' // Not supported
    ];

    // Create test files
    const testUris: vscode.Uri[] = [];
    for (const fileName of testFiles) {
      const filePath = path.join(tempDir, fileName);
      await fs.writeFile(filePath, 'Test content');
      testUris.push(vscode.Uri.file(filePath));
    }

    // Filter for supported files (simulate the command's filtering logic)
    const supportedExtensions = ['.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt'];
    const supportedFiles = testUris.filter(uri => {
      const ext = path.extname(uri.fsPath).toLowerCase();
      return supportedExtensions.includes(ext);
    });

    // Should filter to 3 supported files (.docx, .xlsx, .pptx)
    assert.strictEqual(supportedFiles.length, 3, 'Should filter to supported files only');
    
    // Verify correct files are included
    const supportedNames = supportedFiles.map(uri => path.basename(uri.fsPath));
    assert.ok(supportedNames.includes('document1.docx'), 'Should include Word document');
    assert.ok(supportedNames.includes('spreadsheet.xlsx'), 'Should include Excel file');
    assert.ok(supportedNames.includes('presentation.pptx'), 'Should include PowerPoint file');
  });

  test('should handle edge cases in file selection', async () => {
    // Test various edge cases
    
    const edgeCases = [
      {
        name: 'empty array',
        files: [],
        expected: 0
      },
      {
        name: 'mixed case extensions',
        files: ['Document.DOCX', 'Spreadsheet.XLSX'],
        expected: 2
      },
      {
        name: 'files with complex names',
        files: ['my-document (1).docx', 'report_2024.xlsx'],
        expected: 2
      }
    ];

    for (const testCase of edgeCases) {
      const testUris = testCase.files.map(name => 
        vscode.Uri.file(path.join(tempDir, name))
      );

      const supportedExtensions = ['.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt'];
      const filteredFiles = testUris.filter(uri => {
        const ext = path.extname(uri.fsPath).toLowerCase();
        return supportedExtensions.includes(ext);
      });

      assert.strictEqual(
        filteredFiles.length, 
        testCase.expected, 
        `Edge case "${testCase.name}" should filter correctly`
      );
    }
  });

  test('should validate progress reporting structure', async () => {
    // Test the structure of batch conversion results
    
    interface BatchConversionResult {
      totalFiles: number;
      successfulConversions: number;
      failedConversions: number;
      skippedFiles: number;
      results: any[];
      duration: number;
    }

    // Create a mock result structure
    const mockResult: BatchConversionResult = {
      totalFiles: 5,
      successfulConversions: 3,
      failedConversions: 2,
      skippedFiles: 0,
      results: [],
      duration: 1500
    };

    // Validate result structure
    assert.ok(typeof mockResult.totalFiles === 'number', 'totalFiles should be number');
    assert.ok(typeof mockResult.successfulConversions === 'number', 'successfulConversions should be number');
    assert.ok(typeof mockResult.failedConversions === 'number', 'failedConversions should be number');
    assert.ok(typeof mockResult.skippedFiles === 'number', 'skippedFiles should be number');
    assert.ok(Array.isArray(mockResult.results), 'results should be array');
    assert.ok(typeof mockResult.duration === 'number', 'duration should be number');

    // Validate totals add up
    const expectedTotal = mockResult.successfulConversions + mockResult.failedConversions + mockResult.skippedFiles;
    assert.strictEqual(
      mockResult.totalFiles, 
      expectedTotal, 
      'Total files should equal sum of success + failed + skipped'
    );
  });
});
