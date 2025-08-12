import * as fs from 'fs/promises';
import * as path from 'path';
import { MarkdownInfoConfig, MarkdownInfoField } from '../types';
import { I18n } from '../i18n';
import { FileUtils } from '../utils/fileUtils';

/**
 * Interface for document metadata
 */
export interface DocumentMetadata {
  fileName?: string;
  fileSize?: number;
  modifiedDate?: Date;
  author?: string;
  title?: string;
  subject?: string;
  pageCount?: number;
  slideCount?: number;
  worksheetCount?: number;
  worksheetNames?: string[];
  [key: string]: any;
}

/**
 * Interface for conversion warnings
 */
export interface ConversionWarning {
  type: 'info' | 'warning' | 'error';
  message: string;
}

/**
 * Utility class for generating configurable Markdown information blocks
 */
export class MarkdownInfoBlockGenerator {
  /**
   * Generate complete Markdown header with configurable info blocks
   */
  static async generateMarkdownHeader(
    inputPath: string,
    config: MarkdownInfoConfig,
    metadata?: DocumentMetadata,
    warnings?: ConversionWarning[]
  ): Promise<string> {
    let markdown = '';
    const fileName = path.basename(inputPath);
    const fileNameWithoutExt = path.basename(inputPath, path.extname(inputPath));

    // Document title
    if (config.includeTitle) {
      const documentTitle = metadata?.title || fileNameWithoutExt;
      markdown += `# ${documentTitle}\n\n`;
    }

    // Source notice
    if (config.includeSourceNotice) {
      markdown += `${I18n.t('common.convertedFrom', fileName)}\n\n`;
    }

    // Add separator after header if any header content was added
    if (config.includeTitle || config.includeSourceNotice) {
      if (config.includeSectionSeparators) {
        markdown += `---\n\n`;
      }
    }

    // File information block
    if (config.includeFileInfo) {
      markdown += await this.generateFileInfoBlock(inputPath, metadata);
    }

    // Document metadata block
    if (config.includeMetadata && metadata) {
      markdown += this.generateMetadataBlock(metadata);
    }

    // Conversion warnings block
    if (config.includeConversionWarnings && warnings && warnings.length > 0) {
      markdown += this.generateWarningsBlock(warnings);
    }

    // Content heading
    if (config.includeContentHeading) {
      markdown += `## ${I18n.t('common.content')}\n\n`;
    }

    return markdown;
  }

  /**
   * Generate file information block
   */
  private static async generateFileInfoBlock(inputPath: string, metadata?: DocumentMetadata): Promise<string> {
    let markdown = `## ${I18n.t('common.fileInfo')}\n\n`;
    
    const fileName = metadata?.fileName || path.basename(inputPath);
    markdown += `- **${I18n.t('common.fileName')}**: ${fileName}\n`;

    // File size
    if (metadata?.fileSize !== undefined) {
      markdown += `- **${I18n.t('common.fileSize')}**: ${FileUtils.formatFileSize(metadata.fileSize)}\n`;
    } else {
      try {
        const fileStats = await fs.stat(inputPath);
        markdown += `- **${I18n.t('common.fileSize')}**: ${FileUtils.formatFileSize(fileStats.size)}\n`;
      } catch {
        // File stats not available
      }
    }

    // Modified date
    if (metadata?.modifiedDate) {
      markdown += `- **${I18n.t('common.modifiedDate')}**: ${metadata.modifiedDate.toLocaleString()}\n`;
    } else {
      try {
        const fileStats = await fs.stat(inputPath);
        markdown += `- **${I18n.t('common.modifiedDate')}**: ${fileStats.mtime.toLocaleString()}\n`;
      } catch {
        // File stats not available
      }
    }

    markdown += '\n';
    return markdown;
  }

