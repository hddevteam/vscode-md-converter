import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { FileUtils } from '../utils/fileUtils';
import { UIUtils } from '../ui/uiUtils';
import { WordToMarkdownConverter } from '../converters/wordToMarkdown';
import { ExcelToMarkdownConverter } from '../converters/excelToMarkdown';
import { PdfToTextConverter } from '../converters/pdfToText';
import { PowerPointToMarkdownConverter } from '../converters/powerpointToMarkdown';
import { ConversionResult, BatchConversionResult } from '../types';
import { I18n } from '../i18n';

interface BatchConversionOptions {
  outputDirectory?: string;
  includeSubfolders?: boolean;
  fileTypes?: string[];
}

/**
 * Handle batch conversion command
 */
export async function batchConvert(uri?: vscode.Uri) {
  try {
    // If no URI provided, prompt user to select folder
    if (!uri) {
      const folderUris = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: I18n.t('batch.selectFolder')
      });

      if (!folderUris || folderUris.length === 0) {
        return; // User cancelled selection
      }

      uri = folderUris[0];
    }

    // Verify it's a folder
    const folderPath = uri.fsPath;
    const stat = await fs.stat(folderPath);
    if (!stat.isDirectory()) {
      vscode.window.showErrorMessage(I18n.t('error.notAFolder', folderPath));
      return;
    }

    // Quick scan to check if there are any convertible files
    const availableFiles = await collectFiles(folderPath, ['.docx', '.doc', '.xlsx', '.xls', '.csv', '.pdf', '.pptx', '.ppt'], true);
    if (availableFiles.length === 0) {
      vscode.window.showInformationMessage(I18n.t('batch.noConvertibleFiles', path.basename(folderPath)));
      return;
    }

    // Show preview of files to be converted
    const folderName = path.basename(folderPath);
    const previewMessage = I18n.t('batch.foundFiles', availableFiles.length, folderName);
    const continueOption = I18n.t('batch.continue');
    const cancelOption = I18n.t('batch.cancel');
    
    const userChoice = await vscode.window.showInformationMessage(
      previewMessage,
      { modal: true },
      continueOption,
      cancelOption
    );

    if (userChoice !== continueOption) {
      return; // User cancelled
    }

    // Configure batch conversion options
    const options = await getBatchConversionOptions(folderPath);
    if (!options) {
      return; // User cancelled configuration
    }

    // Show progress indicator
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: I18n.t('progress.batchConverting', folderName),
        cancellable: true
      },
      async (progress, token) => {
        // Get list of files to convert based on user selection
        const files = await collectFiles(folderPath, options.fileTypes, options.includeSubfolders);
        if (files.length === 0) {
          vscode.window.showInformationMessage(I18n.t('batch.noFilesFound', folderPath));
          return;
        }

        // Create output directory (if it doesn't exist)
        const outputDir = options.outputDirectory || folderPath;
        await fs.mkdir(outputDir, { recursive: true });

        // Convert files
        const results = [];
        let processedCount = 0;
        const startTime = Date.now();

        for (const file of files) {
          if (token.isCancellationRequested) {
            break;
          }

          const fileName = path.basename(file);
          const fileExt = path.extname(file).toLowerCase();
          
          // Update progress
          const progressIncrement = 100 / files.length;
          progress.report({ 
            increment: progressIncrement, 
            message: I18n.t('progress.processingFile', processedCount + 1, files.length, fileName)
          });

          try {
            let result: ConversionResult;
            const fileStartTime = Date.now();
            
            // Calculate relative file path to preserve directory structure
            let targetOutputDir = outputDir;
            if (options.includeSubfolders && options.outputDirectory) {
              // Get relative path from source folder
              const relativePath = path.relative(folderPath, path.dirname(file));
              if (relativePath) {
                // Create nested output directory to preserve structure
                targetOutputDir = path.join(outputDir, relativePath);
                await fs.mkdir(targetOutputDir, { recursive: true });
              }
            }
            
            // Select converter based on file type
            switch (fileExt) {
              case '.docx':
              case '.doc':
                result = await WordToMarkdownConverter.convert(file, { outputDirectory: targetOutputDir });
                break;
              case '.xlsx':
              case '.xls':
              case '.csv':
                result = await ExcelToMarkdownConverter.convert(file, { outputDirectory: targetOutputDir });
                break;
              case '.pdf':
                result = await PdfToTextConverter.convert(file, { outputDirectory: targetOutputDir });
                break;
              case '.pptx':
              case '.ppt':
                result = await PowerPointToMarkdownConverter.convert(file, { outputDirectory: targetOutputDir });
                break;
              default:
                result = {
                  success: false,
                  inputPath: file,
                  error: I18n.t('error.unsupportedFormat', fileExt)
                };
            }

            // Add timing information
            result.duration = Date.now() - fileStartTime;
            results.push(result);
          } catch (error) {
            results.push({
              success: false,
              inputPath: file,
              error: error instanceof Error ? error.message : I18n.t('error.unknownError'),
              duration: Date.now() - Date.now()
            });
          }

          processedCount++;
        }

        // Calculate statistics
        const totalFiles = files.length;
        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;
        const skippedCount = totalFiles - processedCount;
        const totalDuration = Date.now() - startTime;

        // Show batch conversion result
        UIUtils.showBatchConversionResult({
          totalFiles,
          successCount,
          failedCount,
          skippedCount,
          results,
          totalDuration
        });
      }
    );
  } catch (error) {
    UIUtils.showError(
      I18n.t('error.batchConversionFailed'), 
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Collect files that match the criteria
 */
async function collectFiles(
  folderPath: string,
  fileTypes: string[] = ['.docx', '.doc', '.xlsx', '.xls', '.csv', '.pdf', '.pptx', '.ppt'],
  includeSubfolders: boolean = false
): Promise<string[]> {
  const result: string[] = [];

  // Read directory contents
  const entries = await fs.readdir(folderPath, { withFileTypes: true });

  // Process each entry
  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);

    if (entry.isFile()) {
      // Check file type
      const ext = path.extname(entry.name).toLowerCase();
      if (fileTypes.includes(ext)) {
        result.push(entryPath);
      }
    } else if (entry.isDirectory() && includeSubfolders) {
      // If it's a directory and include subfolders, recursively collect
      const subFiles = await collectFiles(entryPath, fileTypes, includeSubfolders);
      result.push(...subFiles);
    }
  }

  return result;
}

