import * as vscode from 'vscode';
import * as path from 'path';
import { PdfToTextConverter } from '../converters/pdfToText';

export async function testPdfConversion() {
  try {
    // 获取工作目录中的PDF文件进行测试
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('请打开一个工作目录');
      return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    
    // 查找PDF文件
    const pdfFiles = await vscode.workspace.findFiles('**/*.pdf', null, 5);
    
    if (pdfFiles.length === 0) {
      vscode.window.showInformationMessage('工作目录中没有找到PDF文件');
      return;
    }

    // 让用户选择要测试的PDF文件
    const selectedFile = await vscode.window.showQuickPick(
      pdfFiles.map(file => ({
        label: path.basename(file.fsPath),
        description: path.dirname(file.fsPath),
        file: file.fsPath
      })),
      { placeHolder: '选择要转换的PDF文件' }
    );

    if (!selectedFile) {
      return;
    }

    // 显示进度
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'PDF转换测试',
      cancellable: false
    }, async (progress) => {
      progress.report({ message: '正在转换PDF文件...' });
      
      try {
        const result = await PdfToTextConverter.convert(selectedFile.file, {
          outputDirectory: path.join(workspaceRoot, 'test-output')
        });

        if (result.success) {
          const message = `PDF转换成功！\n输出文件: ${result.outputPath}`;
          const action = await vscode.window.showInformationMessage(
            message,
            '打开文件',
            '显示在资源管理器'
          );

          if (action === '打开文件' && result.outputPath) {
            const doc = await vscode.workspace.openTextDocument(result.outputPath);
            await vscode.window.showTextDocument(doc);
          } else if (action === '显示在资源管理器' && result.outputPath) {
            await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(result.outputPath));
          }
        } else {
          vscode.window.showErrorMessage(`PDF转换失败: ${result.error}`);
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`转换出错: ${error.message}`);
      }
    });

  } catch (error: any) {
    vscode.window.showErrorMessage(`测试失败: ${error.message}`);
  }
}
