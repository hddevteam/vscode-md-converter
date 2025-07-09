import * as vscode from 'vscode';
import * as path from 'path';
import { ConversionResult, BatchConversionResult } from '../types';
import { I18n } from '../i18n';

export interface ProgressInfo {
  message?: string;
  increment?: number;
}

export class UIUtils {
  /**
   * Show progress bar
   */
  static async withProgress<T>(
    title: string,
    task: (progress: vscode.Progress<ProgressInfo>, token: vscode.CancellationToken) => Promise<T>
  ): Promise<T> {
    return vscode.window.withProgress<T>(
      {
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: true
      },
      task
    );
  }

  /**
   * Show conversion result notification
   */
  static showConversionResultNotification(result: ConversionResult): void {
    if (result.success) {
      const fileName = result.outputPath ? vscode.Uri.file(result.outputPath).fsPath : 'unknown';
      const openButton = I18n.t('success.openFile');
      const message = I18n.t('success.conversionComplete', fileName);
      
      vscode.window.showInformationMessage(message, openButton).then(selection => {
        if (selection === openButton && result.outputPath) {
          const uri = vscode.Uri.file(result.outputPath);
          vscode.commands.executeCommand('vscode.open', uri);
        }
      });
    } else {
      vscode.window.showErrorMessage(I18n.t('error.conversionFailed', result.error));
    }
  }

  /**
   * Show conversion result notification for multiple output files
   */
  static showMultipleFileConversionResult(result: ConversionResult): void {
    if (result.success && result.outputPaths && result.outputPaths.length > 0) {
      const fileCount = result.outputPaths.length;
      const openButton = I18n.t('success.openFile');
      const message = I18n.t('excel.csvFilesSaved', fileCount);
      
      vscode.window.showInformationMessage(message, openButton).then(selection => {
        if (selection === openButton && result.outputPaths && result.outputPaths.length > 0) {
          // Open the first file or the directory containing the files
          const uri = vscode.Uri.file(result.outputPaths[0]);
          if (result.outputPaths.length === 1) {
            // Open single file directly
            vscode.commands.executeCommand('vscode.open', uri);
          } else {
            // Open containing directory for multiple files
            const dirUri = vscode.Uri.file(path.dirname(result.outputPaths[0]));
            vscode.commands.executeCommand('revealFileInOS', dirUri);
          }
        }
      });
    } else {
      vscode.window.showErrorMessage(I18n.t('error.conversionFailed', result.error));
    }
  }

  /**
   * Show batch conversion result notification
   */
  static showBatchConversionResult(result: BatchConversionResult): void {
    const { totalFiles, successCount, failedCount, skippedCount } = result;
    
    if (successCount === totalFiles) {
      vscode.window.showInformationMessage(I18n.t('success.allComplete', successCount));
    } else {
      const detailsButton = I18n.t('success.viewDetails');
      const message = `${I18n.t('progress.complete')}: ${successCount}/${totalFiles} ${I18n.t('report.successful', '')}, ${failedCount} ${I18n.t('report.failed', '')}, ${skippedCount} ${I18n.t('report.skipped', '')}`;
      
      vscode.window.showInformationMessage(message, detailsButton).then(selection => {
        if (selection === detailsButton) {
          this.showConversionResultsReport(result);
        }
      });
    }
  }

  /**
   * Show detailed conversion report
   */
  private static showConversionResultsReport(result: BatchConversionResult): void {
    const panel = vscode.window.createWebviewPanel(
      'conversionReport',
      I18n.t('report.title'),
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    const successItems = result.results
      .filter(r => r.success)
      .map(r => `<li class="success">✅ ${vscode.Uri.file(r.inputPath).fsPath} ➡️ ${r.outputPath ? vscode.Uri.file(r.outputPath).fsPath : 'unknown'} (${r.duration}ms)</li>`)
      .join('');

    const failedItems = result.results
      .filter(r => !r.success)
      .map(r => `<li class="error">❌ ${vscode.Uri.file(r.inputPath).fsPath} - ${I18n.t('error.conversionFailed', r.error)}</li>`)
      .join('');

    const locale = vscode.env.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';

    panel.webview.html = `
      <!DOCTYPE html>
      <html lang="${locale}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${I18n.t('report.title')}</title>
        <style>
          body { font-family: var(--vscode-editor-font-family); padding: 20px; }
          h1 { color: var(--vscode-editor-foreground); }
          .success { color: var(--vscode-terminal-ansiGreen); }
          .error { color: var(--vscode-terminal-ansiRed); }
          .summary { margin-bottom: 20px; padding: 10px; background: var(--vscode-editor-background); }
          ul { line-height: 1.5; }
        </style>
      </head>
      <body>
        <h1>${I18n.t('report.title')}</h1>
        
        <div class="summary">
          <p>${I18n.t('report.totalFiles', result.totalFiles)}</p>
          <p>${I18n.t('report.successful', result.successCount)}</p>
          <p>${I18n.t('report.failed', result.failedCount)}</p>
          <p>${I18n.t('report.skipped', result.skippedCount)}</p>
        </div>

        ${result.successCount > 0 ? `
        <h2>${I18n.t('report.successfulConversions', result.successCount)}</h2>
        <ul>${successItems}</ul>
        ` : ''}

        ${result.failedCount > 0 ? `
        <h2>${I18n.t('report.failedConversions', result.failedCount)}</h2>
        <ul>${failedItems}</ul>
        ` : ''}
      </body>
      </html>
    `;
  }

  /**
   * Show error message
   */
  static showError(message: string, error?: Error): void {
    const errorMessage = error ? `${message}: ${error.message}` : message;
    vscode.window.showErrorMessage(errorMessage);
    console.error(errorMessage, error);
  }

  /**
   * Prompt user to select output directory
   */
  static async promptForOutputDirectory(defaultDir?: string): Promise<string | undefined> {
    const options: vscode.OpenDialogOptions = {
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: I18n.t('batch.selectOutputDir')
    };

    if (defaultDir) {
      options.defaultUri = vscode.Uri.file(defaultDir);
    }

    const result = await vscode.window.showOpenDialog(options);
    
    return result && result.length > 0 ? result[0].fsPath : undefined;
  }
}
