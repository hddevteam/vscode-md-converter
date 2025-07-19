import * as vscode from 'vscode';
import { I18n } from '../i18n';

/**
 * Page range selection result
 */
export interface PageRangeResult {
  pageNumbers: number[];
  outputMode: 'merge' | 'separate';
  cancelled: boolean;
}

/**
 * Page range validation result
 */
export interface PageRangeValidation {
  isValid: boolean;
  pageNumbers: number[];
  error?: string;
}

/**
 * Page range selector utility for collecting user input
 */
export class PageRangeSelector {
  
  /**
   * Show page range selection dialog for image conversion (no output mode selection)
   */
  static async selectPageRangeForImages(totalPages: number, documentName: string): Promise<PageRangeResult> {
    const result: PageRangeResult = {
      pageNumbers: [],
      outputMode: 'separate', // Always separate for images
      cancelled: true
    };

    try {
      // Get page range input
      const pageRangeInput = await vscode.window.showInputBox({
        prompt: I18n.t('pageRange.inputPrompt', totalPages.toString(), documentName),
        placeHolder: I18n.t('pageRange.inputPlaceholder'),
        validateInput: (value: string) => {
          const validation = PageRangeSelector.validatePageRange(value, totalPages);
          return validation.isValid ? undefined : validation.error;
        }
      });

      if (!pageRangeInput) {
        return result; // User cancelled
      }

      // Parse page range
      const validation = PageRangeSelector.validatePageRange(pageRangeInput, totalPages);
      if (!validation.isValid) {
        vscode.window.showErrorMessage(validation.error || I18n.t('pageRange.invalidRange'));
        return result;
      }

      result.pageNumbers = validation.pageNumbers;
      result.cancelled = false;
      return result;

    } catch (error) {
      vscode.window.showErrorMessage(I18n.t('pageRange.selectionError', 
        error instanceof Error ? error.message : I18n.t('error.unknownError')));
      return result;
    }
  }

  /**
   * Show page range selection dialog
   */
  static async selectPageRange(totalPages: number, documentName: string): Promise<PageRangeResult> {
    const result: PageRangeResult = {
      pageNumbers: [],
      outputMode: 'separate',
      cancelled: true
    };

    try {
      // Step 1: Get page range input
      const pageRangeInput = await vscode.window.showInputBox({
        prompt: I18n.t('pageRange.inputPrompt', totalPages.toString(), documentName),
        placeHolder: I18n.t('pageRange.inputPlaceholder'),
        validateInput: (value: string) => {
          const validation = PageRangeSelector.validatePageRange(value, totalPages);
          return validation.isValid ? undefined : validation.error;
        }
      });

      if (!pageRangeInput) {
        return result; // User cancelled
      }

      // Parse page range
      const validation = PageRangeSelector.validatePageRange(pageRangeInput, totalPages);
      if (!validation.isValid) {
        vscode.window.showErrorMessage(validation.error || I18n.t('pageRange.invalidRange'));
        return result;
      }

      result.pageNumbers = validation.pageNumbers;

      // Step 2: Select output mode (only if multiple pages)
      if (result.pageNumbers.length > 1) {
        const outputModeChoice = await vscode.window.showQuickPick([
          {
            label: I18n.t('pageRange.outputModeSeparate'),
            description: I18n.t('pageRange.outputModeSeparateDesc'),
            detail: 'separate'
          },
          {
            label: I18n.t('pageRange.outputModeMerge'),
            description: I18n.t('pageRange.outputModeMergeDesc'),
            detail: 'merge'
          }
        ], {
          placeHolder: I18n.t('pageRange.outputModePrompt'),
          canPickMany: false
        });

        if (!outputModeChoice) {
          return result; // User cancelled
        }

        result.outputMode = outputModeChoice.detail as 'merge' | 'separate';
      }

      result.cancelled = false;
      return result;

    } catch (error) {
      vscode.window.showErrorMessage(I18n.t('pageRange.selectionError', 
        error instanceof Error ? error.message : I18n.t('error.unknownError')));
      return result;
    }
  }

  /**
   * Validate and parse page range input
   */
  static validatePageRange(input: string, totalPages: number): PageRangeValidation {
    const result: PageRangeValidation = {
      isValid: false,
      pageNumbers: []
    };

    if (!input || input.trim() === '') {
      result.error = I18n.t('pageRange.emptyInput');
      return result;
    }

    try {
      const pageNumbers = new Set<number>();
      const ranges = input.split(',').map(range => range.trim());

      for (const range of ranges) {
        if (range === '') {
          continue;
        }

        if (range.includes('-')) {
          // Handle range like "3-8"
          const [startStr, endStr] = range.split('-').map(s => s.trim());
          
          if (!startStr || !endStr) {
            result.error = I18n.t('pageRange.invalidRangeFormat', range);
            return result;
          }

          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);

          if (isNaN(start) || isNaN(end)) {
            result.error = I18n.t('pageRange.invalidNumbers', range);
            return result;
          }

          if (start > end) {
            result.error = I18n.t('pageRange.invalidRangeOrder', range);
            return result;
          }

          if (start < 1 || end > totalPages) {
            result.error = I18n.t('pageRange.outOfBounds', range, totalPages.toString());
            return result;
          }

          for (let i = start; i <= end; i++) {
            pageNumbers.add(i);
          }
        } else {
          // Handle single page like "5"
          const pageNum = parseInt(range, 10);
          
          if (isNaN(pageNum)) {
            result.error = I18n.t('pageRange.invalidNumber', range);
            return result;
          }

          if (pageNum < 1 || pageNum > totalPages) {
            result.error = I18n.t('pageRange.pageOutOfBounds', range, totalPages.toString());
            return result;
          }

          pageNumbers.add(pageNum);
        }
      }

      if (pageNumbers.size === 0) {
        result.error = I18n.t('pageRange.noValidPages');
        return result;
      }

      result.isValid = true;
      result.pageNumbers = Array.from(pageNumbers).sort((a, b) => a - b);
      return result;

    } catch (error) {
      result.error = I18n.t('pageRange.parseError', 
        error instanceof Error ? error.message : I18n.t('error.unknownError'));
      return result;
    }
  }

  /**
   * Format page numbers for display
   */
  static formatPageNumbers(pageNumbers: number[]): string {
    if (pageNumbers.length === 0) {
      return '';
    }
    if (pageNumbers.length === 1) {
      return pageNumbers[0].toString();
    }

    // Sort the array to ensure proper range formatting
    const sortedPages = [...pageNumbers].sort((a, b) => a - b);

    const ranges: string[] = [];
    let start = sortedPages[0];
    let end = sortedPages[0];

    for (let i = 1; i < sortedPages.length; i++) {
      if (sortedPages[i] === end + 1) {
        end = sortedPages[i];
      } else {
        if (start === end) {
          ranges.push(start.toString());
        } else {
          ranges.push(`${start}-${end}`);
        }
        start = end = sortedPages[i];
      }
    }

    // Add the last range
    if (start === end) {
      ranges.push(start.toString());
    } else {
      ranges.push(`${start}-${end}`);
    }

    return ranges.join(', ');
  }
}
