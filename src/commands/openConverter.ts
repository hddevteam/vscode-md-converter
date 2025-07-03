import * as vscode from 'vscode';
import * as path from 'path';
import { I18n } from '../i18n';

/**
 * Handle open converter interface command
 */
export function openConverter() {
  // Create and show webview panel
  const panel = vscode.window.createWebviewPanel(
    'documentConverter', // Panel identifier
    I18n.t('commands.openConverter'), // Panel title
    vscode.ViewColumn.One, // Position in editor
    {
      // Enable JavaScript
      enableScripts: true,
      // Restrict accessible resources
      localResourceRoots: [
        vscode.Uri.file(path.join(vscode.workspace.rootPath || '', 'media'))
      ]
    }
  );

  // Set webview content
  panel.webview.html = getWebviewContent();

  // Handle messages from webview
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
 * Generate webview content with internationalization support
 */
function getWebviewContent() {
  const locale = vscode.env.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  const isZh = locale === 'zh';
  
  // Define localized strings for the webview
  const webviewStrings = {
    title: isZh ? '文档转换器' : 'Document Converter',
    wordToMarkdown: {
      title: isZh ? 'Word 转 Markdown' : 'Word to Markdown',
      description: isZh ? '将 Word 文档 (.docx, .doc) 转换为 Markdown 格式，保留文本结构和基本格式。' : 'Convert Word documents (.docx, .doc) to Markdown format, preserving text structure and basic formatting.',
      buttonText: isZh ? '选择文件转换' : 'Select File to Convert'
    },
    excelToMarkdown: {
      title: isZh ? 'Excel/CSV 转 Markdown' : 'Excel/CSV to Markdown',
      description: isZh ? '将 Excel 工作簿或 CSV 文件转换为 Markdown 表格，保留多个工作表的数据。' : 'Convert Excel workbooks or CSV files to Markdown tables, preserving data from multiple worksheets.',
      buttonText: isZh ? '选择文件转换' : 'Select File to Convert'
    },
    pdfToText: {
      title: isZh ? 'PDF 转文本' : 'PDF to Text',
      description: isZh ? '从 PDF 文件中提取文本内容，并保存为纯文本文件。' : 'Extract text content from PDF files and save as plain text files.',
      buttonText: isZh ? '选择文件转换' : 'Select File to Convert'
    },
    batchConvert: {
      title: isZh ? '批量转换' : 'Batch Conversion',
      description: isZh ? '选择一个文件夹，批量转换其中的所有支持文件类型。' : 'Select a folder to batch convert all supported file types within it.',
      buttonText: isZh ? '选择文件夹' : 'Select Folder'
    }
  };

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${webviewStrings.title}</title>
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
    ${webviewStrings.title}
  </h1>
  
  <div class="card">
    <h2 class="card-title">${webviewStrings.wordToMarkdown.title}</h2>
    <div class="card-content">
      ${webviewStrings.wordToMarkdown.description}
    </div>
    <div>
      <span class="formats">.docx</span>
      <span class="formats">.doc</span>
      <span class="formats">→</span>
      <span class="formats">.md</span>
    </div>
    <br>
    <button class="btn" id="convertWord">${webviewStrings.wordToMarkdown.buttonText}</button>
  </div>
  
  <div class="card">
    <h2 class="card-title">${webviewStrings.excelToMarkdown.title}</h2>
    <div class="card-content">
      ${webviewStrings.excelToMarkdown.description}
    </div>
    <div>
      <span class="formats">.xlsx</span>
      <span class="formats">.xls</span>
      <span class="formats">.csv</span>
      <span class="formats">→</span>
      <span class="formats">.md</span>
    </div>
    <br>
    <button class="btn" id="convertExcel">${webviewStrings.excelToMarkdown.buttonText}</button>
  </div>
  
  <div class="card">
    <h2 class="card-title">${webviewStrings.pdfToText.title}</h2>
    <div class="card-content">
      ${webviewStrings.pdfToText.description}
    </div>
    <div>
      <span class="formats">.pdf</span>
      <span class="formats">→</span>
      <span class="formats">.txt</span>
    </div>
    <br>
    <button class="btn" id="convertPdf">${webviewStrings.pdfToText.buttonText}</button>
  </div>
  
  <div class="separator"></div>
  
  <div class="card">
    <h2 class="card-title">${webviewStrings.batchConvert.title}</h2>
    <div class="card-content">
      ${webviewStrings.batchConvert.description}
    </div>
    <button class="btn" id="batchConvert">${webviewStrings.batchConvert.buttonText}</button>
  </div>

  <script>
    (function() {
      // Get VS Code API
      const vscode = acquireVsCodeApi();
      
      // Event handling
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
