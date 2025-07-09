import * as mammoth from 'mammoth';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { TableExtractorBase } from './tableExtractorBase';
import { TableData, TableConversionResult, ConversionOptions, TableExtractionOptions } from '../types';
import { FileUtils } from '../utils/fileUtils';
import { I18n } from '../i18n';

export class WordTableToCsvConverter extends TableExtractorBase {
  /**
   * 从Word文档中提取表格并转换为CSV
   */
  static async convert(inputPath: string, options?: ConversionOptions): Promise<TableConversionResult> {
    const startTime = Date.now();
    
    try {
      // Validate file
      const validation = await FileUtils.validateFile(inputPath);
      if (!validation.isValid) {
        return {
          success: false,
          inputPath,
          error: validation.error || I18n.t('error.unsupportedFormat', 'Invalid file format')
        };
      }

      if (validation.fileType !== 'docx' && validation.fileType !== 'doc') {
        return {
          success: false,
          inputPath,
          error: I18n.t('error.unsupportedFormat', validation.fileType || path.extname(inputPath))
        };
      }

      // Extract tables
      const tables = await this.extractTablesFromWord(inputPath);
      
      if (tables.length === 0) {
        return {
          success: true,
          inputPath,
          tables: [],
          csvPaths: [],
          tableCount: 0,
          duration: Date.now() - startTime
        };
      }

      // 获取配置
      const config = FileUtils.getConfig();
      const tableConfig = FileUtils.getTableConfig();
      
      // 处理输出模式
      let outputMode: 'separate' | 'combined' = 'separate';
      const configOutputMode = options?.tableOutputMode || config.tableOutputMode;
      
      if (configOutputMode === 'ask') {
        const userChoice = await this.promptUserForOutputMode(tables.length);
        if (!userChoice) {
          return {
            success: false,
            inputPath,
            error: I18n.t('progress.cancelled')
          };
        }
        outputMode = userChoice;
      } else if (configOutputMode === 'combined') {
        outputMode = 'combined';
      }

      const extractionOptions = this.createDefaultExtractionOptions({
        outputMode,
        encoding: (options?.tableCsvEncoding || config.tableCsvEncoding || 'utf8') as BufferEncoding,
        delimiter: options?.tableCsvDelimiter || config.tableCsvDelimiter || ',',
        includeMetadata: tableConfig.includeMetadata
      });

      // 生成输出路径
      const outputDir = options?.outputDirectory || config.outputDirectory || path.dirname(inputPath);
      const baseOutputPath = FileUtils.generateOutputPath(inputPath, '.csv', outputDir);

      // 保存CSV文件
      const csvPaths = await this.saveTablesToCsv(tables, baseOutputPath, extractionOptions);

      const duration = Date.now() - startTime;

      return {
        success: true,
        inputPath,
        outputPath: csvPaths[0], // 主要输出路径
        tables,
        csvPaths,
        tableCount: tables.length,
        duration
      };

    } catch (error) {
      return {
        success: false,
        inputPath,
        error: I18n.t('table.tableExtractionFailed', error instanceof Error ? error.message : I18n.t('error.unknownError'))
      };
    }
  }

  /**
   * 从Word文档中提取表格数据
   */
  private static async extractTablesFromWord(inputPath: string): Promise<TableData[]> {
    const buffer = await fs.readFile(inputPath);
    const tables: TableData[] = [];

    try {
      // 使用mammoth提取原始XML中的表格信息
      const result = await mammoth.extractRawText(buffer);

      // 使用自定义转换器提取表格
      const customResult = await mammoth.convertToHtml(buffer, {
        styleMap: '',
        transformDocument: (document) => {
          // 查找所有表格元素
          const tableElements = this.findTableElements(document);
          
          for (let i = 0; i < tableElements.length; i++) {
            const tableElement = tableElements[i];
            const tableData = this.extractTableFromElement(tableElement, i);
            
            if (tableData) {
              tables.push(tableData);
            }
          }
          
          return document;
        }
      });

      // 如果自定义转换失败，尝试备用方法
      if (tables.length === 0) {
        const fallbackTables = await this.extractTablesFromHtml(customResult.value);
        tables.push(...fallbackTables);
      }

    } catch (error) {
      console.warn('Word table extraction error:', error);
      // 尝试简单的文本解析方法
      const textTables = await this.extractTablesFromText(inputPath);
      tables.push(...textTables);
    }

    return tables;
  }

