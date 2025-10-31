import * as fs from 'fs/promises';
import * as path from 'path';
import {
  Document,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  WidthType,
  Packer
} from 'docx';
import { ConversionResult, ConversionOptions, MarkdownInfoConfig, SupportedFileType } from '../types';
import { FileUtils } from '../utils/fileUtils';
import { I18n } from '../i18n';
import { MarkdownInfoBlockGenerator, DocumentMetadata } from './markdownInfoBlockGenerator';

/**
 * Markdown token types for parsing
 */
enum TokenType {
  Heading1 = 'heading1',
  Heading2 = 'heading2',
  Heading3 = 'heading3',
  Heading4 = 'heading4',
  Heading5 = 'heading5',
  Heading6 = 'heading6',
  Paragraph = 'paragraph',
  UnorderedListItem = 'unordered_list_item',
  OrderedListItem = 'ordered_list_item',
  HtmlUnorderedList = 'html_unordered_list',
  HtmlOrderedList = 'html_ordered_list',
  CodeBlock = 'code_block',
  Table = 'table',
  Blockquote = 'blockquote',
  HorizontalRule = 'horizontal_rule',
  Image = 'image',
  Link = 'link'
}

/**
 * Markdown token structure
 */
interface MarkdownToken {
  type: TokenType;
  content: string;
  level?: number; // For headings and nested lists
  language?: string; // For code blocks
  metadata?: any;
  children?: MarkdownToken[];
}

/**
 * Inline formatting tokens
 */
interface InlineFormat {
  type: 'bold' | 'italic' | 'code' | 'strikethrough' | 'link' | 'image';
  content: string;
  url?: string;
  alt?: string;
}

/**
 * Main Markdown to Word converter class
 */
export class MarkdownToWordConverter {
  /**
   * Convert Markdown file to Word document
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

      const fileExt = path.extname(inputPath).toLowerCase();
      if (fileExt !== '.md' && fileExt !== '.markdown') {
        return {
          success: false,
          inputPath,
          error: I18n.t('error.unsupportedFormat', fileExt || 'markdown')
        };
      }

      // Read markdown file
      const markdownContent = await fs.readFile(inputPath, 'utf-8');

      // Get configuration
      const config = FileUtils.getConfig();
      const markdownConfig = options?.markdownInfo || 
        FileUtils.getMarkdownInfoConfig() || 
        MarkdownInfoBlockGenerator.getDefaultConfig('.md');

      // Convert markdown to document
      const document = await this.convertMarkdownToWord(markdownContent, inputPath, markdownConfig);

      // Generate output path
      const outputDir = options?.outputDirectory || config.outputDirectory || path.dirname(inputPath);
      const outputPath = FileUtils.generateOutputPath(inputPath, '.docx', outputDir);

      // Save document
      const bytes = await Packer.toBuffer(document);
      await fs.writeFile(outputPath, bytes);

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
   * Convert markdown content to Word document
   */
  private static async convertMarkdownToWord(
    markdownContent: string,
    filePath: string,
    markdownConfig: MarkdownInfoConfig
  ): Promise<Document> {
    // Parse markdown content
    const tokens = this.parseMarkdown(markdownContent);

    // Convert tokens to docx elements
    const sections = [
      {
        children: this.tokensToDocxElements(tokens)
      }
    ];

    // Create document with metadata
    const metadata: DocumentMetadata = {
      fileName: path.basename(filePath),
      fileSize: markdownContent.length,
      modifiedDate: new Date()
    };

    // Generate info block using async method
    const infoBlock = await MarkdownInfoBlockGenerator.generateMarkdownHeader(filePath, markdownConfig, metadata);
    const infoParagraphs = this.convertInfoBlockToDocxParagraphs(infoBlock);

    // Combine info block with content
    const allElements = [...infoParagraphs, ...sections[0].children];

    return new Document({
      sections: [
        {
          children: allElements
        }
      ]
    });
  }

