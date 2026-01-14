import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import * as xlsx from 'xlsx';
import { ConversionResult, ConversionOptions } from '../types';
import { FileUtils } from '../utils/fileUtils';
import { I18n } from '../i18n';
import { CsvWriterBase } from './csvWriterBase';

export class ExcelToCsvConverter extends CsvWriterBase {
  /**
   * Convert Excel/CSV files to CSV format
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
      const outputDir = options?.outputDirectory || config.outputDirectory || path.dirname(inputPath);
      
      // Get CSV encoding and delimiter from config
      const encoding = config.tableCsvEncoding || 'utf8';
      const delimiter = this.getDelimiterFromConfig(config.tableCsvDelimiter || ',');

      // If input is already CSV, just copy with proper encoding if needed
      if (validation.fileType === 'csv') {
        const outputPath = FileUtils.generateOutputPath(inputPath, '.csv', outputDir);
        await this.processCsvFile(inputPath, outputPath, encoding);
        
        const duration = Date.now() - startTime;
        return {
          success: true,
          inputPath,
          outputPaths: [outputPath],
          duration
        };
      }

      // Process Excel file
      const outputPaths = await this.convertExcelToCsv(inputPath, outputDir, encoding, delimiter, options);

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        inputPath,
        outputPaths,
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
   * Convert Excel document to CSV files
   */
  private static async convertExcelToCsv(
    filePath: string, 
    outputDir: string, 
    encoding: string, 
    delimiter: string,
    options?: ConversionOptions
  ): Promise<string[]> {
    // Read file
    const fileContent = await fs.readFile(filePath);
    const workbook = xlsx.read(fileContent, { 
      type: 'buffer',
      cellText: true,  // Preserve cell text formatting
      cellDates: true, // Auto convert dates
      raw: false       // Use formatted values instead of raw values
    });
    
    const outputPaths: string[] = [];
    const fileNameWithoutExt = path.basename(filePath, path.extname(filePath));
    
    // Get table output mode from config
    const config = FileUtils.getConfig();
    let outputMode = options?.tableOutputMode || config.tableOutputMode || 'separate';
    
    // If mode is 'ask', prompt user
    if (outputMode === 'ask' && workbook.SheetNames.length > 1) {
      const choice = await vscode.window.showQuickPick([
        {
          label: I18n.t('table.outputModeSeparate'),
          value: 'separate' as const
        },
        {
          label: I18n.t('table.outputModeCombined'),
          value: 'combined' as const
        }
      ], {
        title: I18n.t('table.outputModePrompt')
      });
      
      outputMode = choice?.value || 'separate';
    }

    if (outputMode === 'combined' && workbook.SheetNames.length > 1) {
      // Combined mode: all sheets in one CSV
      const combinedOutputPath = path.join(outputDir, `${fileNameWithoutExt}_combined.csv`);
      await this.createCombinedCsv(workbook, combinedOutputPath, encoding, delimiter, config.includeTableMetadata);
      outputPaths.push(combinedOutputPath);
    } else {
      // Separate mode: one CSV per sheet
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        
        // Check if worksheet is empty
        if (!sheet['!ref']) {
          continue;
        }
        
        // Generate safe filename from sheet name
        const safeSheetName = this.sanitizeFileName(sheetName);
        const outputPath = workbook.SheetNames.length === 1 
          ? path.join(outputDir, `${fileNameWithoutExt}.csv`)
          : path.join(outputDir, `${fileNameWithoutExt}_${safeSheetName}.csv`);
        
        await this.createSheetCsv(sheet, outputPath, encoding, delimiter, sheetName, config.includeTableMetadata);
        outputPaths.push(outputPath);
      }
    }
    
