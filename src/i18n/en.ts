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
    batchConvert: 'Batch Convert Documents',
    openConverter: 'Open Document Converter',
    testPdfConversion: 'Test PDF Conversion',
    debugPdfEnvironment: 'Debug PDF Environment'
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
    unknownError: 'Unknown error'
  },

  // Batch conversion
  batch: {
    selectFolder: 'Select folder for batch conversion',
    selectFileTypes: 'Select file types to convert',
    includeSubfolders: 'Include subfolders?',
    includeSubfoldersPrompt: 'Choose whether to search for files in subfolders',
    selectOutputDir: 'Select output directory',
    outputDirSourceLocation: 'Source file directory',
    outputDirSourceDescription: 'Save converted files in the original directory',
    outputDirCustom: 'Specify output directory',
    outputDirCustomDescription: 'Choose a target folder',
    noFilesFound: 'No convertible files found in {0}.',
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
  }
};
