import * as vscode from 'vscode';
import * as path from 'path';
import { PowerPointToMarkdownConverter } from '../converters/powerpointToMarkdown';
import { I18n } from '../i18n';

/**
 * Test PowerPoint conversion functionality
 */
export async function testPowerPointConversion() {
  try {
    // Get workspace path
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      vscode.window.showErrorMessage('请先打开一个工作区');
      return;
    }

    // File picker
    const fileUri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: '选择PowerPoint文件进行测试',
      filters: {
        'PowerPoint演示文稿': ['pptx', 'ppt']
      }
    });

    if (!fileUri || fileUri.length === 0) {
      return;
    }

    const selectedFile = {
      file: fileUri[0].fsPath,
      name: path.basename(fileUri[0].fsPath)
    };

    // Show progress
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'PowerPoint转换测试',
      cancellable: false
    }, async (progress) => {
      progress.report({ message: '正在转换PowerPoint文件...' });
      
      try {
        const result = await PowerPointToMarkdownConverter.convert(selectedFile.file, {
          outputDirectory: path.join(workspaceRoot, 'test-output')
        });

        if (result.success) {
          const message = `PowerPoint转换成功！\n输出文件: ${result.outputPath}`;
          const action = await vscode.window.showInformationMessage(
            message,
            '打开文件',
            '显示在资源管理器'
          );

          if (action === '打开文件' && result.outputPath) {
            const doc = await vscode.workspace.openTextDocument(result.outputPath);
            await vscode.window.showTextDocument(doc);
          } else if (action === '显示在资源管理器' && result.outputPath) {
            vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(result.outputPath));
          }
        } else {
          vscode.window.showErrorMessage(`PowerPoint转换失败: ${result.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        vscode.window.showErrorMessage(`PowerPoint转换测试失败: ${errorMessage}`);
        console.error('PowerPoint转换测试错误:', error);
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    vscode.window.showErrorMessage(`PowerPoint转换测试失败: ${errorMessage}`);
    console.error('PowerPoint转换测试错误:', error);
  }
}
