import * as vscode from 'vscode';
import * as path from 'path';
import { WordToMarkdownConverter } from '../converters/wordToMarkdown';
import { UIUtils } from '../ui/uiUtils';
import { I18n } from '../i18n';

/**
 * Handle Word to Markdown conversion command
 */
export async function convertWordToMarkdown(uri?: vscode.Uri) {
  try {
    // If no URI provided, prompt user to select file
    if (!uri) {
      const fileUris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: {
          [I18n.t('fileTypes.wordDocuments')]: ['docx', 'doc']
        },
        title: I18n.t('commands.convertWordToMarkdown')
      });

      if (!fileUris || fileUris.length === 0) {
        return; // User cancelled selection
      }

      uri = fileUris[0];
    }

    const filePath = uri.fsPath;
    const fileName = path.basename(filePath);

    // Show progress indicator
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `${I18n.t('commands.convertWordToMarkdown')}: ${fileName}`,
        cancellable: false
      },
      async (progress) => {
        progress.report({ increment: 0, message: I18n.t('progress.processing') });

        // Check file format first
        const fileExt = path.extname(filePath).toLowerCase();
        
        // Handle old .doc format with user-friendly dialog
        if (fileExt === '.doc') {
          const action = await vscode.window.showWarningMessage(
            I18n.t('word.docFormatNotice'),
            { detail: '为获得更好的转换效果，请先将此文件转换为.docx格式。' },
            '在Microsoft Word中打开此文件',
            '仍要继续'
          );
          
          if (action === '在Microsoft Word中打开此文件') {
            // Try to open the file in Word
            await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
            return;
          } else if (action !== '仍要继续') {
            return; // User cancelled
          }
        }

        progress.report({ increment: 30, message: '转换中...' });

        // Execute conversion
        const result = await WordToMarkdownConverter.convert(filePath);

        progress.report({ increment: 100, message: '转换完成' });

        // Handle result
        if (result.success && result.outputPath) {
          // Show success message
          UIUtils.showConversionResultNotification(result);
        } else {
          // Show error message
          UIUtils.showError(`${I18n.t('error.conversionFailed', fileName)}`, new Error(result.error || I18n.t('error.unknownError')));
        }
      }
    );
  } catch (error) {
    UIUtils.showError(
      I18n.t('error.conversionFailed', ''), 
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
