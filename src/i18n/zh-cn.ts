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
    convertExcelToCsv: '将Excel转换为CSV',
    convertPdfToText: '将PDF转换为文本',
    convertPdfToImage: '将PDF转换为图片',
    convertPowerPointToMarkdown: '将PowerPoint转换为Markdown',
    convertMarkdownToWord: '将Markdown转换为Word',
    batchConvert: '批量转换Markdown',
    openConverter: '打开文档转换器',
    debugPdfEnvironment: '调试PDF环境',
    convertWordTablesToCsv: '提取Word表格到CSV',
    convertPdfTablesToCsv: '提取PDF表格到CSV',
    convertPdfPagesToText: '导出指定页码PDF到文本',
    convertPdfPagesToImages: '导出指定页码PDF到图片',
    convertExcelWorksheetsToMarkdown: '导出指定Excel工作表到Markdown',
    convertExcelWorksheetsToCsv: '导出指定Excel工作表到CSV',
    convertPowerPointSlidesToMarkdown: '导出指定幻灯片到Markdown',
    convertSelectedToMarkdown: '将所选转换为Markdown'
  },

  // Webview strings for the document converter
  webview: {
    title: '文档转换器',
    wordToMarkdown: {
      title: 'Word 转 Markdown',
      description: '将 Word 文档 (.docx, .doc) 转换为 Markdown 格式，保留文本结构和基本格式。',
      buttonText: '选择文件转换'
    },
    excelToMarkdown: {
      title: 'Excel/CSV 转 Markdown',
      description: '将 Excel 工作簿或 CSV 文件转换为 Markdown 表格，保留多个工作表的数据。',
      buttonText: '选择文件转换'
    },
    pdfToText: {
      title: 'PDF 转文本',
      description: '从 PDF 文件中提取文本内容，并保存为纯文本文件。',
      buttonText: '选择文件转换'
    },
    powerPointToMarkdown: {
      title: 'PowerPoint 转 Markdown',
      description: '将 PowerPoint 演示文稿 (.pptx, .ppt) 转换为 Markdown 格式，提取幻灯片内容和演讲者备注。',
      buttonText: '选择文件转换'
    },
    batchConvert: {
      title: '批量转换',
      description: '选择一个文件夹，批量转换其中的所有支持文件类型。',
      buttonText: '选择文件夹'
    }
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
    viewDetails: '查看详情',
    filesCount: '{0} 个文件',
    imagesInFolder: '{0} 张图片在 {1} 中',
    filesInFolder: '{0} 个文件在 {1} 中'
  },

  // Error messages
  error: {
    conversionFailed: '转换失败: {0}',
    batchConversionFailed: '批量转换失败',
    fileNotFound: '文件未找到',
    unsupportedFormat: '不支持的文件类型: {0}',
    unknownError: '未知错误',
    pdfParseUnavailable: 'PDF解析库不可用',
    pdfParseFailed: 'PDF解析失败: {0}',
    csvWriteFailed: '写入CSV文件失败 {0}: {1}'
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
    no: '否',
    
    // Multi-select conversion messages
    multiSelect: {
      noFilesSelected: '未选择文件进行转换',
      noSupportedFiles: '选择的文件中没有支持的格式: {0}',
      someFilesSkipped: '部分文件被跳过（不支持的格式）: {0}',
      converting: '正在转换文件为Markdown...',
      executionFailed: '转换执行失败: {0}',
      isDirectory: '不支持目录',
      fileNotFound: '文件未找到或无法访问',
      pdfNotSupported: 'PDF文件不支持Markdown转换（请使用PDF转文本功能）',
      unsupportedFormat: '不支持的文件格式: {0}',
      unsupportedFileType: '不支持的文件类型: {0}',
      starting: '准备转换中...',
      processingFile: '正在转换: {0}',
      singleFileSuccess: '已成功转换为 {0}',
      batchSuccess: '成功转换了 {0} 个文件，共 {1} 个',
      partialSuccess: '成功转换 {0} 个文件，共 {1} 个，{2} 个失败',
      allFailed: '全部 {0} 个文件转换失败',
      success: '成功',
      failed: '失败',
      openFile: '打开文件',
      showDetails: '显示详情',
      resultsTitle: '转换结果',
      resultsHeader: 'Markdown转换结果',
      resultsSummary: '总计: {0} | 成功: {1} | 失败: {2}'
    }
  },

  // QuickPick for Markdown info blocks
  quickpick: {
    markdownInfo: {
      title: '选择Markdown输出信息块',
      placeholder: '选择要在生成的Markdown中包含的信息块',
      rememberTitle: '保存为默认设置？',
      rememberPlaceholder: '您希望将此选择保存为默认偏好吗？',
      rememberDescription: '将此选择保存为未来转换的默认设置',
      defaultSaved: '您的选择已保存为默认偏好',
      options: {
        title: '文档标题',
        sourceNotice: '来源说明',
        fileInfo: '文件信息',
        metadata: '文档元数据',
        conversionWarnings: '转换警告',
        contentHeading: '内容标题',
        sectionSeparators: '分节线'
      },
      descriptions: {
        title: '包含文档标题头（# 标题）',
        sourceNotice: '包含"转换自[文件名]"说明',
        fileInfo: '包含文件大小、修改日期等信息',
        metadata: '包含作者、创建日期、页数/表数/幻灯片数',
        conversionWarnings: '包含转换警告和提示',
        contentHeading: '包含"内容"或章节标题',
        sectionSeparators: '包含分节线（---）'
      }
    },
    rememberChoice: '✓ 记住此选择作为默认'
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
    showWelcomeMessageDescription: '扩展激活时显示欢迎消息',
    markdownInfoFieldsDescription: 'Markdown输出中包含的默认信息块（标题、来源说明、文件信息、元数据、警告、内容标题、分节线）',
    rememberMarkdownInfoSelectionDescription: '记住用户对Markdown信息块的选择作为未来转换的默认值'
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
    rowsLimitNotice: '*注意: 数据行数超过 {0} 行，仅显示前 {1} 行*',
    whitespaceChar: '(空白字符)',
    convertedFrom: '*转换自: {0}*',
    csvFilesSaved: '成功转换为 {0} 个CSV文件',
    worksheetSelectionTitle: '选择要导出的工作表',
    selectWorksheets: '选择要转换的工作表:',
    selectAllWorksheets: '全选',
    selectNoneWorksheets: '全不选',
    selectedWorksheetsCount: '已选择 {0} 个工作表',
    outputFormatTitle: '选择输出格式',
    outputFormatMarkdown: 'Markdown格式 (.md)',
    outputFormatCsv: 'CSV格式 (.csv)',
    worksheetConversionComplete: '工作表转换完成',
    worksheetsConversionComplete: '工作表转换完成'
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

  // PDF to Image conversion specific messages
  pdfToImage: {
    toolNotFound: '系统中未安装 poppler-utils 工具，此功能需要该工具。',
    installationGuide: 'poppler-utils 安装指南',
    conversionStarted: '正在将PDF页面转换为图片...',
    conversionComplete: 'PDF转图片转换完成！',
    outputLocation: '图片已保存到：{0}',
    batchProgress: '正在转换第 {0} 个PDF，共 {1} 个：{2}',
    installNow: '查看安装指南',
    cancel: '取消',
    toolDetection: '正在检查 poppler-utils 安装状态...',
    macOSInstructions: 'macOS 用户请使用 Homebrew 安装：',
    windowsInstructions: 'Windows 用户请下载便携版本或使用包管理器：',
    linuxInstructions: 'Linux 用户请使用系统包管理器安装：',
    macOSCommand: 'brew install poppler',
    windowsDownload: '下载地址：https://blog.alivate.com.au/poppler-windows/',
    linuxCommand: 'sudo apt-get install poppler-utils',
    verifyInstallation: '安装完成后，请重启 VS Code 并重试。',
    installationSuccessful: '成功检测到 poppler-utils！',
    installationFailed: '未找到 poppler-utils，请先安装。',
    checkInstallation: '正在检查安装状态...',
    conversionFailed: 'PDF转图片失败：{0}',
    invalidPdf: 'PDF文件无效或损坏。',
    noPages: 'PDF文件中未找到页面。',
    directoryCreated: '已创建输出目录：{0}',
    imagesSaved: '成功保存 {0} 张图片'
  },

  // Common messages for all converters
  common: {
    convertedFrom: '转换自：{0}',
    fileInfo: '文件信息',
    fileName: '文件名',
    fileSize: '文件大小',
    modifiedDate: '修改日期',
    content: '内容',
    metadata: '文档元数据',
    author: '作者',
    documentTitle: '文档标题',
    subject: '主题',
    pageCount: '页数',
    slideCount: '幻灯片数',
    worksheetCount: '工作表数',
    worksheetNames: '工作表名称',
    conversionWarnings: '转换警告'
  },

  // Word conversion specific messages
  word: {
    fileInfo: '📊 文件信息',
    fileName: '文件名',
    fileSize: '文件大小',
    modifiedDate: '修改日期',
    convertedFrom: '*转换自: {0}*',
    importantNotice: '⚠️ 重要提示',
        docFormatNotice: '此文件为较旧的Word格式(.doc)。当前转换器主要支持新的Word格式(.docx)。',
    docFormatDetail: '为获得更好的转换效果，请先将此文件转换为.docx格式。',
    openInWord: '在Microsoft Word中打开此文件',
    continueAnyway: '仍要继续',
    converting: '转换中...',
    conversionComplete: '转换完成',
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
    passwordProtected: '- 文档受密码保护'
  },

  // Debug environment messages
  debug: {
    currentWorkDir: '当前工作目录: {0}',
    vscodeWorkspace: 'VS Code工作区: {0}',
    extensionDir: '扩展目录: {0}',
    projectRootDir: '项目根目录: {0}',
    pdfParseModulePath: 'pdf-parse模块路径: {0}',
    testFilePath: '测试文件路径: {0}',
    nodeModulesExists: 'node_modules存在: {0}',
    pdfParseExists: 'pdf-parse存在: {0}',
    testFileExists: '测试文件存在: {0}',
    pdfParseLoadSuccess: 'pdf-parse加载成功: {0}',
    pdfParseLoadFailed: 'pdf-parse加载失败: {0}',
    debugInfoTitle: 'PDF环境调试信息',
    copyToClipboard: '复制到剪贴板',
    debugFailed: '调试失败: {0}',
    none: '无'
  },

  // File utility messages
  fileUtils: {
    validatingFile: '正在验证文件: {0}',
    fileAccessError: '文件访问错误: {0}',
    fileNotExistOrAccessible: '文件不存在或无法访问: {0}',
    checkFilePath: '检查文件路径是否正确',
    confirmReadPermission: '确认文件是否有读取权限',
    pathNotFile: '路径不是一个文件',
    fileEmpty: '文件为空',
    checkFileCorrupted: '检查文件是否损坏或不完整'
  },

  // PowerPoint conversion specific messages
  powerpoint: {
    fileInfo: '📊 文件信息',
    fileName: '文件名',
    fileSize: '文件大小',
    modifiedDate: '修改日期',
    slideCount: '幻灯片数量',
    author: '作者',
    title: '标题',
    subject: '主题',
    convertedFrom: '*转换自：{0}*',
    slidesContent: '📝 幻灯片内容',
    slide: '幻灯片 {0}',
    emptySlide: '*（此幻灯片为空）*',
    speakerNotes: '🎤 演讲者备注',
    notesForSlide: '幻灯片 {0} 的备注',
    extractionError: '❌ 内容提取错误',
    extractionErrorMessage: '无法提取幻灯片内容。错误：{0}',
    basicInfoOnly: '仅提取了基本文件信息。',
    importantNotice: '⚠️ 重要提示',
    pptFormatNotice: '此文件为较旧的PowerPoint格式(.ppt)。当前转换器主要支持新的PowerPoint格式(.pptx)。',
    pptFormatDetail: '为获得更好的转换效果，请先将此文件转换为.pptx格式。',
    pptFormatNoticeDetail: '为获得更好的转换效果，建议先将此文件转换为.pptx格式。',
    bestConversionSteps: '**为获得最佳转换效果，请按以下步骤操作：**',
    recommendedMethod: '**推荐方法**：转换为.pptx格式',
    openInPowerPoint: '在PowerPoint中打开',
    saveAsPptx: '选择"文件" > "另存为"，选择"PowerPoint演示文稿(*.pptx)"格式',
    useThisExtensionAgain: '保存后重新使用此扩展进行转换',
    alternativeMethods: '**其他方法**：',
    useLibreOffice: '使用LibreOffice Impress打开并保存为.pptx格式',
    useOnlineConverter: '使用在线演示文稿转换工具',
    manualExtraction: '手动将幻灯片内容复制到新的Markdown文件中',
    continueAnyway: '仍然继续',
    converting: '转换中...',
    conversionComplete: '转换完成',
    extractedContent: '已提取内容',
    pptLimitedSupport: '.ppt格式的支持有限。已提取基本文件信息。',
    convertToPptxSuggestion: '要获得完整内容提取，请将此演示文稿另存为.pptx格式后重新转换。',
    slidesConversionComplete: '幻灯片 {0} 转换完成'
  },

  // Table extraction specific messages
  table: {
    sourcePage: '来源：第 {0} 页',
    sourceSlide: '来源：第 {0} 张幻灯片',
    sourceSection: '来源：{0}',
    combinedTablesFrom: '合并的表格来自：{0}',
    extractedDate: '提取时间：{0}',
    totalTables: '表格总数：{0}',
    tableNumber: '表格 {0}',
    tableTitle: '标题：{0}',
    tableDimensions: '尺寸：{0} 行 × {1} 列',
    extractionComplete: '表格提取完成',
    tablesFound: '在文档中发现 {0} 个表格',
    noTablesFound: '文档中未发现表格',
    exportingTables: '正在导出表格到CSV...',
    csvFilesSaved: '已保存CSV文件：{0}',
    outputModePrompt: '您希望如何保存表格？',
    outputModeSeparate: '单独文件（每个表格一个CSV）',
    outputModeCombined: '合并文件（所有表格在一个CSV中）',
    confirmTableExtraction: '发现 {0} 个表格。继续提取吗？',
    tableExtractionFailed: '表格提取失败：{0}',
    invalidTableData: '无效的表格数据：行数或列数不足',
    csvEncodingPrompt: '选择CSV文件编码：',
    csvDelimiterPrompt: '选择CSV分隔符：',
    delimiterComma: '逗号 (,)',
    delimiterSemicolon: '分号 (;)',
    delimiterTab: '制表符',
    encodingUtf8: 'UTF-8 (推荐)',
    encodingGbk: 'GBK (中文)',
    mergedCellPrompt: '如何处理合并单元格：',
    mergedCellRepeat: '在所有合并单元格中重复值',
    mergedCellEmpty: '仅在第一个单元格中放值，其他留空',
    mergedCellNotation: '使用 [MERGED] 标记表示合并单元格'
  },

  // Page range selection specific messages
  pageRange: {
    inputPrompt: '请输入 "{1}" 的页码范围（共 {0} 页）',
    inputPlaceholder: '示例："5"（单页）, "3-8"（范围）, "1,3,5"（多页）, "1-3,5,7-9"（混合）',
    outputModePrompt: '您希望如何输出页面？',
    outputModeSeparate: '单独文件',
    outputModeSeparateDesc: '将每页导出为单独的文件',
    outputModeMerge: '合并文件',
    outputModeMergeDesc: '将所有页面合并到单个文件中',
    emptyInput: '请输入页码范围',
    invalidRangeFormat: '无效的范围格式："{0}"',
    invalidNumbers: '范围中包含无效数字："{0}"',
    invalidRangeOrder: '无效范围（开始页 > 结束页）："{0}"',
    outOfBounds: '页码范围 "{0}" 超出范围（最大：{1} 页）',
    invalidNumber: '无效的页码："{0}"',
    pageOutOfBounds: '页码 {0} 超出范围（最大：{1} 页）',
    noValidPages: '未指定有效页码',
    parseError: '解析页码范围时出错：{0}',
    selectionError: '页码选择错误：{0}',
    conversionStarted: '正在转换 {1} 的页码 {0}...',
    conversionComplete: '成功转换页码 {0}',
    exportingPages: '正在导出指定页面...',
    processingPage: '正在处理第 {0} 页，共 {1} 页...',
    pageExportFailed: '导出页码 {0} 失败：{1}',
    noContentFound: '页码 {0} 未找到内容',
    pageProcessed: '页码 {0} 处理成功'
  }
};
