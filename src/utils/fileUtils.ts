import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { FileValidationResult, SupportedFileType, ConversionConfig, MarkdownInfoField, MarkdownInfoConfig } from '../types';

export class FileUtils {
  /**
   * Validate if file is in supported format
   */
  static async validateFile(filePath: string): Promise<FileValidationResult> {
    try {
      console.log(`正在验证文件: ${filePath}`);
      
      // Check if file exists
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
        '.pdf': 'pdf',
        '.pptx': 'pptx',
        '.ppt': 'ppt'
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
   * Generate output file path
   */
  static generateOutputPath(inputPath: string, targetExtension: string, outputDir?: string): string {
    const inputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputDirectory = outputDir || inputDir;
    
    return path.join(outputDirectory, `${baseName}${targetExtension}`);
  }

  /**
   * Ensure directory exists
   */
  static async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all supported files in a folder
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
   * Safely write file
   */
  static async writeFile(filePath: string, content: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      await this.ensureDirectoryExists(dir);
      await fs.writeFile(filePath, content, encoding);
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Write CSV file with Excel compatibility
   */
  static async writeCsvFile(filePath: string, content: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      await this.ensureDirectoryExists(dir);
      
      let finalContent = content;
      
      // For UTF-8 encoding with Chinese content, add BOM for Excel compatibility
      if (encoding === 'utf8' && this.containsChinese(content)) {
        finalContent = '\uFEFF' + content; // Add UTF-8 BOM
      }
      
      await fs.writeFile(filePath, finalContent, encoding);
    } catch (error) {
      throw new Error(`Failed to write CSV file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if text contains Chinese characters
   */
  private static containsChinese(text: string): boolean {
    return /[\u4e00-\u9fff]/.test(text);
  }

  /**
   * Get user configuration
   */
  static getConfig(): ConversionConfig {
    const config = vscode.workspace.getConfiguration('documentConverter');
    
    return {
      outputDirectory: config.get<string>('outputDirectory') || '',
      maxRowsExcel: config.get<number>('maxRowsExcel') || 1000,
      preserveFormatting: config.get<boolean>('preserveFormatting') || true,
      autoOpenResult: config.get<boolean>('autoOpenResult') || true,
      // Table extraction configuration with defaults
      tableOutputMode: config.get<'separate' | 'combined' | 'ask'>('tableOutputMode') || 'separate',
      tableCsvEncoding: config.get<BufferEncoding>('tableCsvEncoding') || 'utf8',
      tableCsvDelimiter: config.get<',' | ';' | '\t'>('tableCsvDelimiter') || ',',
      includeTableMetadata: config.get<boolean>('includeTableMetadata') || false,
      // Markdown info block configuration with defaults
      markdownInfoFields: (config.get<string[]>('markdownInfoFields') as MarkdownInfoField[]) || ['title', 'sourceNotice', 'fileInfo', 'contentHeading', 'sectionSeparators'],
      rememberMarkdownInfoSelection: config.get<boolean>('rememberMarkdownInfoSelection') || true
    };
  }

  /**
   * Get table extraction configuration
   */
  static getTableConfig(): { includeMetadata: boolean } {
    const config = vscode.workspace.getConfiguration('documentConverter');
    return {
      includeMetadata: config.get<boolean>('includeTableMetadata') || false
    };
  }

  /**
   * Get markdown info block configuration
   */
  static getMarkdownInfoConfig(): MarkdownInfoConfig {
    const config = vscode.workspace.getConfiguration('documentConverter');
    const selectedFields = (config.get<string[]>('markdownInfoFields') as MarkdownInfoField[]) || [];
    
    return {
      includeTitle: selectedFields.includes('title'),
      includeSourceNotice: selectedFields.includes('sourceNotice'),
      includeFileInfo: selectedFields.includes('fileInfo'),
      includeMetadata: selectedFields.includes('metadata'),
      includeConversionWarnings: selectedFields.includes('conversionWarnings'),
      includeContentHeading: selectedFields.includes('contentHeading'),
      includeSectionSeparators: selectedFields.includes('sectionSeparators')
    };
  }

  /**
   * Check if the user has explicitly customized markdown info fields
   * rather than using the default values from package.json
   */
  static hasUserDefinedMarkdownInfoFields(): boolean {
    const config = vscode.workspace.getConfiguration('documentConverter');
    const inspected = config.inspect<string[]>('markdownInfoFields');
    if (!inspected) {
      return false;
    }
    // If any of these are defined (even empty array), user/workspace has overridden the default
    return (
      inspected.globalValue !== undefined ||
      inspected.workspaceValue !== undefined ||
      inspected.workspaceFolderValue !== undefined
    );
  }

  /**
   * Open file
   */
  static async openFile(filePath: string): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      // If unable to open in editor, try opening with system default program
      vscode.env.openExternal(vscode.Uri.file(filePath));
    }
  }

  /**
   * Format file size
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
