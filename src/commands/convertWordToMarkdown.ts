import * as vscode from 'vscode';
import * as path from 'path';
import { WordToMarkdownConverter } from '../converters/wordToMarkdown';
import { UIUtils } from '../ui/uiUtils';

/**
 * 处理Word到Markdown的转换命令
 */
export async function convertWordToMarkdown(uri?: vscode.Uri) {
  try {
    // 如果没有提供URI，提示用户选择文件
    if (!uri) {
      const fileUris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: {
          'Word文档': ['docx', 'doc']
        },
        title: '选择要转换为Markdown的Word文档'
      });

      if (!fileUris || fileUris.length === 0) {
        return; // 用户取消了选择
      }

      uri = fileUris[0];
    }

    const filePath = uri.fsPath;
    const fileName = path.basename(filePath);

    // 显示进度指示器
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `正在将Word转换为Markdown: ${fileName}`,
        cancellable: false
      },
      async (progress) => {
        progress.report({ increment: 10, message: '准备转换...' });

        // 执行转换
        const result = await WordToMarkdownConverter.convert(filePath);

        progress.report({ increment: 90, message: '完成' });

        // 处理结果
        if (result.success && result.outputPath) {
          // 显示成功消息
          UIUtils.showConversionResultNotification(result);
        } else {
          // 显示错误消息
          UIUtils.showError(`转换 ${fileName} 失败`, new Error(result.error || '未知错误'));
        }
      }
    );
  } catch (error) {
    UIUtils.showError(
      '转换失败', 
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
