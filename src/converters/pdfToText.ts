import * as fs from 'fs/promises';
import * as path from 'path';
import { ConversionResult, ConversionOptions } from '../types';
import { FileUtils } from '../utils/fileUtils';

// 使用动态导入来避免在模块加载时触发pdf-parse的测试
let pdfParse: any = null;

async function getPdfParse() {
  if (!pdfParse) {
    try {
      pdfParse = await import('pdf-parse');
      // 如果是CommonJS模块，获取default导出
      pdfParse = pdfParse.default || pdfParse;
    } catch (error) {
      throw new Error(`无法加载PDF解析库: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  return pdfParse;
}

export class PdfToTextConverter {
  /**
   * 将PDF文件转换为文本
   */
  static async convert(inputPath: string, options?: ConversionOptions): Promise<ConversionResult> {
    const startTime = Date.now();
    
    try {
      // 验证文件
      const validation = await FileUtils.validateFile(inputPath);
      if (!validation.isValid) {
        return {
          success: false,
          inputPath,
          error: validation.error || '无效的文件格式'
        };
      }

      if (validation.fileType !== 'pdf') {
        return {
          success: false,
          inputPath,
          error: `不支持的文件类型: ${validation.fileType || path.extname(inputPath)}`
        };
      }

      // 读取PDF文件
      let dataBuffer;
      try {
        dataBuffer = await fs.readFile(inputPath);
      } catch (err) {
        return {
          success: false,
          inputPath,
          error: `无法读取PDF文件: ${err instanceof Error ? err.message : '未知错误'}`
        };
      }
      
      // 解析PDF
      let pdfData;
      try {
        const pdfParseLibrary = await getPdfParse();
        pdfData = await pdfParseLibrary(dataBuffer);
      } catch (err) {
        return {
          success: false,
          inputPath,
          error: `无法解析PDF文件: ${err instanceof Error ? err.message : '未知错误'}`
        };
      }
      
      // 提取文本
      const text = this.formatPdfText(pdfData);
      
      // 生成输出路径
      const config = FileUtils.getConfig();
      const outputDir = options?.outputDirectory || config.outputDirectory || path.dirname(inputPath);
      const outputPath = FileUtils.generateOutputPath(inputPath, '.txt', outputDir);
      
      // 保存文本文件
      await FileUtils.writeFile(outputPath, text);
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        inputPath,
        outputPath,
        duration
      };
    } catch (error) {
      return {
        success: false,
        inputPath,
        error: `转换失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
  
  /**
   * 格式化PDF文本
   */
  private static formatPdfText(pdfData: import('pdf-parse').PDFData): string {
    const { text, numpages, info } = pdfData;
    const filename = info?.Title || 'Unnamed PDF';
    
    // 标题信息
    let result = `# ${filename}\n\n`;
    
    // 文件信息
    result += '## 文件信息\n\n';
    result += `- 页数: ${numpages}\n`;
    
    if (info) {
      if (info.Author) {
        result += `- 作者: ${info.Author}\n`;
      }
      if (info.CreationDate) {
        result += `- 创建日期: ${info.CreationDate}\n`;
      }
      if (info.Creator) {
        result += `- 创建工具: ${info.Creator}\n`;
      }
    }
    
    result += '\n';
    result += '## 文本内容\n\n';
    
    // 处理每页文本
    const pageTexts = text.split('\n\n').filter((t: string) => t.trim());
    
    for (let i = 0; i < pageTexts.length; i++) {
      if (i > 0) {
        result += `\n${'-'.repeat(80)}\n\n`;
      }
      result += pageTexts[i] + '\n';
    }
    
    return result;
  }
}
