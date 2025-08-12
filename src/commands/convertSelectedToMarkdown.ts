import * as vscode from 'vscode';
import * as path from 'path';
import { I18n } from '../i18n';
import { FileUtils } from '../utils/fileUtils';
import { MarkdownInfoSelector } from '../ui/markdownInfoSelector';
import { WordToMarkdownConverter } from '../converters/wordToMarkdown';
import { ExcelToMarkdownConverter } from '../converters/excelToMarkdown';
import { PowerPointToMarkdownConverter } from '../converters/powerpointToMarkdown';
import { ConversionResult, MarkdownInfoConfig } from '../types';

/**
 * Interface for batch conversion results
 */
interface BatchConversionResult {
  totalFiles: number;
  successfulConversions: number;
  failedConversions: number;
  skippedFiles: number;
  results: ConversionResult[];
  duration: number;
}

/**
 * Interface for file processing info
 */
interface FileProcessingInfo {
  filePath: string;
  fileType: string;
  isSupported: boolean;
  reason?: string;
}

/**
 * Command handler for converting selected files to Markdown
 */
export class ConvertSelectedToMarkdownCommand {
  /**
   * Injectable wrappers for VS Code APIs to enable safe testing without
   * assigning to readonly VS Code properties.
   */
  static fsStat: (uri: vscode.Uri) => Thenable<vscode.FileStat> = (uri: vscode.Uri) => vscode.workspace.fs.stat(uri);
  static getActiveEditor: () => vscode.TextEditor | undefined = () => vscode.window.activeTextEditor;

  /**
   * Execute the convert selected to Markdown command
   * Handles both single file and multi-file selection
   */
  static async execute(uri?: vscode.Uri, uris?: vscode.Uri[]): Promise<void> {
    const startTime = Date.now();

    try {
      // Determine which files to process
      const filesToProcess = this.determineFilesToProcess(uri, uris);
      
      if (filesToProcess.length === 0) {
        vscode.window.showWarningMessage(I18n.t('batch.multiSelect.noFilesSelected'));
        return;
      }

      // Analyze files and filter supported types
      const fileAnalysis = await this.analyzeFiles(filesToProcess);
      const supportedFiles = fileAnalysis.filter(f => f.isSupported);
      
      if (supportedFiles.length === 0) {
        vscode.window.showWarningMessage(
          I18n.t('batch.multiSelect.noSupportedFiles', 
            fileAnalysis.map(f => path.basename(f.filePath)).join(', ')
          )
        );
        return;
      }

      // Show skipped files warning if any
      const skippedFiles = fileAnalysis.filter(f => !f.isSupported);
      if (skippedFiles.length > 0) {
        const skippedNames = skippedFiles.map(f => path.basename(f.filePath));
        vscode.window.showWarningMessage(
          I18n.t('batch.multiSelect.someFilesSkipped', 
            skippedNames.join(', ')
          )
        );
      }

      // Get Markdown info configuration
      const markdownConfig = await this.getMarkdownConfiguration(supportedFiles.length > 1);
      if (!markdownConfig) {
        // User cancelled the selection
        return;
      }

      // Show progress and perform batch conversion
      const result = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: I18n.t('batch.multiSelect.converting'),
        cancellable: true
      }, async (progress, token) => {
        return this.performBatchConversion(supportedFiles, markdownConfig, progress, token);
      });

