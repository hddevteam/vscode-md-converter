import * as fs from 'fs/promises';
import * as path from 'path';
import { ConversionResult, ConversionOptions } from '../types';
import { FileUtils } from '../utils/fileUtils';

// 在模块加载时设置正确的工作目录，然后导入pdf-parse
let pdfParse: any;

try {
  // 保存当前工作目录
  const originalCwd = process.cwd();
  
  // 查找包含 node_modules 的项目根目录
  let projectRoot = __dirname;
  while (projectRoot && projectRoot !== '/') {
    const nodeModulesPath = require('path').join(projectRoot, 'node_modules');
    if (require('fs').existsSync(nodeModulesPath)) {
      break;
    }
    projectRoot = require('path').dirname(projectRoot);
  }
  
  try {
    // 临时切换到项目根目录
    if (projectRoot && projectRoot !== originalCwd) {
      process.chdir(projectRoot);
    }
    
    // 导入 pdf-parse
    pdfParse = require('pdf-parse');
  } finally {
    // 恢复原始工作目录
    process.chdir(originalCwd);
  }
} catch (error) {
  console.warn('PDF-parse 加载警告:', error);
  // 如果仍然失败，尝试不改变工作目录直接导入
  try {
    pdfParse = require('pdf-parse');
  } catch (fallbackError) {
    console.error('PDF-parse 加载失败:', fallbackError);
  }
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
        // 使用基本的解析选项，避免复杂的自定义渲染器
        pdfData = await pdfParse(dataBuffer, {
          max: 0 // 解析所有页面
        });
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
     // 改进的文本处理逻辑
    const processedText = PdfToTextConverter.formatForReadability(text);

    // 按段落分割文本
    const paragraphs = processedText
      .split(/\n\s*\n/)  // 按多个换行符分割段落
      .map((paragraph: string) => paragraph.trim())
      .filter((paragraph: string) => paragraph.length > 0);
    
    // 输出段落
    for (let i = 0; i < paragraphs.length; i++) {
      if (i > 0) {
        result += '\n\n';
      }
      
      // 处理每个段落内的换行
      const cleanParagraph = paragraphs[i]
        .replace(/\n+/g, ' ')  // 将段落内的换行替换为空格
        .replace(/\s+/g, ' ')  // 合并多个空格为一个
        .trim();
      
      result += cleanParagraph;
    }
    
    return result;
  }
  
  /**
   * 改进文本空格处理
   */
  private static improveTextSpacing(text: string): string {
    // 处理PDF提取文本中常见的空格问题
    let processedText = text;
    
    // 1. 修复被错误分割的单词（连续字母之间缺少空格）
    // 例如: "HelloWorld" -> "Hello World"
    processedText = processedText.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    // 2. 修复数字和字母之间的空格
    // 例如: "123abc" -> "123 abc", "abc123" -> "abc 123"
    processedText = processedText.replace(/(\d)([a-zA-Z])/g, '$1 $2');
    processedText = processedText.replace(/([a-zA-Z])(\d)/g, '$1 $2');
    
    // 3. 修复标点符号前后的空格
    // 确保标点符号后有空格，前面没有多余空格
    processedText = processedText.replace(/\s*([,.!?;:])\s*/g, '$1 ');
    
    // 4. 修复常见的PDF文本提取问题
    // 处理连续的大写字母后跟小写字母的情况
    processedText = processedText.replace(/([A-Z]{2,})([a-z])/g, (match, caps, lower) => {
      // 如果有多个大写字母，在最后一个大写字母前插入空格
      const lastCap = caps.slice(-1);
      const restCaps = caps.slice(0, -1);
      return restCaps + ' ' + lastCap + lower;
    });
    
    // 5. 修复句子之间的空格
    // 确保句子结束后有适当的空格
    processedText = processedText.replace(/([.!?])\s*([A-Z])/g, '$1 $2');
    
    // 6. 处理PDF中常见的连字符问题
    // 修复被错误分割的连字符单词
    processedText = processedText.replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2');
    
    // 7. 清理多余的空白字符
    processedText = processedText.replace(/[ \t]+/g, ' ');  // 合并空格和制表符
    processedText = processedText.replace(/\n[ \t]+/g, '\n');  // 移除行首的空格
    processedText = processedText.replace(/[ \t]+\n/g, '\n');  // 移除行尾的空格
    
    return processedText;
  }

  // 高级文本格式化方法
  private static formatForReadability(text: string): string {
    let formatted = text;

    // 1. 识别和保护特殊格式（如代码块、链接等）
    const protectedSections: string[] = [];
    let protectionIndex = 0;

    // 保护看起来像URL的文本
    formatted = formatted.replace(/https?:\/\/[^\s]+/g, (match) => {
      const placeholder = `__PROTECTED_URL_${protectionIndex++}__`;
      protectedSections.push(match);
      return placeholder;
    });

    // 保护看起来像邮件地址的文本
    formatted = formatted.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (match) => {
      const placeholder = `__PROTECTED_EMAIL_${protectionIndex++}__`;
      protectedSections.push(match);
      return placeholder;
    });

    // 2. 应用现有的文本改进
    formatted = PdfToTextConverter.improveTextSpacing(formatted);

    // 3. 恢复保护的内容
    protectedSections.forEach((section, index) => {
      const placeholder = section.includes('@') 
        ? `__PROTECTED_EMAIL_${index}__`
        : `__PROTECTED_URL_${index}__`;
      formatted = formatted.replace(placeholder, section);
    });

    // 4. 最终清理
    formatted = formatted
      .replace(/\n{3,}/g, '\n\n')  // 最多保留两个连续换行
      .replace(/^[ \t]+/gm, '')    // 移除行首空格
      .replace(/[ \t]+$/gm, '');   // 移除行尾空格

    return formatted.trim();
  }
}
