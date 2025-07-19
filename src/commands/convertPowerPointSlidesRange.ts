import * as vscode from 'vscode';
import * as path from 'path';
import { PowerPointSlideRangeConverter, SlideRangeConversionResult } from '../converters/powerpointSlideRangeConverter';
import { I18n } from '../i18n';

/**
 * Convert specific slides from PowerPoint to Markdown
 */
export async function convertPowerPointSlidesToMarkdown(uri?: vscode.Uri): Promise<void> {
  try {
    let inputPath: string;
    
    if (uri) {
      inputPath = uri.fsPath;
    } else {
      // Show file picker
      const fileUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: I18n.t('commands.convertPowerPointToMarkdown'),
        filters: {
          'PowerPoint Documents': ['pptx', 'ppt']
        }
      });
      
      if (!fileUri || fileUri.length === 0) {
        return; // User cancelled
      }
      
      inputPath = fileUri[0].fsPath;
    }

    // Validate file extension
    const ext = path.extname(inputPath).toLowerCase();
    if (ext !== '.pptx' && ext !== '.ppt') {
      vscode.window.showErrorMessage(I18n.t('error.unsupportedFormat', ext));
      return;
    }

    // Handle .ppt format with guidance
    if (ext === '.ppt') {
      const action = await vscode.window.showWarningMessage(
        I18n.t('powerpoint.pptFormatNotice'),
        { detail: I18n.t('powerpoint.pptFormatNoticeDetail') },
        I18n.t('powerpoint.openInPowerPoint'),
        I18n.t('powerpoint.continueAnyway')
      );
      
      if (action === I18n.t('powerpoint.openInPowerPoint')) {
        // Try to open the file in PowerPoint
        await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(inputPath));
        return;
      } else if (!action || action !== I18n.t('powerpoint.continueAnyway')) {
        return; // User cancelled
      }
      // Continue with .ppt processing (limited support)
    }

    // Convert with slide range selection
    const result: SlideRangeConversionResult = await PowerPointSlideRangeConverter.convertWithSlideRange(inputPath);

    if (result.success) {
      const slideNumbers = result.slideNumbers?.join(', ') || '';
      const message = I18n.t('powerpoint.slidesConversionComplete', slideNumbers);
      
      let outputInfo: string;
      if (result.outputPath) {
        outputInfo = path.basename(result.outputPath);
      } else if (result.outputDirectory) {
        const successfulSlides = result.slideResults?.filter(r => r.success).length || 0;
        outputInfo = I18n.t('success.filesInFolder', 
          successfulSlides.toString(), 
          path.basename(result.outputDirectory));
      } else {
        outputInfo = 'unknown';
      }

      const action = await vscode.window.showInformationMessage(
        `${message}: ${outputInfo}`,
        I18n.t('success.openFile'),
        I18n.t('success.viewDetails')
      );

      if (action === I18n.t('success.openFile')) {
        // Open the output file or directory
        if (result.outputPath) {
          const doc = await vscode.workspace.openTextDocument(result.outputPath);
          await vscode.window.showTextDocument(doc);
        } else if (result.outputDirectory) {
          const dirUri = vscode.Uri.file(result.outputDirectory);
          await vscode.commands.executeCommand('revealFileInOS', dirUri);
        }
      } else if (action === I18n.t('success.viewDetails')) {
        // Show detailed results
        await showSlideConversionDetails(result);
      }

    } else {
      vscode.window.showErrorMessage(I18n.t('error.conversionFailed', result.errorMessage || I18n.t('error.unknownError')));
    }

  } catch (error) {
    console.error('PowerPoint slides to Markdown conversion error:', error);
    vscode.window.showErrorMessage(
      I18n.t('error.conversionFailed', error instanceof Error ? error.message : I18n.t('error.unknownError'))
    );
  }
}

/**
 * Show detailed conversion results
 */
async function showSlideConversionDetails(result: SlideRangeConversionResult): Promise<void> {
  if (!result.slideResults || result.slideResults.length === 0) {
    return;
  }

  const successful = result.slideResults.filter(r => r.success);
  const failed = result.slideResults.filter(r => !r.success);

  let content = `# ${I18n.t('powerpoint.slidesConversionComplete', '')}\n\n`;
  content += `## Summary\n\n`;
  content += `- Total Slides: ${result.slideResults.length}\n`;
  content += `- Successful: ${successful.length}\n`;
  content += `- Failed: ${failed.length}\n`;
  
  if (result.outputPath) {
    content += `- Output File: ${path.basename(result.outputPath)}\n`;
  } else if (result.outputDirectory) {
    content += `- Output Directory: ${path.basename(result.outputDirectory)}\n`;
  }
  
  content += `\n`;

  if (successful.length > 0) {
    content += `## Successful Conversions\n\n`;
    for (const slideResult of successful) {
      const titleInfo = slideResult.title ? ` - ${slideResult.title}` : '';
      content += `- Slide ${slideResult.slideNumber}${titleInfo}\n`;
    }
    content += '\n';
  }

  if (failed.length > 0) {
    content += `## Failed Conversions\n\n`;
    for (const slideResult of failed) {
      content += `- Slide ${slideResult.slideNumber}: ${slideResult.error || 'Unknown error'}\n`;
    }
  }

  // Create and show a new document with the details
  const doc = await vscode.workspace.openTextDocument({
    content,
    language: 'markdown'
  });
  await vscode.window.showTextDocument(doc);
}
