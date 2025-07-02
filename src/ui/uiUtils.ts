import * as vscode from 'vscode';
import { ConversionResult, BatchConversionResult } from '../types';

export interface ProgressInfo {
  message?: string;
  increment?: number;
}

export class UIUtils {
  /**
   * 显示进度条
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
   * 显示转换结果通知
   */
  static showConversionResultNotification(result: ConversionResult): void {
    if (result.success) {
      const fileName = result.outputPath ? vscode.Uri.file(result.outputPath).fsPath : 'unknown';
      const openButton = '打开文件';
      const message = `成功转换为: ${fileName}`;
      
      vscode.window.showInformationMessage(message, openButton).then(selection => {
        if (selection === openButton && result.outputPath) {
          const uri = vscode.Uri.file(result.outputPath);
          vscode.commands.executeCommand('vscode.open', uri);
        }
      });
    } else {
      vscode.window.showErrorMessage(`转换失败: ${result.error}`);
    }
  }

  /**
   * 显示批量转换结果通知
   */
  static showBatchConversionResult(result: BatchConversionResult): void {
    const { totalFiles, successCount, failedCount, skippedCount } = result;
    
    if (successCount === totalFiles) {
      vscode.window.showInformationMessage(`全部完成! ${successCount} 个文件成功转换`);
    } else {
      const detailsButton = '查看详情';
      const message = `转换完成: ${successCount}/${totalFiles} 个文件成功, ${failedCount} 个失败, ${skippedCount} 个跳过`;
      
      vscode.window.showInformationMessage(message, detailsButton).then(selection => {
        if (selection === detailsButton) {
          this.showConversionResultsReport(result);
        }
      });
    }
  }

  /**
   * 显示详细转换报告
   */
  private static showConversionResultsReport(result: BatchConversionResult): void {
    const panel = vscode.window.createWebviewPanel(
      'conversionReport',
      '文件转换报告',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    const successItems = result.results
      .filter(r => r.success)
      .map(r => `<li class="success">✅ ${vscode.Uri.file(r.inputPath).fsPath} ➡️ ${r.outputPath ? vscode.Uri.file(r.outputPath).fsPath : 'unknown'} (${r.duration}ms)</li>`)
      .join('');

    const failedItems = result.results
      .filter(r => !r.success)
      .map(r => `<li class="error">❌ ${vscode.Uri.file(r.inputPath).fsPath} - 错误: ${r.error}</li>`)
      .join('');

    panel.webview.html = `
      <!DOCTYPE html>
      <html lang="zh">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>文件转换报告</title>
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
        <h1>文件转换报告</h1>
        
        <div class="summary">
          <p>总文件数: ${result.totalFiles}</p>
          <p>成功: ${result.successCount}</p>
          <p>失败: ${result.failedCount}</p>
          <p>跳过: ${result.skippedCount}</p>
        </div>

        ${result.successCount > 0 ? `
        <h2>成功转换 (${result.successCount})</h2>
        <ul>${successItems}</ul>
        ` : ''}

        ${result.failedCount > 0 ? `
        <h2>转换失败 (${result.failedCount})</h2>
        <ul>${failedItems}</ul>
        ` : ''}
      </body>
      </html>
    `;
  }

  /**
   * 显示错误消息
   */
  static showError(message: string, error?: Error): void {
    const errorMessage = error ? `${message}: ${error.message}` : message;
    vscode.window.showErrorMessage(errorMessage);
    console.error(errorMessage, error);
  }

  /**
   * 提示用户选择输出目录
   */
  static async promptForOutputDirectory(defaultDir?: string): Promise<string | undefined> {
    const options: vscode.OpenDialogOptions = {
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: '选择输出目录'
    };

    if (defaultDir) {
      options.defaultUri = vscode.Uri.file(defaultDir);
    }

    const result = await vscode.window.showOpenDialog(options);
    
    return result && result.length > 0 ? result[0].fsPath : undefined;
  }
}
