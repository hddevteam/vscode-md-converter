import * as fs from 'fs/promises';
import * as path from 'path';
import * as JSZip from 'jszip';
import * as vscode from 'vscode';
import { ConversionResult, ConversionOptions } from '../types';
import { FileUtils } from '../utils/fileUtils';
import { I18n } from '../i18n';
import { PageRangeSelector, PageRangeResult } from '../ui/pageRangeSelector';

/**
 * PowerPoint slide range conversion result
 */
export interface SlideRangeConversionResult {
  success: boolean;
  slideNumbers?: number[];
  outputPath?: string;
  outputDirectory?: string;
  totalSlides?: number;
  errorMessage?: string;
  slideResults?: Array<{
    slideNumber: number;
    title?: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * PowerPoint slide range converter with slide selection support
 */
export class PowerPointSlideRangeConverter {
  
  /**
   * Convert specific slides from PowerPoint to Markdown
   */
  static async convertWithSlideRange(inputPath: string): Promise<SlideRangeConversionResult> {
    try {
      // Validate input file
      if (!await this.fileExists(inputPath)) {
        return {
          success: false,
          errorMessage: I18n.t('error.fileNotFound')
        };
      }
      
      // Check file format
      const fileExtension = path.extname(inputPath).toLowerCase();
      if (fileExtension !== '.pptx') {
        // Handle .ppt format with guidance
        if (fileExtension === '.ppt') {
          return {
            success: false,
            errorMessage: I18n.t('powerpoint.pptFormatNotSupported')
          };
        }
        return {
          success: false,
          errorMessage: I18n.t('error.unsupportedFormat', fileExtension)
        };
      }
      
      // Get slide information
      const slideInfo = await this.getSlideInfo(inputPath);
      if (slideInfo.totalSlides === 0) {
        return {
          success: false,
          errorMessage: I18n.t('powerpoint.noSlidesFound')
        };
      }

      const documentName = path.basename(inputPath);

      // Show slide range selection dialog
      const slideRangeResult: PageRangeResult = await PageRangeSelector.selectPageRange(
        slideInfo.totalSlides, 
        documentName
      );
      
      if (slideRangeResult.cancelled) {
        return {
          success: false,
          errorMessage: I18n.t('pageRange.userCancelled')
        };
      }

      // Create output directory or file
      const outputPath = this.generateOutputPath(inputPath, slideRangeResult);
      
      // Convert selected slides
      const result = await this.convertSelectedSlides(
        inputPath, 
        slideRangeResult.pageNumbers,
        slideRangeResult.outputMode,
        outputPath
      );
      
      return {
        success: result.success,
        slideNumbers: slideRangeResult.pageNumbers,
        outputPath: result.outputPath,
        outputDirectory: result.outputDirectory,
        totalSlides: slideInfo.totalSlides,
        errorMessage: result.errorMessage,
        slideResults: result.slideResults
      };
      
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : I18n.t('error.unknownError')
      };
    }
  }
  
  /**
   * Get slide information from PowerPoint file
   */
  private static async getSlideInfo(inputPath: string): Promise<{
    totalSlides: number;
    slideTitles: string[];
  }> {
    try {
      const fileContent = await fs.readFile(inputPath);
      const zip = await JSZip.loadAsync(fileContent);
      
      // Get slide files
      const slideFiles = Object.keys(zip.files)
        .filter(fileName => fileName.startsWith('ppt/slides/slide') && fileName.endsWith('.xml'))
        .sort((a, b) => {
          const aNum = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0');
          const bNum = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0');
          return aNum - bNum;
        });

      const slideTitles: string[] = [];
      
      // Extract slide titles for preview
      for (const slideFileName of slideFiles) {
        const slideFile = zip.file(slideFileName);
        if (slideFile) {
          try {
            const slideContent = await slideFile.async('text');
            const title = this.extractSlideTitle(slideContent);
            slideTitles.push(title || `${I18n.t('powerpoint.slide')} ${slideTitles.length + 1}`);
          } catch {
            slideTitles.push(`${I18n.t('powerpoint.slide')} ${slideTitles.length + 1}`);
          }
        }
      }
      
      return {
        totalSlides: slideFiles.length,
        slideTitles
      };
    } catch (error) {
      return {
        totalSlides: 0,
        slideTitles: []
      };
    }
  }
  
  /**
   * Convert selected slides
   */
  private static async convertSelectedSlides(
    inputPath: string,
    slideNumbers: number[],
    outputMode: 'merge' | 'separate',
    outputPath: string
  ): Promise<{
    success: boolean;
    outputPath?: string;
    outputDirectory?: string;
    errorMessage?: string;
    slideResults?: Array<{
      slideNumber: number;
      title?: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const slideResults: Array<{
      slideNumber: number;
      title?: string;
      success: boolean;
      error?: string;
    }> = [];

    try {
      const fileContent = await fs.readFile(inputPath);
      const zip = await JSZip.loadAsync(fileContent);
      
      // File information
      const fileStats = await fs.stat(inputPath);
      const fileName = path.basename(inputPath);
      const fileNameWithoutExt = path.basename(inputPath, path.extname(inputPath));

      // Get all slide files
      const allSlideFiles = Object.keys(zip.files)
        .filter(fileName => fileName.startsWith('ppt/slides/slide') && fileName.endsWith('.xml'))
        .sort((a, b) => {
          const aNum = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0');
          const bNum = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0');
          return aNum - bNum;
        });

      // Get notes files mapping
      const notesFiles = Object.keys(zip.files)
        .filter(fileName => fileName.startsWith('ppt/notesSlides/notesSlide') && fileName.endsWith('.xml'))
        .sort((a, b) => {
          const aNum = parseInt(a.match(/notesSlide(\d+)\.xml$/)?.[1] || '0');
          const bNum = parseInt(b.match(/notesSlide(\d+)\.xml$/)?.[1] || '0');
          return aNum - bNum;
        });

      if (outputMode === 'merge') {
        // Create single merged file
        let markdown = this.createMarkdownHeader(fileNameWithoutExt, fileName, fileStats);
        
        // Add slide range information
        const slideRangeStr = PageRangeSelector.formatPageNumbers(slideNumbers);
        markdown += `**${I18n.t('powerpoint.selectedSlides')}**: ${slideRangeStr}\n\n`;
        markdown += `---\n\n`;

        // Process each selected slide
        for (const slideNumber of slideNumbers) {
          const slideIndex = slideNumber - 1;
          
          if (slideIndex < 0 || slideIndex >= allSlideFiles.length) {
            slideResults.push({
              slideNumber,
              success: false,
              error: I18n.t('powerpoint.slideNotFound', slideNumber.toString())
            });
            continue;
          }

          try {
            const slideFile = zip.file(allSlideFiles[slideIndex]);
            if (!slideFile) {
              throw new Error(I18n.t('powerpoint.slideFileNotFound', slideNumber.toString()));
            }

            const slideContent = await slideFile.async('text');
            const slideTitle = this.extractSlideTitle(slideContent);
            
            markdown += `### ${I18n.t('powerpoint.slide', slideNumber)} ${slideTitle ? `- ${slideTitle}` : ''}\n\n`;
            
            const extractedText = this.extractTextFromSlideXml(slideContent);
            if (extractedText.trim()) {
              markdown += extractedText;
            } else {
              markdown += `*${I18n.t('powerpoint.emptySlide')}*\n`;
            }
            
            // Add notes if available
            if (slideIndex < notesFiles.length) {
              const notesFile = zip.file(notesFiles[slideIndex]);
              if (notesFile) {
                const notesContent = await notesFile.async('text');
                const extractedNotes = this.extractTextFromSlideXml(notesContent);
                if (extractedNotes.trim()) {
                  markdown += `\n\n#### ${I18n.t('powerpoint.speakerNotes')}\n\n`;
                  markdown += extractedNotes;
                }
              }
            }
            
            markdown += '\n\n---\n\n';

            slideResults.push({
              slideNumber,
              title: slideTitle || undefined,
              success: true
            });

          } catch (error) {
            slideResults.push({
              slideNumber,
              success: false,
              error: error instanceof Error ? error.message : I18n.t('error.unknownError')
            });
          }
        }

        // Write merged file
        await FileUtils.writeFile(outputPath, markdown);
        
        return {
          success: slideResults.some(r => r.success),
          outputPath,
          slideResults
        };

      } else {
        // Create separate files
        const outputDir = outputPath;
        await fs.mkdir(outputDir, { recursive: true });
        
        for (const slideNumber of slideNumbers) {
          const slideIndex = slideNumber - 1;
          
          if (slideIndex < 0 || slideIndex >= allSlideFiles.length) {
            slideResults.push({
              slideNumber,
              success: false,
              error: I18n.t('powerpoint.slideNotFound', slideNumber.toString())
            });
            continue;
          }

          try {
            const slideFile = zip.file(allSlideFiles[slideIndex]);
            if (!slideFile) {
              throw new Error(I18n.t('powerpoint.slideFileNotFound', slideNumber.toString()));
            }

            const slideContent = await slideFile.async('text');
            const slideTitle = this.extractSlideTitle(slideContent);
            
            // Create individual slide markdown
            let slideMarkdown = this.createMarkdownHeader(
              `${fileNameWithoutExt} - ${I18n.t('powerpoint.slide', slideNumber)}`, 
              fileName, 
              fileStats
            );
            
            slideMarkdown += `### ${I18n.t('powerpoint.slide', slideNumber)} ${slideTitle ? `- ${slideTitle}` : ''}\n\n`;
            
            const extractedText = this.extractTextFromSlideXml(slideContent);
            if (extractedText.trim()) {
              slideMarkdown += extractedText;
            } else {
              slideMarkdown += `*${I18n.t('powerpoint.emptySlide')}*\n`;
            }
            
            // Add notes if available
            if (slideIndex < notesFiles.length) {
              const notesFile = zip.file(notesFiles[slideIndex]);
              if (notesFile) {
                const notesContent = await notesFile.async('text');
                const extractedNotes = this.extractTextFromSlideXml(notesContent);
                if (extractedNotes.trim()) {
                  slideMarkdown += `\n\n#### ${I18n.t('powerpoint.speakerNotes')}\n\n`;
                  slideMarkdown += extractedNotes;
                }
              }
            }
            
            // Write individual slide file
            const slideFileName = `${fileNameWithoutExt}_slide-${slideNumber}.md`;
            const slideFilePath = path.join(outputDir, slideFileName);
            await FileUtils.writeFile(slideFilePath, slideMarkdown);

            slideResults.push({
              slideNumber,
              title: slideTitle || undefined,
              success: true
            });

          } catch (error) {
            slideResults.push({
              slideNumber,
              success: false,
              error: error instanceof Error ? error.message : I18n.t('error.unknownError')
            });
          }
        }

        return {
          success: slideResults.some(r => r.success),
          outputDirectory: outputDir,
          slideResults
        };
      }

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : I18n.t('error.unknownError'),
        slideResults
      };
    }
  }

  /**
   * Create markdown header section
   */
  private static createMarkdownHeader(title: string, fileName: string, fileStats: Awaited<ReturnType<typeof fs.stat>>): string {
    let markdown = '';
    
    markdown += `# ${title}\n\n`;
    markdown += `${I18n.t('powerpoint.convertedFrom', fileName)}\n\n`;
    markdown += `---\n\n`;
    
    markdown += `## ${I18n.t('powerpoint.fileInfo')}\n\n`;
    markdown += `- **${I18n.t('powerpoint.fileName')}**: ${fileName}\n`;
    markdown += `- **${I18n.t('powerpoint.fileSize')}**: ${FileUtils.formatFileSize(Number(fileStats.size))}\n`;
    markdown += `- **${I18n.t('powerpoint.modifiedDate')}**: ${fileStats.mtime.toLocaleDateString()}\n\n`;
    
    return markdown;
  }

  /**
   * Extract slide title from slide XML (first text element that looks like a title)
   */
  private static extractSlideTitle(xmlContent: string): string | null {
    try {
      // Look for title patterns in slide XML
      const textMatches = xmlContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
      if (textMatches && textMatches.length > 0) {
        for (const match of textMatches) {
          const contentMatch = match.match(/<a:t[^>]*>([^<]*)<\/a:t>/);
          if (contentMatch && contentMatch[1]) {
            const content = contentMatch[1]
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
              .trim();
            
            // Check if this looks like a title (reasonable length, not too long)
            if (content.length > 3 && content.length < 100 && !content.includes('\n')) {
              return content;
            }
          }
        }
      }
    } catch {
      // Ignore extraction errors
    }
    return null;
  }

  /**
   * Extract text content from PowerPoint slide XML (reuse from existing converter)
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
        // Process text parts to preserve structure
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
              if (this.shouldBreakLine(currentGroup.split('\n').pop() || '', part)) {
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
   * Check if a line is likely a list item
   */
  private static isLikelyListItem(text: string): boolean {
    return /^[\s]*[-•◦▪▫○●]\s/.test(text) || 
           /^[\s]*\d+[\.\)]\s/.test(text) ||
           /^[\s]*[a-zA-Z][\.\)]\s/.test(text);
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
   * Generate output path based on output mode
   */
  private static generateOutputPath(inputPath: string, slideRangeResult: PageRangeResult): string {
    const inputDir = path.dirname(inputPath);
    const basename = path.basename(inputPath, path.extname(inputPath));
    
    if (slideRangeResult.outputMode === 'merge') {
      // Single file
      const slideRangeStr = PageRangeSelector.formatPageNumbers(slideRangeResult.pageNumbers);
      const cleanSlideRange = slideRangeStr.replace(/[<>:"/\\|?*]/g, '_').replace(/,\s*/g, '-');
      return path.join(inputDir, `${basename}_slides-${cleanSlideRange}.md`);
    } else {
      // Directory for separate files - no page range in folder name
      return path.join(inputDir, `${basename}_Slides`);
    }
  }
}
