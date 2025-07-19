import * as vscode from 'vscode';
import * as path from 'path';
import { PdfPageRangeImageConverter, PageRangeImageResult } from '../converters/pdfPageRangeImageConverter';
import { I18n } from '../i18n';

/**
 * Convert specific pages from PDF to images
 */
export async function convertPdfPagesToImages(uri?: vscode.Uri): Promise<void> {
  try {
    let inputPath: string;
    
    if (uri) {
      inputPath = uri.fsPath;
    } else {
      // Show file picker
      const fileUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: I18n.t('commands.convertPdfToImage'),
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

    // Initialize converter and check tool availability
    const converter = new PdfPageRangeImageConverter();
    const isToolAvailable = await converter.initialize();
    
    if (!isToolAvailable) {
      const toolInfo = converter.getToolAvailability();
      vscode.window.showErrorMessage(
        I18n.t('pdfToImage.toolNotFound'),
        I18n.t('pdfToImage.installNow')
      ).then(selection => {
        if (selection === I18n.t('pdfToImage.installNow')) {
          // Show installation guide
          showInstallationGuide();
        }
      });
      return;
    }

    // Convert without progress dialog
    const result: PageRangeImageResult = await converter.convertPagesWithRange(inputPath);

    if (result.success) {
      const pageRangeStr = result.pageNumbers.join(', ');
      const message = I18n.t('pageRange.conversionComplete', pageRangeStr);
      
      const outputInfo = I18n.t('success.imagesInFolder', 
        result.outputFiles.length.toString(), 
        path.basename(result.outputDirectory));

      const action = await vscode.window.showInformationMessage(
        `${message}: ${outputInfo}`,
        I18n.t('success.openFile'),
        I18n.t('success.viewDetails')
      );

      if (action === I18n.t('success.openFile')) {
        // Open output directory
        const dirUri = vscode.Uri.file(result.outputDirectory);
        await vscode.commands.executeCommand('revealFileInOS', dirUri);
      } else if (action === I18n.t('success.viewDetails')) {
        // Show detailed results
        await showConversionDetails(result);
      }

    } else {
      vscode.window.showErrorMessage(I18n.t('error.conversionFailed', result.errorMessage || I18n.t('error.unknownError')));
    }

  } catch (error) {
    console.error('PDF pages to images conversion error:', error);
    vscode.window.showErrorMessage(
      I18n.t('error.conversionFailed', error instanceof Error ? error.message : I18n.t('error.unknownError'))
    );
  }
}

/**
 * Show installation guide for poppler-utils
 */
function showInstallationGuide(): void {
  const panel = vscode.window.createWebviewPanel(
    'popplerInstallation',
    I18n.t('pdfToImage.installationGuide'),
    vscode.ViewColumn.One,
    { enableScripts: false }
  );

  const platform = process.platform;
  let instructions = '';

  switch (platform) {
    case 'darwin': // macOS
      instructions = `
        <h2>${I18n.t('pdfToImage.macOSInstructions')}</h2>
        <pre><code>${I18n.t('pdfToImage.macOSCommand')}</code></pre>
      `;
      break;
    case 'win32': // Windows
      instructions = `
        <h2>${I18n.t('pdfToImage.windowsInstructions')}</h2>
        <p>${I18n.t('pdfToImage.windowsDownload')}</p>
      `;
      break;
    default: // Linux
      instructions = `
        <h2>${I18n.t('pdfToImage.linuxInstructions')}</h2>
        <pre><code>${I18n.t('pdfToImage.linuxCommand')}</code></pre>
      `;
      break;
  }

  panel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${I18n.t('pdfToImage.installationGuide')}</title>
      <style>
        body { font-family: var(--vscode-editor-font-family); padding: 20px; line-height: 1.6; }
        h1, h2 { color: var(--vscode-editor-foreground); }
        pre { background: var(--vscode-editor-background); padding: 10px; border-radius: 4px; }
        code { font-family: var(--vscode-editor-font-family); }
      </style>
    </head>
    <body>
      <h1>${I18n.t('pdfToImage.installationGuide')}</h1>
      <p>${I18n.t('pdfToImage.toolNotFound')}</p>
      
      ${instructions}
      
      <h2>${I18n.t('pdfToImage.verifyInstallation')}</h2>
      <p>${I18n.t('pdfToImage.verifyInstallation')}</p>
    </body>
    </html>
  `;
}

/**
 * Show detailed conversion results
 */
async function showConversionDetails(result: PageRangeImageResult): Promise<void> {
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
  content += `- Output Mode: ${result.outputMode}\n`;
  content += `- Output Directory: ${result.outputDirectory}\n\n`;

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
