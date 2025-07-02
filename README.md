# 文档转换器 (Document Converter)

这个VS Code扩展提供了将常见文档格式转换为Markdown和文本格式的功能，便于在VS Code中进行内容编辑和管理。

## 功能特点

- **Word转Markdown**: 将Word文档(.docx, .doc)转换为Markdown格式(.md)
- **Excel转Markdown**: 将Excel电子表格(.xlsx, .xls)和CSV文件(.csv)转换为Markdown表格
- **PDF转文本**: 将PDF文档(.pdf)转换为纯文本文件(.txt)
- **批量转换**: 支持一次性处理整个文件夹中的文档，可选择文件类型和是否包含子文件夹
- **自定义选项**: 可设置输出目录、格式保留等选项

<!-- 未来可以添加功能预览截图 -->

## 使用方法

### 通过文件资源管理器右键菜单

1. 在VS Code的文件资源管理器中右键单击Word、Excel、CSV或PDF文件
2. 从上下文菜单中选择相应的转换选项:
   - "Convert Word to Markdown"
   - "Convert Excel to Markdown" 
   - "Convert PDF to Text"
3. 转换完成后，会显示通知，可直接点击打开转换后的文件

### 通过命令面板

1. 按下 `Ctrl+Shift+P`（Windows/Linux）或 `Cmd+Shift+P`（macOS）打开命令面板
2. 输入"Document Converter"可看到所有可用命令
3. 选择需要的转换命令，然后按照提示选择文件

### 批量转换

1. 在文件资源管理器中右键单击一个文件夹
2. 选择"Batch Convert Documents"
3. 在弹出的选项中:
   - 选择要转换的文件类型
   - 选择是否包含子文件夹
   - 选择输出目录位置
4. 点击确认开始批量转换
5. 转换完成后会显示详细报告

### 通过转换器界面

1. 点击活动栏中的"Document Converter"图标，或通过命令面板运行"Open Document Converter"命令
2. 在打开的界面中选择要执行的转换操作
3. 按照提示选择文件或文件夹

## 设置选项

扩展提供了以下可自定义选项，可在VS Code设置中修改：

* `documentConverter.outputDirectory`: 默认输出目录（留空则使用源文件所在目录）
* `documentConverter.maxRowsExcel`: 每个Excel工作表显示的最大行数（默认：1000）
* `documentConverter.preserveFormatting`: 转换时是否保留文本格式（粗体、斜体等）
* `documentConverter.autoOpenResult`: 转换完成后是否自动打开转换后的文件
* `documentConverter.showWelcomeMessage`: 激活扩展时是否显示欢迎消息

## 依赖项

此扩展使用以下库处理文档转换：

- [docx](https://github.com/dolanmiu/docx) - 用于处理Word文档
- [xlsx](https://github.com/SheetJS/sheetjs) - 用于处理Excel/CSV文件
- [pdf-parse](https://github.com/gbro115/pdf-parse) - 用于从PDF提取文本

## 已知问题

- 对于大型Excel文件，自动限制显示的行数以保证性能
- Word文档的格式转换是基本的，复杂格式可能无法完全保留
- PDF转文本会尝试保留段落结构，但复杂布局可能会有所差异

## 版本历史

### 0.0.1

- 初始版本
- 支持Word转Markdown、Excel转Markdown和PDF转文本
- 提供批量转换功能
- 添加基本设置选项

---

**享受文档转换的便利！**
