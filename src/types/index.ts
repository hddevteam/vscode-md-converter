export interface ConversionResult {
  success: boolean;
  inputPath: string;
  outputPath?: string;
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
  // 合并单元格信息
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
  includeMetadata: boolean; // 是否包含元数据注释
  mergedCellStrategy: 'repeat' | 'empty' | 'notation'; // 合并单元格处理策略
  minRows: number;
  minColumns: number;
}
