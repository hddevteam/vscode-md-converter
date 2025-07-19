import * as fs from 'fs/promises';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { TableData, TableExtractionOptions, TableConversionResult } from '../types';
import { FileUtils } from '../utils/fileUtils';
import { I18n } from '../i18n';
import { CsvWriterBase } from './csvWriterBase';

export abstract class TableExtractorBase extends CsvWriterBase {
  /**
   * Generate CSV file content
   */
  protected static generateCsvContent(
    tableData: TableData, 
    options: TableExtractionOptions,
    includeMetadata: boolean = true
  ): string {
    if (!tableData.rows || tableData.rows.length === 0) {
      return '';
    }

    const delimiter = options.delimiter;
    const csvRows: string[] = [];

    // Optionally include metadata comments
    if (includeMetadata) {
      // Add table title as comment (if available)
      if (tableData.title) {
        csvRows.push(`# ${tableData.title}`);
        csvRows.push('');
      }

      // Add table location info as comment
      if (tableData.sourceLocation) {
        const location = tableData.sourceLocation;
        let locationInfo = '# ';
        if (location.page) {
          locationInfo += I18n.t('table.sourcePage', location.page.toString());
        } else if (location.slide) {
          locationInfo += I18n.t('table.sourceSlide', location.slide.toString());
        } else if (location.section) {
          locationInfo += I18n.t('table.sourceSection', location.section);
        }
        csvRows.push(locationInfo);
        csvRows.push('');
      }
    }

    // Convert table data
    const processedRows = this.processMergedCells(tableData, options);
    for (const row of processedRows) {
      const escapedRow = row.map(cell => {
        // Process cell content
        let cellContent = (cell || '').toString().trim();
        
        // If contains separator, line breaks, or quotes, needs to be quoted
        if (cellContent.includes(delimiter) || 
            cellContent.includes('\n') || 
            cellContent.includes('"')) {
          // Escape quotes
          cellContent = cellContent.replace(/"/g, '""');
          cellContent = `"${cellContent}"`;
        }
        
        return cellContent;
      });
      
      csvRows.push(escapedRow.join(delimiter));
    }

    return csvRows.join('\n');
  }

  /**
   * Save single table as CSV file
   */
  protected static async saveSingleTableToCsv(
    tableData: TableData,
    baseOutputPath: string,
    options: TableExtractionOptions
  ): Promise<string> {
    const csvContent = this.generateCsvContent(tableData, options, false); // Don't include metadata here
    
    // Generate filename
    const baseDir = path.dirname(baseOutputPath);
    const baseName = path.basename(baseOutputPath, path.extname(baseOutputPath));
    const fileName = `${baseName}_table_${tableData.id}.csv`;
    const outputPath = path.join(baseDir, fileName);
    
    // Use base class method to save file
    await this.writeCsvFile(
      outputPath, 
      csvContent, 
      options.encoding, 
      options.includeMetadata,
      {
        source: tableData.sourceLocation?.section,
        title: tableData.title,
        dimensions: `${tableData.rowCount} × ${tableData.columnCount}`
      }
    );
    
    return outputPath;
  }

  /**
   * Save all tables to a single CSV file
   */
  protected static async saveCombinedTablesToCsv(
    tables: TableData[],
    baseOutputPath: string,
    options: TableExtractionOptions
  ): Promise<string> {
    // Prepare combined data
    const sections = tables.map((table, index) => ({
      name: `${I18n.t('table.tableNumber', (index + 1).toString())}${table.title ? ` - ${table.title}` : ''}`,
      content: this.generateCsvContent(table, options, false),
      metadata: {
        tableId: table.id,
        dimensions: `${table.rowCount} × ${table.columnCount}`,
        source: table.sourceLocation?.section
      }
    }));

    // Generate output path
    const baseDir = path.dirname(baseOutputPath);
    const baseName = path.basename(baseOutputPath, path.extname(baseOutputPath));
    const fileName = `${baseName}_all_tables.csv`;
    const outputPath = path.join(baseDir, fileName);

    // Use base class method to save combined file
    await this.writeCombinedCsv(
      sections,
      outputPath,
      options.encoding,
      options.includeMetadata,
      {
        title: I18n.t('table.combinedTablesFrom', path.basename(baseOutputPath))
      }
    );

    return outputPath;
  }

  /**
   * Save table data to CSV files
   */
  protected static async saveTablesToCsv(
    tables: TableData[],
    baseOutputPath: string,
    options: TableExtractionOptions
  ): Promise<string[]> {
    const csvPaths: string[] = [];
    
    if (tables.length === 0) {
      return csvPaths;
    }
    
    if (options.outputMode === 'combined') {
      // Combined mode: save all tables to one file
      const combinedPath = await this.saveCombinedTablesToCsv(tables, baseOutputPath, options);
      csvPaths.push(combinedPath);
    } else {
      // Separate mode: save each table as individual file
      for (const table of tables) {
        const csvPath = await this.saveSingleTableToCsv(table, baseOutputPath, options);
        csvPaths.push(csvPath);
      }
    }
    
    return csvPaths;
  }

  /**
   * Validate if table data is valid
   */
  protected static validateTable(
    rows: string[][],
    options: TableExtractionOptions
  ): boolean {
    if (!rows || rows.length < options.minRows) {
      return false;
    }
    
    // Check if there are enough columns
    const validRows = rows.filter(row => row && row.length >= options.minColumns);
    if (validRows.length < options.minRows) {
      return false;
    }
    
    // Check if there is at least some non-empty content
    const hasContent = rows.some(row => 
      row.some(cell => cell && cell.toString().trim().length > 0)
    );
    
    return hasContent;
  }

  /**
   * Clean table data
   */
  protected static cleanTableData(rows: string[][]): string[][] {
    if (!rows || rows.length === 0) {
      return [];
    }
    
    // Remove completely blank rows (at the beginning and end)
    let startIndex = 0;
    let endIndex = rows.length - 1;
    
    // Remove empty rows from the beginning
    while (startIndex < rows.length && this.isEmptyRow(rows[startIndex])) {
      startIndex++;
    }
    
    // Remove empty rows from the end
    while (endIndex >= startIndex && this.isEmptyRow(rows[endIndex])) {
      endIndex--;
    }
    
    if (startIndex > endIndex) {
      return [];
    }
    
    const cleanedRows = rows.slice(startIndex, endIndex + 1);
    
    // Normalize the number of columns per row (using maximum column count)
    const maxColumns = Math.max(...cleanedRows.map(row => row.length));
    
    return cleanedRows.map(row => {
      const paddedRow = [...row];
      while (paddedRow.length < maxColumns) {
        paddedRow.push('');
      }
      return paddedRow.map(cell => (cell || '').toString().trim());
    });
  }

  /**
   * Check if row is empty
   */
  private static isEmptyRow(row: string[]): boolean {
    return !row || row.length === 0 || row.every(cell => !cell || cell.toString().trim() === '');
  }

  /**
   * Generate table ID
   */
  protected static generateTableId(index: number, title?: string): string {
    const suffix = title ? `_${title.replace(/[^\w\u4e00-\u9fff]/g, '_')}` : '';
    return `${(index + 1).toString().padStart(2, '0')}${suffix}`;
  }

  /**
   * Create default extraction options
   */
  protected static createDefaultExtractionOptions(
    customOptions?: Partial<TableExtractionOptions>
  ): TableExtractionOptions {
    return {
      outputMode: 'separate',
      encoding: 'utf8',
      delimiter: ',',
      includeHeaders: true,
      includeMetadata: false, // Default to not include metadata comments for better standard CSV format compliance
      mergedCellStrategy: 'repeat',
      minRows: 2,
      minColumns: 2,
      ...customOptions
    };
  }

  /**
   * Process merged cells
   */
  protected static processMergedCells(
    tableData: TableData,
    options: TableExtractionOptions
  ): string[][] {
    if (!tableData.mergedCells || tableData.mergedCells.length === 0) {
      return tableData.rows;
    }

    const processedRows: string[][] = tableData.rows.map(row => [...row]);

    for (const mergedCell of tableData.mergedCells) {
      const { startRow, endRow, startCol, endCol, value } = mergedCell;

      switch (options.mergedCellStrategy) {
        case 'repeat':
          // Repeat value to all merged cells
          for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
              if (processedRows[row] && processedRows[row][col] !== undefined) {
                processedRows[row][col] = value;
              }
            }
          }
          break;

        case 'empty':
          // Only put value in first cell, leave others empty
          for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
              if (processedRows[row] && processedRows[row][col] !== undefined) {
                if (row === startRow && col === startCol) {
                  processedRows[row][col] = value;
                } else {
                  processedRows[row][col] = '';
                }
              }
            }
          }
          break;

        case 'notation':
          // Use special notation to indicate merging
          for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
              if (processedRows[row] && processedRows[row][col] !== undefined) {
                if (row === startRow && col === startCol) {
                  processedRows[row][col] = value;
                } else {
                  processedRows[row][col] = `[MERGED:${startRow},${startCol}]`;
                }
              }
            }
          }
          break;
      }
    }

    return processedRows;
  }
}
