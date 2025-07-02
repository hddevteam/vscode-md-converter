import * as vscode from 'vscode';
import * as path from 'path';

/**
 * 处理打开转换器界面的命令
 */
export function openConverter() {
  // 创建并显示webview面板
  const panel = vscode.window.createWebviewPanel(
    'documentConverter', // 面板的标识符
    '文档转换器', // 面板的标题
    vscode.ViewColumn.One, // 在编辑器中的位置
    {
      // 启用JavaScript
      enableScripts: true,
      // 限制可访问的资源
      localResourceRoots: [
        vscode.Uri.file(path.join(vscode.workspace.rootPath || '', 'media'))
      ]
    }
  );

  // 设置webview内容
  panel.webview.html = getWebviewContent();

  // 处理webview发送的消息
  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        case 'convertWord':
          vscode.commands.executeCommand('document-md-converter.convertWordToMarkdown');
          return;
        case 'convertExcel':
          vscode.commands.executeCommand('document-md-converter.convertExcelToMarkdown');
          return;
        case 'convertPdf':
          vscode.commands.executeCommand('document-md-converter.convertPdfToText');
          return;
        case 'batchConvert':
          vscode.commands.executeCommand('document-md-converter.batchConvert');
          return;
      }
    },
    undefined,
    []
  );
}

/**
 * 生成webview内容
 */
function getWebviewContent() {
  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>文档转换器</title>
  <style>
    body {
      font-family: var(--vscode-editor-font-family);
      color: var(--vscode-editor-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px;
    }
    h1 {
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 10px;
      font-size: 1.5em;
    }
    .card {
      background: var(--vscode-sideBar-background);
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 15px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .card-title {
      font-size: 1.2em;
      margin-top: 0;
      margin-bottom: 10px;
      color: var(--vscode-editor-foreground);
    }
    .card-content {
      margin-bottom: 15px;
      font-size: 0.9em;
      opacity: 0.8;
    }
    .btn {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 8px 12px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 0.9em;
    }
    .btn:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .icon {
      margin-right: 8px;
      vertical-align: middle;
    }
    .separator {
      border-top: 1px solid var(--vscode-panel-border);
      margin: 20px 0;
    }
    .formats {
      display: inline-block;
      padding: 3px 5px;
      margin-right: 5px;
      font-size: 0.8em;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <h1>
    <span class="icon">📝</span>
    文档转换器
  </h1>
  
  <div class="card">
    <h2 class="card-title">Word 转 Markdown</h2>
    <div class="card-content">
      将 Word 文档 (.docx, .doc) 转换为 Markdown 格式，保留文本结构和基本格式。
    </div>
    <div>
      <span class="formats">.docx</span>
      <span class="formats">.doc</span>
      <span class="formats">→</span>
      <span class="formats">.md</span>
    </div>
    <br>
    <button class="btn" id="convertWord">选择文件转换</button>
  </div>
  
  <div class="card">
    <h2 class="card-title">Excel/CSV 转 Markdown</h2>
    <div class="card-content">
      将 Excel 工作簿或 CSV 文件转换为 Markdown 表格，保留多个工作表的数据。
    </div>
    <div>
      <span class="formats">.xlsx</span>
      <span class="formats">.xls</span>
      <span class="formats">.csv</span>
      <span class="formats">→</span>
      <span class="formats">.md</span>
    </div>
    <br>
    <button class="btn" id="convertExcel">选择文件转换</button>
  </div>
  
  <div class="card">
    <h2 class="card-title">PDF 转文本</h2>
    <div class="card-content">
      从 PDF 文件中提取文本内容，并保存为纯文本文件。
    </div>
    <div>
      <span class="formats">.pdf</span>
      <span class="formats">→</span>
      <span class="formats">.txt</span>
    </div>
    <br>
    <button class="btn" id="convertPdf">选择文件转换</button>
  </div>
  
  <div class="separator"></div>
  
  <div class="card">
    <h2 class="card-title">批量转换</h2>
    <div class="card-content">
      选择一个文件夹，批量转换其中的所有支持文件类型。
    </div>
    <button class="btn" id="batchConvert">选择文件夹</button>
  </div>

  <script>
    (function() {
      // 获取VS Code API
      const vscode = acquireVsCodeApi();
      
      // 事件处理
      document.getElementById('convertWord').addEventListener('click', function() {
        vscode.postMessage({ command: 'convertWord' });
      });
      
      document.getElementById('convertExcel').addEventListener('click', function() {
        vscode.postMessage({ command: 'convertExcel' });
      });
      
      document.getElementById('convertPdf').addEventListener('click', function() {
        vscode.postMessage({ command: 'convertPdf' });
      });
      
      document.getElementById('batchConvert').addEventListener('click', function() {
        vscode.postMessage({ command: 'batchConvert' });
      });
    })();
  </script>
</body>
</html>`;
}
