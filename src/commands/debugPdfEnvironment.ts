import * as vscode from 'vscode';
import * as path from 'path';

export async function debugPdfEnvironment() {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const currentWorkdir = process.cwd();
    
    const debugInfo = [
      `当前工作目录: ${currentWorkdir}`,
      `VS Code工作区: ${workspaceFolders ? workspaceFolders[0].uri.fsPath : '无'}`,
      `扩展目录: ${path.dirname(__dirname)}`,
      `项目根目录: ${path.dirname(path.dirname(__dirname))}`,
    ];
    
    // 检查pdf-parse相关路径
    const nodeModulesPath = path.join(currentWorkdir, 'node_modules', 'pdf-parse');
    const testFilePath = path.join(nodeModulesPath, 'test', 'data', '05-versions-space.pdf');
    
    debugInfo.push(`pdf-parse模块路径: ${nodeModulesPath}`);
    debugInfo.push(`测试文件路径: ${testFilePath}`);
    
    const fs = require('fs');
    debugInfo.push(`node_modules存在: ${fs.existsSync(path.join(currentWorkdir, 'node_modules'))}`);
    debugInfo.push(`pdf-parse存在: ${fs.existsSync(nodeModulesPath)}`);
    debugInfo.push(`测试文件存在: ${fs.existsSync(testFilePath)}`);
    
    // 尝试测试pdf-parse
    try {
      const pdfParse = require('pdf-parse');
      debugInfo.push(`pdf-parse加载成功: ${typeof pdfParse}`);
    } catch (error: any) {
      debugInfo.push(`pdf-parse加载失败: ${error.message}`);
    }
    
    const message = debugInfo.join('\n');
    await vscode.window.showInformationMessage(
      'PDF环境调试信息',
      { detail: message, modal: true },
      '复制到剪贴板'
    );
    
    console.log('PDF环境调试信息:', message);
    
  } catch (error: any) {
    vscode.window.showErrorMessage(`调试失败: ${error.message}`);
  }
}
