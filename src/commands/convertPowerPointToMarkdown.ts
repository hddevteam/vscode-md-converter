import * as vscode from 'vscode';
import * as path from 'path';
import { PowerPointToMarkdownConverter } from '../converters/powerpointToMarkdown';
import { UIUtils } from '../ui/uiUtils';
import { I18n } from '../i18n';

/**
 * Handle PowerPoint to Markdown conversion command
 */
export async function convertPowerPointToMarkdown(uri?: vscode.Uri) {
  let filePath: string;

  if (uri) {
    filePath = uri.fsPath;
  } else {
    // Show file picker
    const fileUri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: I18n.t('commands.convertPowerPointToMarkdown'),
      filters: {
        'PowerPoint演示文稿 (.pptx, .ppt)': ['pptx', 'ppt']
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
          { detail: '为获得更好的转换效果，请先将此文件转换为.pptx格式。' },
          I18n.t('powerpoint.openInPowerPoint'),
          '仍要继续'
        );
        
        if (action === I18n.t('powerpoint.openInPowerPoint')) {
          // Try to open the file in PowerPoint
          await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
          return;
        } else if (action !== '仍要继续') {
          return; // User cancelled
        }
      }
      
      progress.report({ 
        increment: 50,
        message: '转换中...'
      });
      
      const result = await PowerPointToMarkdownConverter.convert(filePath);

      progress.report({ 
        increment: 100,
        message: '转换完成'
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
