import * as fs from 'fs/promises';
import * as path from 'path';
import * as iconv from 'iconv-lite';
import { FileUtils } from '../utils/fileUtils';
import { I18n } from '../i18n';

/**
 * CSV writer base class - unified CSV file writing logic
 */
export abstract class CsvWriterBase {
  /**
   * Write CSV file with unified encoding and BOM handling
   */
  protected static async writeCsvFile(
    outputPath: string, 
    content: string, 
    encoding: string = 'utf8',
    includeMetadata: boolean = false,
    metadata?: {
      title?: string;
      source?: string;
      [key: string]: any;
    }
  ): Promise<void> {
    let finalContent = content;
    
    // Add metadata
    if (includeMetadata && metadata) {
      const metadataLines: string[] = [];
      
      if (metadata.title) {
        metadataLines.push(`# ${metadata.title}`);
      }
      
      if (metadata.source) {
        metadataLines.push(`# ${I18n.t('table.sourceSection', metadata.source)}`);
      }
      
      metadataLines.push(`# ${I18n.t('table.extractedDate', new Date().toLocaleString())}`);
      
      // Add other custom metadata
      Object.entries(metadata).forEach(([key, value]) => {
        if (key !== 'title' && key !== 'source' && value !== undefined) {
          metadataLines.push(`# ${key}: ${value}`);
        }
      });
      
      metadataLines.push(''); // Empty line separator
      finalContent = metadataLines.join('\n') + content;
    }
    
    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    await FileUtils.ensureDirectoryExists(dir);
    
    // Write file based on encoding
    if (encoding === 'gbk') {
      const buffer = iconv.encode(finalContent, 'gbk');
      await fs.writeFile(outputPath, buffer);
    } else {
      // UTF-8 encoding, add BOM for Excel compatibility
      const utf8BOM = '\uFEFF';
      const contentWithBOM = this.containsChinese(finalContent) 
        ? utf8BOM + finalContent 
        : finalContent;
      await fs.writeFile(outputPath, contentWithBOM, 'utf8');
    }
  }

  /**
   * Write multiple CSV files in batch
   */
  protected static async writeCsvFiles(
    csvData: Array<{
      outputPath: string;
      content: string;
      metadata?: any;
    }>,
    encoding: string = 'utf8',
    includeMetadata: boolean = false
  ): Promise<string[]> {
    const writtenPaths: string[] = [];
    
    for (const data of csvData) {
      await this.writeCsvFile(
        data.outputPath, 
        data.content, 
        encoding, 
        includeMetadata, 
        data.metadata
      );
      writtenPaths.push(data.outputPath);
    }
    
    return writtenPaths;
  }

  /**
   * Create combined CSV file
   */
  protected static async writeCombinedCsv(
    sections: Array<{
      name: string;
      content: string;
      metadata?: any;
    }>,
    outputPath: string,
    encoding: string = 'utf8',
    includeMetadata: boolean = false,
    globalMetadata?: any
  ): Promise<void> {
    const combinedRows: string[] = [];
    
    // Add global file metadata
    if (includeMetadata && globalMetadata) {
      if (globalMetadata.title) {
        combinedRows.push(`# ${globalMetadata.title}`);
      }
      combinedRows.push(`# ${I18n.t('table.extractedDate', new Date().toLocaleString())}`);
      combinedRows.push(`# ${I18n.t('table.totalTables', sections.length)}`);
      combinedRows.push('');
    }
    
    // Add sections
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      // Add separator (except for first section)
      if (i > 0 && includeMetadata) {
        combinedRows.push('');
        combinedRows.push('#'.repeat(50));
        combinedRows.push('');
      }
      
      // Add section title
      if (includeMetadata) {
        combinedRows.push(`# ${I18n.t('table.tableNumber')} ${i + 1}: ${section.name}`);
        
        if (section.metadata) {
          Object.entries(section.metadata).forEach(([key, value]) => {
            if (value !== undefined) {
              combinedRows.push(`# ${key}: ${value}`);
            }
          });
        }
        
        combinedRows.push('');
      }
      
      // Add content
      if (section.content.trim().length > 0) {
        combinedRows.push(section.content);
      }
    }
    
    const finalContent = combinedRows.join('\n');
    await this.writeCsvFile(outputPath, finalContent, encoding);
  }

  /**
   * Check if text contains Chinese characters
   */
  private static containsChinese(text: string): boolean {
    return /[\u4e00-\u9fff]/.test(text);
  }

  /**
   * Generate safe filename
   */
  public static sanitizeFileName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '_')  // Replace invalid characters
      .replace(/\s+/g, '_')           // Replace spaces with underscores
      .substring(0, 50);              // Limit length
  }

  /**
   * Get delimiter character from config value
   */
  public static getDelimiterFromConfig(configValue: string): string {
    switch (configValue) {
      case ';':
        return ';';
      case '\\t':
      case '\t':
        return '\t';
      case ',':
      default:
        return ',';
    }
  }

  /**
   * Generate output path
   */
  protected static generateCsvOutputPath(
    inputPath: string, 
    outputDir: string, 
    suffix?: string
  ): string {
    const fileNameWithoutExt = path.basename(inputPath, path.extname(inputPath));
    const fileName = suffix 
      ? `${fileNameWithoutExt}_${suffix}.csv`
      : `${fileNameWithoutExt}.csv`;
    return path.join(outputDir, fileName);
  }
}
