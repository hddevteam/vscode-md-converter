import * as fs from 'fs/promises';
import * as path from 'path';
import * as JSZip from 'jszip';
import { ConversionResult, ConversionOptions, MarkdownInfoConfig } from '../types';
import { FileUtils } from '../utils/fileUtils';
import { I18n } from '../i18n';
import { MarkdownInfoBlockGenerator, DocumentMetadata, ConversionWarning } from './markdownInfoBlockGenerator';

/**
 * PowerPoint to Markdown converter
 * Handles both .pptx and .ppt files
 */
export class PowerPointToMarkdownConverter {
  /**
   * Convert PowerPoint presentation to Markdown format
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

      if (validation.fileType !== 'pptx' && validation.fileType !== 'ppt') {
        return {
          success: false,
          inputPath,
          error: I18n.t('error.unsupportedFormat', validation.fileType || path.extname(inputPath))
        };
      }

      // Determine markdown info configuration
      const fileExtension = path.extname(inputPath).toLowerCase();
      const markdownConfig: MarkdownInfoConfig = options?.markdownInfo ||
        FileUtils.getMarkdownInfoConfig() ||
        MarkdownInfoBlockGenerator.getDefaultConfig(fileExtension);

      // Generate Markdown content
      let markdown: string;
      if (fileExtension === '.pptx') {
        markdown = await this.convertPptxToMarkdown(inputPath, markdownConfig);
      } else {
        // .ppt format - provide guidance for conversion
        markdown = await this.handlePptFormat(inputPath, markdownConfig);
      }

  // Generate output path
  const convConfig = FileUtils.getConfig();
  const outputDir = options?.outputDirectory || convConfig.outputDirectory || path.dirname(inputPath);
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
   * Convert PPTX file to Markdown format
   */
  private static async convertPptxToMarkdown(filePath: string, markdownConfig: MarkdownInfoConfig): Promise<string> {
    const fileContent = await fs.readFile(filePath);
    const zip = await JSZip.loadAsync(fileContent);
    
    // File information
    const fileStats = await fs.stat(filePath);
    const fileName = path.basename(filePath);

    // Create Markdown content
    let markdown = '';

    // Prepare metadata and warnings
    const metadata: DocumentMetadata = {
      fileName,
      fileSize: fileStats.size,
      modifiedDate: fileStats.mtime
    };
    const warnings: ConversionWarning[] = [];

    // Header and file info/metadata blocks
    markdown += await MarkdownInfoBlockGenerator.generateMarkdownHeader(
      filePath,
      markdownConfig,
      metadata,
      warnings
    );

    try {
      // Extract presentation metadata
      const appPropsFile = zip.file('docProps/app.xml');
      const corePropsFile = zip.file('docProps/core.xml');
      
      if (appPropsFile) {
        const appPropsContent = await appPropsFile.async('text');
        const slideCountMatch = appPropsContent.match(/<Slides>(\d+)<\/Slides>/);
        if (slideCountMatch) {
          // Enrich metadata with slide count information if metadata section enabled later
          if (markdownConfig.includeMetadata) {
            markdown += `- **${I18n.t('common.slideCount')}**: ${slideCountMatch[1]}\n`;
          }
        }
      }

      if (corePropsFile) {
        const corePropsContent = await corePropsFile.async('text');
        
        const authorMatch = corePropsContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/);
        if (authorMatch) {
          if (markdownConfig.includeMetadata) {
            markdown += `- **${I18n.t('common.author')}**: ${authorMatch[1]}\n`;
          }
        }

        const titleMatch = corePropsContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/);
        if (titleMatch) {
          if (markdownConfig.includeMetadata) {
            markdown += `- **${I18n.t('common.documentTitle')}**: ${titleMatch[1]}\n`;
          }
        }

        const subjectMatch = corePropsContent.match(/<dc:subject[^>]*>([^<]+)<\/dc:subject>/);
        if (subjectMatch) {
          if (markdownConfig.includeMetadata) {
            markdown += `- **${I18n.t('common.subject')}**: ${subjectMatch[1]}\n`;
          }
        }
      }
      if (markdownConfig.includeSectionSeparators) {
        markdown += '\n---\n\n';
      } else {
        markdown += '\n';
      }

      // Extract slides content and their corresponding notes
      const slidesFolder = zip.folder('ppt/slides');
      const notesFolder = zip.folder('ppt/notesSlides');
      
