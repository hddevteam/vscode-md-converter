# OneClick Markdown Converter - VS Code Extension

**English** | [中文](README.zh-cn.md) | **[🌐 Website](https://hddevteam.github.io/vscode-md-converter/)**

A powerful VS Code extension for converting various document formats to Markdown and text formats with just one click.

## 🚀 Features

### Supported Document Types
- **Word Documents** (.docx, .doc) → Markdown
- **Excel Spreadsheets** (.xlsx, .xls, .csv) → Markdown Tables
- **PDF Documents** (.pdf) → Text Files
- **PowerPoint Presentations** (.pptx, .ppt) → Markdown

### Core Features
- ✅ **Context Menu Integration** - Convert directly from file explorer
- ✅ **Command Palette Support** - Access via Cmd+Shift+P
- ✅ **Batch Conversion** - Select folders for bulk processing
- ✅ **Smart Text Processing** - Automatically optimize conversion quality
- ✅ **Progress Indicators** - Real-time conversion progress display
- ✅ **Error Handling** - Comprehensive error messages and handling
- ✅ **Multi-language Support** - Automatic language switching between English and Chinese

## 📦 Installation

### From VS Code Marketplace (Recommended)
1. Open VS Code Extensions Marketplace (`Ctrl+Shift+X` or `Cmd+Shift+X`)
2. Search for "Document Converter" or "hddevteam"
3. Click **Install**

### Direct Link
Visit the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=luckyXmobile.document-md-converter) and click **Install**.

### Manual Installation (For Development)
```bash
# Clone the project
git clone https://github.com/hddevteam/vscode-md-converter.git
cd vscode-md-converter

# Install dependencies
npm install

# Compile extension
npm run compile

# Press F5 in VS Code for debugging
```

## 🎯 Usage

### Single File Conversion
1. **Context Menu**: Right-click on document files in file explorer and select appropriate conversion option
2. **Command Palette**: 
   - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
   - Type conversion commands (e.g., "Convert Word to Markdown")

### Batch Conversion
1. Right-click on a folder containing documents
2. Select "Batch Convert Documents"
3. Follow prompts to select conversion types and options

### Available Commands
- `Convert Word to Markdown` - Convert Word documents to Markdown
- `Convert Excel to Markdown` - Convert Excel files to Markdown tables
- `Convert PDF to Text` - Convert PDF to text files
- `Convert PowerPoint to Markdown` - Convert PowerPoint presentations to Markdown
- `Extract Word Tables to CSV` - Extract tables from Word documents to CSV format
- `Extract PDF Tables to CSV` - Extract tables from PDF documents to CSV format
- `Batch Convert Documents` - Batch convert documents
- `Open Document Converter` - Open converter interface

## 🔧 Conversion Features

### Word Document Conversion
- Preserve text formatting (bold, italic, etc.)
- Convert heading levels
- Handle lists and tables
- Support .docx and .doc formats
- Smart timeout handling (prevents .doc file freezing)

### Excel Spreadsheet Conversion
- Convert to Markdown table format
- Preserve cell data types
- Handle multiple worksheets
- Support .xlsx, .xls, .csv formats
- Automatic data formatting

### PDF Document Conversion
- **Advanced Text Processing Algorithms**:
  - Smart space correction
  - Word boundary detection
  - Punctuation formatting
  - Hyphenated word reconstruction
- **Text Quality Optimization**:
  - Remove extra whitespace
  - Fix common spacing issues
  - Protect URL and email formats
  - Sentence structure optimization
- **Output Enhancement**:
  - Add document metadata
  - Organize content by paragraphs
  - Markdown format output

### PowerPoint Presentation Conversion
- **Slide Content Extraction**:
  - Extract text from all slides
  - Intelligent paragraph grouping
  - Header detection and formatting
  - List item identification
- **Presentation Structure**:
  - Maintain slide order and hierarchy
  - Extract presentation metadata (author, title, subject)
  - Include slide count and file information
- **Speaker Notes Support**:
  - Extract and organize speaker notes
  - Link notes to corresponding slides
  - Preserve note formatting
- **Format Compatibility**:
  - Support both .pptx (modern) and .ppt (legacy) formats
  - Provide guidance for .ppt format conversion
  - Handle complex presentation layouts

## 🌐 Multi-language Support

The extension automatically switches interface language based on VS Code language settings:
- **English** (default) - For English environments
- **Chinese** - Automatically detects Chinese environments

Supported language features:
- Command titles and descriptions
- User interface text
- Error messages and prompts
- Configuration option descriptions

## 📁 Output Formats

All converted files are saved in the same directory as the original files with appropriate formats:
- Word → `.md` files
- Excel → `.md` files (with tables)
- PDF → `.txt` files

## 🚀 Latest Features (v0.1.5)

### Table Extraction Support ✨
- **📊 Word Table Extraction**: Export tables from Word documents directly to CSV format
- **📋 PDF Table Extraction**: Advanced table detection and CSV export from PDF documents
- **🔧 Flexible Output Options**: Choose between separate files or combined CSV output
- **🌏 Encoding Support**: UTF-8 and GBK encoding options for Chinese compatibility
- **⚙️ Customizable CSV Format**: Configure delimiters (comma, semicolon, tab)
- **📝 Table Metadata**: Optional metadata inclusion for table analysis

### Advanced Table Detection
- Intelligent table recognition for various PDF formats
- Support for space-separated, tab-separated, and comma-separated tables
- Enhanced Chinese text handling in forex and financial documents
- Robust parsing algorithms for complex table structures

## 🚀 Upcoming Features (v0.2.0)

We're actively working on expanding format support and adding new capabilities:

