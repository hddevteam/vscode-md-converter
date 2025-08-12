import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { ConvertSelectedToMarkdownCommand } from '../../../commands/convertSelectedToMarkdown';
import { MarkdownInfoConfig } from '../../../types';

suite('ConvertSelectedToMarkdownCommand Unit Tests', () => {
  let originalShowQuickPick: typeof vscode.window.showQuickPick;
  let originalShowInformationMessage: typeof vscode.window.showInformationMessage;
  let originalShowWarningMessage: typeof vscode.window.showWarningMessage;
  let originalShowErrorMessage: typeof vscode.window.showErrorMessage;
  let originalWithProgress: typeof vscode.window.withProgress;
  let originalStat: typeof vscode.workspace.fs.stat;

  setup(() => {
    // Store original methods
    originalShowQuickPick = vscode.window.showQuickPick;
    originalShowInformationMessage = vscode.window.showInformationMessage;
    originalShowWarningMessage = vscode.window.showWarningMessage;
    originalShowErrorMessage = vscode.window.showErrorMessage;
    originalWithProgress = vscode.window.withProgress;
    originalStat = vscode.workspace.fs.stat;
  });

  teardown(() => {
    // Restore original implementations after each test
    // This is handled within each test to avoid conflicts
  });

  test('should handle no files selected', async () => {
    // Mock warning message to capture what's shown
    let warningMessage = '';
    const originalShowWarningMessage = vscode.window.showWarningMessage;
    (vscode.window.showWarningMessage as any) = async (message: string) => {
      warningMessage = message;
      return undefined;
    };

    try {
      // Test with empty URI array
      await ConvertSelectedToMarkdownCommand.execute(undefined, []);
      
      // Should show warning about no files
      assert.ok(warningMessage.length > 0, 'Should show warning message when no files selected');
    } finally {
      vscode.window.showWarningMessage = originalShowWarningMessage;
    }
  });

  test('should handle single file selection', async () => {
    const testUri = vscode.Uri.file('/test/document.docx');
    
    // Mock file stat to return valid file
    vscode.workspace.fs.stat = async (uri: vscode.Uri) => {
      return { type: vscode.FileType.File, ctime: 0, mtime: 0, size: 1000 } as vscode.FileStat;
    };

    // Mock showQuickPick for configuration selection
    (vscode.window.showQuickPick as any) = async () => [
      { label: 'Document Title', picked: true }
    ];

    // Mock withProgress to avoid actual conversion
    let progressTitle = '';
    (vscode.window.withProgress as any) = async (options: any, task: any) => {
      progressTitle = options.title;
      // Return a mock result
      return {
        totalFiles: 1,
        successfulConversions: 0,
        failedConversions: 1,
        skippedFiles: 0,
        results: [],
        duration: 100
      };
    };

    let errorMessage = '';
    vscode.window.showErrorMessage = async (message: string) => {
      errorMessage = message;
      return undefined;
    };

    await ConvertSelectedToMarkdownCommand.execute(testUri);

    assert.ok(progressTitle.includes('Converting'), 'Should show progress with conversion message');
  });

  test('should handle multi-file selection', async () => {
    const testUris = [
      vscode.Uri.file('/test/document1.docx'),
      vscode.Uri.file('/test/document2.xlsx'),
      vscode.Uri.file('/test/document3.pptx')
    ];

    // Mock file stat to return valid files
    vscode.workspace.fs.stat = async (uri: vscode.Uri) => {
      return { type: vscode.FileType.File, ctime: 0, mtime: 0, size: 1000 } as vscode.FileStat;
    };

    // Mock showQuickPick for configuration selection
    (vscode.window.showQuickPick as any) = async () => [
      { label: 'Document Title', picked: true },
      { label: 'File Information', picked: true }
    ];

    // Mock withProgress
    let progressTitle = '';
    (vscode.window.withProgress as any) = async (options: any, task: any) => {
      progressTitle = options.title;
      return {
        totalFiles: 3,
        successfulConversions: 0,
        failedConversions: 3,
        skippedFiles: 0,
        results: [],
        duration: 300
      };
    };

    let errorMessage = '';
    vscode.window.showErrorMessage = async (message: string) => {
      errorMessage = message;
      return undefined;
    };

    await ConvertSelectedToMarkdownCommand.execute(undefined, testUris);

    assert.ok(progressTitle.includes('Converting'), 'Should show progress for multi-file conversion');
  });

  test('should filter unsupported file types', async () => {
    const testUris = [
      vscode.Uri.file('/test/document.docx'),  // Supported
      vscode.Uri.file('/test/image.png'),      // Unsupported
      vscode.Uri.file('/test/data.xlsx')       // Supported
    ];

    // Mock file stat
    vscode.workspace.fs.stat = async (uri: vscode.Uri) => {
      return { type: vscode.FileType.File, ctime: 0, mtime: 0, size: 1000 } as vscode.FileStat;
    };

    let warningMessage = '';
    vscode.window.showWarningMessage = async (message: string) => {
      warningMessage = message;
      return undefined;
    };

    // Mock showQuickPick for configuration selection
    (vscode.window.showQuickPick as any) = async () => [
      { label: 'Document Title', picked: true }
    ];

    // Mock withProgress
    (vscode.window.withProgress as any) = async (options: any, task: any) => {
      return {
        totalFiles: 2, // Only supported files
        successfulConversions: 0,
        failedConversions: 2,
        skippedFiles: 0,
        results: [],
        duration: 200
      };
    };

    vscode.window.showErrorMessage = async () => undefined;

    await ConvertSelectedToMarkdownCommand.execute(undefined, testUris);

    assert.ok(warningMessage.includes('skipped'), 'Should show warning about skipped files');
    assert.ok(warningMessage.includes('image.png'), 'Should mention the unsupported file');
  });

  test('should handle directories in selection', async () => {
    const testUris = [
      vscode.Uri.file('/test/document.docx'),  // File
      vscode.Uri.file('/test/folder')          // Directory
    ];

    // Mock file stat to return appropriate types
    vscode.workspace.fs.stat = async (uri: vscode.Uri) => {
      if (uri.fsPath.includes('folder')) {
        return { type: vscode.FileType.Directory, ctime: 0, mtime: 0, size: 0 } as vscode.FileStat;
      }
      return { type: vscode.FileType.File, ctime: 0, mtime: 0, size: 1000 } as vscode.FileStat;
    };

    let warningMessage = '';
    vscode.window.showWarningMessage = async (message: string) => {
      warningMessage = message;
      return undefined;
    };

    // Mock showQuickPick for configuration selection
    (vscode.window.showQuickPick as any) = async () => [
      { label: 'Document Title', picked: true }
    ];

    // Mock withProgress
    (vscode.window.withProgress as any) = async (options: any, task: any) => {
      return {
        totalFiles: 1,
        successfulConversions: 0,
        failedConversions: 1,
        skippedFiles: 0,
        results: [],
        duration: 100
      };
    };

    vscode.window.showErrorMessage = async () => undefined;

    await ConvertSelectedToMarkdownCommand.execute(undefined, testUris);

    assert.ok(warningMessage.includes('skipped'), 'Should show warning about skipped directories');
    assert.ok(warningMessage.includes('folder'), 'Should mention the directory');
  });

  test('should handle non-existent files', async () => {
    const testUris = [
      vscode.Uri.file('/test/nonexistent.docx')
    ];

    // Mock file stat to throw error for non-existent file
    vscode.workspace.fs.stat = async (uri: vscode.Uri) => {
      throw new vscode.FileSystemError('File not found');
    };

    let warningMessage = '';
    vscode.window.showWarningMessage = async (message: string) => {
      warningMessage = message;
      return undefined;
    };

    await ConvertSelectedToMarkdownCommand.execute(undefined, testUris);

    assert.ok(warningMessage.includes('No supported files'), 'Should show no supported files warning');
  });

  test('should handle user cancellation of configuration selection', async () => {
    const testUri = vscode.Uri.file('/test/document.docx');

    // Mock file stat
    vscode.workspace.fs.stat = async (uri: vscode.Uri) => {
      return { type: vscode.FileType.File, ctime: 0, mtime: 0, size: 1000 } as vscode.FileStat;
    };

    // Mock showQuickPick to return undefined (user cancellation)
    (vscode.window.showQuickPick as any) = async () => undefined;

    // Track if progress was called (it shouldn't be)
    let progressCalled = false;
    (vscode.window.withProgress as any) = async (options: any, task: any) => {
      progressCalled = true;
      return {};
    };

    await ConvertSelectedToMarkdownCommand.execute(testUri);

    assert.strictEqual(progressCalled, false, 'Should not start conversion when user cancels configuration');
  });

  test('should handle mixed file types correctly', async () => {
    const testUris = [
      vscode.Uri.file('/test/document.docx'),
      vscode.Uri.file('/test/spreadsheet.xlsx'),
      vscode.Uri.file('/test/presentation.pptx'),
      vscode.Uri.file('/test/data.csv'),
      vscode.Uri.file('/test/old_doc.doc')
    ];

    // Mock file stat
    vscode.workspace.fs.stat = async (uri: vscode.Uri) => {
      return { type: vscode.FileType.File, ctime: 0, mtime: 0, size: 1000 } as vscode.FileStat;
    };

    // Mock showQuickPick for configuration selection
    (vscode.window.showQuickPick as any) = async () => [
      { label: 'Document Title', picked: true }
    ];

    // Mock withProgress to track progress calls
    let progressCalls: string[] = [];
    (vscode.window.withProgress as any) = async (options: any, task: any) => {
      progressCalls.push(options.title);
      
      // Mock the progress function
      const mockProgress = {
        report: (value: any) => {
          // Track progress reports if needed
        }
      };
      
      const mockToken = {
        isCancellationRequested: false,
        onCancellationRequested: () => ({ dispose: () => {} })
      };

      // Call the task to simulate progress
      return await task(mockProgress, mockToken);
    };

    vscode.window.showErrorMessage = async () => undefined;

    await ConvertSelectedToMarkdownCommand.execute(undefined, testUris);

    assert.strictEqual(progressCalls.length, 1, 'Should call progress once');
    assert.ok(progressCalls[0].includes('Converting'), 'Should show converting message');
  });

  test('should handle error during execution', async () => {
    const testUri = vscode.Uri.file('/test/document.docx');

    // Mock file stat to throw an unexpected error
    vscode.workspace.fs.stat = async (uri: vscode.Uri) => {
      throw new Error('Unexpected error');
    };

    let errorMessage = '';
    vscode.window.showErrorMessage = async (message: string) => {
      errorMessage = message;
      return undefined;
    };

    await ConvertSelectedToMarkdownCommand.execute(testUri);

    assert.ok(errorMessage.includes('Failed to execute'), 'Should show execution failed error');
    assert.ok(errorMessage.includes('Unexpected error'), 'Should include the original error message');
  });

  test('should determine files to process correctly from active editor', async () => {
    // Mock active editor with a file
    const mockDocument = {
      uri: vscode.Uri.file('/test/active_document.docx')
    };
    
    const mockEditor = {
      document: mockDocument
    };

    const originalActiveTextEditor = vscode.window.activeTextEditor;
    (vscode.window as any).activeTextEditor = mockEditor;

    // Mock file stat
    vscode.workspace.fs.stat = async (uri: vscode.Uri) => {
      return { type: vscode.FileType.File, ctime: 0, mtime: 0, size: 1000 } as vscode.FileStat;
    };

    // Mock showQuickPick for configuration selection
    (vscode.window.showQuickPick as any) = async () => [
      { label: 'Document Title', picked: true }
    ];

    let progressTitle = '';
    (vscode.window.withProgress as any) = async (options: any, task: any) => {
      progressTitle = options.title;
      return {
        totalFiles: 1,
        successfulConversions: 0,
        failedConversions: 1,
        skippedFiles: 0,
        results: [],
        duration: 100
      };
    };

    vscode.window.showErrorMessage = async () => undefined;

    try {
      // Call without URI parameters to test active editor fallback
      await ConvertSelectedToMarkdownCommand.execute();
      
      assert.ok(progressTitle.includes('Converting'), 'Should process active editor file');
    } finally {
      (vscode.window as any).activeTextEditor = originalActiveTextEditor;
    }
  });
});
