import * as vscode from 'vscode';
import * as path from 'path';
import { PdfTableToCsvConverter } from '../converters/pdfTableToCsv';
import { TableConversionResult } from '../types';
import { I18n } from '../i18n';

export async function convertPdfTablesToCsv(uri?: vscode.Uri): Promise<void> {
  try {
    let inputPath: string;

    if (uri && uri.fsPath) {
      inputPath = uri.fsPath;
    } else {
      // If no URI provided, let user select file
      const selectedFiles = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
          'PDF Documents': ['pdf']
        },
        title: I18n.t('commands.convertPdfTablesToCsv')
      });

      if (!selectedFiles || selectedFiles.length === 0) {
        return;
      }

      inputPath = selectedFiles[0].fsPath;
    }

    // Show progress
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: I18n.t('table.exportingTables'),
      cancellable: false
    }, async (progress) => {
      progress.report({ increment: 0, message: I18n.t('progress.processing') });

      try {
        // Execute conversion
        const result: TableConversionResult = await PdfTableToCsvConverter.convert(inputPath);

        progress.report({ increment: 100, message: I18n.t('progress.complete') });

        if (result.success) {
          if (result.tableCount === 0) {
            // No tables found
            vscode.window.showInformationMessage(
              I18n.t('table.noTablesFound')
            );
          } else {
            // Conversion successful
            const message = I18n.t('table.tablesFound', result.tableCount!.toString()) + 
                           '\n' + I18n.t('table.csvFilesSaved', result.csvPaths!.length.toString());
            
            const openFolderAction = I18n.t('success.openFile');
            const choice = await vscode.window.showInformationMessage(
              message,
              openFolderAction
            );

            if (choice === openFolderAction && result.csvPaths && result.csvPaths.length > 0) {
              // Open folder containing CSV files
              const folderPath = path.dirname(result.csvPaths[0]);
              await vscode.env.openExternal(vscode.Uri.file(folderPath));
            }
          }
        } else {
          // Conversion failed
          vscode.window.showErrorMessage(
            I18n.t('table.tableExtractionFailed', result.error || I18n.t('error.unknownError'))
          );
        }
      } catch (error) {
        progress.report({ increment: 100, message: I18n.t('error.conversionFailed') });
        vscode.window.showErrorMessage(
          I18n.t('table.tableExtractionFailed', error instanceof Error ? error.message : I18n.t('error.unknownError'))
        );
      }
    });

  } catch (error) {
    vscode.window.showErrorMessage(
      I18n.t('error.conversionFailed', error instanceof Error ? error.message : I18n.t('error.unknownError'))
    );
  }
}
