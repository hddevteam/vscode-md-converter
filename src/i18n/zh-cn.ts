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
    batchConvert: '批量转换Markdown',
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
    includeSubfoldersPrompt: '选择是否搜索子文件夹中的文件（将保持目录结构）',
    selectOutputDir: '选择输出目录',
    outputDirSourceLocation: '源文件所在目录',
    outputDirSourceDescription: '将转换后的文件保存在原目录中',
    outputDirCustom: '指定输出目录',
    outputDirCustomDescription: '选择一个目标文件夹（将保持子文件夹结构）',
    noFilesFound: '在 {0} 中未找到可转换的文件。',
    noConvertibleFiles: '在所选文件夹中未找到支持的文件类型。',
    foundFiles: '找到 {0} 个可转换文件。是否继续？',
    continue: '继续',
    cancel: '取消',
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
  },

  // Excel conversion specific messages
  excel: {
    fileInfo: '📊 文件信息',
    fileName: '文件名',
    fileSize: '文件大小',
    sheetCount: '工作表数量',
    sheetList: '工作表列表',
    worksheet: '📋 工作表',
    emptyWorksheet: '*该工作表为空*',
    dataDimensions: '数据维度',
    dataDimensionsValue: '{0} 行 x {1} 列',
    rowsLimitNotice: '*注意: 数据行数超过 {0} 行，仅显示前 {0} 行*',
    whitespaceChar: '(空白字符)',
    convertedFrom: '*转换自: {0}*'
  },

  // PDF conversion specific messages
  pdf: {
    fileInfo: '## 文件信息',
    fileName: '文件名',
    fileSize: '文件大小',
    modifiedDate: '修改日期',
    pageCount: '页数',
    author: '作者',
    creationDate: '创建日期',
    creator: '创建工具',
    textContent: '## 文本内容',
    convertedFrom: '*转换自: {0}*',
    cannotReadFile: '无法读取PDF文件: {0}',
    cannotParseFile: '无法解析PDF文件: {0}'
  },

  // Word conversion specific messages
  word: {
    fileInfo: '📊 文件信息',
    fileName: '文件名',
    fileSize: '文件大小',
    modifiedDate: '修改日期',
    convertedFrom: '*转换自: {0}*',
    importantNotice: '⚠️ 重要提示',
    docFormatNotice: '此文件是旧版Word格式（.doc），当前转换器主要支持新版Word格式（.docx）。',
    bestConversionSteps: '**为获得最佳转换效果，请按以下步骤操作：**',
    recommendedMethod: '**推荐方法**：转换为.docx格式',
    alternativeMethods: '**替代方法**：',
    conversionTips: '- 使用LibreOffice Writer打开并另存为.docx\n   - 使用在线文档转换工具\n   - 直接复制文档内容到新的Markdown文件',
    attemptedContent: '## 尝试提取的内容',
    attemptingExtraction: '*正在尝试从.doc文件中提取基本文本...*',
    extractedText: '**提取的文本：**',
    incompletContentNotice: '*注意：以上内容可能不完整或格式化不准确。建议按照上述方法转换为.docx格式以获得更好的结果。*',
    cannotExtractText: '*无法从此.doc文件中提取文本内容。*',
    possibleReasons: '这可能是因为：',
    fileFormatSpecial: '- 文件格式特殊或使用了旧版本的.doc格式',
    mainlyImages: '- 文件包含主要是图片或其他非文本元素',
    fileCorrupted: '- 文件可能已损坏',
    stronglyRecommend: '**强烈建议使用上述推荐方法转换为.docx格式。**',
    conversionInfo: '**转换信息：**',
    extractionFailed: '*快速提取失败：{0}*',
    normalSituation: '**这是正常情况**，因为.doc格式较为复杂。请使用上述推荐方法转换为.docx格式。',
    content: '## 内容',
    noTextContent: '*此文档似乎没有可提取的文本内容。*',
    conversionError: '## 转换错误',
    processingDocxError: '处理.docx文件时出错：{0}',
    possibleSolutions: '**可能的解决方案：**',
    checkFileIntegrity: '1. 确认文件未损坏且未被密码保护',
    resaveInWord: '2. 尝试在Microsoft Word中重新保存文件',
    checkValidDocument: '3. 检查文件是否为有效的Word文档',
    conversionWarnings: '⚠️ 转换警告',
    documentFormatSpecial: '- 文档格式特殊或已损坏',
    passwordProtected: '- 文档被密码保护'
  }
};
