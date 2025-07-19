import * as vscode from 'vscode';
import * as path from 'path';
import { PdfPageRangeConverter, PageRangeConversionResult } from '../converters/pdfPageRangeConverter';
import { I18n } from '../i18n';

/**
 * Convert specific pages from PDF to text
 */
export async function convertPdfPagesToText(uri?: vscode.Uri): Promise<void> {
  try {
    let inputPath: string;
    
    if (uri) {
      inputPath = uri.fsPath;
    } else {
      // Show file picker
      const fileUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: I18n.t('commands.convertPdfToText'),
        filters: {
          'PDF Documents': ['pdf']
        }
      });
      
      if (!fileUri || fileUri.length === 0) {
        return; // User cancelled
      }
      
      inputPath = fileUri[0].fsPath;
    }

    // Validate file extension
    const ext = path.extname(inputPath).toLowerCase();
    if (ext !== '.pdf') {
      vscode.window.showErrorMessage(I18n.t('error.unsupportedFormat', ext));
      return;
    }

    // Convert without progress dialog
    const result: PageRangeConversionResult = await PdfPageRangeConverter.convertWithPageRange(inputPath);

    if (result.success) {
      const pageRangeStr = result.pageNumbers?.join(', ') || '';
      const message = I18n.t('pageRange.conversionComplete', pageRangeStr);
      
      let outputInfo: string;
      if (result.outputMode === 'merge' && result.outputPath) {
        outputInfo = path.basename(result.outputPath);
      } else if (result.outputPaths && result.outputPaths.length > 0) {
        outputInfo = I18n.t('success.filesCount', result.outputPaths.length.toString());
      } else {
        outputInfo = 'unknown';
      }

      const action = await vscode.window.showInformationMessage(
        `${message}: ${outputInfo}`,
        I18n.t('success.openFile'),
        I18n.t('success.viewDetails')
      );

      if (action === I18n.t('success.openFile')) {
        // Open the first output file
        const fileToOpen = result.outputPath || (result.outputPaths && result.outputPaths[0]);
        if (fileToOpen) {
          const doc = await vscode.workspace.openTextDocument(fileToOpen);
          await vscode.window.showTextDocument(doc);
        }
      } else if (action === I18n.t('success.viewDetails')) {
        // Show detailed results
        await showConversionDetails(result);
      }

    } else {
      vscode.window.showErrorMessage(I18n.t('error.conversionFailed', result.error || I18n.t('error.unknownError')));
    }

  } catch (error) {
    console.error('PDF pages to text conversion error:', error);
    vscode.window.showErrorMessage(
      I18n.t('error.conversionFailed', error instanceof Error ? error.message : I18n.t('error.unknownError'))
    );
  }
}

/**
 * Show detailed conversion results
 */
async function showConversionDetails(result: PageRangeConversionResult): Promise<void> {
  if (!result.pageResults || result.pageResults.length === 0) {
    return;
  }

  const successful = result.pageResults.filter(r => r.success);
  const failed = result.pageResults.filter(r => !r.success);

  let content = `# ${I18n.t('pageRange.conversionComplete', '')}\n\n`;
  content += `## Summary\n\n`;
  content += `- Total Pages: ${result.pageResults.length}\n`;
  content += `- Successful: ${successful.length}\n`;
  content += `- Failed: ${failed.length}\n`;
  content += `- Output Mode: ${result.outputMode}\n\n`;

  if (successful.length > 0) {
    content += `## Successful Conversions\n\n`;
    for (const pageResult of successful) {
      content += `- Page ${pageResult.pageNumber}: ${path.basename(pageResult.outputPath)}\n`;
    }
    content += '\n';
  }

  if (failed.length > 0) {
    content += `## Failed Conversions\n\n`;
    for (const pageResult of failed) {
      content += `- Page ${pageResult.pageNumber}: ${pageResult.error || 'Unknown error'}\n`;
    }
  }

  // Create and show a new document with the details
  const doc = await vscode.workspace.openTextDocument({
    content,
    language: 'markdown'
  });
  await vscode.window.showTextDocument(doc);
}