  /**
   * Parse markdown content into tokens
   */
  private static parseMarkdown(content: string): MarkdownToken[] {
    const lines = content.split('\n');
    const tokens: MarkdownToken[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines (but preserve them as separators)
      if (!trimmed) {
        i++;
        continue;
      }

      // Heading detection
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        tokens.push({
          type: (
            [TokenType.Heading1, TokenType.Heading2, TokenType.Heading3, 
             TokenType.Heading4, TokenType.Heading5, TokenType.Heading6][level - 1]
          ) as TokenType,
          content: headingMatch[2],
          level
        });
        i++;
        continue;
      }

      // Code block detection (fenced)
      if (trimmed.startsWith('```')) {
        const codeBlock = this.parseCodeBlock(lines, i);
        tokens.push(codeBlock.token);
        i = codeBlock.nextIndex;
        continue;
      }

      // Table detection
      if (trimmed.includes('|')) {
        const table = this.parseTable(lines, i);
        if (table.token) {
          tokens.push(table.token);
          i = table.nextIndex;
          continue;
        }
      }

      // Blockquote detection
      if (trimmed.startsWith('>')) {
        const blockquote = this.parseBlockquote(lines, i);
        tokens.push(blockquote.token);
        i = blockquote.nextIndex;
        continue;
      }

      // HTML list detection
      if (trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) {
        const htmlList = this.parseHtmlList(lines, i);
        tokens.push(htmlList.token);
        i = htmlList.nextIndex;
        continue;
      }

      // List detection
      const listMatch = trimmed.match(/^(\d+\.|\-|\+|\*)\s+/);
      if (listMatch) {
        const list = this.parseList(lines, i);
        tokens.push(...list.tokens);
        i = list.nextIndex;
        continue;
      }

      // Horizontal rule
      if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        tokens.push({
          type: TokenType.HorizontalRule,
          content: ''
        });
        i++;
        continue;
      }

