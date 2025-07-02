import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { FileUtils } from '../utils/fileUtils';
import { UIUtils } from '../ui/uiUtils';
import { WordToMarkdownConverter } from '../converters/wordToMarkdown';
import { ExcelToMarkdownConverter } from '../converters/excelToMarkdown';
import { PdfToTextConverter } from '../converters/pdfToText';
import { ConversionResult, BatchConversionResult } from '../types';

interface BatchConversionOptions {
  outputDirectory?: string;
  includeSubfolders?: boolean;
  fileTypes?: string[];
}

/**
 * 处理批量转换命令
 */
export async function batchConvert(uri?: vscode.Uri) {
  try {
    // 如果没有提供URI，提示用户选择文件夹
    if (!uri) {
      const folderUris = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: '选择要批量转换的文件夹'
      });

      if (!folderUris || folderUris.length === 0) {
        return; // 用户取消了选择
      }

      uri = folderUris[0];
    }

    const folderPath = uri.fsPath;

    // 配置批量转换选项
    const options = await getBatchConversionOptions(folderPath);
    if (!options) {
      return; // 用户取消了配置
    }

    // 显示进度指示器
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `正在批量转换文件: ${path.basename(folderPath)}`,
        cancellable: true
      },
      async (progress, token) => {
        // 获取待转换文件列表
        const files = await collectFiles(folderPath, options.fileTypes, options.includeSubfolders);
        if (files.length === 0) {
          vscode.window.showInformationMessage(`在 ${folderPath} 中未找到可转换的文件。`);
          return;
        }

        // 创建输出目录（如果不存在）
        const outputDir = options.outputDirectory || folderPath;
        await fs.mkdir(outputDir, { recursive: true });

        // 转换文件
        const results = [];
        let processedCount = 0;

        for (const file of files) {
          if (token.isCancellationRequested) {
            break;
          }

          const fileName = path.basename(file);
          const fileExt = path.extname(file).toLowerCase();
          
          // 更新进度
          const progressIncrement = 100 / files.length;
          progress.report({ 
            increment: progressIncrement, 
            message: `处理文件 ${processedCount + 1}/${files.length}: ${fileName}` 
          });

          try {
            let result: ConversionResult;
            
            // 根据文件类型选择转换器
            switch (fileExt) {
              case '.docx':
              case '.doc':
                result = await WordToMarkdownConverter.convert(file, { outputDirectory: outputDir });
                break;
              case '.xlsx':
              case '.xls':
              case '.csv':
                result = await ExcelToMarkdownConverter.convert(file, { outputDirectory: outputDir });
                break;
              case '.pdf':
                result = await PdfToTextConverter.convert(file, { outputDirectory: outputDir });
                break;
              default:
                result = {
                  success: false,
                  inputPath: file,
                  error: `不支持的文件类型: ${fileExt}`
                };
            }

            results.push(result);
          } catch (error) {
            results.push({
              success: false,
              inputPath: file,
              error: error instanceof Error ? error.message : '未知错误'
            });
          }

          processedCount++;
        }

        // 计算统计信息
        const totalFiles = files.length;
        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;
        const skippedCount = totalFiles - processedCount;

        // 显示批量转换结果
        UIUtils.showBatchConversionResult({
          totalFiles,
          successCount,
          failedCount,
          skippedCount,
          results
        });
      }
    );
  } catch (error) {
    UIUtils.showError(
      '批量转换失败', 
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 收集符合条件的文件
 */
async function collectFiles(
  folderPath: string,
  fileTypes: string[] = ['.docx', '.doc', '.xlsx', '.xls', '.csv', '.pdf'],
  includeSubfolders: boolean = false
): Promise<string[]> {
  const result: string[] = [];

  // 读取目录内容
  const entries = await fs.readdir(folderPath, { withFileTypes: true });

  // 处理每一个条目
  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);

    if (entry.isFile()) {
      // 检查文件类型
      const ext = path.extname(entry.name).toLowerCase();
      if (fileTypes.includes(ext)) {
        result.push(entryPath);
      }
    } else if (entry.isDirectory() && includeSubfolders) {
      // 如果是目录且包含子文件夹，则递归收集
      const subFiles = await collectFiles(entryPath, fileTypes, includeSubfolders);
      result.push(...subFiles);
    }
  }

  return result;
}

/**
 * 获取批量转换选项
 */
async function getBatchConversionOptions(defaultDir: string): Promise<BatchConversionOptions | undefined> {
  const options: BatchConversionOptions = {
    includeSubfolders: false,
    fileTypes: ['.docx', '.doc', '.xlsx', '.xls', '.csv', '.pdf']
  };

  // 文件类型选项
  const fileTypeOptions = [
    { label: 'Word文档 (.docx, .doc)', picked: true, types: ['.docx', '.doc'] },
    { label: 'Excel文件 (.xlsx, .xls)', picked: true, types: ['.xlsx', '.xls'] },
    { label: 'CSV文件 (.csv)', picked: true, types: ['.csv'] },
    { label: 'PDF文档 (.pdf)', picked: true, types: ['.pdf'] }
  ];

  // 选择文件类型
  const selectedFileTypes = await vscode.window.showQuickPick(
    fileTypeOptions,
    {
      canPickMany: true,
      title: '选择要转换的文件类型',
      placeHolder: '不选择表示全部类型'
    }
  );

  if (!selectedFileTypes) {
    return undefined; // 用户取消了选择
  }

  if (selectedFileTypes.length > 0) {
    options.fileTypes = selectedFileTypes.flatMap(option => option.types);
  }

  // 询问是否包含子文件夹
  const includeSubfoldersOption = await vscode.window.showQuickPick(
    ['是', '否'],
    {
      canPickMany: false,
      title: '是否包含子文件夹？',
      placeHolder: '选择是否搜索子文件夹中的文件'
    }
  );

  if (!includeSubfoldersOption) {
    return undefined; // 用户取消了选择
  }

  options.includeSubfolders = includeSubfoldersOption === '是';

  // 询问输出目录
  const outputDirOptions = [
    { label: '源文件所在目录', description: '将转换后的文件保存在原目录中' },
    { label: '指定输出目录', description: '选择一个目标文件夹' }
  ];

  const outputDirOption = await vscode.window.showQuickPick(
    outputDirOptions,
    {
      canPickMany: false,
      title: '选择输出目录',
      placeHolder: '选择转换后文件的保存位置'
    }
  );

  if (!outputDirOption) {
    return undefined; // 用户取消了选择
  }

  // 如果选择指定输出目录，则提示用户选择
  if (outputDirOption.label === '指定输出目录') {
    options.outputDirectory = await UIUtils.promptForOutputDirectory(defaultDir);
    if (!options.outputDirectory) {
      return undefined; // 用户取消了选择
    }
  }

  return options;
}
