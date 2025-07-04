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
}

export interface ProgressInfo {
  current: number;
  total: number;
  fileName: string;
  status: 'processing' | 'completed' | 'failed' | 'skipped';
}

export type SupportedFileType = 'docx' | 'doc' | 'xlsx' | 'xls' | 'csv' | 'pdf';

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
}
