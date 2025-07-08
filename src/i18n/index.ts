import * as vscode from 'vscode';
import { EnglishMessages } from './en';
import { ChineseMessages } from './zh-cn';

// Define the structure of all translatable messages
export interface Messages {
  // Extension activation
  extension: {
    activating: string;
    activated: string;
    deactivated: string;
    activationFailed: string;
    welcomeMessage: string;
    welcomeButton: string;
  };

  // Commands
  commands: {
    convertWordToMarkdown: string;
    convertExcelToMarkdown: string;
    convertPdfToText: string;
    batchConvert: string;
    openConverter: string;
    debugPdfEnvironment: string;
  };

  // Progress and status messages
  progress: {
    processing: string;
    batchConverting: string;
    processingFile: string;
    complete: string;
    cancelled: string;
  };

  // Success messages
  success: {
    conversionComplete: string;
    allComplete: string;
    openFile: string;
    viewDetails: string;
  };

  // Error messages
  error: {
    conversionFailed: string;
    batchConversionFailed: string;
    fileNotFound: string;
    unsupportedFormat: string;
    unknownError: string;
  };

  // Batch conversion
  batch: {
    selectFolder: string;
    selectFileTypes: string;
    includeSubfolders: string;
    includeSubfoldersPrompt: string;
    selectOutputDir: string;
    outputDirSourceLocation: string;
    outputDirSourceDescription: string;
    outputDirCustom: string;
    outputDirCustomDescription: string;
    noFilesFound: string;
    noConvertibleFiles: string;
    foundFiles: string;
    continue: string;
    cancel: string;
    yes: string;
    no: string;
  };

  // File types
  fileTypes: {
    wordDocuments: string;
    excelFiles: string;
    csvFiles: string;
    pdfDocuments: string;
  };

  // Report
  report: {
    title: string;
    totalFiles: string;
    successful: string;
    failed: string;
    skipped: string;
    successfulConversions: string;
    failedConversions: string;
  };

  // Configuration
  config: {
    title: string;
    outputDirectory: string;
    outputDirectoryDescription: string;
    maxRowsExcel: string;
    maxRowsExcelDescription: string;
    preserveFormatting: string;
    preserveFormattingDescription: string;
    autoOpenResult: string;
    autoOpenResultDescription: string;
    showWelcomeMessage: string;
    showWelcomeMessageDescription: string;
  };

  // Excel conversion specific messages
  excel: {
    fileInfo: string;
    fileName: string;
    fileSize: string;
    sheetCount: string;
    sheetList: string;
    worksheet: string;
    emptyWorksheet: string;
    dataDimensions: string;
    dataDimensionsValue: string;
    rowsLimitNotice: string;
    whitespaceChar: string;
    convertedFrom: string;
  };

  // PDF conversion specific messages
  pdf: {
    fileInfo: string;
    fileName: string;
    fileSize: string;
    modifiedDate: string;
    pageCount: string;
    author: string;
    creationDate: string;
    creator: string;
    textContent: string;
    convertedFrom: string;
    cannotReadFile: string;
    cannotParseFile: string;
  };

  // Word conversion specific messages
  word: {
    fileInfo: string;
    fileName: string;
    fileSize: string;
    modifiedDate: string;
    convertedFrom: string;
    importantNotice: string;
    docFormatNotice: string;
    bestConversionSteps: string;
    recommendedMethod: string;
    alternativeMethods: string;
    conversionTips: string;
    attemptedContent: string;
    attemptingExtraction: string;
    extractedText: string;
    incompletContentNotice: string;
    cannotExtractText: string;
    possibleReasons: string;
    fileFormatSpecial: string;
    mainlyImages: string;
    fileCorrupted: string;
    stronglyRecommend: string;
    conversionInfo: string;
    extractionFailed: string;
    normalSituation: string;
    content: string;
    noTextContent: string;
    conversionError: string;
    processingDocxError: string;
    possibleSolutions: string;
    checkFileIntegrity: string;
    resaveInWord: string;
    checkValidDocument: string;
    conversionWarnings: string;
    documentFormatSpecial: string;
    passwordProtected: string;
  };

  // PowerPoint conversion specific messages
  powerpoint: {
    fileInfo: string;
    fileName: string;
    fileSize: string;
    modifiedDate: string;
    slideCount: string;
    author: string;
    title: string;
    subject: string;
    convertedFrom: string;
    slidesContent: string;
    slide: string;
    emptySlide: string;
    speakerNotes: string;
    notesForSlide: string;
    extractionError: string;
    extractionErrorMessage: string;
    basicInfoOnly: string;
    importantNotice: string;
    pptFormatNotice: string;
    bestConversionSteps: string;
    recommendedMethod: string;
    openInPowerPoint: string;
    saveAsPptx: string;
    useThisExtensionAgain: string;
    alternativeMethods: string;
    useLibreOffice: string;
    useOnlineConverter: string;
    manualExtraction: string;
  };
}

// Language detection and message retrieval
export class I18n {
  private static messages: Messages;

  /**
   * Initialize i18n with the appropriate language
   */
  static initialize(): void {
    const locale = this.getLocale();
    
    switch (locale) {
      case 'zh-cn':
      case 'zh':
        this.messages = ChineseMessages;
        break;
      default:
        this.messages = EnglishMessages;
        break;
    }
  }

  /**
   * Get the current VS Code locale
   */
  private static getLocale(): string {
    return vscode.env.language.toLowerCase();
  }

  /**
   * Get all messages for the current locale
   */
  static getMessages(): Messages {
    if (!this.messages) {
      this.initialize();
    }
    return this.messages;
  }

  /**
   * Get a specific message by path (e.g., 'extension.activated')
   */
  static getMessage(path: string, ...args: any[]): string {
    const messages = this.getMessages();
    const keys = path.split('.');
    let value: any = messages;

    for (const key of keys) {
      value = value?.[key];
    }

    if (typeof value === 'string') {
      // Simple string interpolation
      return args.reduce((str, arg, index) => {
        return str.replace(`{${index}}`, String(arg));
      }, value);
    }

    return path; // Fallback to the path if message not found
  }

  /**
   * Shorthand for getMessage
   */
  static t(path: string, ...args: any[]): string {
    return this.getMessage(path, ...args);
  }
}

// Initialize when the module is loaded
I18n.initialize();