    return outputPaths;
  }

  /**
   * Create CSV from single worksheet
   */
  private static async createSheetCsv(
    sheet: xlsx.WorkSheet, 
    outputPath: string, 
    encoding: string, 
    delimiter: string,
    sheetName: string,
    includeMetadata: boolean = false
  ): Promise<void> {
    // Extract data as array to process
    const data = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, {
      header: 1,
      defval: '',
      blankrows: false  // Skip blank rows
    }) as any[][];
    
    // Filter out empty rows and trim trailing empty columns
    const cleanedData = this.cleanSheetData(data);
    
    // Convert cleaned data back to CSV
    let csvContent = '';
    if (cleanedData.length > 0) {
      csvContent = cleanedData
        .map(row => row.map(cell => this.escapeCsvCell(String(cell), delimiter)).join(delimiter))
        .join('\n');
    }
    
    // Write file using base class method
    await this.writeCsvFile(
      outputPath, 
      csvContent, 
      encoding, 
      includeMetadata,
      { source: sheetName }
    );
  }

  /**
   * Create combined CSV from all worksheets
   */
  private static async createCombinedCsv(
    workbook: xlsx.WorkBook, 
    outputPath: string, 
    encoding: string, 
    delimiter: string,
    includeMetadata: boolean = false
  ): Promise<void> {
    const sections: Array<{ name: string; content: string; metadata?: any }> = [];
    
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      
      // Check if worksheet is empty
      if (!sheet['!ref']) {
        continue;
      }
      
      // Extract data as array to process
      const data = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, {
        header: 1,
        defval: '',
        blankrows: false
      }) as any[][];
      
      // Filter out empty rows and trim trailing empty columns
      const cleanedData = this.cleanSheetData(data);
      
      if (cleanedData.length > 0) {
        const csvContent = cleanedData
          .map(row => row.map(cell => this.escapeCsvCell(String(cell), delimiter)).join(delimiter))
          .join('\n');
        
        sections.push({
          name: sheetName,
          content: csvContent
        });
      }
    }
    
    // Write combined CSV using base class method
    await this.writeCombinedCsv(
      sections,
      outputPath,
      encoding,
      includeMetadata,
      { 
        title: I18n.t('table.combinedTablesFrom', path.basename(outputPath, '.csv'))
      }
    );
  }

  /**
   * Clean sheet data by removing empty rows and trimming trailing empty columns
   */
  private static cleanSheetData(data: any[][]): any[][] {
    if (data.length === 0) {
      return data;
    }
    
    // Filter out completely empty rows
    const nonEmptyRows = data.filter(row => 
      row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
    );
    
    if (nonEmptyRows.length === 0) {
      return [];
    }
    
    // Find the rightmost column that has any non-empty content
    let maxNonEmptyCol = 0;
    
    for (const row of nonEmptyRows) {
      for (let colIndex = row.length - 1; colIndex >= 0; colIndex--) {
        const cell = row[colIndex];
        if (cell !== null && cell !== undefined && String(cell).trim() !== '') {
          maxNonEmptyCol = Math.max(maxNonEmptyCol, colIndex);
          break;
        }
      }
    }
    
    // Trim all rows to the maxNonEmptyCol + 1 length
    return nonEmptyRows.map(row => row.slice(0, maxNonEmptyCol + 1));
  }

  /**
   * Escape CSV cell content properly
   */
  private static escapeCsvCell(value: string, delimiter: string): string {
    // If value contains delimiter, newline, or quotes, wrap in quotes and escape quotes
    if (value.includes(delimiter) || value.includes('\n') || value.includes('"')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }

  /**
   * Process CSV file (handle encoding conversion)
   */
  private static async processCsvFile(inputPath: string, outputPath: string, targetEncoding: string): Promise<void> {
    if (inputPath === outputPath && targetEncoding === 'utf8') {
      // No conversion needed
      return;
    }
    
    const content = await fs.readFile(inputPath, 'utf8');
    
    // Use base class method for consistent CSV writing
    await this.writeCsvFile(outputPath, content, targetEncoding);
  }
}
