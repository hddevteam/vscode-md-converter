import * as vscode from 'vscode';
import * as path from 'path';
import { PowerPointToMarkdownConverter } from '../converters/powerpointToMarkdown';
import { UIUtils } from '../ui/uiUtils';
import { I18n } from '../i18n';
import { ConvertSelectedToMarkdownCommand } from './convertSelectedToMarkdown';

/**
 * Handle PowerPoint to Markdown conversion command
 * Supports both single file and multi-file selection
 */
export async function convertPowerPointToMarkdown(uri?: vscode.Uri, uris?: vscode.Uri[]) {
  // If multiple files are selected, use batch conversion
  if (uris && uris.length > 1) {
    return ConvertSelectedToMarkdownCommand.execute(uri, uris);
  }
  
  // Single file conversion logic continues below...
  
  let filePath: string;

  if (uri) {
    filePath = uri.fsPath;
  } else {
    // Show file picker
    const fileUri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: I18n.t('commands.convertPowerPointToMarkdown'),
      filters: {
        'PowerPoint Presentations (.pptx, .ppt)': ['pptx', 'ppt']
      }
    });

    if (!fileUri || fileUri.length === 0) {
      return;
    }

    filePath = fileUri[0].fsPath;
  }

  // Show progress
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: I18n.t('progress.processing'),
    cancellable: false
  }, async (progress) => {
    progress.report({ 
      increment: 0,
      message: I18n.t('progress.processingFile', '1', '1', path.basename(filePath)) 
    });
    
    try {
      // Check file format first
      const fileExt = path.extname(filePath).toLowerCase();
      
      // Handle old formats with user-friendly dialogs
      if (fileExt === '.ppt') {
        const action = await vscode.window.showWarningMessage(
          I18n.t('powerpoint.pptFormatNotice'),
          { detail: I18n.t('powerpoint.pptFormatDetail') },
          I18n.t('powerpoint.openInPowerPoint'),
          I18n.t('powerpoint.continueAnyway')
        );
        
        if (action === I18n.t('powerpoint.openInPowerPoint')) {
          // Try to open the file in PowerPoint
          await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
          return;
        } else if (action !== I18n.t('powerpoint.continueAnyway')) {
          return; // User cancelled
        }
      }
      
      progress.report({ 
        increment: 50,
        message: I18n.t('powerpoint.converting')
      });
      
      const result = await PowerPointToMarkdownConverter.convert(filePath);

      progress.report({ 
        increment: 100,
        message: I18n.t('powerpoint.conversionComplete')
      });

      if (result.success) {
        const message = I18n.t('success.conversionComplete', result.outputPath!);
        const action = await vscode.window.showInformationMessage(
          message,
          I18n.t('success.openFile')
        );

        if (action === I18n.t('success.openFile') && result.outputPath) {
          const uri = vscode.Uri.file(result.outputPath);
          await vscode.commands.executeCommand('vscode.open', uri);
        }
      } else {
        vscode.window.showErrorMessage(I18n.t('error.conversionFailed', result.error || I18n.t('error.unknownError')));
      }
    } catch (error) {
      vscode.window.showErrorMessage(I18n.t('error.conversionFailed', error instanceof Error ? error.message : I18n.t('error.unknownError')));
    }
  });
}
