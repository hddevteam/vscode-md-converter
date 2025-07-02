import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { FileValidationResult, SupportedFileType, ConversionConfig } from '../types';

export class FileUtils {
  /**
   * 验证文件是否为支持的格式
   */
  static async validateFile(filePath: string): Promise<FileValidationResult> {
    try {
      console.log(`正在验证文件: ${filePath}`);
      
      // 检查文件是否存在
      try {
        await fs.access(filePath);
      } catch (error) {
        console.error(`文件访问错误: ${error}`);
        return { 
          isValid: false, 
          error: `文件不存在或无法访问: ${filePath}`,
          suggestions: ['检查文件路径是否正确', '确认文件是否有读取权限']
        };
      }
      
      const stats = await fs.stat(filePath);
      
      if (!stats.isFile()) {
        return { isValid: false, error: '路径不是一个文件' };
      }

      if (stats.size === 0) {
        return { 
          isValid: false, 
          error: '文件为空',
          suggestions: ['检查文件是否损坏或不完整']
        };
      }

      const ext = path.extname(filePath).toLowerCase();
      const supportedExtensions: Record<string, SupportedFileType> = {
        '.docx': 'docx',
        '.doc': 'doc',
        '.xlsx': 'xlsx',
        '.xls': 'xls',
        '.csv': 'csv',
        '.pdf': 'pdf'
      };

      const fileType = supportedExtensions[ext];
      if (!fileType) {
        return {
          isValid: false,
          error: `Unsupported file type: ${ext}`,
          suggestions: ['Supported formats: .docx, .doc, .xlsx, .xls, .csv, .pdf']
        };
      }

      return { isValid: true, fileType };
    } catch (error) {
      return {
        isValid: false,
        error: `Cannot access file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * 生成输出文件路径
   */
  static generateOutputPath(inputPath: string, targetExtension: string, outputDir?: string): string {
    const inputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputDirectory = outputDir || inputDir;
    
    return path.join(outputDirectory, `${baseName}${targetExtension}`);
  }

  /**
   * 确保目录存在
   */
  static async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取文件夹中的所有支持的文件
   */
  static async getSupportedFilesInDirectory(dirPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath);
      const supportedFiles: string[] = [];

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          const validation = await this.validateFile(filePath);
          if (validation.isValid) {
            supportedFiles.push(filePath);
          }
        }
      }

      return supportedFiles;
    } catch (error) {
      throw new Error(`Failed to read directory ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 安全地写入文件
   */
  static async writeFile(filePath: string, content: string): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      await this.ensureDirectoryExists(dir);
      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取用户配置
   */
  static getConfig(): ConversionConfig {
    const config = vscode.workspace.getConfiguration('documentConverter');
    
    return {
      outputDirectory: config.get<string>('outputDirectory') || '',
      maxRowsExcel: config.get<number>('maxRowsExcel') || 1000,
      preserveFormatting: config.get<boolean>('preserveFormatting') || true,
      autoOpenResult: config.get<boolean>('autoOpenResult') || true
    };
  }

  /**
   * 打开文件
   */
  static async openFile(filePath: string): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      // 如果无法在编辑器中打开，尝试用系统默认程序打开
      vscode.env.openExternal(vscode.Uri.file(filePath));
    }
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) {
      return '0 Bytes';
    }
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
