import * as fs from 'fs/promises';
import * as path from 'path';
import * as xlsx from 'xlsx';
import * as vscode from 'vscode';
import { ConversionResult, ConversionOptions } from '../types';
import { FileUtils } from '../utils/fileUtils';
import { I18n } from '../i18n';
import { CsvWriterBase } from './csvWriterBase';

/**
 * Worksheet selection result
 */
export interface WorksheetSelectionResult {
  worksheetNames: string[];
  outputFormat: 'markdown' | 'csv';
  cancelled: boolean;
}

/**
 * Worksheet range conversion result
 */
export interface WorksheetRangeConversionResult {
  success: boolean;
  worksheetNames?: string[];
  outputFormat?: 'markdown' | 'csv';
  outputPaths?: string[];
  outputDirectory?: string;
  totalWorksheets?: number;
  errorMessage?: string;
  worksheetResults?: Array<{
    worksheetName: string;
    outputPath: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Excel worksheet range converter with worksheet selection support
 */
export class ExcelWorksheetRangeConverter extends CsvWriterBase {
  
    /**
   * Convert Excel file with user worksheet selection
   */
  public static async convertWithWorksheetSelection(
    filePath: string, 
    outputFormat: 'markdown' | 'csv' = 'markdown'
  ): Promise<ConversionResult> {
    try {
      // Validate file
      await FileUtils.validateFile(filePath);
      
      // Read Excel file
      const workbook = xlsx.readFile(filePath);
      const allWorksheetNames = workbook.SheetNames;
      
      if (allWorksheetNames.length === 0) {
        return {
          success: false,
          inputPath: filePath,
          error: I18n.t('excel.noWorksheetsFound')
        };
      }
      
      // Show selection dialog (without format selection)
      const documentName = path.basename(filePath, path.extname(filePath));
      const selectionResult = await this.selectWorksheetsAndFormat(allWorksheetNames, documentName, outputFormat);
      
      if (selectionResult.cancelled) {
        return {
          success: false,
          inputPath: filePath,
          error: I18n.t('conversion.cancelled')
        };
      }
      
      // Convert selected worksheets
      const outputDir = path.dirname(filePath);
      const result = await this.convertSelectedWorksheets(
        filePath,
        selectionResult.worksheetNames,
        selectionResult.outputFormat,
        outputDir
      );
      
      // Convert result to match ConversionResult interface
      return {
        success: result.success,
        inputPath: filePath,
        outputPaths: result.outputPaths,
        error: result.errorMessage
      };
      
    } catch (error) {
      return {
        success: false,
        inputPath: filePath,
        error: error instanceof Error ? error.message : I18n.t('error.unknownError')
      };
    }
  }
  
  /**
   * Show worksheet selection dialog
   */
  private static async selectWorksheetsAndFormat(
    allWorksheetNames: string[], 
    documentName: string,
    outputFormat: 'markdown' | 'csv' = 'markdown'
  ): Promise<WorksheetSelectionResult> {
    const result: WorksheetSelectionResult = {
      worksheetNames: [],
      outputFormat,
      cancelled: true
    };

    try {
      // Create worksheet selection options (no custom "Select All" - use VS Code's built-in Ctrl+A)
      const worksheetItems = allWorksheetNames.map((name, index) => ({
        label: name,
        // Don't set detail to avoid duplicate display
        picked: false
      }));

      const selectedWorksheets = await vscode.window.showQuickPick(worksheetItems, {
        placeHolder: I18n.t('excel.selectWorksheets', documentName),
        canPickMany: true
      });

      if (!selectedWorksheets || selectedWorksheets.length === 0) {
        return result; // User cancelled
      }

      // All selected worksheets are actual worksheet names
      result.worksheetNames = selectedWorksheets.map(item => item.label);

      result.cancelled = false;
      return result;

    } catch (error) {
      console.error('Worksheet selection error:', error);
      return result;
    }
  }
  
  /**
   * Get workbook information
   */
  private static async getWorkbookInfo(inputPath: string): Promise<{
    worksheetNames: string[];
    totalWorksheets: number;
  }> {
    const fileContent = await fs.readFile(inputPath);
    const workbook = xlsx.read(fileContent, { 
      type: 'buffer',
      bookSheets: true // Only read sheet names for efficiency
    });
    
    return {
      worksheetNames: workbook.SheetNames,
      totalWorksheets: workbook.SheetNames.length
    };
  }
  
  /**
   * Convert selected worksheets
   */
  private static async convertSelectedWorksheets(
    inputPath: string,
    worksheetNames: string[],
    outputFormat: 'markdown' | 'csv',
    outputDir: string
  ): Promise<{
    success: boolean;
    outputPaths: string[];
    errorMessage?: string;
    worksheetResults?: Array<{
      worksheetName: string;
      outputPath: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const worksheetResults: Array<{
      worksheetName: string;
      outputPath: string;
      success: boolean;
      error?: string;
    }> = [];
    const outputPaths: string[] = [];

    try {
      // Read the workbook
      const fileContent = await fs.readFile(inputPath);
      const workbook = xlsx.read(fileContent, { 
        type: 'buffer',
        cellText: true,
        cellDates: true,
        raw: false
      });

      const basename = path.basename(inputPath, path.extname(inputPath));

      // Process each selected worksheet
      for (const worksheetName of worksheetNames) {
        try {
          const sheet = workbook.Sheets[worksheetName];
          
          if (!sheet) {
            worksheetResults.push({
              worksheetName,
              outputPath: '',
              success: false,
              error: I18n.t('excel.worksheetNotFound', worksheetName)
            });
            continue;
          }

          // Generate output file path
          const safeWorksheetName = this.sanitizeFileName(worksheetName);
          const fileExtension = outputFormat === 'markdown' ? '.md' : '.csv';
          const outputFileName = worksheetNames.length === 1 
            ? `${basename}${fileExtension}`
            : `${basename}_${safeWorksheetName}${fileExtension}`;
          const outputPath = path.join(outputDir, outputFileName);

          if (outputFormat === 'markdown') {
            await this.convertWorksheetToMarkdown(sheet, worksheetName, outputPath, basename);
          } else {
            await this.convertWorksheetToCsv(sheet, worksheetName, outputPath);
          }

          worksheetResults.push({
            worksheetName,
            outputPath,
            success: true
          });
          outputPaths.push(outputPath);

        } catch (error) {
          worksheetResults.push({
            worksheetName,
            outputPath: '',
            success: false,
            error: error instanceof Error ? error.message : I18n.t('error.unknownError')
          });
        }
      }

      const successful = worksheetResults.filter(r => r.success);
      const failed = worksheetResults.filter(r => !r.success);

      return {
        success: successful.length > 0,
        outputPaths,
        errorMessage: failed.length > 0 ? 
          I18n.t('excel.partialConversionFailed', failed.length.toString(), worksheetNames.length.toString()) : 
          undefined,
        worksheetResults
      };

    } catch (error) {
      return {
        success: false,
        outputPaths: [],
        errorMessage: error instanceof Error ? error.message : I18n.t('error.unknownError'),
        worksheetResults
      };
    }
  }

  /**
   * Convert single worksheet to Markdown
   */
  private static async convertWorksheetToMarkdown(
    sheet: xlsx.WorkSheet,
    worksheetName: string,
    outputPath: string,
    basename: string
  ): Promise<void> {
    let markdown = '';
    
    // Add title and worksheet information
    markdown += `# ${basename} - ${worksheetName}\n\n`;
    markdown += `${I18n.t('excel.convertedFrom', `${basename} - ${worksheetName}`)}\n\n`;
    markdown += `---\n\n`;
    
    // Extract data
    const data = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, {
      header: 1,
      defval: '',
      blankrows: true
    }) as any[][];
    
    // Filter out completely empty rows
    const nonEmptyData = data.filter(row => 
      row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
    );
    
    // Check if worksheet is empty after filtering
    if (!sheet['!ref'] || nonEmptyData.length === 0) {
      markdown += `${I18n.t('excel.emptyWorksheet')}\n\n`;
      await FileUtils.writeFile(outputPath, markdown);
      return;
    }
    
    // Remove trailing empty columns
    const trimmedData = this.trimTrailingEmptyColumns(nonEmptyData);
    
    markdown += `## ${I18n.t('excel.worksheet')}: ${worksheetName}\n\n`;
    markdown += `**${I18n.t('excel.dataDimensions')}**: ${I18n.t('excel.dataDimensionsValue', 
      trimmedData.length, 
      Math.max(...trimmedData.map(row => row.length))
    )}\n\n`;
    
    // Determine maximum number of columns
    const maxCols = Math.max(...trimmedData.map(row => row.length));
    
    // Create table
    for (let rowIndex = 0; rowIndex < trimmedData.length; rowIndex++) {
      const row = trimmedData[rowIndex];
      const formattedRow = [];
      
      // Fill each column
      for (let colIndex = 0; colIndex < maxCols; colIndex++) {
        const cellValue = colIndex < row.length ? row[colIndex] : '';
        formattedRow.push(this.formatCellValueForMarkdown(cellValue));
      }
      
      markdown += '| ' + formattedRow.join(' | ') + ' |\n';
      
      // Add separator after first row
      if (rowIndex === 0) {
        markdown += '| ' + Array(maxCols).fill('---').join(' | ') + ' |\n';
      }
    }
    
    markdown += '\n';
    
    await FileUtils.writeFile(outputPath, markdown);
  }

  /**
   * Trim trailing empty columns from data rows
   */
  private static trimTrailingEmptyColumns(data: any[][]): any[][] {
    if (data.length === 0) {
      return data;
    }
    
    // Find the rightmost column that has any non-empty content
    let maxNonEmptyCol = 0;
    
    for (const row of data) {
      for (let colIndex = row.length - 1; colIndex >= 0; colIndex--) {
        const cell = row[colIndex];
        if (cell !== null && cell !== undefined && String(cell).trim() !== '') {
          maxNonEmptyCol = Math.max(maxNonEmptyCol, colIndex);
          break;
        }
      }
    }
    
    // Trim all rows to the maxNonEmptyCol + 1 length
    return data.map(row => row.slice(0, maxNonEmptyCol + 1));
  }

  /**
   * Convert single worksheet to CSV
   */
  private static async convertWorksheetToCsv(
    sheet: xlsx.WorkSheet,
    worksheetName: string,
    outputPath: string
  ): Promise<void> {
    // Get CSV configuration
    const config = FileUtils.getConfig();
    const encoding = config.tableCsvEncoding || 'utf8';
    const delimiter = this.getDelimiterFromConfig(config.tableCsvDelimiter || ',');
    
    // Extract data as array to process
    const data = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, {
      header: 1,
      defval: '',
      blankrows: false
    }) as any[][];
    
    // Filter out empty rows and trim trailing empty columns
    const nonEmptyData = data.filter(row => 
      row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
    );
    
    const cleanedData = this.trimTrailingEmptyColumns(nonEmptyData);
    
    // Convert cleaned data to CSV
    let csvContent = '';
    if (cleanedData.length > 0) {
      csvContent = cleanedData
        .map(row => row.map(cell => this.escapeCsvCell(String(cell), delimiter)).join(delimiter))
        .join('\n');
    }
    
    // Write CSV file using base class method
    await this.writeCsvFile(
      outputPath, 
      csvContent, 
      encoding, 
      config.includeTableMetadata,
      { source: worksheetName }
    );
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
   * Format cell value for Markdown table display
   */
  private static formatCellValueForMarkdown(value: any): string {
    // Handle null, undefined and empty values
    if (value === null || value === undefined) {
      return ' ';
    }
    
    // Handle number types
    if (typeof value === 'number') {
      if (isNaN(value)) {
        return ' ';
      }
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
    
    if (trimmed.length === 0 && strValue.length > 0) {
      return I18n.t('excel.whitespaceChar');
    }
    
    return trimmed.length > 0 ? trimmed : ' ';
  }

  /**
   * Create output directory if it doesn't exist
   */
  private static async createOutputDirectory(outputDir: string): Promise<void> {
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      throw new Error(I18n.t('error.directoryCreationFailed', outputDir));
    }
  }
  
  /**
   * Check if file exists
   */
  private static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Generate output directory path
   */
  private static generateOutputDirectory(inputPath: string, selectionResult: WorksheetSelectionResult): string {
    const inputDir = path.dirname(inputPath);
    const basename = path.basename(inputPath, path.extname(inputPath));
    const formatSuffix = selectionResult.outputFormat === 'markdown' ? 'Markdown' : 'CSV';
    
    return path.join(inputDir, `${basename}_Worksheets_${formatSuffix}`);
  }
  
  // Note: sanitizeFileName is inherited from CsvWriterBase
}
