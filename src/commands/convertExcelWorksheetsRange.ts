import * as vscode from 'vscode';
import * as path from 'path';
import { ExcelWorksheetRangeConverter } from '../converters/excelWorksheetRangeConverter';
import { ConversionResult } from '../types';
import { I18n } from '../i18n';

/**
 * Convert selected worksheets from Excel to Markdown
 */
export async function convertExcelWorksheetsToMarkdown(uri?: vscode.Uri): Promise<void> {
  try {
    let inputPath: string;
    
    if (uri) {
      inputPath = uri.fsPath;
    } else {
      // Show file picker
      const fileUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: I18n.t('commands.convertExcelToMarkdown'),
        filters: {
          'Excel Documents': ['xlsx', 'xls']
        }
      });
      
      if (!fileUri || fileUri.length === 0) {
        return; // User cancelled
      }
      
      inputPath = fileUri[0].fsPath;
    }

    // Validate file extension
    const ext = path.extname(inputPath).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      vscode.window.showErrorMessage(I18n.t('error.unsupportedFormat', ext));
      return;
    }

    // Convert with worksheet selection - specify Markdown format
    const result: ConversionResult = await ExcelWorksheetRangeConverter.convertWithWorksheetSelection(inputPath, 'markdown');

    if (result.success) {
      const message = I18n.t('success.conversionComplete', path.basename(inputPath));
      
      let outputInfo: string;
      if (result.outputPaths && result.outputPaths.length > 0) {
        outputInfo = I18n.t('success.filesCount', result.outputPaths.length.toString());
      } else {
        outputInfo = 'unknown';
      }

      const action = await vscode.window.showInformationMessage(
        `${message}: ${outputInfo}`,
        I18n.t('success.openFile')
      );

      if (action === I18n.t('success.openFile')) {
        // Open the first output file or directory
        if (result.outputPaths && result.outputPaths.length > 0) {
          if (result.outputPaths.length === 1) {
            const doc = await vscode.workspace.openTextDocument(result.outputPaths[0]);
            await vscode.window.showTextDocument(doc);
          } else {
            // Open output directory
            const dirUri = vscode.Uri.file(path.dirname(result.outputPaths[0]));
            await vscode.commands.executeCommand('revealFileInOS', dirUri);
          }
        }
      }

    } else {
      vscode.window.showErrorMessage(I18n.t('error.conversionFailed', result.error || I18n.t('error.unknownError')));
    }

  } catch (error) {
    console.error('Excel worksheets to Markdown conversion error:', error);
    vscode.window.showErrorMessage(
      I18n.t('error.conversionFailed', error instanceof Error ? error.message : I18n.t('error.unknownError'))
    );
  }
}

/**
 * Convert selected worksheets from Excel to CSV
 */
export async function convertExcelWorksheetsToCsv(uri?: vscode.Uri): Promise<void> {
  try {
    let inputPath: string;
    
    if (uri) {
      inputPath = uri.fsPath;
    } else {
      // Show file picker
      const fileUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: I18n.t('commands.convertExcelToCsv'),
        filters: {
          'Excel Documents': ['xlsx', 'xls']
        }
      });
      
      if (!fileUri || fileUri.length === 0) {
        return; // User cancelled
      }
      
      inputPath = fileUri[0].fsPath;
    }

    // Validate file extension
    const ext = path.extname(inputPath).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      vscode.window.showErrorMessage(I18n.t('error.unsupportedFormat', ext));
      return;
    }

    // Convert with worksheet selection - specify CSV format
    const result: ConversionResult = await ExcelWorksheetRangeConverter.convertWithWorksheetSelection(inputPath, 'csv');

    if (result.success) {
      const message = I18n.t('success.conversionComplete', path.basename(inputPath));
      
      let outputInfo: string;
      if (result.outputPaths && result.outputPaths.length > 0) {
        outputInfo = I18n.t('success.filesCount', result.outputPaths.length.toString());
      } else {
        outputInfo = 'unknown';
      }

      const action = await vscode.window.showInformationMessage(
        `${message}: ${outputInfo}`,
        I18n.t('success.openFile')
      );

      if (action === I18n.t('success.openFile')) {
        // Open output directory for CSV files
        if (result.outputPaths && result.outputPaths.length > 0) {
          const dirUri = vscode.Uri.file(path.dirname(result.outputPaths[0]));
          await vscode.commands.executeCommand('revealFileInOS', dirUri);
        }
      }

    } else {
      vscode.window.showErrorMessage(I18n.t('error.conversionFailed', result.error || I18n.t('error.unknownError')));
    }

  } catch (error) {
    console.error('Excel worksheets to CSV conversion error:', error);
    vscode.window.showErrorMessage(
      I18n.t('error.conversionFailed', error instanceof Error ? error.message : I18n.t('error.unknownError'))
    );
  }
}