  /**
   * 从mammoth文档对象中查找表格元素
   */
  private static findTableElements(document: any): any[] {
    const tables: any[] = [];
    
    const walk = (element: any) => {
      if (element.type === 'table') {
        tables.push(element);
      }
      
      if (element.children) {
        element.children.forEach(walk);
      }
    };
    
    if (document.children) {
      document.children.forEach(walk);
    }
    
    return tables;
  }

  /**
   * 从表格元素中提取数据
   */
  private static extractTableFromElement(tableElement: any, index: number): TableData | null {
    try {
      const rows: string[][] = [];
      
      if (tableElement.children) {
        for (const row of tableElement.children) {
          if (row.type === 'tableRow' && row.children) {
            const cellValues: string[] = [];
            
            for (const cell of row.children) {
              if (cell.type === 'tableCell') {
                const cellText = this.extractTextFromElement(cell);
                cellValues.push(cellText.trim());
              }
            }
            
            if (cellValues.length > 0) {
              rows.push(cellValues);
            }
          }
        }
      }

      if (rows.length === 0) {
        return null;
      }

      const cleanedRows = this.cleanTableData(rows);
      
      if (!this.validateTable(cleanedRows, this.createDefaultExtractionOptions())) {
        return null;
      }

      return {
        id: this.generateTableId(index),
        rows: cleanedRows,
        rowCount: cleanedRows.length,
        columnCount: Math.max(...cleanedRows.map(row => row.length)),
        sourceLocation: {
          section: I18n.t('word.content')
        }
      };

    } catch (error) {
      console.warn('Error extracting table from element:', error);
      return null;
    }
  }

  /**
   * 从元素中提取文本内容
   */
  private static extractTextFromElement(element: any): string {
    if (!element) {
      return '';
    }

    if (typeof element === 'string') {
      return element;
    }

    if (element.type === 'text') {
      return element.value || '';
    }

    let text = '';
    if (element.children) {
      for (const child of element.children) {
        text += this.extractTextFromElement(child);
      }
    }

    return text;
  }

  /**
   * 从HTML中提取表格（备用方法）
   */
  private static async extractTablesFromHtml(html: string): Promise<TableData[]> {
    const tables: TableData[] = [];
    
    try {
      // 简单的HTML表格解析
      const tableRegex = /<table[^>]*>(.*?)<\/table>/gis;
      let tableMatch;
      let tableIndex = 0;

      while ((tableMatch = tableRegex.exec(html)) !== null) {
        const tableHtml = tableMatch[1];
        const rows = this.parseHtmlTableRows(tableHtml);
        
        if (rows.length > 0) {
          const cleanedRows = this.cleanTableData(rows);
          
          if (this.validateTable(cleanedRows, this.createDefaultExtractionOptions())) {
            tables.push({
              id: this.generateTableId(tableIndex),
              rows: cleanedRows,
              rowCount: cleanedRows.length,
              columnCount: Math.max(...cleanedRows.map(row => row.length)),
              sourceLocation: {
                section: I18n.t('word.content')
              }
            });
            tableIndex++;
          }
        }
      }
    } catch (error) {
      console.warn('HTML table parsing error:', error);
    }

    return tables;
  }

