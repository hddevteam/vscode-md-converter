import { Messages } from './index';

export const ChineseMessages: Messages = {
  // Extension activation
  extension: {
    activating: '文档转换器扩展开始激活...',
    activated: '文档转换器扩展激活成功',
    deactivated: '文档转换器扩展已停用',
    activationFailed: '文档转换器扩展激活失败',
    welcomeMessage: '文档转换器已激活！右键单击文件或文件夹以使用转换功能，或从命令面板中使用。',
    welcomeButton: '不再显示'
  },

  // Commands
  commands: {
    convertWordToMarkdown: '将Word转换为Markdown',
    convertExcelToMarkdown: '将Excel转换为Markdown',
    convertPdfToText: '将PDF转换为文本',
    batchConvert: '批量转换文档',
    openConverter: '打开文档转换器',
    testPdfConversion: '测试PDF转换',
    debugPdfEnvironment: '调试PDF环境'
  },

  // Progress and status messages
  progress: {
    processing: '处理中...',
    batchConverting: '正在批量转换文件: {0}',
    processingFile: '处理文件 {0}/{1}: {2}',
    complete: '完成',
    cancelled: '已取消'
  },

  // Success messages
  success: {
    conversionComplete: '成功转换为: {0}',
    allComplete: '全部完成! {0} 个文件成功转换',
    openFile: '打开文件',
    viewDetails: '查看详情'
  },

  // Error messages
  error: {
    conversionFailed: '转换失败: {0}',
    batchConversionFailed: '批量转换失败',
    fileNotFound: '文件未找到',
    unsupportedFormat: '不支持的文件类型: {0}',
    unknownError: '未知错误'
  },

  // Batch conversion
  batch: {
    selectFolder: '选择要批量转换的文件夹',
    selectFileTypes: '选择要转换的文件类型',
    includeSubfolders: '是否包含子文件夹？',
    includeSubfoldersPrompt: '选择是否搜索子文件夹中的文件',
    selectOutputDir: '选择输出目录',
    outputDirSourceLocation: '源文件所在目录',
    outputDirSourceDescription: '将转换后的文件保存在原目录中',
    outputDirCustom: '指定输出目录',
    outputDirCustomDescription: '选择一个目标文件夹',
    noFilesFound: '在 {0} 中未找到可转换的文件。',
    yes: '是',
    no: '否'
  },

  // File types
  fileTypes: {
    wordDocuments: 'Word文档 (.docx, .doc)',
    excelFiles: 'Excel文件 (.xlsx, .xls)',
    csvFiles: 'CSV文件 (.csv)',
    pdfDocuments: 'PDF文档 (.pdf)'
  },

  // Report
  report: {
    title: '文件转换报告',
    totalFiles: '总文件数: {0}',
    successful: '成功: {0}',
    failed: '失败: {0}',
    skipped: '跳过: {0}',
    successfulConversions: '成功转换 ({0})',
    failedConversions: '转换失败 ({0})'
  },

  // Configuration
  config: {
    title: '文档转换器',
    outputDirectory: '输出目录',
    outputDirectoryDescription: '转换文档的默认输出目录（留空则使用源文件目录）',
    maxRowsExcel: 'Excel最大行数',
    maxRowsExcelDescription: '每个Excel工作表显示的最大行数',
    preserveFormatting: '保留格式',
    preserveFormattingDescription: '转换时保留文本格式（粗体、斜体）',
    autoOpenResult: '自动打开结果',
    autoOpenResultDescription: '自动打开转换后的文件',
    showWelcomeMessage: '显示欢迎消息',
    showWelcomeMessageDescription: '扩展激活时显示欢迎消息'
  }
};
