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
    convertExcelToCsv: string;
    convertPdfToText: string;
    convertPdfToImage: string;
    convertPowerPointToMarkdown: string;
    batchConvert: string;
    openConverter: string;
    debugPdfEnvironment: string;
    convertWordTablesToCsv: string;
    convertPdfTablesToCsv: string;
    convertPdfPagesToText: string;
    convertPdfPagesToImages: string;
    convertExcelWorksheetsToMarkdown: string;
    convertExcelWorksheetsToCsv: string;
    convertPowerPointSlidesToMarkdown: string;
    convertSelectedToMarkdown: string;
  };

  // Webview strings for the document converter
  webview: {
    title: string;
    wordToMarkdown: {
      title: string;
      description: string;
      buttonText: string;
    };
    excelToMarkdown: {
      title: string;
      description: string;
      buttonText: string;
    };
    pdfToText: {
      title: string;
      description: string;
      buttonText: string;
    };
    powerPointToMarkdown: {
      title: string;
      description: string;
      buttonText: string;
    };
    batchConvert: {
      title: string;
      description: string;
      buttonText: string;
    };
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
    filesCount: string;
    imagesInFolder: string;
    filesInFolder: string;
  };

  // Error messages
  error: {
    conversionFailed: string;
    batchConversionFailed: string;
    fileNotFound: string;
    unsupportedFormat: string;
    unknownError: string;
    pdfParseUnavailable: string;
    pdfParseFailed: string;
    csvWriteFailed: string;
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
    
    // Multi-select conversion messages
    multiSelect: {
      noFilesSelected: string;
      noSupportedFiles: string;
      someFilesSkipped: string;
      converting: string;
      executionFailed: string;
      isDirectory: string;
      fileNotFound: string;
      pdfNotSupported: string;
      unsupportedFormat: string;
      unsupportedFileType: string;
      starting: string;
      processingFile: string;
      singleFileSuccess: string;
      batchSuccess: string;
      partialSuccess: string;
      allFailed: string;
      success: string;
      failed: string;
      openFile: string;
      showDetails: string;
      resultsTitle: string;
      resultsHeader: string;
      resultsSummary: string;
    };
  };

  // QuickPick for Markdown info blocks
  quickpick: {
    markdownInfo: {
      title: string;
      placeholder: string;
      rememberTitle: string;
      rememberPlaceholder: string;
      rememberDescription: string;
      defaultSaved: string;
      options: {
        title: string;
        sourceNotice: string;
        fileInfo: string;
        metadata: string;
        conversionWarnings: string;
        contentHeading: string;
        sectionSeparators: string;
      };
      descriptions: {
        title: string;
        sourceNotice: string;
        fileInfo: string;
        metadata: string;
        conversionWarnings: string;
        contentHeading: string;
        sectionSeparators: string;
      };
    };
    rememberChoice: string;
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
    markdownInfoFieldsDescription: string;
    rememberMarkdownInfoSelectionDescription: string;
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
    csvFilesSaved: string;
    worksheetSelectionTitle: string;
    selectWorksheets: string;
    selectAllWorksheets: string;
    selectNoneWorksheets: string;
    selectedWorksheetsCount: string;
    outputFormatTitle: string;
    outputFormatMarkdown: string;
    outputFormatCsv: string;
    worksheetConversionComplete: string;
    worksheetsConversionComplete: string;
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

  // PDF to Image conversion specific messages
  pdfToImage: {
    toolNotFound: string;
    installationGuide: string;
    conversionStarted: string;
    conversionComplete: string;
    outputLocation: string;
    batchProgress: string;
    installNow: string;
    cancel: string;
    toolDetection: string;
    macOSInstructions: string;
    windowsInstructions: string;
    linuxInstructions: string;
    macOSCommand: string;
    windowsDownload: string;
    linuxCommand: string;
    verifyInstallation: string;
    installationSuccessful: string;
    installationFailed: string;
    checkInstallation: string;
    conversionFailed: string;
    invalidPdf: string;
    noPages: string;
    directoryCreated: string;
    imagesSaved: string;
  };

  // Common messages for all converters
  common: {
    convertedFrom: string;
    fileInfo: string;
    fileName: string;
    fileSize: string;
    modifiedDate: string;
    content: string;
    metadata: string;
    author: string;
    documentTitle: string;
    subject: string;
    pageCount: string;
    slideCount: string;
    worksheetCount: string;
    worksheetNames: string;
    conversionWarnings: string;
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
    docFormatDetail: string;
    openInWord: string;
    continueAnyway: string;
    converting: string;
    conversionComplete: string;
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

  // Debug environment messages
  debug: {
    currentWorkDir: string;
    vscodeWorkspace: string;
    extensionDir: string;
    projectRootDir: string;
    pdfParseModulePath: string;
    testFilePath: string;
    nodeModulesExists: string;
    pdfParseExists: string;
    testFileExists: string;
    pdfParseLoadSuccess: string;
    pdfParseLoadFailed: string;
    debugInfoTitle: string;
    copyToClipboard: string;
    debugFailed: string;
    none: string;
  };

  // File utility messages
  fileUtils: {
    validatingFile: string;
    fileAccessError: string;
    fileNotExistOrAccessible: string;
    checkFilePath: string;
    confirmReadPermission: string;
    pathNotFile: string;
    fileEmpty: string;
    checkFileCorrupted: string;
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
    pptFormatDetail: string;
    pptFormatNoticeDetail: string;
    bestConversionSteps: string;
    recommendedMethod: string;
    openInPowerPoint: string;
    saveAsPptx: string;
    useThisExtensionAgain: string;
    alternativeMethods: string;
    useLibreOffice: string;
    useOnlineConverter: string;
    manualExtraction: string;
    continueAnyway: string;
    converting: string;
    conversionComplete: string;
    extractedContent: string;
    pptLimitedSupport: string;
    convertToPptxSuggestion: string;
    slidesConversionComplete: string;
  };

  // Table extraction specific messages
  table: {
    sourcePage: string;
    sourceSlide: string;
    sourceSection: string;
    combinedTablesFrom: string;
    extractedDate: string;
    totalTables: string;
    tableNumber: string;
    tableTitle: string;
    tableDimensions: string;
    extractionComplete: string;
    tablesFound: string;
    noTablesFound: string;
    exportingTables: string;
    csvFilesSaved: string;
    outputModePrompt: string;
    outputModeSeparate: string;
    outputModeCombined: string;
    confirmTableExtraction: string;
    tableExtractionFailed: string;
    invalidTableData: string;
    csvEncodingPrompt: string;
    csvDelimiterPrompt: string;
    delimiterComma: string;
    delimiterSemicolon: string;
    delimiterTab: string;
    encodingUtf8: string;
    encodingGbk: string;
    mergedCellPrompt: string;
    mergedCellRepeat: string;
    mergedCellEmpty: string;
    mergedCellNotation: string;
  };

  // Page range selection specific messages
  pageRange: {
    inputPrompt: string;
    inputPlaceholder: string;
    outputModePrompt: string;
    outputModeSeparate: string;
    outputModeSeparateDesc: string;
    outputModeMerge: string;
    outputModeMergeDesc: string;
    emptyInput: string;
    invalidRangeFormat: string;
    invalidNumbers: string;
    invalidRangeOrder: string;
    outOfBounds: string;
    invalidNumber: string;
    pageOutOfBounds: string;
    noValidPages: string;
    parseError: string;
    selectionError: string;
    conversionStarted: string;
    conversionComplete: string;
    exportingPages: string;
    processingPage: string;
    pageExportFailed: string;
    noContentFound: string;
    pageProcessed: string;
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
