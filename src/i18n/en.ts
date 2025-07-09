import { Messages } from './index';

export const EnglishMessages: Messages = {
  // Extension activation
  extension: {
    activating: 'Document Converter extension is activating...',
    activated: 'Document Converter extension activated successfully',
    deactivated: 'Document Converter extension deactivated',
    activationFailed: 'Document Converter extension activation failed',
    welcomeMessage: 'Document Converter is now active! Right-click on files or folders to use conversion features, or access them from the command palette.',
    welcomeButton: 'Don\'t show again'
  },

  // Commands
  commands: {
    convertWordToMarkdown: 'Convert Word to Markdown',
    convertExcelToMarkdown: 'Convert Excel to Markdown',
    convertPdfToText: 'Convert PDF to Text',
    convertPowerPointToMarkdown: 'Convert PowerPoint to Markdown',
    batchConvert: 'Batch Convert to Markdown',
    openConverter: 'Open Document Converter',
    debugPdfEnvironment: 'Debug PDF Environment',
    convertWordTablesToCsv: 'Extract Word Tables to CSV',
    convertPdfTablesToCsv: 'Extract PDF Tables to CSV'
  },

  // Progress and status messages
  progress: {
    processing: 'Processing...',
    batchConverting: 'Batch converting files: {0}',
    processingFile: 'Processing file {0}/{1}: {2}',
    complete: 'Complete',
    cancelled: 'Cancelled'
  },

  // Success messages
  success: {
    conversionComplete: 'Successfully converted to: {0}',
    allComplete: 'All done! {0} files converted successfully',
    openFile: 'Open File',
    viewDetails: 'View Details'
  },

  // Error messages
  error: {
    conversionFailed: 'Conversion failed: {0}',
    batchConversionFailed: 'Batch conversion failed',
    fileNotFound: 'File not found',
    unsupportedFormat: 'Unsupported file format: {0}',
    unknownError: 'Unknown error',
    pdfParseUnavailable: 'PDF parsing library is not available',
    pdfParseFailed: 'PDF parsing failed: {0}',
    csvWriteFailed: 'Failed to write CSV file {0}: {1}'
  },

  // Batch conversion
  batch: {
    selectFolder: 'Select folder for batch conversion',
    selectFileTypes: 'Select file types to convert',
    includeSubfolders: 'Include subfolders?',
    includeSubfoldersPrompt: 'Choose whether to search for files in subfolders (directory structure will be preserved)',
    selectOutputDir: 'Select output directory',
    outputDirSourceLocation: 'Source file directory',
    outputDirSourceDescription: 'Save converted files in the original directory',
    outputDirCustom: 'Specify output directory',
    outputDirCustomDescription: 'Choose a target folder (subfolder structure will be preserved)',
    noFilesFound: 'No convertible files found in {0}.',
    noConvertibleFiles: 'No convertible files found in "{0}". This folder contains no Word, Excel, or PDF documents.',
    foundFiles: 'Found {0} convertible files in "{1}". Do you want to proceed with batch conversion?',
    continue: 'Continue',
    cancel: 'Cancel',
    yes: 'Yes',
    no: 'No'
  },

  // File types
  fileTypes: {
    wordDocuments: 'Word Documents (.docx, .doc)',
    excelFiles: 'Excel Files (.xlsx, .xls)',
    csvFiles: 'CSV Files (.csv)',
    pdfDocuments: 'PDF Documents (.pdf)'
  },

  // Report
  report: {
    title: 'File Conversion Report',
    totalFiles: 'Total files: {0}',
    successful: 'Successful: {0}',
    failed: 'Failed: {0}',
    skipped: 'Skipped: {0}',
    successfulConversions: 'Successful Conversions ({0})',
    failedConversions: 'Failed Conversions ({0})'
  },

  // Configuration
  config: {
    title: 'Document Converter',
    outputDirectory: 'Output Directory',
    outputDirectoryDescription: 'Default output directory for converted documents (leave empty to use same directory as source)',
    maxRowsExcel: 'Excel Maximum Rows',
    maxRowsExcelDescription: 'Maximum number of rows to display per Excel sheet',
    preserveFormatting: 'Preserve Formatting',
    preserveFormattingDescription: 'Preserve text formatting (bold, italic) when converting',
    autoOpenResult: 'Auto Open Result',
    autoOpenResultDescription: 'Automatically open converted files',
    showWelcomeMessage: 'Show Welcome Message',
    showWelcomeMessageDescription: 'Show a welcome message when the extension is activated'
  },

  // Excel conversion specific messages
  excel: {
    fileInfo: '📊 File Information',
    fileName: 'File Name',
    fileSize: 'File Size',
    sheetCount: 'Number of Worksheets',
    sheetList: 'Worksheet List',
    worksheet: '📋 Worksheet',
    emptyWorksheet: '*This worksheet is empty*',
    dataDimensions: 'Data Dimensions',
    dataDimensionsValue: '{0} rows x {1} columns',
    rowsLimitNotice: '*Note: Data rows exceed {0} rows, showing only the first {1} rows*',
    whitespaceChar: '(whitespace)',
    convertedFrom: '*Converted from: {0}*'
  },

  // PDF conversion specific messages
  pdf: {
    fileInfo: '## File Information',
    fileName: 'File Name',
    fileSize: 'File Size',
    modifiedDate: 'Modified Date',
    pageCount: 'Pages',
    author: 'Author',
    creationDate: 'Creation Date',
    creator: 'Creator',
    textContent: '## Text Content',
    convertedFrom: '*Converted from: {0}*',
    cannotReadFile: 'Cannot read PDF file: {0}',
    cannotParseFile: 'Cannot parse PDF file: {0}'
  },

  // Word conversion specific messages
  word: {
    fileInfo: '📊 File Information',
    fileName: 'File Name',
    fileSize: 'File Size',
    modifiedDate: 'Modified Date',
    convertedFrom: '*Converted from: {0}*',
    importantNotice: '⚠️ Important Notice',
    docFormatNotice: 'This file is in the old Word format (.doc). The current converter primarily supports the new Word format (.docx).',
    bestConversionSteps: '**For best conversion results, please follow these steps:**',
    recommendedMethod: '**Recommended Method**: Convert to .docx format',
    alternativeMethods: '**Alternative Methods**:',
    conversionTips: '- Use LibreOffice Writer to open and save as .docx\n   - Use online document conversion tools\n   - Copy document content directly to a new Markdown file',
    attemptedContent: '## Attempted Content Extraction',
    attemptingExtraction: '*Attempting to extract basic text from .doc file...*',
    extractedText: '**Extracted Text:**',
    incompletContentNotice: '*Note: The above content may be incomplete or inaccurately formatted. It is recommended to convert to .docx format using the above method for better results.*',
    cannotExtractText: '*Cannot extract text content from this .doc file.*',
    possibleReasons: 'This may be because:',
    fileFormatSpecial: '- File format is special or uses an old version of .doc format',
    mainlyImages: '- File mainly contains images or other non-text elements',
    fileCorrupted: '- File may be corrupted',
    stronglyRecommend: '**Strongly recommend using the above recommended method to convert to .docx format.**',
    conversionInfo: '**Conversion Information:**',
    extractionFailed: '*Quick extraction failed: {0}*',
    normalSituation: '**This is normal**, as the .doc format is quite complex. Please use the above recommended method to convert to .docx format.',
    content: '## Content',
    noTextContent: '*This document seems to have no extractable text content.*',
    conversionError: '## Conversion Error',
    processingDocxError: 'Error occurred while processing .docx file: {0}',
    possibleSolutions: '**Possible Solutions:**',
    checkFileIntegrity: '1. Confirm that the file is not corrupted and not password protected',
    resaveInWord: '2. Try to resave the file in Microsoft Word',
    checkValidDocument: '3. Check if the file is a valid Word document',
    conversionWarnings: '⚠️ Conversion Warnings',
    documentFormatSpecial: '- Document format is special or corrupted',
    passwordProtected: '- Document is password protected'
  },

  // PowerPoint conversion specific messages
  powerpoint: {
    fileInfo: '📊 File Information',
    fileName: 'File Name',
    fileSize: 'File Size',
    modifiedDate: 'Modified Date',
    slideCount: 'Slide Count',
    author: 'Author',
    title: 'Title',
    subject: 'Subject',
    convertedFrom: '*Converted from: {0}*',
    slidesContent: 'Slides Content',
    slide: 'Slide {0}',
    emptySlide: 'This slide appears to be empty or contains only images',
    speakerNotes: 'Speaker Notes',
    notesForSlide: 'Notes for Slide {0}',
    extractionError: 'Content Extraction Error',
    extractionErrorMessage: 'Error occurred while extracting presentation content: {0}',
    basicInfoOnly: 'Only basic file information could be extracted.',
    importantNotice: '⚠️ Important Notice',
    pptFormatNotice: 'This file is in the old PowerPoint format (.ppt). The current converter primarily supports the new PowerPoint format (.pptx).',
    bestConversionSteps: '**For best conversion results, please follow these steps:**',
    recommendedMethod: '**Recommended Method**: Convert to .pptx format',
    openInPowerPoint: 'Open this file in Microsoft PowerPoint',
    saveAsPptx: 'Select "File" > "Save As" and choose "PowerPoint Presentation (*.pptx)" format',
    useThisExtensionAgain: 'Save and use this extension to convert again',
    alternativeMethods: '**Alternative Methods**:',
    useLibreOffice: 'Use LibreOffice Impress to open and save as .pptx',
    useOnlineConverter: 'Use online presentation conversion tools',
    manualExtraction: 'Manually copy slide content to a new Markdown file'
  },

  // Table extraction specific messages
  table: {
    sourcePage: 'Source: Page {0}',
    sourceSlide: 'Source: Slide {0}',
    sourceSection: 'Source: {0}',
    combinedTablesFrom: 'Combined Tables from: {0}',
    extractedDate: 'Extracted on: {0}',
    totalTables: 'Total Tables: {0}',
    tableNumber: 'Table {0}',
    tableTitle: 'Title: {0}',
    tableDimensions: 'Dimensions: {0} rows × {1} columns',
    extractionComplete: 'Table extraction completed',
    tablesFound: 'Found {0} table(s) in document',
    noTablesFound: 'No tables found in document',
    exportingTables: 'Exporting tables to CSV...',
    csvFilesSaved: 'CSV files saved: {0}',
    outputModePrompt: 'How would you like to save the tables?',
    outputModeSeparate: 'Separate files (one CSV per table)',
    outputModeCombined: 'Combined file (all tables in one CSV)',
    confirmTableExtraction: 'Found {0} table(s). Continue with extraction?',
    tableExtractionFailed: 'Table extraction failed: {0}',
    invalidTableData: 'Invalid table data: insufficient rows or columns',
    csvEncodingPrompt: 'Select CSV file encoding:',
    csvDelimiterPrompt: 'Select CSV delimiter:',
    delimiterComma: 'Comma (,)',
    delimiterSemicolon: 'Semicolon (;)',
    delimiterTab: 'Tab',
    encodingUtf8: 'UTF-8 (Recommended)',
    encodingGbk: 'GBK (Chinese)',
    mergedCellPrompt: 'How to handle merged cells:',
    mergedCellRepeat: 'Repeat value in all merged cells',
    mergedCellEmpty: 'Value only in first cell, others empty',
    mergedCellNotation: 'Use [MERGED] notation for merged cells'
  }
};
