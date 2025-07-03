# 文档转换器 VS Code 扩展

[English](README.md) | **中文**

一个功能强大的VS Code扩展，用于将各种文档格式转换为Markdown和文本格式。

## 🚀 功能特性

### 支持的文档类型
- **Word文档** (.docx, .doc) → Markdown
- **Excel表格** (.xlsx, .xls, .csv) → Markdown表格
- **PDF文档** (.pdf) → 文本文件

### 核心功能
- ✅ **右键菜单集成** - 直接在文件资源管理器中转换
- ✅ **命令面板支持** - 通过 Cmd+Shift+P 访问
- ✅ **批量转换** - 选择文件夹进行批量处理
- ✅ **智能文本处理** - 自动优化转换质量
- ✅ **进度指示器** - 实时显示转换进度
- ✅ **错误处理** - 完善的错误提示和处理
- ✅ **多语言支持** - 中英文界面自动切换

## 📦 安装

1. 在VS Code中打开扩展市场 (Ctrl+Shift+X)
2. 搜索 "Document MD Converter"
3. 点击安装

或者手动安装：
```bash
# 克隆项目
git clone <repository-url>
cd vscode-md-converter

# 安装依赖
npm install

# 编译扩展
npm run compile

# 在VS Code中按F5进行调试
```

## 🎯 使用方法

### 单文件转换
1. **右键菜单**: 在文件资源管理器中右键点击文档文件，选择相应的转换选项
2. **命令面板**: 
   - 按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
   - 输入转换命令（如 "将Word转换为Markdown"）

### 批量转换
1. 右键点击包含文档的文件夹
2. 选择 "批量转换文档"
3. 按提示选择转换类型和选项

### 可用命令
- `将Word转换为Markdown` - 转换Word文档为Markdown
- `将Excel转换为Markdown` - 转换Excel文件为Markdown表格
- `将PDF转换为文本` - 转换PDF为文本文件
- `批量转换文档` - 批量转换文档
- `打开文档转换器` - 打开转换器界面
- `测试PDF转换` - 测试PDF转换功能

## 🔧 转换特性

### Word文档转换
- 保留文本格式（粗体、斜体等）
- 转换标题层级
- 处理列表和表格
- 支持 .docx 和 .doc 格式
- 智能超时处理（避免.doc文件卡死）

### Excel表格转换
- 转换为Markdown表格格式
- 保留单元格数据类型
- 处理多工作表
- 支持 .xlsx, .xls, .csv 格式
- 自动数据格式化

### PDF文档转换
- **高级文本处理算法**:
  - 智能空格修复
  - 单词边界检测
  - 标点符号格式化
  - 连字符单词重组
- **文本质量优化**:
  - 移除多余空白字符
  - 修复常见间距问题
  - 保护URL和邮箱格式
  - 句子结构优化
- **输出增强**:
  - 添加文档元数据
  - 按段落组织内容
  - Markdown格式输出

## 🌐 多语言支持

扩展会根据VS Code的语言设置自动切换界面语言：
- **英文** (默认) - 适用于英文环境
- **中文** - 自动检测中文环境

支持的语言功能：
- 命令标题和描述
- 用户界面文本
- 错误消息和提示
- 配置选项说明

## 📁 输出格式

所有转换后的文件将保存在原文件同目录下的相应格式：
- Word → `.md` 文件
- Excel → `.md` 文件（包含表格）
- PDF → `.txt` 文件

## ⚙️ 配置选项

扩展支持以下配置选项（在设置中搜索"文档转换器"）：
- 输出目录设置
- Excel最大行数限制
- 格式保留选项
- 自动打开结果文件

## 🛠️ 技术实现

### 依赖库
- **mammoth.js** - Word文档处理
- **xlsx** - Excel文件处理  
- **pdf-parse** - PDF文本提取
- **VS Code API** - 扩展集成

### 架构设计
```
src/
├── converters/           # 核心转换器
│   ├── wordToMarkdown.ts
│   ├── excelToMarkdown.ts
│   └── pdfToText.ts
├── commands/            # VS Code命令处理
├── i18n/               # 国际化支持
│   ├── index.ts        # 国际化管理器
│   ├── en.ts          # 英文语言包
│   └── zh-cn.ts       # 中文语言包
├── utils/              # 工具函数
├── types/              # TypeScript类型定义
└── extension.ts        # 扩展入口
```

## 🐛 故障排除

### 常见问题

1. **转换失败**
   - 检查文件是否损坏
   - 确保文件未被其他程序打开
   - 查看VS Code开发者控制台的错误信息

2. **.doc文件转换卡死**
   - 扩展已内置超时机制
   - 建议将.doc文件转换为.docx后再处理

3. **PDF文本质量差**
   - 某些PDF可能使用图像文本，建议使用OCR工具
   - 检查PDF是否为扫描件

4. **界面语言问题**
   - 扩展会自动检测VS Code语言设置
   - 支持中文(zh-cn)和英文环境
   - 可在VS Code设置中更改显示语言

### 调试模式
按 F5 在VS Code中以调试模式运行扩展，查看详细日志信息。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个扩展！

### 开发环境设置
```bash
# 克隆仓库
git clone <repository-url>
cd vscode-md-converter

# 安装依赖
npm install

# 开发模式编译
npm run watch

# 运行测试
npm test
```

### 添加新语言支持
1. 在 `src/i18n/` 目录下创建新的语言文件
2. 在 `src/i18n/index.ts` 中添加语言检测逻辑
3. 创建对应的 `package.nls.{language}.json` 文件

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔄 更新日志

### v0.0.1
- ✨ 初始版本发布
- ✅ Word转Markdown转换
- ✅ Excel转Markdown转换  
- ✅ PDF转文本转换
- ✅ 批量转换功能
- ✅ VS Code集成
- ✅ 中英文双语支持

---

**享受文档转换的便利！** 🎉
