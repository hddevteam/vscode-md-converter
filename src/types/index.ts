export interface ConversionResult {
  success: boolean;
  inputPath: string;
  outputPath?: string;
  outputPaths?: string[];  // Support multiple output files
  error?: string;
  duration?: number;
}

export interface BatchConversionResult {
  totalFiles: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  results: ConversionResult[];
  totalDuration?: number;
}

export interface ConversionOptions {
  outputDirectory?: string;
  maxRows?: number;
  preserveFormatting?: boolean;
  autoOpen?: boolean;
  // Table extraction options
  tableOutputMode?: 'separate' | 'combined' | 'ask';
  tableCsvEncoding?: BufferEncoding;
  tableCsvDelimiter?: ',' | ';' | '\t';
}

export interface ProgressInfo {
  current: number;
  total: number;
  fileName: string;
  status: 'processing' | 'completed' | 'failed' | 'skipped';
}

export type SupportedFileType = 'docx' | 'doc' | 'xlsx' | 'xls' | 'csv' | 'pdf' | 'pptx' | 'ppt';

export interface FileValidationResult {
  isValid: boolean;
  fileType?: SupportedFileType;
  error?: string;
  suggestions?: string[];
}

export interface ConversionConfig {
  outputDirectory: string;
  maxRowsExcel: number;
  preserveFormatting: boolean;
  autoOpenResult: boolean;
  // Table extraction configuration
  tableOutputMode: 'separate' | 'combined' | 'ask';
  tableCsvEncoding: BufferEncoding;
  tableCsvDelimiter: ',' | ';' | '\t';
  includeTableMetadata: boolean;  // Add missing property
}

// Table extraction specific types
export interface TableData {
  id: string;
  title?: string;
  rows: string[][];
  rowCount: number;
  columnCount: number;
  sourceLocation?: {
    page?: number;
    slide?: number;
    section?: string;
  };
  // Merged cell information
  mergedCells?: MergedCellInfo[];
}

export interface MergedCellInfo {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  value: string;
}

export interface TableConversionResult extends ConversionResult {
  tables?: TableData[];
  csvPaths?: string[];
  tableCount?: number;
}

export interface TableExtractionOptions {
  outputMode: 'separate' | 'combined';
  encoding: BufferEncoding;
  delimiter: ',' | ';' | '\t';
  includeHeaders: boolean;
  includeMetadata: boolean; // Whether to include metadata comments
  mergedCellStrategy: 'repeat' | 'empty' | 'notation'; // Merged cell processing strategy
  minRows: number;
  minColumns: number;
}
