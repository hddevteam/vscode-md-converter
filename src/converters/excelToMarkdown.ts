import * as fs from 'fs/promises';
import * as path from 'path';
import * as xlsx from 'xlsx';
import { ConversionResult, ConversionOptions } from '../types';
import { FileUtils } from '../utils/fileUtils';

export class ExcelToMarkdownConverter {
  /**
   * 将Excel/CSV文件转换为Markdown
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

      if (validation.fileType !== 'xlsx' && validation.fileType !== 'xls' && validation.fileType !== 'csv') {
        return {
          success: false,
          inputPath,
          error: `不支持的文件类型: ${validation.fileType || path.extname(inputPath)}`
        };
      }

      // 获取配置
      const config = FileUtils.getConfig();
      const maxRows = options?.maxRows ?? config.maxRowsExcel;

      // 生成Markdown内容
      let markdown = await this.convertExcelToMarkdown(inputPath, maxRows);

      // 生成输出路径
      const outputDir = options?.outputDirectory || config.outputDirectory || path.dirname(inputPath);
      const outputPath = FileUtils.generateOutputPath(inputPath, '.md', outputDir);

      // 保存Markdown文件
      await FileUtils.writeFile(outputPath, markdown);

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
   * 将Excel/CSV文档转换为Markdown
   */
  private static async convertExcelToMarkdown(filePath: string, maxRows: number): Promise<string> {
    // 读取文件
    const fileContent = await fs.readFile(filePath);
    const workbook = xlsx.read(fileContent, { 
      type: 'buffer',
      cellText: true,  // 保留单元格的文本格式
      cellDates: true, // 自动转换日期
      raw: false       // 不使用原始值，使用格式化后的值
    });
    
    // 文件信息
    const fileStats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    const fileNameWithoutExt = path.basename(filePath, path.extname(filePath));
    
    // 创建Markdown内容
    let markdown = '';
    
    // 添加标题和文件信息
    markdown += `# ${fileNameWithoutExt}\n\n`;
    markdown += `*转换自: ${fileName}*\n\n`;
    markdown += `---\n\n`;
    
    markdown += `## 📊 文件信息\n\n`;
    markdown += `- **文件名**: ${fileName}\n`;
    markdown += `- **文件大小**: ${FileUtils.formatFileSize(fileStats.size)}\n`;
    markdown += `- **工作表数量**: ${workbook.SheetNames.length}\n`;
    markdown += `- **工作表列表**: ${workbook.SheetNames.join(', ')}\n\n`;
    
    // 处理每个工作表
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      
      // 获取工作表的范围
      const range = xlsx.utils.decode_range(sheet['!ref'] || 'A1:A1');
      
      markdown += `## 📋 工作表: ${sheetName}\n\n`;
      
      // 检查工作表是否为空
      if (!sheet['!ref'] || range.s.r > range.e.r || range.s.c > range.e.c) {
        markdown += '*该工作表为空*\n\n';
        markdown += '---\n\n';
        continue;
      }
      
      // 使用不同的方式提取数据以保留所有内容
      const data = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, {
        header: 1,  // 使用数组格式，保留所有行
        defval: '', // 空单元格的默认值
        blankrows: true // 包含空行
      }) as any[][];
      
      // 过滤掉完全空的行
      const nonEmptyData = data.filter(row => 
        row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
      );
      
      if (nonEmptyData.length === 0) {
        markdown += '*该工作表为空*\n\n';
        markdown += '---\n\n';
        continue;
      }
      
      markdown += `**数据维度**: ${nonEmptyData.length} 行 x ${Math.max(...nonEmptyData.map(row => row.length))} 列\n\n`;
      
      // 如果数据行数过多，进行截取
      let displayData = nonEmptyData;
      if (nonEmptyData.length > maxRows) {
        markdown += `*注意: 数据行数超过 ${maxRows} 行，仅显示前 ${maxRows} 行*\n\n`;
        displayData = nonEmptyData.slice(0, maxRows);
      }
      
      // 确定最大列数
      const maxCols = Math.max(...displayData.map(row => row.length));
      
      // 创建表格
      for (let rowIndex = 0; rowIndex < displayData.length; rowIndex++) {
        const row = displayData[rowIndex];
        const formattedRow = [];
        
        // 填充每一列
        for (let colIndex = 0; colIndex < maxCols; colIndex++) {
          const cellValue = colIndex < row.length ? row[colIndex] : '';
          formattedRow.push(this.formatCellValue(cellValue));
        }
        
        markdown += '| ' + formattedRow.join(' | ') + ' |\n';
        
        // 在第一行后添加分隔符
        if (rowIndex === 0) {
          markdown += '| ' + Array(maxCols).fill('---').join(' | ') + ' |\n';
        }
      }
      
      markdown += '\n---\n\n';
    }
    
    return markdown;
  }

  /**
   * 格式化单元格值
   */
  private static formatCellValue(value: any): string {
    // 处理null、undefined和空值
    if (value === null || value === undefined) {
      return ' ';
    }
    
    // 处理数字类型
    if (typeof value === 'number') {
      // 如果是NaN，返回空
      if (isNaN(value)) {
        return ' ';
      }
      // 格式化数字，保留必要的小数位
      return value.toString();
    }
    
    // 处理布尔值
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }
    
    // 处理日期对象
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    // 转换为字符串
    let strValue = String(value);
    
    // 如果字符串为空，返回空格
    if (strValue.length === 0) {
      return ' ';
    }
    
    // 处理换行符 - 替换为HTML换行标签
    strValue = strValue.replace(/\r?\n/g, '<br>');
    
    // 处理制表符
    strValue = strValue.replace(/\t/g, '    ');
    
    // 处理管道符（Markdown表格特殊字符）
    strValue = strValue.replace(/\|/g, '\\|');
    
    // 处理反斜杠
    strValue = strValue.replace(/\\/g, '\\\\');
    
    // 去除首尾空白，但保留内容
    const trimmed = strValue.trim();
    
    // 如果trim后为空，但原始值不为空，说明可能全是空白字符
    if (trimmed.length === 0 && strValue.length > 0) {
      return '(空白字符)';
    }
    
    // 如果内容为空，返回单个空格以保持表格格式
    return trimmed.length > 0 ? trimmed : ' ';
  }
}