- **🖼️ PDF to Images**: Convert PDF pages to individual image files (PNG/JPG)
- **📤 Enhanced Export**: Export PowerPoint slides and PDF pages as high-quality images
- **🏗️ Architecture Improvements**: Better plugin system for future format extensions
- **🎨 Custom Templates**: User-defined output templates for different conversion scenarios

[View our complete roadmap](ROADMAP.md) | [Track progress on GitHub](https://github.com/hddevteam/vscode-md-converter/issues?q=is%3Aissue+is%3Aopen+label%3Av0.2.0)

## ⚙️ Configuration Options

The extension supports the following configuration options (search for "Document Converter" in settings):
- Output directory settings
- Excel maximum rows limit
- Format preservation options
- Auto-open result files

## 🛠️ Technical Implementation

### Dependencies
- **mammoth.js** - Word document processing
- **xlsx** - Excel file processing  
- **pdf-parse** - PDF text extraction
- **VS Code API** - Extension integration

### Architecture Design
```
src/
├── converters/           # Core converters
│   ├── wordToMarkdown.ts
│   ├── excelToMarkdown.ts
│   └── pdfToText.ts
├── commands/            # VS Code command handlers
├── i18n/               # Internationalization support
│   ├── index.ts        # I18n manager
│   ├── en.ts          # English language pack
│   └── zh-cn.ts       # Chinese language pack
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── extension.ts        # Extension entry point
```

## 🐛 Troubleshooting

### Common Issues

1. **Conversion Failed**
   - Check if file is corrupted
   - Ensure file is not open in other programs
   - Check VS Code Developer Console for error messages

2. **.doc File Conversion Freezing**
   - Extension has built-in timeout mechanism
   - Recommend converting .doc files to .docx before processing

3. **Poor PDF Text Quality**
   - Some PDFs may use image text, recommend using OCR tools
   - Check if PDF is a scanned document

4. **Interface Language Issues**
   - Extension automatically detects VS Code language settings
   - Supports Chinese (zh-cn) and English environments
   - Can change display language in VS Code settings

### Debug Mode
Press F5 in VS Code to run extension in debug mode and view detailed log information.

## 🤝 Contributing

Welcome to submit Issues and Pull Requests to improve this extension!

See our [Development Roadmap](ROADMAP.md) for planned features and upcoming improvements.

### Development Environment Setup
```bash
# Clone repository
git clone https://github.com/hddevteam/vscode-md-converter.git
cd vscode-md-converter

# Install dependencies
npm install

# Development mode compilation
npm run watch

# Run tests
npm test
```

### Adding New Language Support
1. Create new language file in `src/i18n/` directory
2. Add language detection logic in `src/i18n/index.ts`
3. Create corresponding `package.nls.{language}.json` file

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 🔄 Changelog

### v0.1.5 - 2025-07-09
- ✨ **NEW: PDF Table Extraction** - Complete implementation of PDF table extraction to CSV
- 📊 **NEW: Word Table Extraction** - Enhanced Word table extraction with improved CSV output
- 🎯 Advanced table detection algorithms for PDF documents with single-space separation support
- 🌏 Support for complex Chinese forex tables and multi-column data extraction
- ⚙️ Table output mode selection (separate files vs combined file)
- 📝 Excel compatibility with UTF-8 BOM for proper Chinese character display
- 🧹 Simplified PDF parsing architecture using only reliable pdf-parse library
- 🔧 Enhanced table detection for various table formats (tab, comma, space-separated)
- 🛠️ Better error handling and user feedback for table extraction operations
- 📖 Code quality improvements with English comments throughout codebase

### v0.1.4
- ✨ **NEW: PowerPoint Support** - Full conversion of .pptx presentations to Markdown
- 🎯 Intelligent slide content extraction with proper text formatting
- 📝 Speaker notes support with automatic linking to slides
- 🔧 Enhanced user experience with proper progress reporting
- ⚠️ User-friendly warnings for legacy .ppt format with conversion guidance
- 📊 Comprehensive presentation metadata extraction (author, title, subject, slide count)
- 🧹 Codebase cleanup - removed unnecessary test commands for cleaner interface
- 🌐 Updated translations and documentation for PowerPoint features

### v0.1.3
- ✨ Added directory structure preservation in batch conversion
- 🗂️ Enhanced subfolder handling with original hierarchy
- 🔄 Improved conversion workflow with better progress reporting
- 🌐 Updated translations for subfolder structure features
- 🧩 Fixed additional context menu integration issues

### v0.1.2
- ✨ Added enhanced folder batch conversion
- 🔍 Added file count preview before batch conversion
- 🚀 Added conversion confirmation dialog
- ⏱️ Added total duration tracking for batch operations
- 🧩 Fixed folder context menu integration
- 🌐 Updated internationalization for new UI elements

### v0.1.1
- 🎨 Updated extension branding to "OneClick Markdown Converter"
- 🌐 Enhanced GitHub Pages website with Chinese version
- 🎨 Improved color scheme with modern purple-teal gradients
- 📚 Updated internationalization support
- 🔧 Enhanced documentation and user guides

### v0.1.0
- 🚀 Published to VS Code Marketplace
- 🌐 Added comprehensive GitHub Pages website
- 📦 Professional packaging and distribution
- 🎨 Created custom extension icon
- 📖 Complete documentation and guides

### v0.0.1
- ✨ Initial release
- ✅ Word to Markdown conversion
- ✅ Excel to Markdown conversion  
- ✅ PDF to text conversion
- ✅ Batch conversion functionality
- ✅ VS Code integration
- ✅ English and Chinese bilingual support

---

**Enjoy the convenience of document conversion!** 🎉