  /**
   * 解析HTML表格行
   */
  private static parseHtmlTableRows(tableHtml: string): string[][] {
    const rows: string[][] = [];
    
    try {
      const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
      let rowMatch;

      while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
        const rowHtml = rowMatch[1];
        const cells: string[] = [];
        
        const cellRegex = /<t[dh][^>]*>(.*?)<\/t[dh]>/gis;
        let cellMatch;

        while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
          const cellContent = cellMatch[1]
            .replace(/<[^>]*>/g, '') // 移除HTML标签
            .replace(/&nbsp;/g, ' ') // 替换&nbsp;
            .replace(/&amp;/g, '&')  // 替换&amp;
            .replace(/&lt;/g, '<')   // 替换&lt;
            .replace(/&gt;/g, '>')   // 替换&gt;
            .trim();
          
          cells.push(cellContent);
        }

        if (cells.length > 0) {
          rows.push(cells);
        }
      }
    } catch (error) {
      console.warn('HTML row parsing error:', error);
    }

    return rows;
  }

  /**
   * 从纯文本中提取表格（最后备用方法）
   */
  private static async extractTablesFromText(inputPath: string): Promise<TableData[]> {
    try {
      const buffer = await fs.readFile(inputPath);
      const result = await mammoth.extractRawText(buffer);
      const text = result.value;

      return this.parseTextTables(text);
    } catch (error) {
      console.warn('Text table extraction error:', error);
      return [];
    }
  }

  /**
   * 从文本中解析类似表格的结构
   */
  private static parseTextTables(text: string): TableData[] {
    const tables: TableData[] = [];
    const lines = text.split('\n');
    let currentTable: string[][] = [];
    let tableIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检测可能的表格行（包含制表符或多个空格分隔的内容）
      if (this.looksLikeTableRow(line)) {
        const cells = this.parseTableRowFromText(line);
        if (cells.length > 1) {
          currentTable.push(cells);
        }
      } else {
        // 如果遇到非表格行，结束当前表格
        if (currentTable.length > 0) {
          const cleanedTable = this.cleanTableData(currentTable);
          if (this.validateTable(cleanedTable, this.createDefaultExtractionOptions())) {
            tables.push({
              id: this.generateTableId(tableIndex),
              rows: cleanedTable,
              rowCount: cleanedTable.length,
              columnCount: Math.max(...cleanedTable.map(row => row.length)),
              sourceLocation: {
                section: I18n.t('word.content')
              }
            });
            tableIndex++;
          }
          currentTable = [];
        }
      }
    }

    // 处理最后一个表格
    if (currentTable.length > 0) {
      const cleanedTable = this.cleanTableData(currentTable);
      if (this.validateTable(cleanedTable, this.createDefaultExtractionOptions())) {
        tables.push({
          id: this.generateTableId(tableIndex),
          rows: cleanedTable,
          rowCount: cleanedTable.length,
          columnCount: Math.max(...cleanedTable.map(row => row.length)),
          sourceLocation: {
            section: I18n.t('word.content')
          }
        });
      }
    }

    return tables;
  }

  /**
   * 检查文本行是否看起来像表格行
   */
  private static looksLikeTableRow(line: string): boolean {
    if (!line || line.length < 3) {
      return false;
    }

    // 检查是否包含制表符
    if (line.includes('\t')) {
      return true;
    }

    // 检查是否包含多个连续空格（可能是列分隔符）
    if (/\s{2,}/.test(line)) {
      return true;
    }

    // 检查是否包含常见的表格分隔符
    if (/[|,;]/.test(line)) {
      const parts = line.split(/[|,;]/).filter(part => part.trim().length > 0);
      return parts.length > 1;
    }

    return false;
  }

  /**
   * 从文本行中解析表格单元格
   */
  private static parseTableRowFromText(line: string): string[] {
    let cells: string[] = [];

    // 优先使用制表符分割
    if (line.includes('\t')) {
      cells = line.split('\t').map(cell => cell.trim());
    }
    // 使用其他分隔符
    else if (/[|,;]/.test(line)) {
      const delimiter = line.includes('|') ? '|' : (line.includes(',') ? ',' : ';');
      cells = line.split(delimiter).map(cell => cell.trim());
    }
    // 使用多个空格分割
    else if (/\s{2,}/.test(line)) {
      cells = line.split(/\s{2,}/).map(cell => cell.trim()).filter(cell => cell.length > 0);
    }

    return cells.filter(cell => cell.length > 0);
  }

  /**
   * 提示用户选择输出模式
   */
  private static async promptUserForOutputMode(tableCount: number): Promise<'separate' | 'combined' | null> {
    const choice = await vscode.window.showQuickPick([
      {
        label: I18n.t('table.outputModeSeparate'),
        detail: I18n.t('table.outputModeSeparate'),
        value: 'separate'
      },
      {
        label: I18n.t('table.outputModeCombined'),
        detail: I18n.t('table.outputModeCombined'),
        value: 'combined'
      }
    ], {
      placeHolder: I18n.t('table.outputModePrompt'),
      ignoreFocusOut: true
    });

    return choice?.value as 'separate' | 'combined' || null;
  }
}