      // Show results
      await this.showConversionResults(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : I18n.t('error.unknownError');
      vscode.window.showErrorMessage(
        I18n.t('batch.multiSelect.executionFailed', errorMessage)
      );
    }
  }

  /**
   * Determine which files to process based on command parameters
   */
  private static determineFilesToProcess(uri?: vscode.Uri, uris?: vscode.Uri[]): vscode.Uri[] {
    // Multi-select case: uris array provided
    if (uris && uris.length > 0) {
      return uris;
    }

    // Single file case: uri provided
    if (uri) {
      return [uri];
    }

    // Fallback: check active editor
  const activeEditor = this.getActiveEditor();
    if (activeEditor && activeEditor.document.uri.scheme === 'file') {
      return [activeEditor.document.uri];
    }

    return [];
  }

  /**
   * Analyze files to determine which are supported for Markdown conversion
   */
  private static async analyzeFiles(files: vscode.Uri[]): Promise<FileProcessingInfo[]> {
    const analysis: FileProcessingInfo[] = [];

    for (const file of files) {
      const filePath = file.fsPath;
      const extension = path.extname(filePath).toLowerCase();

      // Check if file exists and is not a directory
      try {
        const stats = await this.fsStat(file);
        if (stats.type === vscode.FileType.Directory) {
          analysis.push({
            filePath,
            fileType: 'directory',
            isSupported: false,
            reason: I18n.t('batch.multiSelect.isDirectory')
          });
          continue;
        }
      } catch (error) {
        analysis.push({
          filePath,
          fileType: 'unknown',
          isSupported: false,
          reason: I18n.t('batch.multiSelect.fileNotFound')
        });
        continue;
      }

      // Determine file type and support
      let fileType: string;
      let isSupported: boolean;
      let reason: string | undefined;

      switch (extension) {
        case '.docx':
        case '.doc':
          fileType = 'word';
          isSupported = true;
          break;
        case '.xlsx':
        case '.xls':
        case '.csv':
          fileType = 'excel';
          isSupported = true;
          break;
        case '.pptx':
        case '.ppt':
          fileType = 'powerpoint';
          isSupported = true;
          break;
        case '.pdf':
          fileType = 'pdf';
          isSupported = false;
          reason = I18n.t('batch.multiSelect.pdfNotSupported');
          break;
        default:
          fileType = 'unknown';
          isSupported = false;
          reason = I18n.t('batch.multiSelect.unsupportedFormat', extension);
          break;
      }

      analysis.push({
        filePath,
        fileType,
        isSupported,
        reason
      });
    }

    return analysis;
  }

  /**
   * Get Markdown configuration from user or saved preferences
   */
  private static async getMarkdownConfiguration(isBatchMode: boolean): Promise<MarkdownInfoConfig | null> {
    const config = FileUtils.getConfig();
    const rememberChoice = config.rememberMarkdownInfoSelection;
    
    // Only use saved preferences if user has explicitly enabled "remember choice"
    // and has actual saved field selections (not empty defaults)
    if (rememberChoice && FileUtils.hasUserDefinedMarkdownInfoFields()) {
      return FileUtils.getMarkdownInfoConfig();
    }

    // Show selection UI for new users or when remember choice is disabled
    // or when no fields have been selected yet
    try {
      const selectedConfig = await MarkdownInfoSelector.showSelector();
      return selectedConfig || null;
    } catch (error) {
      // User cancelled or error occurred
      return null;
    }
  }

  /**
   * Perform batch conversion with progress reporting
   */
  private static async performBatchConversion(
    files: FileProcessingInfo[],
    markdownConfig: MarkdownInfoConfig,
    progress: vscode.Progress<{ message?: string; increment?: number }>,
    token: vscode.CancellationToken
  ): Promise<BatchConversionResult> {
    const results: ConversionResult[] = [];
    const totalFiles = files.length;
    let successfulConversions = 0;
    let failedConversions = 0;
    const incrementPerFile = 100 / totalFiles;

    progress.report({ message: I18n.t('batch.multiSelect.starting'), increment: 0 });

    for (let i = 0; i < files.length; i++) {
      if (token.isCancellationRequested) {
        break;
      }

      const file = files[i];
      const fileName = path.basename(file.filePath);
      
      progress.report({ 
        message: I18n.t('batch.multiSelect.processingFile', fileName),
        increment: i === 0 ? 0 : incrementPerFile
      });

      try {
        const result = await this.convertSingleFile(file, markdownConfig);
        results.push(result);
        
        if (result.success) {
          successfulConversions++;
        } else {
          failedConversions++;
        }
      } catch (error) {
        failedConversions++;
        results.push({
          success: false,
          inputPath: file.filePath,
          error: error instanceof Error ? error.message : I18n.t('error.unknownError')
        });
      }

      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Final progress update
    progress.report({ increment: incrementPerFile });

    return {
      totalFiles,
      successfulConversions,
      failedConversions,
      skippedFiles: 0, // Already filtered out
      results,
      duration: Date.now() - Date.now() // Will be set by caller
    };
  }

  /**
   * Convert a single file to Markdown
   */
  private static async convertSingleFile(
    file: FileProcessingInfo,
    markdownConfig: MarkdownInfoConfig
  ): Promise<ConversionResult> {
    const options = {
      markdownInfo: markdownConfig
    };

    switch (file.fileType) {
      case 'word':
        return WordToMarkdownConverter.convert(file.filePath, options);
      
      case 'excel':
        return ExcelToMarkdownConverter.convert(file.filePath, options);
      
      case 'powerpoint':
        return PowerPointToMarkdownConverter.convert(file.filePath, options);
      
      default:
        return {
          success: false,
          inputPath: file.filePath,
          error: I18n.t('batch.multiSelect.unsupportedFileType', file.fileType)
        };
    }
  }

  /**
   * Show conversion results to the user
   */
  private static async showConversionResults(result: BatchConversionResult): Promise<void> {
    const { totalFiles, successfulConversions, failedConversions } = result;

    if (successfulConversions === totalFiles) {
      // All successful
      if (totalFiles === 1) {
        const successResult = result.results.find(r => r.success);
        if (successResult && successResult.outputPath) {
          const openFile = I18n.t('batch.multiSelect.openFile');
          const choice = await vscode.window.showInformationMessage(
            I18n.t('batch.multiSelect.singleFileSuccess', 
              path.basename(successResult.outputPath)
            ),
            openFile
          );
          
          if (choice === openFile) {
            const doc = await vscode.workspace.openTextDocument(successResult.outputPath);
            await vscode.window.showTextDocument(doc);
          }
        }
      } else {
        vscode.window.showInformationMessage(
          I18n.t('batch.multiSelect.batchSuccess', 
            successfulConversions, totalFiles
          )
        );
      }
    } else if (successfulConversions > 0) {
      // Partial success
      const showDetails = I18n.t('batch.multiSelect.showDetails');
      const choice = await vscode.window.showWarningMessage(
        I18n.t('batch.multiSelect.partialSuccess', 
          successfulConversions, totalFiles, failedConversions
        ),
        showDetails
      );

      if (choice === showDetails) {
        this.showDetailedResults(result);
      }
    } else {
      // All failed
      const showDetails = I18n.t('batch.multiSelect.showDetails');
      const choice = await vscode.window.showErrorMessage(
        I18n.t('batch.multiSelect.allFailed', totalFiles),
        showDetails
      );

      if (choice === showDetails) {
        this.showDetailedResults(result);
      }
    }
  }

  /**
   * Show detailed results in output channel or quick pick
   */
  private static showDetailedResults(result: BatchConversionResult): void {
    const outputChannel = vscode.window.createOutputChannel(
      I18n.t('batch.multiSelect.resultsTitle')
    );
    
    outputChannel.appendLine(I18n.t('batch.multiSelect.resultsHeader'));
    outputChannel.appendLine(`${'='.repeat(50)}`);
    outputChannel.appendLine(
      I18n.t('batch.multiSelect.resultsSummary', 
        result.totalFiles, result.successfulConversions, result.failedConversions
      )
    );
    outputChannel.appendLine('');

    result.results.forEach((res, index) => {
      const fileName = path.basename(res.inputPath);
      if (res.success) {
        outputChannel.appendLine(`✅ ${fileName}: ${I18n.t('batch.multiSelect.success')}`);
        if (res.outputPath) {
          outputChannel.appendLine(`   → ${res.outputPath}`);
        }
      } else {
        outputChannel.appendLine(`❌ ${fileName}: ${I18n.t('batch.multiSelect.failed')}`);
        if (res.error) {
          outputChannel.appendLine(`   ${res.error}`);
        }
      }
      outputChannel.appendLine('');
    });

    outputChannel.show();
  }
}
