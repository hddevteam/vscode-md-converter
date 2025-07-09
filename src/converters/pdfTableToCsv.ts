import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { TableExtractorBase } from './tableExtractorBase';
import { TableData, TableConversionResult, ConversionOptions, TableExtractionOptions } from '../types';
import { FileUtils } from '../utils/fileUtils';
import { I18n } from '../i18n';

// Import PDF libraries with error handling
let pdfParse: any;

// Dynamic imports for better compatibility in VS Code extension environment
async function loadPdfLibraries() {
  // Load pdf-parse for text-based extraction
  try {
    pdfParse = require('pdf-parse');
  } catch (error) {
    pdfParse = null;
  }
}

// Initialize libraries immediately
loadPdfLibraries();

/**
 * PDF表格提取到CSV转换器
 */
export class PdfTableToCsvConverter extends TableExtractorBase {
  /**
   * Convert PDF table to CSV
   */
  static async convert(inputPath: string, options?: ConversionOptions): Promise<TableConversionResult> {
    const startTime = Date.now();
    
    try {
      // Ensure PDF libraries are loaded
      await loadPdfLibraries();
      
      // Check if PDF parsers are available
      if (!pdfParse) {
        return {
          success: false,
          inputPath,
          error: I18n.t('error.pdfParseUnavailable')
        };
      }

      // Validate file
      const validation = await FileUtils.validateFile(inputPath);
      if (!validation.isValid) {
        return {
          success: false,
          inputPath,
          error: validation.error || I18n.t('error.unsupportedFormat', 'Invalid file format')
        };
      }

      if (validation.fileType !== 'pdf') {
        return {
          success: false,
          inputPath,
          error: I18n.t('error.unsupportedFormat', validation.fileType || path.extname(inputPath))
        };
      }

      // Extract tables
      const tables = await this.extractTablesFromPdf(inputPath);
      
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

      // Get configuration
      const config = FileUtils.getConfig();
      const tableConfig = FileUtils.getTableConfig();
      
      // Handle output mode
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

      // Generate output paths
      const outputDir = options?.outputDirectory || config.outputDirectory || path.dirname(inputPath);
      const baseOutputPath = FileUtils.generateOutputPath(inputPath, '.csv', outputDir);

      // Save CSV files
      const csvPaths = await this.saveTablesToCsv(tables, baseOutputPath, extractionOptions);

      const duration = Date.now() - startTime;

      return {
        success: true,
        inputPath,
        outputPath: csvPaths[0], // Primary output path
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
   * Extract table data from PDF document using text-based approach
   */
  private static async extractTablesFromPdf(inputPath: string): Promise<TableData[]> {
    const buffer = await fs.readFile(inputPath);
    let tables: TableData[] = [];

    try {
      // Use pdf-parse for text-based extraction
      if (pdfParse) {
        tables = await this.extractTablesWithTextParsing(buffer);
      }

    } catch (error) {
      throw new Error(I18n.t('error.pdfParseFailed', error instanceof Error ? error.message : 'Unknown error'));
    }

    return tables;
  }

  /**
   * Extract tables using text-based parsing with pdf-parse
   */
  private static async extractTablesWithTextParsing(buffer: Buffer): Promise<TableData[]> {
    const tables: TableData[] = [];

    try {
      // Parse PDF
      const data = await pdfParse(buffer);
      const text = data.text;

      if (!text || text.trim().length === 0) {
        return tables;
      }

      // Split text by pages
      const pages = this.splitTextIntoPages(text, data.numpages);

      // Search for tables in each page
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const pageText = pages[pageIndex];
        const pageTables = await this.extractTablesFromPageText(pageText, pageIndex + 1);
        tables.push(...pageTables);
      }

    } catch (error) {
      console.error('Text parsing error:', error);
      throw error;
    }

    return tables;
  }

  /**
   * 将PDF文本分割为页面
   */
  private static splitTextIntoPages(text: string, pageCount: number): string[] {
    // For single page PDF, return the entire text as one page
    if (pageCount === 1) {
      return [text];
    }
    
    const pages: string[] = [];
    
    // Try to split by page separators
    const pageBreaks = text.split(/\f|\n\s*\n(?=\S)/);
    
    if (pageBreaks.length >= pageCount) {
      return pageBreaks.slice(0, pageCount);
    }

    // If unable to split accurately, divide text evenly
    const lines = text.split('\n');
    const linesPerPage = Math.ceil(lines.length / pageCount);
    
    for (let i = 0; i < pageCount; i++) {
      const startLine = i * linesPerPage;
      const endLine = Math.min((i + 1) * linesPerPage, lines.length);
      const pageText = lines.slice(startLine, endLine).join('\n');
      pages.push(pageText);
    }

    return pages;
  }

  /**
   * 从页面文本中提取表格
   */
  private static async extractTablesFromPageText(pageText: string, pageNumber: number): Promise<TableData[]> {
    const tables: TableData[] = [];
    const lines = pageText.split('\n');
    
    // Look for potential table regions
    const tableRegions = this.findTableRegions(lines);
    
    for (let regionIndex = 0; regionIndex < tableRegions.length; regionIndex++) {
      const region = tableRegions[regionIndex];
      const tableData = this.parseTableFromRegion(region, pageNumber, regionIndex + 1);
      
      if (tableData) {
        tables.push(tableData);
      }
    }

    return tables;
  }

  /**
   * Find possible table regions with lower threshold
   */
  private static findTableRegions(lines: string[]): string[][] {
    const regions: string[][] = [];
    let currentRegion: string[] = [];
    let consecutiveTableLines = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isTableLine = this.looksLikeTableRow(line);
      
      if (isTableLine) {
        currentRegion.push(line);
        consecutiveTableLines++;
      } else if (line.length === 0) {
        // Empty line, if we have enough table lines, end current region
        if (consecutiveTableLines >= 1) { // Lower threshold
          if (currentRegion.length >= 1) { // Lower threshold
            regions.push([...currentRegion]);
          }
        }
        currentRegion = [];
        consecutiveTableLines = 0;
      } else {
        // Non-table line
        if (consecutiveTableLines >= 1) { // Lower threshold
          // If we had consecutive table lines before, save current region
          if (currentRegion.length >= 1) { // Lower threshold
            regions.push([...currentRegion]);
          }
        }
        currentRegion = [];
        consecutiveTableLines = 0;
      }
    }
    
    // Check the last region
    if (currentRegion.length >= 1 && consecutiveTableLines >= 1) { // Lower threshold
      regions.push(currentRegion);
    }

    return regions;
  }

  /**
   * Check if text line looks like a table row (more lenient)
   */
  private static looksLikeTableRow(line: string): boolean {
    if (!line || line.length < 3) {
      return false;
    }

    // Check for tab characters
    if (line.includes('\t')) {
      return true;
    }

    // Check for multiple consecutive spaces (possible column separators)
    const spaceSeparated = /\s{2,}/.test(line);
    if (spaceSeparated) {
      const parts = line.split(/\s{2,}/).filter(part => part.trim().length > 0);
      if (parts.length >= 2) {
        return true;
      }
    }

    // Check for common table separators
    if (/[|,;]/.test(line)) {
      const parts = line.split(/[|,;]/).filter(part => part.trim().length > 0);
      if (parts.length >= 2) {
        return true;
      }
    }

    // Check for single space separation with multiple parts and numbers
    // This is for tables like "港币 100 人民币 85.68 85.68 85.34 84.74"
    const singleSpaceParts = line.split(/\s+/).filter(part => part.trim().length > 0);
    if (singleSpaceParts.length >= 4) { // Need at least 4 parts for a meaningful table row
      const hasNumbers = singleSpaceParts.some(part => /^\d+(\.\d+)?$/.test(part));
      if (hasNumbers) {
        return true;
      }
    }

    // Check for mixed numbers and text (possibly data rows) - lowered threshold
    const hasNumbers = /\d/.test(line);
    const hasText = /[a-zA-Z\u4e00-\u9fff]/.test(line);
    const words = line.split(/\s+/).filter(word => word.length > 0);
    if (hasNumbers && hasText && words.length >= 2) {
      return true;
    }

    // Even more lenient: check for multiple words that might be columns
    if (words.length >= 3) {
      const hasVariedLengths = words.some(word => word.length > 3) && words.some(word => word.length <= 3);
      if (hasVariedLengths) {
        return true;
      }
    }

    return false;
  }

  /**
   * 从表格区域解析表格数据
   */
  private static parseTableFromRegion(region: string[], pageNumber: number, tableIndex: number): TableData | null {
    if (region.length < 2) {
      return null;
    }

    const rows: string[][] = [];
    
    for (const line of region) {
      const cells = this.parseTableRowFromText(line);
      if (cells.length >= 2) {
        rows.push(cells);
      }
    }

    if (rows.length < 2) {
      return null;
    }

    // Normalize column count (use the most common column count)
    const columnCounts = rows.map(row => row.length);
    const mostCommonColumnCount = this.getMostCommonValue(columnCounts);
    
    const normalizedRows = rows.map(row => {
      if (row.length < mostCommonColumnCount) {
        // 补充空列
        return [...row, ...Array(mostCommonColumnCount - row.length).fill('')];
      } else if (row.length > mostCommonColumnCount) {
        // 截断多余列
        return row.slice(0, mostCommonColumnCount);
      }
      return row;
    });

    return {
      id: `page${pageNumber}_table${tableIndex}`,
      title: `Page ${pageNumber} Table ${tableIndex}`,
      rows: normalizedRows,
      rowCount: normalizedRows.length,
      columnCount: mostCommonColumnCount,
      sourceLocation: {
        page: pageNumber,
        section: `Table ${tableIndex}`
      }
    };
  }

  /**
   * 从文本行中解析表格单元格
   */
  private static parseTableRowFromText(line: string): string[] {
    let cells: string[] = [];

    // Use tab delimiters first
    if (line.includes('\t')) {
      cells = line.split('\t').map(cell => cell.trim());
    }
    // Use other delimiters
    else if (/[|,;]/.test(line)) {
      const delimiter = line.includes('|') ? '|' : (line.includes(',') ? ',' : ';');
      cells = line.split(delimiter).map(cell => cell.trim());
    }
    // Use multiple spaces for splitting
    else if (/\s{2,}/.test(line)) {
      cells = line.split(/\s{2,}/).map(cell => cell.trim()).filter(cell => cell.length > 0);
    }
    // Use single space splitting (suitable for forex rate tables)
    else {
      const parts = line.split(/\s+/).filter(part => part.trim().length > 0);
      if (parts.length >= 4) { // At least 4 columns to be considered as a table row
        cells = parts;
      }
    }

    return cells.filter(cell => cell.length > 0);
  }

  /**
   * 获取数组中最常见的值
   */
  private static getMostCommonValue(arr: number[]): number {
    const counts: { [key: number]: number } = {};
    let maxCount = 0;
    let mostCommon = arr[0];

    for (const value of arr) {
      counts[value] = (counts[value] || 0) + 1;
      if (counts[value] > maxCount) {
        maxCount = counts[value];
        mostCommon = value;
      }
    }

    return mostCommon;
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