  /**
   * Generate document metadata block
   */
  private static generateMetadataBlock(metadata: DocumentMetadata): string {
    let markdown = `## ${I18n.t('common.metadata')}\n\n`;
    let hasMetadata = false;

    // Author
    if (metadata.author) {
      markdown += `- **${I18n.t('common.author')}**: ${metadata.author}\n`;
      hasMetadata = true;
    }

    // Document title (if different from filename)
    if (metadata.title) {
      markdown += `- **${I18n.t('common.documentTitle')}**: ${metadata.title}\n`;
      hasMetadata = true;
    }

    // Subject
    if (metadata.subject) {
      markdown += `- **${I18n.t('common.subject')}**: ${metadata.subject}\n`;
      hasMetadata = true;
    }

    // Page count (for Word/PDF documents)
    if (metadata.pageCount !== undefined) {
      markdown += `- **${I18n.t('common.pageCount')}**: ${metadata.pageCount}\n`;
      hasMetadata = true;
    }

    // Slide count (for PowerPoint presentations)
    if (metadata.slideCount !== undefined) {
      markdown += `- **${I18n.t('common.slideCount')}**: ${metadata.slideCount}\n`;
      hasMetadata = true;
    }

    // Worksheet information (for Excel files)
    if (metadata.worksheetCount !== undefined) {
      markdown += `- **${I18n.t('common.worksheetCount')}**: ${metadata.worksheetCount}\n`;
      hasMetadata = true;
    }

    if (metadata.worksheetNames && metadata.worksheetNames.length > 0) {
      markdown += `- **${I18n.t('common.worksheetNames')}**: ${metadata.worksheetNames.join(', ')}\n`;
      hasMetadata = true;
    }

    // Add custom metadata fields
    for (const [key, value] of Object.entries(metadata)) {
      if (!['fileName', 'fileSize', 'modifiedDate', 'author', 'title', 'subject', 'pageCount', 'slideCount', 'worksheetCount', 'worksheetNames'].includes(key)) {
        if (value !== undefined && value !== null && value !== '') {
          markdown += `- **${key}**: ${value}\n`;
          hasMetadata = true;
        }
      }
    }

    if (!hasMetadata) {
      return ''; // Don't include empty metadata section
    }

    markdown += '\n';
    return markdown;
  }

  /**
   * Generate conversion warnings block
   */
  private static generateWarningsBlock(warnings: ConversionWarning[]): string {
    let markdown = `## ${I18n.t('common.conversionWarnings')}\n\n`;

    for (const warning of warnings) {
      let icon = '';
      switch (warning.type) {
        case 'info':
          icon = 'ℹ️';
          break;
        case 'warning':
          icon = '⚠️';
          break;
        case 'error':
          icon = '❌';
          break;
      }
      
      markdown += `${icon} ${warning.message}\n\n`;
    }

    return markdown;
  }

  /**
   * Generate section separator
   */
  static generateSectionSeparator(): string {
    return '---\n\n';
  }

  /**
   * Get default configuration for a specific file type
   */
  static getDefaultConfig(fileExtension: string): MarkdownInfoConfig {
    const defaults: MarkdownInfoConfig = {
      includeTitle: true,
      includeSourceNotice: true,
      includeFileInfo: false,
      includeMetadata: false,
      includeConversionWarnings: true,
      includeContentHeading: false,
      includeSectionSeparators: false
    };

    // Customize defaults based on file type
    switch (fileExtension.toLowerCase()) {
      case '.docx':
      case '.doc':
        // Word documents often have rich metadata
        defaults.includeMetadata = true;
        defaults.includeFileInfo = true;
        break;
      
      case '.xlsx':
      case '.xls':
      case '.csv':
        // Excel files benefit from worksheet information
        defaults.includeMetadata = true;
        defaults.includeContentHeading = true;
        break;
      
      case '.pptx':
      case '.ppt':
        // PowerPoint presentations have slide information
        defaults.includeMetadata = true;
        defaults.includeFileInfo = true;
        defaults.includeSectionSeparators = true;
        break;
      
      default:
        // Keep conservative defaults for unknown types
        break;
    }

    return defaults;
  }
}
