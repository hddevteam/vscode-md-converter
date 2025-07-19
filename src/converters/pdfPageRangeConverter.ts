import * as fs from 'fs/promises';
import * as path from 'path';
import { ConversionResult, ConversionOptions } from '../types';
import { FileUtils } from '../utils/fileUtils';
import { I18n } from '../i18n';
import { PageRangeSelector, PageRangeResult } from '../ui/pageRangeSelector';

// Set correct working directory during module loading, then import pdf-parse
let pdfParse: any;

try {
  // Save current working directory
  const originalCwd = process.cwd();
  
  // Find project root directory containing node_modules
  let projectRoot = __dirname;
  while (projectRoot && projectRoot !== '/') {
    const nodeModulesPath = require('path').join(projectRoot, 'node_modules');
    if (require('fs').existsSync(nodeModulesPath)) {
      break;
    }
    projectRoot = require('path').dirname(projectRoot);
  }
  
  try {
    // Temporarily switch to project root directory
    if (projectRoot && projectRoot !== originalCwd) {
      process.chdir(projectRoot);
    }
    
    // Import pdf-parse
    pdfParse = require('pdf-parse');
  } finally {
    // Restore original working directory
    process.chdir(originalCwd);
  }
} catch (error) {
  console.warn('PDF-parse loading warning:', error);
  // If still fails, try importing directly without changing working directory
  try {
    pdfParse = require('pdf-parse');
  } catch (fallbackError) {
    console.error('PDF-parse loading failed:', fallbackError);
  }
}

/**
 * Page range conversion result
 */
