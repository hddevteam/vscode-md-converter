import * as fs from 'fs/promises';
import * as path from 'path';
import * as xlsx from 'xlsx';
import { ConversionResult, ConversionOptions, MarkdownInfoConfig } from '../types';
import { FileUtils } from '../utils/fileUtils';
import { I18n } from '../i18n';
import { MarkdownInfoBlockGenerator, DocumentMetadata, ConversionWarning } from './markdownInfoBlockGenerator';

export class ExcelToMarkdownConverter {
  /**
   * Convert Excel/CSV files to Markdown format
   */
  static async convert(inputPath: string, options?: ConversionOptions): Promise<ConversionResult> {
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

      if (validation.fileType !== 'xlsx' && validation.fileType !== 'xls' && validation.fileType !== 'csv') {
        return {
          success: false,
          inputPath,
          error: I18n.t('error.unsupportedFormat', validation.fileType || path.extname(inputPath))
        };
      }

      // Get configuration
      const config = FileUtils.getConfig();
      const maxRows = options?.maxRows ?? config.maxRowsExcel;
      
      // Get Markdown info configuration
      const fileExtension = path.extname(inputPath).toLowerCase();
      const markdownConfig = options?.markdownInfo || 
        FileUtils.getMarkdownInfoConfig() || 
        MarkdownInfoBlockGenerator.getDefaultConfig(fileExtension);

      // Generate Markdown content
      let markdown = await this.convertExcelToMarkdown(inputPath, maxRows, markdownConfig);

      // Generate output path
      const outputDir = options?.outputDirectory || config.outputDirectory || path.dirname(inputPath);
      const outputPath = FileUtils.generateOutputPath(inputPath, '.md', outputDir);

      // Save Markdown file
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
        error: I18n.t('error.conversionFailed', error instanceof Error ? error.message : I18n.t('error.unknownError'))
      };
    }
  }

  /**
   * Convert Excel/CSV document to Markdown format
   */
  private static async convertExcelToMarkdown(filePath: string, maxRows: number, markdownConfig: MarkdownInfoConfig): Promise<string> {
    // Read file
    const fileContent = await fs.readFile(filePath);
    const workbook = xlsx.read(fileContent, { 
      type: 'buffer',
      cellText: true,  // Preserve cell text formatting
      cellDates: true, // Auto convert dates
      raw: false       // Use formatted values instead of raw values
    });
    
    // File information
    const fileStats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    
    // Prepare document metadata
    const metadata: DocumentMetadata = {
      fileName,
      fileSize: fileStats.size,
      modifiedDate: fileStats.mtime,
      worksheetCount: workbook.SheetNames.length,
      worksheetNames: workbook.SheetNames
    };

    // Prepare conversion warnings
    const warnings: ConversionWarning[] = [];
    
    // Create Markdown content
    let markdown = '';
    
    // Generate configurable header
    markdown += await MarkdownInfoBlockGenerator.generateMarkdownHeader(
      filePath,
      markdownConfig,
      metadata,
      warnings
    );
    
    // Process each worksheet
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      
      // Get worksheet range
      const range = xlsx.utils.decode_range(sheet['!ref'] || 'A1:A1');
      
      markdown += `## ${I18n.t('excel.worksheet')}: ${sheetName}\n\n`;
      
      // Check if worksheet is empty
      if (!sheet['!ref'] || range.s.r > range.e.r || range.s.c > range.e.c) {
        markdown += `${I18n.t('excel.emptyWorksheet')}\n\n`;
        if (markdownConfig.includeSectionSeparators) {
          markdown += '---\n\n';
        }
        continue;
      }
      
      // Extract data using different approach to preserve all content
      const data = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, {
        header: 1,  // Use array format, preserve all rows
        defval: '', // Default value for empty cells
        blankrows: true // Include blank rows
      }) as any[][];
      
      // Filter out completely empty rows
      const nonEmptyData = data.filter(row => 
        row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
      );
      
      if (nonEmptyData.length === 0) {
        markdown += `${I18n.t('excel.emptyWorksheet')}\n\n`;
        if (markdownConfig.includeSectionSeparators) {
          markdown += '---\n\n';
        }
        continue;
      }
      
      markdown += `**${I18n.t('excel.dataDimensions')}**: ${I18n.t('excel.dataDimensionsValue', nonEmptyData.length, Math.max(...nonEmptyData.map(row => row.length)))}\n\n`;
      
      // Truncate data if too many rows
      let displayData = nonEmptyData;
      if (nonEmptyData.length > maxRows) {
        markdown += `${I18n.t('excel.rowsLimitNotice', maxRows)}\n\n`;
        displayData = nonEmptyData.slice(0, maxRows);
      }
      
      // Determine maximum number of columns
      const maxCols = Math.max(...displayData.map(row => row.length));
      
      // Create table
      for (let rowIndex = 0; rowIndex < displayData.length; rowIndex++) {
        const row = displayData[rowIndex];
        const formattedRow = [];
        
        // Fill each column
        for (let colIndex = 0; colIndex < maxCols; colIndex++) {
          const cellValue = colIndex < row.length ? row[colIndex] : '';
          formattedRow.push(this.formatCellValue(cellValue));
        }
        
        markdown += '| ' + formattedRow.join(' | ') + ' |\n';
        
        // Add separator after first row
        if (rowIndex === 0) {
          markdown += '| ' + Array(maxCols).fill('---').join(' | ') + ' |\n';
        }
      }
      
      if (markdownConfig.includeSectionSeparators) {
        markdown += '\n---\n\n';
      }
    }
    
    return markdown;
  }

  /**
   * Format cell value for Markdown table display
   */
  private static formatCellValue(value: any): string {
    // Handle null, undefined and empty values
    if (value === null || value === undefined) {
      return ' ';
    }
    
    // Handle number types
    if (typeof value === 'number') {
      // Return empty for NaN
      if (isNaN(value)) {
        return ' ';
      }
      // Format number, preserve necessary decimal places
      return value.toString();
    }
    
    // Handle boolean values
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }
    
    // Handle Date objects
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    // Convert to string
    let strValue = String(value);
    
    // Return space if string is empty
    if (strValue.length === 0) {
      return ' ';
    }
    
    // Handle line breaks - replace with HTML line break tags
    strValue = strValue.replace(/\r?\n/g, '<br>');
    
    // Handle tab characters
    strValue = strValue.replace(/\t/g, '    ');
    
    // Handle pipe characters (Markdown table special character)
    strValue = strValue.replace(/\|/g, '\\|');
    
    // Handle backslashes
    strValue = strValue.replace(/\\/g, '\\\\');
    
    // Remove leading and trailing whitespace, but preserve content
    const trimmed = strValue.trim();
    
    // If trimmed is empty but original value is not, it might be all whitespace characters
    if (trimmed.length === 0 && strValue.length > 0) {
      return I18n.t('excel.whitespaceChar');
    }
    
    // Return single space for empty content to maintain table format
    return trimmed.length > 0 ? trimmed : ' ';
  }
}
