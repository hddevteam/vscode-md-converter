# OneClick Markdown Converter - VS Code Extension

**English** | [中文](README.zh-cn.md) | **[🌐 Website](https://hddevteam.github.io/vscode-md-converter/)**

A powerful VS Code extension for converting various document formats to Markdown and text formats with just one click.

## 🚀 Features

### Supported Document Types
- **Word Documents** (.docx, .doc) → Markdown
- **Markdown Files** (.md, .markdown) → Word Documents (.docx) ⭐ **NEW in v0.4.0**
- **Excel Spreadsheets** (.xlsx, .xls, .csv) → Markdown Tables
- **Excel Spreadsheets** (.xlsx, .xls) → CSV Files
- **PDF Documents** (.pdf) → Text Files
- **PDF Documents** (.pdf) → PNG Images *(requires poppler-utils)*
- **PowerPoint Presentations** (.pptx, .ppt) → Markdown

### 🆕 Multi-Select Markdown Conversion (v0.3.0)
- **🔥 Multi-File Selection** - Select multiple files in VS Code Explorer and convert them all to Markdown at once
- **🎛️ Configurable Info Blocks** - Choose what information to include in converted Markdown:
  - File title headers and source notices
  - File metadata (size, modification date, creation date)
  - Document-specific metadata (author, sheet count, slide count)
  - Conversion warnings and content headings
  - Section separators and custom formatting
- **🔄 Mixed File Type Support** - Process Word, Excel, and PowerPoint files in a single operation
- **💾 Preference Persistence** - Remember your info block choices for future conversions
- **📊 Smart Progress Reporting** - Real-time conversion progress with detailed status updates

### 🆕 Advanced Range Export Features (v0.2.0)
- **📄 PDF Page Range Export** - Extract specific pages as text or images
- **📊 Excel Worksheet Range Export** - Export selected worksheets to Markdown/CSV
- **🎨 PowerPoint Slide Range Export** - Convert specific slides to Markdown
- **🔢 CSV Table Range Export** - Extract tables from specific PDF pages
- **🎛️ Unified Page Range Selector** - Intuitive interface for selecting page/slide ranges

### Core Features
- ✅ **Context Menu Integration** - Convert directly from file explorer
- ✅ **Command Palette Support** - Access via Cmd+Shift+P
- ✅ **Multi-Select Conversion** - Convert multiple files at once with customizable output
- ✅ **Batch Conversion** - Select folders for bulk processing
- ✅ **Range Selection** - Choose specific pages, worksheets, or slides to convert
- ✅ **Smart Text Processing** - Automatically optimize conversion quality
- ✅ **Progress Indicators** - Real-time conversion progress display
- ✅ **Error Handling** - Comprehensive error messages and handling
- ✅ **Multi-language Support** - Automatic language switching between English and Chinese
- ✅ **Performance Optimized** - Efficient processing of large documents

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

### 🆕 Multi-Select Conversion (v0.3.0)
1. **Multi-file Selection**: Select multiple files in VS Code Explorer (Ctrl/Cmd+Click)
2. **Flexible Conversion**: Convert different file types to Markdown in one operation
3. **Customizable Output**: Choose what information to include in the converted Markdown:
   - **Title Headers**: Add document title as main heading
   - **Source Notice**: "Converted from [filename]" attribution
   - **File Metadata**: Creation date, modification date, file size
   - **Document Metadata**: Author, sheet count, slide count, etc.
   - **Conversion Warnings**: Important notices and conversion notes
   - **Content Headings**: Section headers for better organization
   - **Section Separators**: Horizontal rules between content sections
4. **Smart Processing**: Automatically filters supported file types and handles unsupported files gracefully
5. **Preference Memory**: Remembers your info block choices for future conversions

**How to use Multi-Select Conversion:**
- Select multiple files in the Explorer (hold Ctrl/Cmd and click files)
- Right-click and choose "Convert Selected to Markdown"  
- Choose which information blocks to include in the output (or use remembered preferences)
- Watch the progress as files are converted with detailed status updates
- Review the consolidated results with success/failure breakdown

### Available Commands
- `Convert Word to Markdown` - Convert Word documents to Markdown
- `Convert Markdown to Word` - Convert Markdown files to Word documents (.docx) ⭐ **NEW**
- `Convert Excel to Markdown` - Convert Excel files to Markdown tables
- `Convert Excel to CSV` - Convert Excel files to CSV format
- `Convert PDF to Text` - Convert PDF to text files
- `Convert PDF to Images` - Convert PDF pages to PNG images *(requires poppler-utils)*
- `Convert PowerPoint to Markdown` - Convert PowerPoint presentations to Markdown
- `Extract Word Tables to CSV` - Extract tables from Word documents to CSV format
- `Extract PDF Tables to CSV` - Extract tables from PDF documents to CSV format
- `Batch Convert Documents` - Batch convert documents
- `Open Document Converter` - Open converter interface

#### 🆕 Advanced Range Export Commands (v0.3.0)
- `Export Specified PDF Pages to Text` - Convert selected PDF pages to text
- `Export Specified PDF Pages to Images` - Convert selected PDF pages to images
- `Export Selected Excel Worksheets to Markdown` - Convert chosen worksheets to Markdown
- `Export Selected Excel Worksheets to CSV` - Convert chosen worksheets to CSV
- `Export PowerPoint Slides to Markdown` - Convert selected slides to Markdown
- **`Convert Selected to Markdown`** - Convert multiple selected files to Markdown with customizable info blocks

## 🔧 Conversion Features

### Markdown Document Conversion ⭐ **NEW (v0.4.0)**
- **Comprehensive Markdown Support**:
  - All heading levels (H1-H6)
  - Text formatting (bold, italic, strikethrough)
  - Inline code and code blocks with syntax highlighting
  - Ordered and unordered lists with nesting
  - Tables with alignment support
  - Blockquotes and horizontal rules
  - Links and images
- **Professional Output**:
  - Clean Word document (.docx) structure
  - Proper formatting preservation
  - Unicode and multilingual support
  - Efficient file size optimization
- **Performance Optimized**:
  - Fast conversion (typically < 50ms per document)
  - Efficient handling of large documents
  - Streaming output for memory efficiency
- **Quality Features**:
  - Preserves document structure and hierarchy
  - Maintains text formatting across all elements
  - Handles edge cases and complex nested structures
  - Consistent output across platforms

**How to use**:
1. Right-click on a `.md` or `.markdown` file in VS Code Explorer
2. Select "Convert Markdown to Word" from context menu
3. Or use Command Palette: `Cmd+Shift+P` → "Convert Markdown to Word"
4. Output Word document will be created in the same directory

### Word Document Conversion
- Preserve text formatting (bold, italic, etc.)
- Convert heading levels
- Handle lists and tables
- Support .docx and .doc formats
- Smart timeout handling (prevents .doc file freezing)

### Excel Spreadsheet Conversion
- **To Markdown**: Convert to Markdown table format
- **To CSV**: Convert to CSV format with configurable options
  - Choose separate files (one per worksheet) or combined file
  - Configurable encoding (UTF-8 or GBK for Chinese Excel compatibility)
  - Configurable delimiter (comma, semicolon, or tab)
  - Optional metadata comments
- Preserve cell data types
- Handle multiple worksheets
- Support .xlsx, .xls, .csv formats
- Automatic data formatting

### PDF Document Conversion

#### Text Extraction
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

#### Image Conversion *(New Feature)*
- **PDF to Images**: Convert PDF pages to high-quality PNG images
- **Tool Requirement**: Requires poppler-utils installation
- **Standard Settings**: 300 DPI resolution for optimal quality
- **Batch Processing**: Convert multiple PDFs with progress tracking
- **Cross-Platform**: Automatic tool detection with installation guidance
- **Organized Output**: Creates structured folder hierarchy for images
- **One-Click Setup**: Simple installation guidance for missing tools

**Installation Guide for poppler-utils**:
- **macOS**: `brew install poppler`
- **Windows**: Download portable version or use package manager
- **Linux**: `sudo apt-get install poppler-utils`

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

## 🚀 Latest Features (v0.4.0)

### Markdown to Word Conversion Enhancement ✨
- **🆕 HTML List Support in Tables**: Full support for HTML `<ul>`, `<ol>`, and `<li>` tags in table cells
- **📝 Complete List Rendering**: All list items now properly convert to Word list format (not just the first item)
- **🧪 Improved Test Coverage**: Enhanced TDD practices with 306 passing tests
- **🐛 Bug Fixes**: Fixed issue where only first HTML list item in tables was converting
- **📊 Quality Improvements**: Better error handling and comprehensive regression tests

### Previous Features (v0.1.5)

#### Table Extraction Support
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

## 🚀 Upcoming Features (v0.4.0)

We're actively working on expanding format support and adding new capabilities:

- **🖼️ PDF to Images**: Convert PDF pages to individual image files (PNG/JPG)
- **📤 Enhanced Export**: Export PowerPoint slides and PDF pages as high-quality images
- **🏗️ Architecture Improvements**: Better plugin system for future format extensions
- **🎨 Custom Templates**: User-defined output templates for different conversion scenarios

[View our complete roadmap](ROADMAP.md) | [Track progress on GitHub](https://github.com/hddevteam/vscode-md-converter/issues?q=is%3Aissue+is%3Aopen+label%3Av0.4.0)

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
