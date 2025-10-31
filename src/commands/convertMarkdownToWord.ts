import * as vscode from 'vscode';
import * as path from 'path';
import { MarkdownToWordConverter } from '../converters/markdownToWord';
import { UIUtils } from '../ui/uiUtils';
import { I18n } from '../i18n';

/**
 * Handle Markdown to Word conversion command
 * Supports single file conversion with progress tracking and error handling
 */
export async function convertMarkdownToWord(uri?: vscode.Uri) {
  try {
    // If no URI provided, prompt user to select file
    if (!uri) {
      const fileUris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: {
          'Markdown Files': ['md', 'markdown']
        },
        title: I18n.t('commands.convertMarkdownToWord')
      });

      if (!fileUris || fileUris.length === 0) {
        return; // User cancelled selection
      }

      uri = fileUris[0];
    }

    const filePath = uri.fsPath;
    const fileName = path.basename(filePath);

    // Show progress indicator with user-friendly UI
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `${I18n.t('commands.convertMarkdownToWord')}: ${fileName}`,
        cancellable: false
      },
      async (progress) => {
        try {
          progress.report({ increment: 0, message: I18n.t('progress.processing') });

          // Execute conversion
          const result = await MarkdownToWordConverter.convert(filePath);

          progress.report({ increment: 100, message: I18n.t('progress.complete') });

          // Handle result
          if (result.success && result.outputPath) {
            // Show success message with action
            UIUtils.showConversionResultNotification(result);
          } else {
            // Show error message
            UIUtils.showError(
              `${I18n.t('error.conversionFailed', fileName)}`,
              new Error(result.error || I18n.t('error.unknownError'))
            );
          }
        } catch (error) {
          progress.report({ increment: 100 });
          UIUtils.showError(
            I18n.t('error.conversionFailed', fileName),
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }
    );
  } catch (error) {
    UIUtils.showError(
      I18n.t('error.conversionFailed', 'Markdown file'),
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