export interface PageRangeConversionResult extends ConversionResult {
  pageNumbers?: number[];
  outputMode?: 'merge' | 'separate';
  pageResults?: Array<{
    pageNumber: number;
    outputPath: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * PDF to text converter with page range support
 */
export class PdfPageRangeConverter {
  
  /**
   * Convert specific pages from PDF to text format
   */
  static async convertWithPageRange(inputPath: string, options?: ConversionOptions): Promise<PageRangeConversionResult> {
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

      if (validation.fileType !== 'pdf') {
        return {
          success: false,
          inputPath,
          error: I18n.t('error.unsupportedFormat', validation.fileType || path.extname(inputPath))
        };
      }

      // Read PDF file to get total pages
      let dataBuffer: Buffer;
      try {
        dataBuffer = await fs.readFile(inputPath);
      } catch (err) {
        return {
          success: false,
          inputPath,
          error: I18n.t('pdf.cannotReadFile', err instanceof Error ? err.message : I18n.t('error.unknownError'))
        };
      }
      
      // Parse PDF to get total pages
      let pdfData: any;
      try {
        pdfData = await pdfParse(dataBuffer, { max: 0 });
      } catch (err) {
        return {
          success: false,
          inputPath,
          error: I18n.t('pdf.cannotParseFile', err instanceof Error ? err.message : I18n.t('error.unknownError'))
        };
      }
      
      const totalPages = pdfData.numpages;
      const documentName = path.basename(inputPath);

      // Show page range selection dialog
      const pageRangeResult: PageRangeResult = await PageRangeSelector.selectPageRange(totalPages, documentName);
      
      if (pageRangeResult.cancelled) {
        return {
          success: false,
          inputPath,
          error: I18n.t('progress.cancelled')
        };
      }

      // Extract content from selected pages
      const pageResults = await this.extractPagesContent(
        dataBuffer, 
        pdfData, 
        pageRangeResult.pageNumbers, 
        pageRangeResult.outputMode,
        inputPath,
        options
      );

      const duration = Date.now() - startTime;
      
      // Determine overall success
      const successfulPages = pageResults.filter(r => r.success);
      const allSuccess = successfulPages.length === pageResults.length;
      
      let outputPath: string | undefined;
      let outputPaths: string[] | undefined;
      
      if (pageRangeResult.outputMode === 'merge' && successfulPages.length > 0) {
        outputPath = successfulPages[0].outputPath;
      } else {
        outputPaths = successfulPages.map(r => r.outputPath);
      }

      return {
        success: allSuccess,
        inputPath,
        outputPath,
        outputPaths,
        duration,
        pageNumbers: pageRangeResult.pageNumbers,
        outputMode: pageRangeResult.outputMode,
        pageResults,
        error: allSuccess ? undefined : I18n.t('pageRange.pageExportFailed', 
          pageResults.filter(r => !r.success).length.toString(),
          pageResults.length.toString()
        )
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
   * Extract content from specified pages
   */
  private static async extractPagesContent(
    dataBuffer: Buffer,
    pdfData: any,
    pageNumbers: number[],
    outputMode: 'merge' | 'separate',
    inputPath: string,
    options?: ConversionOptions
  ): Promise<Array<{ pageNumber: number; outputPath: string; success: boolean; error?: string; }>> {
    
    const results: Array<{ pageNumber: number; outputPath: string; success: boolean; error?: string; }> = [];
    
    try {
      if (outputMode === 'merge') {
        // Merge all selected pages into one file
        const mergedContent = await this.extractMergedPages(dataBuffer, pageNumbers, pdfData, inputPath);
        const config = FileUtils.getConfig();
        const outputDir = options?.outputDirectory || config.outputDirectory || path.dirname(inputPath);
        const pageRangeStr = PageRangeSelector.formatPageNumbers(pageNumbers);
        const outputPath = this.generateOutputPath(inputPath, '.txt', outputDir, pageRangeStr);
        
        try {
          await FileUtils.writeFile(outputPath, mergedContent);
          results.push({
            pageNumber: pageNumbers[0], // Representative page for merged content
            outputPath,
            success: true
          });
        } catch (error) {
          results.push({
            pageNumber: pageNumbers[0],
            outputPath,
            success: false,
            error: error instanceof Error ? error.message : I18n.t('error.unknownError')
          });
        }
        
      } else {
        // Export each page separately
        for (const pageNumber of pageNumbers) {
          try {
            const pageContent = await this.extractSinglePage(dataBuffer, pageNumber, pdfData, inputPath);
            const config = FileUtils.getConfig();
            const outputDir = options?.outputDirectory || config.outputDirectory || path.dirname(inputPath);
            const outputPath = this.generateOutputPath(inputPath, '.txt', outputDir, `page-${pageNumber}`);
            
            await FileUtils.writeFile(outputPath, pageContent);
            
            results.push({
              pageNumber,
              outputPath,
              success: true
            });
            
          } catch (error) {
            results.push({
              pageNumber,
              outputPath: '', // Will not be used since success is false
              success: false,
              error: error instanceof Error ? error.message : I18n.t('error.unknownError')
            });
          }
        }
      }
      
    } catch (error) {
      // If there's a general error, create failed results for all pages
      for (const pageNumber of pageNumbers) {
        results.push({
          pageNumber,
          outputPath: '',
          success: false,
          error: error instanceof Error ? error.message : I18n.t('error.unknownError')
        });
      }
    }
    
    return results;
  }

  /**
   * Extract content from a single page
   */
  private static async extractSinglePage(
    dataBuffer: Buffer,
    pageNumber: number,
    fullPdfData: any,
    inputPath: string
  ): Promise<string> {
    try {
      // Parse single page
      const pageData = await pdfParse(dataBuffer, {
        first: pageNumber,
        last: pageNumber
      });
      
      const filename = path.basename(inputPath);
      
      // Format single page content
      let result = `# ${filename} - ${I18n.t('pageRange.processingPage', pageNumber.toString(), '1')}\n\n`;
      
      // File information
      result += `${I18n.t('pdf.fileInfo')}\n\n`;
      result += `- ${I18n.t('pdf.fileName')}: ${filename}\n`;
      result += `- ${I18n.t('pdf.pageCount')}: ${pageNumber}/${fullPdfData.numpages}\n`;
      
      if (fullPdfData.info) {
        if (fullPdfData.info.Author) {
          result += `- ${I18n.t('pdf.author')}: ${fullPdfData.info.Author}\n`;
        }
        if (fullPdfData.info.CreationDate) {
          result += `- ${I18n.t('pdf.creationDate')}: ${fullPdfData.info.CreationDate}\n`;
        }
      }
      
      result += '\n';
      result += `${I18n.t('pdf.textContent')}\n\n`;
      
      // Format page text
      const processedText = this.formatPdfText(pageData.text);
      result += processedText || I18n.t('pageRange.noContentFound', pageNumber.toString());
      
      return result;
      
    } catch (error) {
      throw new Error(I18n.t('pageRange.pageExportFailed', pageNumber.toString(), 
        error instanceof Error ? error.message : I18n.t('error.unknownError')));
    }
  }

  /**
   * Extract and merge content from multiple pages
   */
  private static async extractMergedPages(
    dataBuffer: Buffer,
    pageNumbers: number[],
    fullPdfData: any,
    inputPath: string
  ): Promise<string> {
    const filename = path.basename(inputPath);
    const pageRangeStr = PageRangeSelector.formatPageNumbers(pageNumbers);
    
    // Title information
    let result = `# ${filename} - ${I18n.t('pageRange.conversionStarted', pageRangeStr, '')}\n\n`;
    
    // File information
    result += `${I18n.t('pdf.fileInfo')}\n\n`;
    result += `- ${I18n.t('pdf.fileName')}: ${filename}\n`;
    result += `- ${I18n.t('pdf.pageCount')}: ${fullPdfData.numpages}\n`;
    result += `- Selected Pages: ${pageRangeStr}\n`;
    
    if (fullPdfData.info) {
      if (fullPdfData.info.Author) {
        result += `- ${I18n.t('pdf.author')}: ${fullPdfData.info.Author}\n`;
      }
      if (fullPdfData.info.CreationDate) {
        result += `- ${I18n.t('pdf.creationDate')}: ${fullPdfData.info.CreationDate}\n`;
      }
    }
    
    result += '\n';
    result += `${I18n.t('pdf.textContent')}\n\n`;
    
    // Process each page
    for (let i = 0; i < pageNumbers.length; i++) {
      const pageNumber = pageNumbers[i];
      
      try {
        const pageData = await pdfParse(dataBuffer, {
          first: pageNumber,
          last: pageNumber
        });
        
        if (i > 0) {
          result += '\n\n---\n\n'; // Page separator
        }
        
        result += `## Page ${pageNumber}\n\n`;
        
        const pageText = this.formatPdfText(pageData.text);
        if (pageText && pageText.trim()) {
          result += pageText;
        } else {
          result += I18n.t('pageRange.noContentFound', pageNumber.toString());
        }
        
      } catch (error) {
        result += `## Page ${pageNumber}\n\n`;
        result += I18n.t('pageRange.pageExportFailed', pageNumber.toString(), 
          error instanceof Error ? error.message : I18n.t('error.unknownError'));
      }
    }
    
    return result;
  }

  /**
   * Format PDF text for better readability
   */
  private static formatPdfText(text: string): string {
    if (!text) {
      return '';
    }
    
    // Basic text cleaning and formatting
    let processed = text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\r/g, '\n')    // Handle old Mac line endings
      .replace(/\n{3,}/g, '\n\n')  // Reduce excessive line breaks
      .replace(/[ \t]+/g, ' ')     // Normalize whitespace
      .replace(/^\s+/gm, '')       // Remove leading spaces from lines
      .replace(/\s+$/gm, '');      // Remove trailing spaces from lines
    
    return processed.trim();
  }

  /**
   * Generate output file path with suffix
   */
  private static generateOutputPath(inputPath: string, extension: string, outputDir: string, suffix: string): string {
    const basename = path.basename(inputPath, path.extname(inputPath));
    const filename = `${basename}_${suffix}${extension}`;
    return path.join(outputDir, filename);
  }
}