      if (slidesFolder) {
        const slideFiles = Object.keys(zip.files)
          .filter(fileName => fileName.startsWith('ppt/slides/slide') && fileName.endsWith('.xml'))
          .sort((a, b) => {
            const aNum = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0');
            const bNum = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0');
            return aNum - bNum;
          });

        // Prepare notes files mapping
        const notesFiles = notesFolder ? Object.keys(zip.files)
          .filter(fileName => fileName.startsWith('ppt/notesSlides/notesSlide') && fileName.endsWith('.xml'))
          .sort((a, b) => {
            const aNum = parseInt(a.match(/notesSlide(\d+)\.xml$/)?.[1] || '0');
            const bNum = parseInt(b.match(/notesSlide(\d+)\.xml$/)?.[1] || '0');
            return aNum - bNum;
          }) : [];

        markdown += `## ${I18n.t('powerpoint.slidesContent')}\n\n`;

        for (let i = 0; i < slideFiles.length; i++) {
          const slideFile = zip.file(slideFiles[i]);
          if (slideFile) {
            const slideContent = await slideFile.async('text');
            const slideNumber = i + 1;
            
            markdown += `### ${I18n.t('powerpoint.slide', slideNumber)}\n\n`;
            
            const extractedText = this.extractTextFromSlideXml(slideContent);
            if (extractedText.trim()) {
              markdown += extractedText;
            } else {
              markdown += `*${I18n.t('powerpoint.emptySlide')}*\n`;
            }
            
            // Add notes for this slide if available
            if (i < notesFiles.length) {
              const notesFile = zip.file(notesFiles[i]);
              if (notesFile) {
                const notesContent = await notesFile.async('text');
                const extractedNotes = this.extractTextFromSlideXml(notesContent);
                if (extractedNotes.trim()) {
                  markdown += `\n\n#### ${I18n.t('powerpoint.speakerNotes')}\n\n`;
                  markdown += extractedNotes;
                }
              }
            }
            
            if (markdownConfig.includeSectionSeparators) {
              markdown += '\n\n---\n\n';
            } else {
              markdown += '\n\n';
            }
          }
        }
      }

    } catch (extractionError) {
      markdown += `\n## ${I18n.t('powerpoint.extractionError')}\n\n`;
      markdown += `${I18n.t('powerpoint.extractionErrorMessage', extractionError instanceof Error ? extractionError.message : I18n.t('error.unknownError'))}\n\n`;
      markdown += `${I18n.t('powerpoint.basicInfoOnly')}\n\n`;
    }

    return markdown;
  }

  /**
   * Handle .ppt format (older PowerPoint format)
   */
  /**
   * Handle .ppt format with simple notice
   */
  private static async handlePptFormat(filePath: string, markdownConfig: MarkdownInfoConfig): Promise<string> {
    const fileStats = await fs.stat(filePath);
    const fileName = path.basename(filePath);

    let markdown = '';
    
    // Prepare metadata and warnings
    const metadata: DocumentMetadata = {
      fileName,
      fileSize: fileStats.size,
      modifiedDate: fileStats.mtime
    };
    const warnings: ConversionWarning[] = [];

    // Header and file info/metadata blocks
    markdown += await MarkdownInfoBlockGenerator.generateMarkdownHeader(
      filePath,
      markdownConfig,
      metadata,
      warnings
    );

    // Simple notice about .ppt format limitation
    markdown += `## 已提取内容\n\n`;
    markdown += `.ppt格式的支持有限。已提取基本文件信息。\n\n`;
    markdown += `要获得完整内容提取，请将此演示文稿另存为.pptx格式后重新转换。\n\n`;

    return markdown;
  }

  /**
   * Extract text content from PowerPoint slide XML
   */
  private static extractTextFromSlideXml(xmlContent: string): string {
    let text = '';
    
    // Extract all text content from <a:t> tags
    const textMatches = xmlContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
    if (textMatches) {
      const textParts: string[] = [];
      
      textMatches.forEach(match => {
        const contentMatch = match.match(/<a:t[^>]*>([^<]*)<\/a:t>/);
        if (contentMatch && contentMatch[1]) {
          const content = contentMatch[1]
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .trim();
          
          if (content) {
            textParts.push(content);
          }
        }
      });
      
      if (textParts.length > 0) {
        // Process text parts more carefully to preserve structure
        const processedParts: string[] = [];
        let currentGroup = '';
        
        for (let i = 0; i < textParts.length; i++) {
          const part = textParts[i];
          
          // Check if this part should start a new group
          if (this.isDefinitelyHeader(part)) {
            // Finish current group if exists
            if (currentGroup.trim()) {
              processedParts.push(currentGroup.trim());
              currentGroup = '';
            }
            processedParts.push(`## ${part}`);
          } else if (this.isLikelyListItem(part)) {
            // Finish current group if it's not a list
            if (currentGroup.trim() && !this.isLikelyListItem(currentGroup.trim().split('\n').pop() || '')) {
              processedParts.push(currentGroup.trim());
              currentGroup = '';
            }
            // Add as list item
            const cleanedItem = part.replace(/^[\s]*[-•◦▪▫○●]\s*/, '').replace(/^[\s]*\d+[\.\)]\s*/, '').replace(/^[\s]*[a-zA-Z][\.\)]\s*/, '');
            if (currentGroup) {
              currentGroup += `\n- ${cleanedItem}`;
            } else {
              currentGroup = `- ${cleanedItem}`;
            }
          } else {
            // Regular text - decide how to join
            if (currentGroup) {
              // Check if we need a line break or just a space
              const lastChar = currentGroup.slice(-1);
              const firstChar = part.charAt(0);
              
              // Add line break if:
              // - Previous part ended with punctuation
              // - Current part looks like start of new sentence
              // - Parts seem semantically different
              if (lastChar === '。' || lastChar === '！' || lastChar === '？' || 
                  (lastChar === '：' && !part.match(/^[a-zA-Z0-9]/)) ||
                  this.shouldBreakLine(currentGroup.split('\n').pop() || '', part)) {
                currentGroup += `\n${part}`;
              } else {
                currentGroup += ` ${part}`;
              }
            } else {
              currentGroup = part;
            }
          }
        }
        
        // Add remaining group
        if (currentGroup.trim()) {
          processedParts.push(currentGroup.trim());
        }
        
        text = processedParts.join('\n\n');
      }
    }
    
    return text;
  }

  /**
   * Check if a line is definitely a header (more strict criteria)
   */
  private static isDefinitelyHeader(text: string): boolean {
    // Only treat as header if it's clearly a title:
    // - Longer than 10 characters but shorter than 100
    // - Doesn't contain common punctuation that indicates it's part of a sentence
    // - Doesn't start with common non-header words
    const nonHeaderStarters = ['备注', '注：', '说明', '提示', '例如', '比如', '另外', '此外', '然而', '但是', '因此', '所以'];
    const lowerText = text.toLowerCase();
    
    return text.length >= 10 && 
           text.length <= 100 &&
           !text.includes('：') &&
           !text.includes('。') &&
           !text.includes('，') &&
           !text.includes('？') &&
           !text.includes('！') &&
           !nonHeaderStarters.some(starter => lowerText.startsWith(starter));
  }

  /**
   * Determine if a line break should be inserted between two text parts
   */
  private static shouldBreakLine(prevPart: string, currentPart: string): boolean {
    // Break if previous part looks like it ends a thought
    if (prevPart.match(/[。！？：]$/)) {
      return true;
    }
    
    // Break if current part starts with typical sentence starters
    const sentenceStarters = ['备注', '注意', '说明', '提示', '例如', '另外', '此外', '然而', '但是', '因此', '所以', '总之'];
    if (sentenceStarters.some(starter => currentPart.toLowerCase().startsWith(starter))) {
      return true;
    }
    
    // Break if parts have very different lengths (likely different content types)
    const lengthRatio = Math.max(prevPart.length, currentPart.length) / Math.min(prevPart.length, currentPart.length);
    if (lengthRatio > 3 && Math.min(prevPart.length, currentPart.length) > 5) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if a line is likely a header (less strict, kept for compatibility)
   */
  private static isLikelyHeader(text: string): boolean {
    // This method is now less aggressive
    return text.length <= 60 && 
           text.length >= 10 &&
           !text.endsWith('.') && 
           !text.endsWith(',') &&
           !text.includes('：') &&
           !text.includes('。') &&
           (text === text.toUpperCase() || text.split(' ').every(word => word.charAt(0) === word.charAt(0).toUpperCase()));
  }

  /**
   * Check if a line is likely a list item
   */
  private static isLikelyListItem(text: string): boolean {
    // List items often start with bullets, numbers, or common list indicators
    return /^[\s]*[-•◦▪▫○●]\s/.test(text) || 
           /^[\s]*\d+[\.\)]\s/.test(text) ||
           /^[\s]*[a-zA-Z][\.\)]\s/.test(text);
  }
}
