import * as fs from 'fs/promises';
import * as path from 'path';
import { ConversionResult, ConversionOptions } from '../types';
import { FileUtils } from '../utils/fileUtils';
import { I18n } from '../i18n';

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

export class PdfToTextConverter {
  /**
   * Convert PDF file to text format
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

      if (validation.fileType !== 'pdf') {
        return {
          success: false,
          inputPath,
          error: I18n.t('error.unsupportedFormat', validation.fileType || path.extname(inputPath))
        };
      }

      // Read PDF file
      let dataBuffer;
      try {
        dataBuffer = await fs.readFile(inputPath);
      } catch (err) {
        return {
          success: false,
          inputPath,
          error: I18n.t('pdf.cannotReadFile', err instanceof Error ? err.message : I18n.t('error.unknownError'))
        };
      }
      
      // Parse PDF
      let pdfData;
      try {
        // Use basic parsing options, avoid complex custom renderers
        pdfData = await pdfParse(dataBuffer, {
          max: 0 // Parse all pages
        });
      } catch (err) {
        return {
          success: false,
          inputPath,
          error: I18n.t('pdf.cannotParseFile', err instanceof Error ? err.message : I18n.t('error.unknownError'))
        };
      }
      
      // Extract text
      const text = this.formatPdfText(pdfData);
      
      // Generate output path
      const config = FileUtils.getConfig();
      const outputDir = options?.outputDirectory || config.outputDirectory || path.dirname(inputPath);
      const outputPath = FileUtils.generateOutputPath(inputPath, '.txt', outputDir);
      
      // Save text file
      await FileUtils.writeFile(outputPath, text);
      
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
   * Format PDF text for better readability
   */
  private static formatPdfText(pdfData: import('pdf-parse').PDFData): string {
    const { text, numpages, info } = pdfData;
    const filename = info?.Title || 'Unnamed PDF';
    
    // Title information
    let result = `# ${filename}\n\n`;
    
    // File information
    result += `${I18n.t('pdf.fileInfo')}\n\n`;
    result += `- ${I18n.t('pdf.pageCount')}: ${numpages}\n`;
    
    if (info) {
      if (info.Author) {
        result += `- ${I18n.t('pdf.author')}: ${info.Author}\n`;
      }
      if (info.CreationDate) {
        result += `- ${I18n.t('pdf.creationDate')}: ${info.CreationDate}\n`;
      }
      if (info.Creator) {
        result += `- ${I18n.t('pdf.creator')}: ${info.Creator}\n`;
      }
    }
    
    result += '\n';
    result += `${I18n.t('pdf.textContent')}\n\n`;
    // Improved text processing logic
    const processedText = PdfToTextConverter.formatForReadability(text);

    // Split text into paragraphs
    const paragraphs = processedText
      .split(/\n\s*\n/)  // Split by multiple line breaks
      .map((paragraph: string) => paragraph.trim())
      .filter((paragraph: string) => paragraph.length > 0);
    
    // Output paragraphs
    for (let i = 0; i < paragraphs.length; i++) {
      if (i > 0) {
        result += '\n\n';
      }
      
      // Handle line breaks within each paragraph
      const cleanParagraph = paragraphs[i]
        .replace(/\n+/g, ' ')  // Replace line breaks within paragraph with spaces
        .replace(/\s+/g, ' ')  // Merge multiple spaces into one
        .trim();
      
      result += cleanParagraph;
    }
    
    return result;
  }
  
  /**
   * Improve text spacing handling for PDF extracted text
   */
  private static improveTextSpacing(text: string): string {
    // Handle common spacing issues in PDF extracted text
    let processedText = text;
    
    // 1. Fix incorrectly split words (missing spaces between consecutive letters)
    // e.g., "HelloWorld" -> "Hello World"
    processedText = processedText.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    // 2. Fix spacing between numbers and letters
    // e.g., "123abc" -> "123 abc", "abc123" -> "abc 123"
    processedText = processedText.replace(/(\d)([a-zA-Z])/g, '$1 $2');
    processedText = processedText.replace(/([a-zA-Z])(\d)/g, '$1 $2');
    
    // 3. Fix spacing around punctuation marks
    // Ensure punctuation marks have space after them, no extra spaces before
    processedText = processedText.replace(/\s*([,.!?;:])\s*/g, '$1 ');
    
    // 4. Fix common PDF text extraction issues
    // Handle consecutive uppercase letters followed by lowercase letters
    processedText = processedText.replace(/([A-Z]{2,})([a-z])/g, (match, caps, lower) => {
      // If there are multiple uppercase letters, insert space before the last uppercase letter
      const lastCap = caps.slice(-1);
      const restCaps = caps.slice(0, -1);
      return restCaps + ' ' + lastCap + lower;
    });
    
    // 5. Fix spacing between sentences
    // Ensure proper spacing after sentence endings
    processedText = processedText.replace(/([.!?])\s*([A-Z])/g, '$1 $2');
    
    // 6. Handle common hyphenation issues in PDFs
    // Fix incorrectly split hyphenated words
    processedText = processedText.replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2');
    
    // 7. Clean up extra whitespace characters
    processedText = processedText.replace(/[ \t]+/g, ' ');  // Merge spaces and tabs
    processedText = processedText.replace(/\n[ \t]+/g, '\n');  // Remove leading spaces from lines
    processedText = processedText.replace(/[ \t]+\n/g, '\n');  // Remove trailing spaces from lines
    
    return processedText;
  }

  // Advanced text formatting method for better readability
  private static formatForReadability(text: string): string {
    let formatted = text;

    // 1. Identify and protect special formats (like code blocks, links, etc.)
    const protectedSections: string[] = [];
    let protectionIndex = 0;

    // Protect URL-like text
    formatted = formatted.replace(/https?:\/\/[^\s]+/g, (match) => {
      const placeholder = `__PROTECTED_URL_${protectionIndex++}__`;
      protectedSections.push(match);
      return placeholder;
    });

    // Protect email address-like text
    formatted = formatted.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (match) => {
      const placeholder = `__PROTECTED_EMAIL_${protectionIndex++}__`;
      protectedSections.push(match);
      return placeholder;
    });

    // 2. Apply existing text improvements
    formatted = PdfToTextConverter.improveTextSpacing(formatted);

    // 3. Restore protected content
    protectedSections.forEach((section, index) => {
      const placeholder = section.includes('@') 
        ? `__PROTECTED_EMAIL_${index}__`
        : `__PROTECTED_URL_${index}__`;
      formatted = formatted.replace(placeholder, section);
    });

    // 4. Final cleanup
    formatted = formatted
      .replace(/\n{3,}/g, '\n\n')  // Keep at most two consecutive line breaks
      .replace(/^[ \t]+/gm, '')    // Remove leading spaces from lines
      .replace(/[ \t]+$/gm, '');   // Remove trailing spaces from lines

    return formatted.trim();
  }
}
