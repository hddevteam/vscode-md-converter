import * as vscode from 'vscode';
import { convertWordToMarkdown } from './commands/convertWordToMarkdown';
import { convertExcelToMarkdown } from './commands/convertExcelToMarkdown';
import { convertPdfToText } from './commands/convertPdfToText';
import { batchConvert } from './commands/batchConvert';
import { openConverter } from './commands/openConverter';
import { testPdfConversion } from './commands/testPdfConversion';
import { debugPdfEnvironment } from './commands/debugPdfEnvironment';

/**
 * 扩展激活时调用
 */
export async function activate(context: vscode.ExtensionContext) {
  try {
    console.log('文档转换器扩展开始激活...');
    console.log('扩展上下文:', context.extensionPath);

    // 注册命令
    console.log('开始注册命令...');
    const commands = [
      vscode.commands.registerCommand(
        'document-md-converter.convertWordToMarkdown',
        async (uri?: vscode.Uri) => {
          console.log('执行Word转Markdown命令, URI:', uri?.fsPath);
          return convertWordToMarkdown(uri);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.convertExcelToMarkdown',
        async (uri?: vscode.Uri) => {
          console.log('执行Excel转Markdown命令, URI:', uri?.fsPath);
          return convertExcelToMarkdown(uri);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.convertPdfToText',
        async (uri?: vscode.Uri) => {
          console.log('执行PDF转文本命令, URI:', uri?.fsPath);
          return convertPdfToText(uri);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.batchConvert',
        async (uri?: vscode.Uri) => {
          console.log('执行批量转换命令, URI:', uri?.fsPath);
          return batchConvert(uri);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.openConverter',
        () => {
          console.log('执行打开转换器命令');
          return openConverter();
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.testPdfConversion',
        () => {
          console.log('执行PDF转换测试命令');
          return testPdfConversion();
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.debugPdfEnvironment',
        () => {
          console.log('执行PDF环境调试命令');
          return debugPdfEnvironment();
        }
      )
    ];

    // 将命令添加到订阅中
    console.log(`注册了 ${commands.length} 个命令`);
    commands.forEach(command => context.subscriptions.push(command));

    // 验证命令是否成功注册
    const registeredCommands = await vscode.commands.getCommands(true);
    const ourCommands = registeredCommands.filter(cmd => cmd.startsWith('document-md-converter.'));
    console.log('已注册的文档转换器命令:', ourCommands);

  // 显示欢迎消息
  const config = vscode.workspace.getConfiguration('documentConverter');
  const showWelcome = config.get('showWelcomeMessage', true);
  
  if (showWelcome) {
    vscode.window.showInformationMessage(
      '文档转换器已激活！右键单击文件或文件夹以使用转换功能，或从命令面板中使用。',
      '不再显示'
    ).then(selection => {
      if (selection === '不再显示') {
        config.update('showWelcomeMessage', false, true);
      }
    });
  }
    
    console.log('文档转换器扩展激活成功');
  } catch (error) {
    console.error('文档转换器扩展激活失败:', error);
    vscode.window.showErrorMessage(`文档转换器扩展激活失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 扩展停用时调用
 */
export function deactivate() {
  // 清理资源
  console.log('文档转换器扩展已停用');
}
