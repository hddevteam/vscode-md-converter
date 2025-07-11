import * as vscode from 'vscode';
import * as path from 'path';
import { I18n } from '../i18n';
import { PdfToImageConverter } from '../converters/pdfToImage.js';
import { InstallationGuidePanel } from '../ui/installationGuide.js';

/**
 * Convert a single PDF file to images
 */
export async function convertPdfToImage(uri?: vscode.Uri): Promise<void> {
  try {
    // Determine the PDF file to convert
    let pdfPath: string;
    
    if (uri && uri.fsPath) {
      pdfPath = uri.fsPath;
    } else {
      // If no URI provided, ask user to select a file
      const fileUri = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectMany: false,
        filters: {
          'PDF Documents': ['pdf']
        },
        title: I18n.t('commands.convertPdfToImage')
      });
      
      if (!fileUri || fileUri.length === 0) {
        return; // User cancelled
      }
      
      pdfPath = fileUri[0].fsPath;
    }
    
    // Validate file extension
    if (!pdfPath.toLowerCase().endsWith('.pdf')) {
      vscode.window.showErrorMessage(I18n.t('error.unsupportedFormat', path.extname(pdfPath)));
      return;
    }
    
    // Initialize converter
    const converter = new PdfToImageConverter();
    const isToolAvailable = await converter.initialize();
    
    if (!isToolAvailable) {
      // Show installation guide
      const toolAvailability = converter.getToolAvailability();
      if (toolAvailability) {
        const action = await vscode.window.showWarningMessage(
          I18n.t('pdfToImage.toolNotFound'),
          I18n.t('pdfToImage.installNow'),
          I18n.t('pdfToImage.cancel')
        );
        
        if (action === I18n.t('pdfToImage.installNow')) {
          InstallationGuidePanel.createOrShow(toolAvailability.installationGuide);
        }
      }
      return;
    }
    
    // Setup conversion options
    const outputDir = PdfToImageConverter.generateOutputDirectory(pdfPath);
    const filePrefix = PdfToImageConverter.generateFilePrefix(pdfPath);
    
    const options = {
      inputPath: pdfPath,
      outputDir,
      filePrefix
    };
    
    // Show progress and perform conversion
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: I18n.t('pdfToImage.conversionStarted'),
        cancellable: false
      },
      async (progress, token) => {
        // Report initial progress
        progress.report({ increment: 0, message: I18n.t('pdfToImage.toolDetection') });
        
        // Perform conversion
        const result = await converter.convert(options, (current, total, message) => {
          const percentage = total > 0 ? (current / total) * 100 : current;
          progress.report({ 
            increment: percentage, 
            message: message 
          });
        });
        
        if (result.success) {
          // Show success message
          const message = I18n.t('pdfToImage.conversionComplete');
          const locationMessage = I18n.t('pdfToImage.outputLocation', result.outputDirectory);
          const imagesSavedMessage = I18n.t('pdfToImage.imagesSaved', result.totalPages);
          
          const action = await vscode.window.showInformationMessage(
            `${message}\n${imagesSavedMessage}\n${locationMessage}`,
            I18n.t('success.openFile'),
            I18n.t('success.viewDetails')
          );
          
          if (action === I18n.t('success.openFile')) {
            // Open the output directory
            const outputUri = vscode.Uri.file(result.outputDirectory);
            await vscode.commands.executeCommand('revealFileInOS', outputUri);
          } else if (action === I18n.t('success.viewDetails')) {
            // Show detailed results in output channel
            showConversionDetails(result);
          }
        } else {
          // Show error message
          vscode.window.showErrorMessage(
            I18n.t('pdfToImage.conversionFailed', result.errorMessage || I18n.t('error.unknownError'))
          );
        }
      }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(I18n.t('error.conversionFailed', errorMessage));
  }
}

/**
 * Batch convert multiple PDF files to images
 */