/**
 * Get batch conversion options
 */
async function getBatchConversionOptions(defaultDir: string): Promise<BatchConversionOptions | undefined> {
  const options: BatchConversionOptions = {
    includeSubfolders: false,
    fileTypes: ['.docx', '.doc', '.xlsx', '.xls', '.csv', '.pdf']
  };

  // File type options
  const fileTypeOptions = [
    { label: I18n.t('fileTypes.wordDocuments'), picked: true, types: ['.docx', '.doc'] },
    { label: I18n.t('fileTypes.excelFiles'), picked: true, types: ['.xlsx', '.xls'] },
    { label: I18n.t('fileTypes.csvFiles'), picked: true, types: ['.csv'] },
    { label: I18n.t('fileTypes.pdfDocuments'), picked: true, types: ['.pdf'] }
  ];

  // Select file types
  const selectedFileTypes = await vscode.window.showQuickPick(
    fileTypeOptions,
    {
      canPickMany: true,
      title: I18n.t('batch.selectFileTypes'),
      placeHolder: I18n.t('batch.selectFileTypes')
    }
  );

  if (!selectedFileTypes) {
    return undefined; // User cancelled selection
  }

  if (selectedFileTypes.length > 0) {
    options.fileTypes = selectedFileTypes.flatMap(option => option.types);
  }

  // Ask whether to include subfolders
  const includeSubfoldersOption = await vscode.window.showQuickPick(
    [I18n.t('batch.yes'), I18n.t('batch.no')],
    {
      canPickMany: false,
      title: I18n.t('batch.includeSubfolders'),
      placeHolder: I18n.t('batch.includeSubfoldersPrompt')
    }
  );

  if (!includeSubfoldersOption) {
    return undefined; // User cancelled selection
  }

  options.includeSubfolders = includeSubfoldersOption === I18n.t('batch.yes');

  // Ask for output directory
  const outputDirOptions = [
    { label: I18n.t('batch.outputDirSourceLocation'), description: I18n.t('batch.outputDirSourceDescription') },
    { label: I18n.t('batch.outputDirCustom'), description: I18n.t('batch.outputDirCustomDescription') }
  ];

  const outputDirOption = await vscode.window.showQuickPick(
    outputDirOptions,
    {
      canPickMany: false,
      title: I18n.t('batch.selectOutputDir'),
      placeHolder: I18n.t('batch.selectOutputDir')
    }
  );

  if (!outputDirOption) {
    return undefined; // User cancelled selection
  }

  // If specify output directory is selected, prompt user to select
  if (outputDirOption.label === I18n.t('batch.outputDirCustom')) {
    options.outputDirectory = await UIUtils.promptForOutputDirectory(defaultDir);
    if (!options.outputDirectory) {
      return undefined; // User cancelled selection
    }
  }

  return options;
}