      // Regular paragraph
      const paragraph = this.parseParagraph(lines, i);
      tokens.push({
        type: TokenType.Paragraph,
        content: paragraph.content
      });
      i = paragraph.nextIndex;
    }

    return tokens;
  }

  /**
   * Parse code block
   */
  private static parseCodeBlock(
    lines: string[],
    startIndex: number
  ): { token: MarkdownToken; nextIndex: number } {
    const firstLine = lines[startIndex].trim();
    const language = firstLine.slice(3).trim();
    const codeLines: string[] = [];
    let i = startIndex + 1;

    while (i < lines.length && !lines[i].trim().startsWith('```')) {
      codeLines.push(lines[i]);
      i++;
    }

    return {
      token: {
        type: TokenType.CodeBlock,
        content: codeLines.join('\n').trim(),
        language: language || undefined
      },
      nextIndex: i + 1
    };
  }

  /**
   * Parse table
   */
  private static parseTable(
    lines: string[],
    startIndex: number
  ): { token?: MarkdownToken; nextIndex: number } {
    if (startIndex + 1 >= lines.length) {
      return { nextIndex: startIndex + 1 };
    }

    const headerLine = lines[startIndex].trim();
    const separatorLine = lines[startIndex + 1].trim();

    // Validate table format
    if (!separatorLine.includes('|') || !separatorLine.includes('-')) {
      return { nextIndex: startIndex + 1 };
    }

    const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);
    const rows: string[][] = [];
    let i = startIndex + 2;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line.includes('|')) {
        break;
      }

      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length === headers.length) {
        rows.push(cells);
      }
      i++;
    }

    if (headers.length > 0) {
      return {
        token: {
          type: TokenType.Table,
          content: JSON.stringify({ headers, rows }),
          metadata: { headers, rows }
        },
        nextIndex: i
      };
    }

    return { nextIndex: startIndex + 1 };
  }

  /**
   * Parse blockquote
   */
  private static parseBlockquote(
    lines: string[],
    startIndex: number
  ): { token: MarkdownToken; nextIndex: number } {
    const quoteLines: string[] = [];
    let i = startIndex;

    while (i < lines.length && lines[i].trim().startsWith('>')) {
      const content = lines[i].replace(/^>\s?/, '');
      quoteLines.push(content);
      i++;
    }

    return {
      token: {
        type: TokenType.Blockquote,
        content: quoteLines.join('\n')
      },
      nextIndex: i
    };
  }

  /**
   * Parse HTML list (<ul> or <ol>)
   */
  private static parseHtmlList(
    lines: string[],
    startIndex: number
  ): { token: MarkdownToken; nextIndex: number } {
    const firstLine = lines[startIndex].trim();
    const isOrdered = firstLine.startsWith('<ol');
    const htmlLines: string[] = [];
    let i = startIndex;
    let foundClosing = false;

    while (i < lines.length) {
      const line = lines[i];
      htmlLines.push(line);

      if (isOrdered && line.includes('</ol>')) {
        foundClosing = true;
        i++;
        break;
      } else if (!isOrdered && line.includes('</ul>')) {
        foundClosing = true;
        i++;
        break;
      }

      i++;
    }

    const htmlContent = htmlLines.join('\n');

    return {
      token: {
        type: isOrdered ? TokenType.HtmlOrderedList : TokenType.HtmlUnorderedList,
        content: htmlContent
      },
      nextIndex: i
    };
  }

  /**
   * Parse list items
   */
  private static parseList(
    lines: string[],
    startIndex: number
  ): { tokens: MarkdownToken[]; nextIndex: number } {
    const tokens: MarkdownToken[] = [];
    const firstLine = lines[startIndex].trim();
    const isOrdered = /^\d+\./.test(firstLine);
    let i = startIndex;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        i++;
        continue;
      }

      const indent = line.length - line.trimLeft().length;
      const isListItem = /^(\d+\.|\-|\+|\*)\s+/.test(trimmed);

      if (!isListItem) {
        break;
      }

      const content = trimmed.replace(/^(\d+\.|\-|\+|\*)\s+/, '');
      tokens.push({
        type: isOrdered ? TokenType.OrderedListItem : TokenType.UnorderedListItem,
        content,
        level: Math.floor(indent / 2)
      });

      i++;
    }

    return { tokens, nextIndex: i };
  }

  /**
   * Parse paragraph (handles inline formatting and HTML lists)
   */
  private static parseParagraph(
    lines: string[],
    startIndex: number
  ): { content: string; nextIndex: number } {
    const paragraphLines: string[] = [];
    let i = startIndex;

    // Check if this paragraph contains HTML list tags
    const firstLineContent = lines[startIndex];
    if (firstLineContent.includes('<ul') || firstLineContent.includes('<ol')) {
      // This is an HTML list, collect all lines until closing tags
      while (i < lines.length) {
        const line = lines[i];
        paragraphLines.push(line);
        
        // Check if we've found closing tags
        if (line.includes('</ul>') || line.includes('</ol>')) {
          i++;
          break;
        }
        i++;
      }
      
      return {
        content: paragraphLines.join('\n'),
        nextIndex: i
      };
    }

    while (i < lines.length) {
      const line = lines[i].trim();

      if (!line) {
        // Empty line marks end of paragraph
        break;
      }

      // Check if this line starts a new block element
      if (/^#{1,6}\s|^```|^\d+\.|^[\-\+\*]\s|^>|^\|/.test(line)) {
        break;
      }

      paragraphLines.push(lines[i]);
      i++;
    }

    return {
      content: paragraphLines.join('\n'),
      nextIndex: i
    };
  }

  /**
   * Convert tokens to docx elements
   */
  private static tokensToDocxElements(tokens: MarkdownToken[]): any[] {
    const elements: any[] = [];

    for (const token of tokens) {
      const converted = this.tokenToDocxElement(token);
      if (converted) {
        // Handle both single elements and arrays of elements
        if (Array.isArray(converted)) {
          elements.push(...converted);
        } else {
          elements.push(converted);
        }
      }
    }

    return elements;
  }

  /**
   * Convert single token to docx element
   */
  private static tokenToDocxElement(token: MarkdownToken): any {
    const content = this.parseInlineFormatting(token.content);

    switch (token.type) {
      case TokenType.Heading1:
        return new Paragraph({
          text: token.content,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        });

      case TokenType.Heading2:
        return new Paragraph({
          text: token.content,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 160 }
        });

      case TokenType.Heading3:
        return new Paragraph({
          text: token.content,
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 140 }
        });

      case TokenType.Heading4:
        return new Paragraph({
          text: token.content,
          heading: HeadingLevel.HEADING_4,
          spacing: { after: 120 }
        });

      case TokenType.Heading5:
        return new Paragraph({
          text: token.content,
          heading: HeadingLevel.HEADING_5,
          spacing: { after: 100 }
        });

      case TokenType.Heading6:
        return new Paragraph({
          text: token.content,
          heading: HeadingLevel.HEADING_6,
          spacing: { after: 100 }
        });

      case TokenType.Paragraph: {
        // Handle <br> tags in paragraphs - split into multiple paragraphs
        const brLines = token.content.split(/<br\s*\/?>/gi);
        
        if (brLines.length > 1) {
          // Return array of paragraphs (will need to handle in tokensToDocxElements)
          // For now, create a single paragraph with line breaks in the content
          const runs: TextRun[] = [];
          
          for (let i = 0; i < brLines.length; i++) {
            if (i > 0) {
              // Add line break
              runs.push(new TextRun({
                text: '\n',
                break: 1
              }));
            }
            
            const lineContent = this.parseInlineFormatting(brLines[i]);
            runs.push(...lineContent);
          }
          
          return new Paragraph({
            children: runs.length > 0 ? runs : [new TextRun(token.content)],
            spacing: { line: 240, after: 200 }
          });
        }
        
        return new Paragraph({
          children: content.length > 0 ? content : [new TextRun(token.content)],
          spacing: { line: 240, after: 200 }
        });
      }

      case TokenType.CodeBlock:
        return new Paragraph({
          text: token.content,
          style: 'Code',
          spacing: { before: 200, after: 200 }
        });

      case TokenType.Blockquote:
        return new Paragraph({
          text: token.content,
          border: {
            left: {
              color: 'CCCCCC',
              space: 1,
              style: BorderStyle.SINGLE,
              size: 24
            }
          },
          indent: { left: 720 },
          spacing: { before: 200, after: 200 }
        });

      case TokenType.Table:
        return this.createTable(token.metadata);

      case TokenType.HorizontalRule:
        return new Paragraph({
          border: {
            bottom: {
              color: '000000',
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6
            }
          },
          spacing: { before: 200, after: 200 }
        });

      case TokenType.UnorderedListItem:
        const unorderedContent = this.parseInlineFormatting(token.content);
        return new Paragraph({
          children: unorderedContent.length > 0 ? unorderedContent : [new TextRun(token.content)],
          bullet: {
            level: token.level || 0
          }
        });

      case TokenType.OrderedListItem:
        const orderedContent = this.parseInlineFormatting(token.content);
        return new Paragraph({
          children: orderedContent.length > 0 ? orderedContent : [new TextRun(token.content)],
          numbering: {
            level: token.level || 0,
            reference: 'default-list'
          }
        });

      case TokenType.HtmlUnorderedList:
        return this.convertHtmlListToParagraphs(token.content, false);

      case TokenType.HtmlOrderedList:
        return this.convertHtmlListToParagraphs(token.content, true);

      default:
        return null;
    }
  }

  /**
   * Convert HTML list tags to Word list paragraphs
   * Returns an array of Paragraph elements representing the list items
   * @param htmlContent - HTML content containing list tags
   * @param isOrdered - true for ordered list (<ol>), false for unordered list (<ul>)
   */
  private static convertHtmlListToParagraphs(htmlContent: string, isOrdered: boolean): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    
    if (isOrdered) {
      // Extract ordered lists
      let olMatch;
      const olRegex = /<ol[^>]*>([\s\S]*?)<\/ol>/gi;
      while ((olMatch = olRegex.exec(htmlContent)) !== null) {
        const olContent = olMatch[1];
        const items = olContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
        
        items.forEach((item: string, index: number) => {
          const liContent = item.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1').trim();
          const runs = this.parseInlineFormatting(liContent);
          
          paragraphs.push(new Paragraph({
            children: runs.length > 0 ? runs : [new TextRun(liContent)],
            numbering: {
              level: 0,
              reference: 'default-list'
            },
            spacing: { after: 100 }
          }));
        });
      }
    } else {
      // Extract unordered lists
      let ulMatch;
      const ulRegex = /<ul[^>]*>([\s\S]*?)<\/ul>/gi;
      while ((ulMatch = ulRegex.exec(htmlContent)) !== null) {
        const ulContent = ulMatch[1];
        const items = ulContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
        
        items.forEach((item: string) => {
          const liContent = item.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1').trim();
          const runs = this.parseInlineFormatting(liContent);
          
          paragraphs.push(new Paragraph({
            children: runs.length > 0 ? runs : [new TextRun(liContent)],
            bullet: {
              level: 0
            },
            spacing: { after: 100 }
          }));
        });
      }
    }
    
    return paragraphs.length > 0 ? paragraphs : [];
  }

  /**
   * Create Word table from markdown table
   */
  private static createTable(metadata: any): Table {
    const { headers, rows } = metadata;

    const headerCells = headers.map(
      (header: string) => {
        const paragraphs = this.createTableCellContent(header);
        return new TableCell({
          children: paragraphs,
          shading: { fill: 'E0E0E0' }
        });
      }
    );

    const headerRow = new TableRow({
      children: headerCells
    });

    const bodyRows = rows.map(
      (row: string[]) =>
        new TableRow({
          children: row.map((cell: string) => {
            const paragraphs = this.createTableCellContent(cell);
            return new TableCell({
              children: paragraphs
            });
          })
        })
    );

    return new Table({
      rows: [headerRow, ...bodyRows],
      width: { size: 100, type: WidthType.PERCENTAGE }
    });
  }

  /**
   * Create table cell content with support for line breaks and lists
   */
  private static createTableCellContent(cellContent: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    
    // First, check if content contains HTML lists and convert them
    if (cellContent.includes('<ul') || cellContent.includes('<ol')) {
      // Handle HTML lists directly in table cells
      const isOrdered = cellContent.includes('<ol');
      
      if (isOrdered) {
        // Extract ordered lists
        let olMatch;
        const olRegex = /<ol[^>]*>([\s\S]*?)<\/ol>/gi;
        while ((olMatch = olRegex.exec(cellContent)) !== null) {
          const olContent = olMatch[1];
          const items = olContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
          
          items.forEach((item: string, index: number) => {
            const liContent = item.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1').trim();
            const formattedContent = this.parseInlineFormatting(liContent, true);
            
            paragraphs.push(
              new Paragraph({
                children: formattedContent.length > 0 ? formattedContent : [new TextRun(liContent)],
                numbering: {
                  level: 0,
                  reference: 'default-list'
                },
                spacing: { after: 100 }
              })
            );
          });
        }
      } else {
        // Extract unordered lists
        let ulMatch;
        const ulRegex = /<ul[^>]*>([\s\S]*?)<\/ul>/gi;
        while ((ulMatch = ulRegex.exec(cellContent)) !== null) {
          const ulContent = ulMatch[1];
          const items = ulContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
          
          items.forEach((item: string) => {
            const liContent = item.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1').trim();
            const formattedContent = this.parseInlineFormatting(liContent, true);
            
            paragraphs.push(
              new Paragraph({
                children: formattedContent.length > 0 ? formattedContent : [new TextRun(liContent)],
                bullet: {
                  level: 0
                },
                spacing: { after: 100 }
              })
            );
          });
        }
      }
      
      // If we processed lists, return the paragraphs
      if (paragraphs.length > 0) {
        return paragraphs;
      }
    }
    
    // Handle <br> tags by splitting into multiple paragraphs
    const lines = cellContent.split(/<br\s*\/?>/gi);

    for (const line of lines) {
      // Check if this line is a list item (- item or * item or + item or 1. item)
      const listMatch = line.trim().match(/^(\d+\.|\-|\+|\*)\s+(.+)$/);
      
      if (listMatch) {
        // It's a list item - parse formatting with br preserved
        const listContent = listMatch[2];
        const formattedContent = this.parseInlineFormatting(listContent, true);
        
        paragraphs.push(
          new Paragraph({
            children: formattedContent.length > 0 ? formattedContent : [new TextRun(listContent)],
            bullet: {
              level: 0
            }
          })
        );
      } else {
        // Regular paragraph content - parse formatting with br preserved
        const trimmedLine = line.trim();
        if (trimmedLine) {
          const formattedContent = this.parseInlineFormatting(trimmedLine, true);
          
          paragraphs.push(
            new Paragraph({
              children: formattedContent.length > 0 ? formattedContent : [new TextRun(trimmedLine)]
            })
          );
        }
      }
    }

    // If no paragraphs were created, return one empty paragraph
    if (paragraphs.length === 0) {
      paragraphs.push(new Paragraph({ text: '' }));
    }

    return paragraphs;
  }

  /**
   * Handle HTML tags in text (convert, remove, or strip)
   * @param text - Text content to process
   * @param preserveBr - If true, preserve <br> tags for splitting (used in tables)
   */
  private static handleHtmlTags(text: string, preserveBr: boolean = false): string {
    // Handle <br> and <br/> tags - keep them if preserveBr is true (for tables)
    if (!preserveBr) {
      text = text.replace(/<br\s*\/?>/gi, '\n');
    }
    
    // NOTE: HTML lists (<ul>, <ol>, <li>) are handled elsewhere:
    // - In main document: by convertHtmlListToParagraphs() which creates Word list items
    // - In table cells: by createTableCellContent() which detects list patterns
    // So we only handle lists here if preserveBr is true (table context)
    
    if (preserveBr) {
      // In table context, convert HTML lists to markdown format for later processing
      // Use <br> tags as separators to maintain consistency with line splitting
      
      // Handle HTML lists - convert <ul><li>item</li></ul> to - item<br>- item format
      text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match: string, content: string) => {
        const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
        const listItems = items.map((item: string) => {
          const liContent = item.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1').trim();
          return '- ' + liContent;
        }).join('<br>');
        return listItems + '<br>';
      });
      
      // Handle HTML ordered lists
      text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match: string, content: string) => {
        const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
        const listItems = items.map((item: string, index: number) => {
          const liContent = item.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1').trim();
          return (index + 1) + '. ' + liContent;
        }).join('<br>');
        return listItems + '<br>';
      });
      
      // Remove any remaining <li> tags
      text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1');
    } else {
      // In main document context, just remove the HTML list tags
      // The lists are already converted to Word list items by convertHtmlListToParagraphs()
      text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '');
      text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, '');
      text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '');
    }
    
    // Remove <div> and </div> tags but keep content
    text = text.replace(/<\/?div[^>]*>/gi, '');
    
    // Remove <span> and </span> tags but keep content
    text = text.replace(/<\/?span[^>]*>/gi, '');
    
    // Remove <p> and </p> tags but keep content
    text = text.replace(/<\/?p[^>]*>/gi, '');
    
    // Remove other common HTML tags
    text = text.replace(/<\/?strong[^>]*>/gi, '**');
    text = text.replace(/<\/?em[^>]*>/gi, '*');
    text = text.replace(/<\/?b[^>]*>/gi, '**');
    text = text.replace(/<\/?i[^>]*>/gi, '*');
    
    // Clean up multiple consecutive whitespace/newlines
    text = text.replace(/\n\s*\n/g, '\n');
    
    return text;
  }

  /**
   * Parse inline formatting (bold, italic, code, links, etc.)
   * @param text - Text content to parse
   * @param preserveBr - If true, preserve <br> tags (used in tables)
   */
  private static parseInlineFormatting(text: string, preserveBr: boolean = false): TextRun[] {
    // First, handle any HTML tags in the text
    text = this.handleHtmlTags(text, preserveBr);
    const runs: TextRun[] = [];
    let remaining = text;
    let lastIndex = 0;

    // Regex patterns for inline formatting (ordered by specificity)
    const patterns = [
      { regex: /\*\*\*(.+?)\*\*\*/g, bold: true, italic: true },
      { regex: /\*\*(.+?)\*\*/g, bold: true },
      { regex: /__(.+?)__/g, bold: true },
      { regex: /\*(.+?)\*/g, italic: true },
      { regex: /_(.+?)_/g, italic: true },
      { regex: /~~(.+?)~~/g, strike: true },
      { regex: /`(.+?)`/g, code: true }
    ];

    // Find all matches
    let result;
    const matches: Array<{ match: RegExpExecArray; type: string; format: any }> = [];

    for (const pattern of patterns) {
      const regex = new RegExp(pattern.regex.source, 'g');
      while ((result = regex.exec(text)) !== null) {
        matches.push({
          match: result,
          type: 'format',
          format: {
            bold: pattern.bold,
            italic: pattern.italic,
            strike: pattern.strike,
            code: pattern.code
          }
        });
      }
    }

    // Sort matches by position
    matches.sort((a, b) => a.match.index - b.match.index);

    // Remove overlapping matches (keep the first match in any overlap)
    const nonOverlapping: typeof matches = [];
    let lastEnd = 0;
    for (const matchItem of matches) {
      if (matchItem.match.index >= lastEnd) {
        nonOverlapping.push(matchItem);
        lastEnd = matchItem.match.index + matchItem.match[0].length;
      }
    }

    // Build TextRuns with proper formatting
    let pos = 0;
    for (const { match, format } of nonOverlapping) {
      if (match.index > pos) {
        runs.push(new TextRun(text.substring(pos, match.index)));
      }

      runs.push(
        new TextRun({
          text: match[1],
          bold: format.bold,
          italics: format.italic,
          strike: format.strike,
          font: format.code ? 'Courier New' : undefined
        })
      );

      pos = match.index + match[0].length;
    }

    if (pos < text.length) {
      runs.push(new TextRun(text.substring(pos)));
    }

    return runs.length > 0 ? runs : [new TextRun(text)];
  }

  /**
   * Convert markdown info block to docx paragraphs
   */
  private static convertInfoBlockToDocxParagraphs(infoBlock: string): Paragraph[] {
    if (!infoBlock) {
      return [];
    }

    const lines = infoBlock.split('\n');
    return lines.map(
      line =>
        new Paragraph({
          text: line,
          spacing: { after: 100 }
        })
    );
  }
}