export async function batchConvertPdfToImage(uri?: vscode.Uri): Promise<void> {
  try {
    // Determine the folder to process
    let folderPath: string;
    
    if (uri && uri.fsPath) {
      const stat = await vscode.workspace.fs.stat(uri);
      if (stat.type === vscode.FileType.Directory) {
        folderPath = uri.fsPath;
      } else {
        folderPath = path.dirname(uri.fsPath);
      }
    } else {
      // Ask user to select a folder
      const folderUri = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: I18n.t('batch.selectFolder')
      });
      
      if (!folderUri || folderUri.length === 0) {
        return; // User cancelled
      }
      
      folderPath = folderUri[0].fsPath;
    }
    
    // Find PDF files in the folder
    const pdfFiles = await findPdfFiles(folderPath);
    
    if (pdfFiles.length === 0) {
      vscode.window.showInformationMessage(
        I18n.t('batch.noFilesFound', folderPath)
      );
      return;
    }
    
    // Confirm batch conversion
    const proceed = await vscode.window.showInformationMessage(
      I18n.t('batch.foundFiles', pdfFiles.length, folderPath),
      I18n.t('batch.continue'),
      I18n.t('batch.cancel')
    );
    
    if (proceed !== I18n.t('batch.continue')) {
      return;
    }
    
    // Initialize converter
    const converter = new PdfToImageConverter();
    const isToolAvailable = await converter.initialize();
    
    if (!isToolAvailable) {
      const toolAvailability = converter.getToolAvailability();
      if (toolAvailability) {
        const action = await vscode.window.showWarningMessage(
          I18n.t('pdfToImage.toolNotFound'),
          I18n.t('pdfToImage.installNow'),
          I18n.t('pdfToImage.cancel')
        );
        
        if (action === I18n.t('pdfToImage.installNow')) {
          InstallationGuidePanel.createOrShow(toolAvailability.installationGuide);
        }
      }
      return;
    }
    
    // Process files with progress
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: I18n.t('progress.batchConverting', ''),
        cancellable: true
      },
      async (progress, token) => {
        const results: Array<{ file: string; success: boolean; error?: string }> = [];
        
        for (let i = 0; i < pdfFiles.length; i++) {
          if (token.isCancellationRequested) {
            break;
          }
          
          const pdfFile = pdfFiles[i];
          const fileName = path.basename(pdfFile);
          
          progress.report({
            message: I18n.t('pdfToImage.batchProgress', i + 1, pdfFiles.length, fileName),
            increment: (i / pdfFiles.length) * 100
          });
          
          try {
            const outputDir = PdfToImageConverter.generateOutputDirectory(pdfFile);
            const filePrefix = PdfToImageConverter.generateFilePrefix(pdfFile);
            
            const options = {
              inputPath: pdfFile,
              outputDir,
              filePrefix
            };
            
            const result = await converter.convert(options);
            
            results.push({
              file: fileName,
              success: result.success,
              error: result.errorMessage
            });
            
          } catch (error) {
            results.push({
              file: fileName,
              success: false,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
        
        // Show batch results
        showBatchResults(results);
      }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(I18n.t('error.batchConversionFailed') + ': ' + errorMessage);
  }
}

/**
 * Find PDF files in a directory
 */
async function findPdfFiles(folderPath: string): Promise<string[]> {
  try {
    const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(folderPath));
    const pdfFiles: string[] = [];
    
    for (const [fileName, fileType] of files) {
      if (fileType === vscode.FileType.File && fileName.toLowerCase().endsWith('.pdf')) {
        pdfFiles.push(path.join(folderPath, fileName));
      }
    }
    
    return pdfFiles.sort();
  } catch (error) {
    return [];
  }
}

/**
 * Show detailed conversion results
 */
function showConversionDetails(result: any): void {
  const outputChannel = vscode.window.createOutputChannel('PDF to Image Converter');
  outputChannel.show();
  
  outputChannel.appendLine('='.repeat(50));
  outputChannel.appendLine('PDF to Image Conversion Results');
  outputChannel.appendLine('='.repeat(50));
  outputChannel.appendLine(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  outputChannel.appendLine(`Total Pages: ${result.totalPages}`);
  outputChannel.appendLine(`Output Directory: ${result.outputDirectory}`);
  
  if (result.outputFiles && result.outputFiles.length > 0) {
    outputChannel.appendLine('\\nGenerated Files:');
    result.outputFiles.forEach((file: string, index: number) => {
      outputChannel.appendLine(`  ${index + 1}. ${path.basename(file)}`);
    });
  }
  
  if (result.errorMessage) {
    outputChannel.appendLine(`\\nError: ${result.errorMessage}`);
  }
  
  outputChannel.appendLine('='.repeat(50));
}

/**
 * Show batch conversion results
 */
function showBatchResults(results: Array<{ file: string; success: boolean; error?: string }>): void {
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  const message = I18n.t('success.allComplete', successful) + 
    (failed > 0 ? `, ${failed} failed` : '');
  
  vscode.window.showInformationMessage(message, I18n.t('success.viewDetails'))
    .then(action => {
      if (action === I18n.t('success.viewDetails')) {
        const outputChannel = vscode.window.createOutputChannel('PDF to Image Batch Results');
        outputChannel.show();
        
        outputChannel.appendLine('='.repeat(50));
        outputChannel.appendLine('Batch PDF to Image Conversion Results');
        outputChannel.appendLine('='.repeat(50));
        outputChannel.appendLine(`Total Files: ${results.length}`);
        outputChannel.appendLine(`Successful: ${successful}`);
        outputChannel.appendLine(`Failed: ${failed}`);
        
        if (successful > 0) {
          outputChannel.appendLine('\\nSuccessful Conversions:');
          results.filter(r => r.success).forEach((result, index) => {
            outputChannel.appendLine(`  ${index + 1}. ${result.file} → ${result.file.replace('.pdf', '_Images/')}`);
          });
        }
        
        if (failed > 0) {
          outputChannel.appendLine('\\nFailed Conversions:');
          results.filter(r => !r.success).forEach((result, index) => {
            outputChannel.appendLine(`  ${index + 1}. ${result.file} - ${result.error}`);
          });
        }
        
        outputChannel.appendLine('='.repeat(50));
      }
    });
}
