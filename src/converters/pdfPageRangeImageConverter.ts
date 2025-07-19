import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { I18n } from '../i18n';
import { ToolDetection, ToolAvailability } from '../utils/toolDetection';
import { PageRangeSelector, PageRangeResult } from '../ui/pageRangeSelector';

const execAsync = promisify(exec);

/**
 * Page range to image conversion result
 */
export interface PageRangeImageResult {
  success: boolean;
  pageNumbers: number[];
  outputMode: 'merge' | 'separate';
  outputFiles: string[];
  outputDirectory: string;
  totalPages: number;
  errorMessage?: string;
  pageResults?: Array<{
    pageNumber: number;
    outputPath: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * PDF to Image converter with page range support using poppler-utils
 */
export class PdfPageRangeImageConverter {
  private toolAvailability: ToolAvailability | null = null;
  
  /**
   * Initialize converter and check tool availability
   */
  async initialize(): Promise<boolean> {
    this.toolAvailability = await ToolDetection.detectPopplerUtils();
    return this.toolAvailability.isInstalled;
  }
  
  /**
   * Get tool availability information
   */
  getToolAvailability(): ToolAvailability | null {
    return this.toolAvailability;
  }
  
  /**
   * Convert specific pages from PDF to PNG images
   */
  async convertPagesWithRange(inputPath: string): Promise<PageRangeImageResult> {
    try {
      // Ensure tool is available
      if (!this.toolAvailability || !this.toolAvailability.isInstalled) {
        throw new Error(I18n.t('pdfToImage.toolNotFound'));
      }
      
      // Validate input file
      if (!fs.existsSync(inputPath)) {
        throw new Error(I18n.t('error.fileNotFound'));
      }
      
      // Get total page count
      const totalPages = await this.getPageCount(inputPath);
      if (totalPages <= 0) {
        throw new Error(I18n.t('pdfToImage.noPages'));
      }

      const documentName = path.basename(inputPath);

      // Show page range selection dialog
      const pageRangeResult: PageRangeResult = await PageRangeSelector.selectPageRange(totalPages, documentName);
      
      if (pageRangeResult.cancelled) {
        return {
          success: false,
          pageNumbers: [],
          outputMode: 'separate',
          outputFiles: [],
          outputDirectory: '',
          totalPages,
          errorMessage: I18n.t('progress.cancelled')
        };
      }

      // Create output directory
      const outputDir = this.generateOutputDirectory(inputPath, pageRangeResult);
      await this.createOutputDirectory(outputDir);
      
      // Convert selected pages
      const result = await this.convertSelectedPages(
        inputPath, 
        pageRangeResult.pageNumbers,
        pageRangeResult.outputMode,
        outputDir
      );
      
      return {
        success: result.success,
        pageNumbers: pageRangeResult.pageNumbers,
        outputMode: pageRangeResult.outputMode,
        outputFiles: result.outputFiles,
        outputDirectory: outputDir,
        totalPages,
        errorMessage: result.errorMessage,
        pageResults: result.pageResults
      };
      
    } catch (error) {
      return {
        success: false,
        pageNumbers: [],
        outputMode: 'separate',
        outputFiles: [],
        outputDirectory: '',
        totalPages: 0,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Convert selected pages to images
   */
  private async convertSelectedPages(
    inputPath: string,
    pageNumbers: number[],
    outputMode: 'merge' | 'separate',
    outputDir: string
  ): Promise<{
    success: boolean;
    outputFiles: string[];
    errorMessage?: string;
    pageResults?: Array<{
      pageNumber: number;
      outputPath: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const pageResults: Array<{
      pageNumber: number;
      outputPath: string;
      success: boolean;
      error?: string;
    }> = [];
    const outputFiles: string[] = [];

    try {
      if (outputMode === 'separate') {
        // Convert each page separately
        for (const pageNumber of pageNumbers) {
          try {
            const outputPath = await this.convertSinglePage(inputPath, pageNumber, outputDir);
            pageResults.push({
              pageNumber,
              outputPath,
              success: true
            });
            outputFiles.push(outputPath);
          } catch (error) {
            pageResults.push({
              pageNumber,
              outputPath: '',
              success: false,
              error: error instanceof Error ? error.message : I18n.t('error.unknownError')
            });
          }
        }
      } else {
        // Convert pages as a range (merge mode - still creates separate files but in sequence)
        const filePrefix = this.generateFilePrefix(inputPath, pageNumbers);
        const outputPaths = await this.convertPageRange(inputPath, pageNumbers, outputDir, filePrefix);
        
        for (let i = 0; i < pageNumbers.length; i++) {
          const pageNumber = pageNumbers[i];
          if (i < outputPaths.length) {
            pageResults.push({
              pageNumber,
              outputPath: outputPaths[i],
              success: true
            });
            outputFiles.push(outputPaths[i]);
          } else {
            pageResults.push({
              pageNumber,
              outputPath: '',
              success: false,
              error: 'Page not converted'
            });
          }
        }
      }

      const successfulConversions = pageResults.filter(r => r.success).length;
      const allSuccess = successfulConversions === pageNumbers.length;

      return {
        success: allSuccess,
        outputFiles,
        pageResults,
        errorMessage: allSuccess ? undefined : 
          I18n.t('pageRange.pageExportFailed', 
            (pageNumbers.length - successfulConversions).toString(), 
            pageNumbers.length.toString())
      };

    } catch (error) {
      return {
        success: false,
        outputFiles: [],
        errorMessage: error instanceof Error ? error.message : I18n.t('error.unknownError')
      };
    }
  }

  /**
   * Convert a single page to image
   */
  private async convertSinglePage(inputPath: string, pageNumber: number, outputDir: string): Promise<string> {
    const basename = path.basename(inputPath, path.extname(inputPath));
    const outputFileName = `${basename}_page-${pageNumber}.png`;
    const outputPath = path.join(outputDir, outputFileName);
    
    // Build pdftoppm command for single page
    const command = `"${this.toolAvailability!.executablePath}" -png -r 300 -f ${pageNumber} -l ${pageNumber} "${inputPath}" "${path.join(outputDir, `${basename}_page-${pageNumber}`)}"`;
    
    try {
      const { stderr } = await execAsync(command, {
        timeout: 2 * 60 * 1000 // 2 minutes timeout
      });
      
      if (stderr && this.isErrorOutput(stderr)) {
        throw new Error(stderr);
      }

      // Check if the output file was created
      const expectedFiles = fs.readdirSync(outputDir).filter(file => 
        file.startsWith(`${basename}_page-${pageNumber}`) && file.endsWith('.png')
      );

      if (expectedFiles.length === 0) {
        throw new Error(I18n.t('pdfToImage.noPages'));
      }

      // pdftoppm adds -1 suffix, so we need to rename the file
      const actualOutputPath = path.join(outputDir, expectedFiles[0]);
      if (actualOutputPath !== outputPath) {
        fs.renameSync(actualOutputPath, outputPath);
      }

      return outputPath;

    } catch (error) {
      throw new Error(I18n.t('pageRange.pageExportFailed', pageNumber.toString(), 
        error instanceof Error ? error.message : I18n.t('error.unknownError')));
    }
  }

  /**
   * Convert a range of pages to images
   */
  private async convertPageRange(
    inputPath: string, 
    pageNumbers: number[], 
    outputDir: string, 
    filePrefix: string
  ): Promise<string[]> {
    const sortedPages = [...pageNumbers].sort((a, b) => a - b);
    const minPage = sortedPages[0];
    const maxPage = sortedPages[sortedPages.length - 1];
    
    // Build pdftoppm command for page range
    const outputPrefix = path.join(outputDir, filePrefix);
    const command = `"${this.toolAvailability!.executablePath}" -png -r 300 -f ${minPage} -l ${maxPage} "${inputPath}" "${outputPrefix}"`;
    
    try {
      const { stderr } = await execAsync(command, {
        timeout: 5 * 60 * 1000 // 5 minutes timeout
      });
      
      if (stderr && this.isErrorOutput(stderr)) {
        throw new Error(stderr);
      }

      // Find all generated files and filter for our selected pages
      const allFiles = fs.readdirSync(outputDir)
        .filter(file => file.startsWith(path.basename(filePrefix)) && file.endsWith('.png'))
        .sort();

      const outputPaths: string[] = [];
      
      // Map generated files to our selected pages
      for (const pageNumber of sortedPages) {
        const pageIndex = pageNumber - minPage + 1; // pdftoppm uses 1-based indexing from the start page
        const expectedSuffix = pageIndex.toString().padStart(2, '0'); // pdftoppm pads with zeros
        
        const matchingFile = allFiles.find(file => 
          file.includes(`-${expectedSuffix}.png`) || 
          file.includes(`-${pageIndex}.png`) ||
          file.endsWith(`-${pageNumber}.png`)
        );
        
        if (matchingFile) {
          outputPaths.push(path.join(outputDir, matchingFile));
        }
      }

      return outputPaths;

    } catch (error) {
      throw new Error(I18n.t('pdfToImage.conversionFailed', 
        error instanceof Error ? error.message : I18n.t('error.unknownError')));
    }
  }
  
  /**
   * Create output directory if it doesn't exist
   */
  private async createOutputDirectory(outputDir: string): Promise<void> {
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
    } catch (error) {
      throw new Error(`Failed to create output directory: ${error}`);
    }
  }
  
  /**
   * Check if stderr output indicates an actual error
   */
  private isErrorOutput(stderr: string): boolean {
    const errorKeywords = ['error', 'failed', 'cannot', 'invalid', 'corrupt'];
    const lowerStderr = stderr.toLowerCase();
    
    return errorKeywords.some(keyword => lowerStderr.includes(keyword));
  }
  
  /**
   * Get page count from PDF
   */
  async getPageCount(pdfPath: string): Promise<number> {
    try {
      // Use pdfinfo if available (part of poppler-utils)
      const command = `pdfinfo "${pdfPath}"`;
      const { stdout } = await execAsync(command);
      
      const match = stdout.match(/Pages:\s+(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    } catch (error) {
      // If pdfinfo is not available, return -1
      console.warn('Could not get page count:', error);
    }
    
    return -1; // Unknown page count
  }
  
  /**
   * Generate output file prefix
   */
  private generateFilePrefix(inputPath: string, pageNumbers: number[]): string {
    const basename = path.basename(inputPath, path.extname(inputPath));
    const pageRangeStr = PageRangeSelector.formatPageNumbers(pageNumbers);
    
    // Clean the page range string for use in filename
    const cleanPageRange = pageRangeStr.replace(/[<>:"/\\|?*]/g, '_').replace(/,\s*/g, '-');
    
    return `${basename}_pages-${cleanPageRange}`;
  }
  
  /**
   * Generate output directory path
   */
  private generateOutputDirectory(inputPath: string, pageRangeResult: PageRangeResult): string {
    const inputDir = path.dirname(inputPath);
    const basename = path.basename(inputPath, path.extname(inputPath));
    const pageRangeStr = PageRangeSelector.formatPageNumbers(pageRangeResult.pageNumbers);
    const cleanPageRange = pageRangeStr.replace(/[<>:"/\\|?*]/g, '_').replace(/,\s*/g, '-');
    
    return path.join(inputDir, `${basename}_Images_Pages-${cleanPageRange}`);
  }
}
