import * as vscode from 'vscode';
import * as path from 'path';
import { PdfToTextConverter } from '../converters/pdfToText';
import { UIUtils } from '../ui/uiUtils';
import { I18n } from '../i18n';

/**
 * Handle PDF to Text conversion command
 */
export async function convertPdfToText(uri?: vscode.Uri) {
  try {
    // If no URI provided, prompt user to select file
    if (!uri) {
      const fileUris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: {
          [I18n.t('fileTypes.pdfDocuments')]: ['pdf']
        },
        title: I18n.t('commands.convertPdfToText')
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
        title: `${I18n.t('commands.convertPdfToText')}: ${fileName}`,
        cancellable: false
      },
      async (progress) => {
        progress.report({ increment: 10, message: I18n.t('progress.processing') });

        // Execute conversion
        const result = await PdfToTextConverter.convert(filePath);

        progress.report({ increment: 90, message: I18n.t('progress.complete') });

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
