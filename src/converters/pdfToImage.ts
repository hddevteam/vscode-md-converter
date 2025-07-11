import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { I18n } from '../i18n';
import { ToolDetection, ToolAvailability } from '../utils/toolDetection';

const execAsync = promisify(exec);

/**
 * Conversion options for PDF to image
 */
export interface ConversionOptions {
  inputPath: string;
  outputDir: string;
  filePrefix: string;
}

/**
 * Conversion result information
 */
export interface ConversionResult {
  success: boolean;
  outputFiles: string[];
  totalPages: number;
  outputDirectory: string;
  errorMessage?: string;
}

/**
 * Progress callback function type
 */
export type ProgressCallback = (current: number, total: number, message: string) => void;

/**
 * PDF to Image converter using poppler-utils
 */
export class PdfToImageConverter {
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
   * Convert PDF to PNG images
   */
  async convert(
    options: ConversionOptions,
    progressCallback?: ProgressCallback
  ): Promise<ConversionResult> {
    try {
      // Ensure tool is available
      if (!this.toolAvailability || !this.toolAvailability.isInstalled) {
        throw new Error(I18n.t('pdfToImage.toolNotFound'));
      }
      
      // Validate input file
      if (!fs.existsSync(options.inputPath)) {
        throw new Error(I18n.t('error.fileNotFound'));
      }
      
      // Create output directory
      await this.createOutputDirectory(options.outputDir);
      
      // Execute conversion
      const result = await this.executeConversion(options, progressCallback);
      
      return result;
      
    } catch (error) {
      return {
        success: false,
        outputFiles: [],
        totalPages: 0,
        outputDirectory: options.outputDir,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
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
   * Execute the actual PDF to image conversion using pdftoppm
   */
  private async executeConversion(
    options: ConversionOptions,
    progressCallback?: ProgressCallback
  ): Promise<ConversionResult> {
    const { inputPath, outputDir, filePrefix } = options;
    const outputPrefix = path.join(outputDir, filePrefix);
    
    // Build the pdftoppm command
    // -png: Output PNG format
    // -r 300: 300 DPI resolution for high quality
    // pdftoppm will automatically append -01, -02, etc. to the prefix
    const command = `"${this.toolAvailability!.executablePath}" -png -r 300 "${inputPath}" "${outputPrefix}"`;
    
    try {
      // Report progress start
      if (progressCallback) {
        progressCallback(0, 100, I18n.t('pdfToImage.conversionStarted'));
      }
      
      // Execute the conversion command
      const { stdout, stderr } = await execAsync(command, {
        // Set timeout to 5 minutes for large files
        timeout: 5 * 60 * 1000
      });
      
      // Check for errors in stderr (pdftoppm sometimes outputs info to stderr)
      if (stderr && this.isErrorOutput(stderr)) {
        throw new Error(stderr);
      }
      
      // Find generated output files
      const outputFiles = await this.findOutputFiles(outputDir, filePrefix);
      
      if (outputFiles.length === 0) {
        throw new Error(I18n.t('pdfToImage.noPages'));
      }
      
      // Report completion
      if (progressCallback) {
        progressCallback(100, 100, I18n.t('pdfToImage.conversionComplete'));
      }
      
      return {
        success: true,
        outputFiles,
        totalPages: outputFiles.length,
        outputDirectory: outputDir
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(I18n.t('pdfToImage.conversionFailed', errorMessage));
    }
  }
  
  /**
   * Check if stderr output indicates an actual error
   */
  private isErrorOutput(stderr: string): boolean {
    // pdftoppm might output warnings to stderr that are not actual errors
    const errorKeywords = ['error', 'failed', 'cannot', 'invalid', 'corrupt'];
    const lowerStderr = stderr.toLowerCase();
    
    return errorKeywords.some(keyword => lowerStderr.includes(keyword));
  }
  
  /**
   * Find generated output files in the output directory
   */
  private async findOutputFiles(outputDir: string, filePrefix: string): Promise<string[]> {
    try {
      const files = fs.readdirSync(outputDir);
      const imageFiles = files
        .filter(file => file.startsWith(filePrefix) && file.endsWith('.png'))
        .map(file => path.join(outputDir, file))
        .sort(); // Sort to ensure proper page order
      
      return imageFiles;
    } catch (error) {
      throw new Error(`Failed to read output directory: ${error}`);
    }
  }
  
  /**
   * Get estimated page count from PDF (if possible)
   * This is a helper method for progress tracking
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
      // If pdfinfo is not available or fails, return -1
      // The actual page count will be determined after conversion
    }
    
    return -1; // Unknown page count
  }
  
  /**
   * Generate output file prefix based on input filename
   */
  static generateFilePrefix(inputPath: string): string {
    const basename = path.basename(inputPath, path.extname(inputPath));
    // Only replace characters that are problematic for file systems
    // Keep alphanumeric characters, Chinese characters, hyphens, and underscores
    return basename.replace(/[<>:"/\\|?*]/g, '_');
  }
  
  /**
   * Generate output directory path
   */
  static generateOutputDirectory(inputPath: string): string {
    const inputDir = path.dirname(inputPath);
    const basename = path.basename(inputPath, path.extname(inputPath));
    
    // Use format: filename_Images
    return path.join(inputDir, `${basename}_Images`);
  }
}
