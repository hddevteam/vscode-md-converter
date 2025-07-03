import * as fs from 'fs/promises';
import * as path from 'path';
import * as mammoth from 'mammoth';
import { I18n } from '../i18n';
import { ConversionResult, ConversionOptions } from '../types';
import { FileUtils } from '../utils/fileUtils';

export class WordToMarkdownConverter {
  /**
   * Clean up markdown text by removing unwanted HTML tags and fixing formatting issues
   */
  static cleanupMarkdown(markdown: string): string {
    let cleaned = markdown;
    
    // Remove OLE link tags (like <a id="OLE_LINK5"></a>)
    cleaned = cleaned.replace(/<a\s+id="OLE_LINK\d+"><\/a>/gi, '');
    
    // Remove other empty anchor tags
    cleaned = cleaned.replace(/<a\s+[^>]*><\/a>/gi, '');
    
    // Remove unnecessary HTML tags (but preserve markdown links)
    cleaned = cleaned.replace(/<\/?span[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/?div[^>]*>/gi, '');
    
    // Fix unnecessary backslash escaping after numbers
    // Change patterns like "1\" or "123\" to "1" or "123"
    cleaned = cleaned.replace(/(\d+)\\\s/g, '$1 ');
    cleaned = cleaned.replace(/(\d+)\\$/gm, '$1');
    
    // Fix other common escaping issues
    cleaned = cleaned.replace(/\\\./g, '.');
    cleaned = cleaned.replace(/\\,/g, ',');
    cleaned = cleaned.replace(/\\;/g, ';');
    cleaned = cleaned.replace(/\\:/g, ':');
    cleaned = cleaned.replace(/\\\+/g, '+');
    cleaned = cleaned.replace(/\\-/g, '-');
    cleaned = cleaned.replace(/\\\*/g, '*');
    cleaned = cleaned.replace(/\\=/g, '=');
    cleaned = cleaned.replace(/\\&/g, '&');
    cleaned = cleaned.replace(/\\#/g, '#');
    cleaned = cleaned.replace(/\\!/g, '!');
    
    // Clean up excessive blank lines (preserve appropriate spacing between paragraphs)
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Clean up trailing spaces at end of lines
    cleaned = cleaned.replace(/[ \t]+$/gm, '');
    
    return cleaned.trim();
  }

  /**
   * Convert Word document to Markdown format
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

      if (validation.fileType !== 'docx' && validation.fileType !== 'doc') {
        return {
          success: false,
          inputPath,
          error: I18n.t('error.unsupportedFormat', validation.fileType || path.extname(inputPath))
        };
      }

      // Get file information
      const fileStats = await fs.stat(inputPath);
      const fileName = path.basename(inputPath);
      const fileNameWithoutExt = path.basename(inputPath, path.extname(inputPath));
      const fileExtension = path.extname(inputPath).toLowerCase();
      
      let markdown = '';
      
      // Add document title and meta information
      markdown += `# ${fileNameWithoutExt}\n\n`;
      markdown += `${I18n.t('word.convertedFrom', fileName)}\n\n`;
      markdown += `---\n\n`;
      
      markdown += `## ${I18n.t('word.fileInfo')}\n\n`;
      markdown += `- **${I18n.t('word.fileName')}**: ${fileName}\n`;
      markdown += `- **${I18n.t('word.fileSize')}**: ${FileUtils.formatFileSize(fileStats.size)}\n`;
      markdown += `- **${I18n.t('word.modifiedDate')}**: ${fileStats.mtime.toLocaleString()}\n\n`;
      
      // Check file format and handle accordingly
      if (fileExtension === '.doc') {
        // Handle .doc files - provide clear guidance without attempting potentially hanging conversions
        markdown += `## ${I18n.t('word.importantNotice')}\n\n`;
        markdown += `${I18n.t('word.docFormatNotice')}\n\n`;
        markdown += `${I18n.t('word.bestConversionSteps')}\n\n`;
        markdown += `1. ${I18n.t('word.recommendedMethod')}\n`;
        markdown += `   - 在Microsoft Word中打开此文件\n`;
        markdown += `   - 选择"文件" > "另存为"\n`;
        markdown += `   - 选择格式为"Word文档 (*.docx)"\n`;
        markdown += `   - 保存后使用本扩展重新转换\n\n`;
        markdown += `2. ${I18n.t('word.alternativeMethods')}\n`;
        markdown += `   ${I18n.t('word.conversionTips')}\n\n`;
        
        // Simple attempt with mammoth, but set short timeout
        try {
          markdown += `${I18n.t('word.attemptedContent')}\n\n`;
          markdown += `${I18n.t('word.attemptingExtraction')}\n\n`;
          
          const buffer = await fs.readFile(inputPath);
          
          // Use Promise.race to set timeout
          const extractionPromise = mammoth.extractRawText(buffer);
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(I18n.t('error.unknownError'))), 5000); // 5 second timeout
          });
          
          const result = await Promise.race([extractionPromise, timeoutPromise]);
          
          if (result.value && result.value.trim()) {
            // Basic text formatting
            let formattedText = result.value
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .join('\n\n');
            
            // Apply cleanup function to remove unnecessary escape characters etc.
            formattedText = WordToMarkdownConverter.cleanupMarkdown(formattedText);
            
            markdown += `${I18n.t('word.extractedText')}\n\n`;
            markdown += formattedText;
            markdown += `\n\n${I18n.t('word.incompletContentNotice')}\n`;
          } else {
            markdown += `${I18n.t('word.cannotExtractText')}\n\n`;
            markdown += `${I18n.t('word.possibleReasons')}\n`;
            markdown += `${I18n.t('word.fileFormatSpecial')}\n`;
            markdown += `${I18n.t('word.mainlyImages')}\n`;
            markdown += `${I18n.t('word.fileCorrupted')}\n\n`;
            markdown += `${I18n.t('word.stronglyRecommend')}\n`;
          }
          
          // Show conversion messages
          if (result.messages && result.messages.length > 0) {
            markdown += `\n${I18n.t('word.conversionInfo')}\n\n`;
            for (const message of result.messages) {
              markdown += `- ${message.type}: ${message.message}\n`;
            }
          }
          
        } catch (docError) {
          markdown += `${I18n.t('word.extractionFailed', docError instanceof Error ? docError.message : I18n.t('error.unknownError'))}\n\n`;
          markdown += `${I18n.t('word.normalSituation')}\n`;
        }
        
      } else {
        // Handle .docx files
        try {
          const buffer = await fs.readFile(inputPath);
          
          // Use mammoth conversion options for better output control
          const options = {
            styleMap: "p[style-name='Heading 1'] => h1:fresh\np[style-name='Heading 2'] => h2:fresh\np[style-name='Heading 3'] => h3:fresh\np[style-name='Heading 4'] => h4:fresh\np[style-name='Heading 5'] => h5:fresh\np[style-name='Heading 6'] => h6:fresh\nr[style-name='Strong'] => strong\nr[style-name='Emphasis'] => em",
            ignoreEmptyParagraphs: true,
            convertImage: (image: any) => {
              // Convert images to base64 format
              return {
                src: `data:${image.contentType};base64,${image.buffer.toString('base64')}`,
                altText: image.altText || 'Image'
              };
            }
          };
          
          const result = await mammoth.convertToMarkdown(buffer, options);
          
          // Add conversion warning information (if any)
          if (result.messages.length > 0) {
            markdown += `## ${I18n.t('word.conversionWarnings')}\n\n`;
            for (const message of result.messages) {
              if (message.type === 'warning') {
                markdown += `- ${message.message}\n`;
              }
            }
            markdown += `\n`;
          }
          
          // Add document content
          markdown += `${I18n.t('word.content')}\n\n`;
          if (result.value && result.value.trim()) {
            let cleanedMarkdown = result.value;
            
            // Clean up unwanted HTML tags and formatting
            cleanedMarkdown = WordToMarkdownConverter.cleanupMarkdown(cleanedMarkdown);
            
            markdown += cleanedMarkdown;
          } else {
            markdown += `${I18n.t('word.noTextContent')}\n\n`;
            markdown += `${I18n.t('word.possibleReasons')}\n`;
            markdown += `${I18n.t('word.mainlyImages')}\n`;
            markdown += `${I18n.t('word.documentFormatSpecial')}\n`;
            markdown += `${I18n.t('word.passwordProtected')}\n`;
          }
          
        } catch (docxError) {
          markdown += `${I18n.t('word.conversionError')}\n\n`;
          markdown += `${I18n.t('word.processingDocxError', docxError instanceof Error ? docxError.message : I18n.t('error.unknownError'))}\n\n`;
          markdown += `${I18n.t('word.possibleSolutions')}\n`;
          markdown += `${I18n.t('word.checkFileIntegrity')}\n`;
          markdown += `${I18n.t('word.resaveInWord')}\n`;
          markdown += `${I18n.t('word.checkValidDocument')}\n`;
        }
      }

      // Generate output path
      const config = FileUtils.getConfig();
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
}
