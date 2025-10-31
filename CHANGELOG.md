# Change Log

All notable changes to the "document-md-converter" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.4.0] - 2025-10-31

### 🎉 Major Release: Enhanced Markdown to Word Conversion with HTML Support

#### Added
- **✨ HTML List Support in Markdown Tables**: Full HTML list conversion in table cells
  - Support for `<ul>` and `<ol>` tags with `<li>` items in table content
  - Proper Word list formatting (bullet and numbered lists) for all list items
  - Comprehensive handling of complex nested HTML structures
  - Multiple list items now correctly render as individual list items (not just the first)

- **🧪 Comprehensive Test Suite Enhancement**:
  - Added strict regression tests for HTML list rendering in tables
  - Implemented comprehensive validation for all list items conversion
  - New test verifies all 3+ list items render correctly as Word list format
  - Enhanced TDD practices with more specific assertions (counting `<w:numPr>` markers)
  - Fixed weak test cases that only verified existence, not quantity

- **🐛 Bug Fixes**:
  - Fixed HTML list conversion in table cells where only first item converted to list
  - Resolved issue where additional list items displayed as dashes (`-`) instead of list items
  - Improved `createTableCellContent()` method with direct HTML list processing
  - Better handling of HTML tag context-awareness in table cells

#### Improvements
- **Test Quality**: TDD improvements to catch similar regressions in future
  - Better test assertions for list item count validation
  - Specific testing for user's real-world training outline example
  - Detailed debug output for XML structure analysis

- **Code Quality**: 
  - Refactored table cell content handler for better HTML processing
  - Proper fallback logic for mixed Markdown and HTML content
  - Improved error messages and handling

#### Technical Details
- **Tests Updated**:
  - `markdownToWord.tableHtmlLists.test.ts`: Added new test case for all list items
  - Total tests: 306 passing (up from 304)
  - No regressions, all existing tests continue to pass

- **Implementation Files**:
  - `src/converters/markdownToWord.ts`: Enhanced `createTableCellContent()` method
  - `src/ui/uiUtils.ts`: File opening improvements with `revealFileInOS`

#### Documentation
- Updated README with HTML list support in tables
- Added user examples showing proper list rendering
- Documented the fix for common table list issues

## [0.3.1] - 2025-10-31

### 🎉 New Feature: Markdown to Word Conversion

#### Added
- **🆕 Markdown to Word Conversion**: Convert Markdown files to professional Word documents
  - Full Markdown support: headings (H1-H6), text formatting, inline code, code blocks
  - List support: ordered, unordered, and nested lists
  - Table support with alignment
  - Blockquotes and horizontal rules
  - Links and images
  - Unicode and multilingual support
  - Efficient file handling for large documents
  
- **🎯 Performance Optimized**
  - Fast conversion (typically < 50ms per document)
  - Efficient streaming output for memory efficiency
  - Large document support
  - Consistent output across platforms

- **🛠️ Integration**
  - Right-click context menu on .md/.markdown files
  - Command palette integration: "Convert Markdown to Word"
  - Full internationalization (English & Chinese)
  - Seamless integration with existing converter architecture

#### Technical Details
- **Implementation**: New MarkdownToWordConverter class with comprehensive Markdown parser
  - 138 unit test cases covering all Markdown features
  - 28 integration test cases for end-to-end validation
  - 9 new end-to-end tests for real-world scenarios
  - 261 total passing tests (up from 252)
  
- **Features**:
  - Custom Markdown tokenizer with 17+ token types
  - Docx library integration using Packer API
  - Automatic output directory handling
  - ConversionResult with success/error reporting
  - Full error handling and user feedback

#### Documentation
- Updated README.md with Markdown→Word conversion guide
- Updated README.zh-cn.md with complete Chinese documentation
- Added feature to supported document types list
- Included usage examples and feature descriptions

## [0.3.0] - 2025-08-13

### 🎉 Major Release: Multi-Select Markdown Conversion Feature

#### Added
- **🆕 Multi-Select Markdown Conversion**: Revolutionary batch processing capability
  - Select multiple files in VS Code Explorer and convert them all to Markdown at once
  - Support for mixed file types (Word, Excel, PowerPoint) in a single operation
  - Customizable output with configurable information blocks:
    - File title headers
    - Source notice ("Converted from filename")
    - File metadata (size, modification date, etc.)
    - Document-specific metadata (author, sheet count, slide count)
    - Conversion warnings and notices
    - Content headings and section separators
  - Smart file filtering - automatically handles unsupported file types gracefully
  - Real-time progress reporting with detailed status updates
  - Context menu integration: "Convert Selected to Markdown"
  - Comprehensive error handling and user feedback

- **🎛️ Configurable Info Blocks**: Granular control over Markdown output
  - Info block selection UI with multi-select functionality
  - "Remember choice" functionality with preference persistence
  - Configuration reading and writing utilities
  - Preview/description for each info block option
  - Full internationalization support (English/Chinese)

- **🔧 Enhanced Converter Architecture**: Refactored for flexibility
  - MarkdownInfoBlockGenerator utility class for configurable output
  - Word converter with configurable info blocks
  - Excel converter with configurable info blocks  
  - PowerPoint converter with configurable info blocks
  - Backward compatibility with existing behavior maintained

#### Technical Improvements
- **🏗️ Core Infrastructure**: Enhanced TypeScript interfaces and configuration
  - New ConversionOptions interface with markdownInfo configuration
  - Enhanced configuration schema in package.json
  - Complete internationalization framework expansion
  - New command definition and menu integration

#### Enhanced Documentation & Localization
- **� Complete Documentation Updates**: Comprehensive feature documentation
  - Updated README.md with detailed multi-select conversion instructions
  - Enhanced README.zh-cn.md with complete Chinese translations
  - Updated GitHub Pages website with new feature highlights
  - Improved SEO descriptions and meta tags

#### Quality Assurance
- **🧪 Comprehensive Testing**: 153 passing tests confirming feature stability
  - Unit tests for info block selection logic
  - Unit tests for configurable converter output
  - Integration tests for multi-select command
  - Edge case testing (mixed file types, large batches)
  - End-to-end user workflow testing

## [0.2.0] - 2025-01-13

### 🎉 Major Release: Multi-Select Conversion & Advanced Range Export Features

#### Added
- **🆕 Multi-Select Markdown Conversion**: Revolutionary batch processing capability
  - Select multiple files in VS Code Explorer and convert them all at once
  - Support for mixed file types (Word, Excel, PowerPoint, PDF, CSV) in a single operation
  - Customizable output with configurable information blocks:
    - File creation and modification dates
    - File size information
    - Conversion timestamp
    - Original file path reference
  - Smart file filtering - automatically handles unsupported file types gracefully
  - Real-time progress reporting with detailed status updates
  - Context menu integration: "Convert Selected to Markdown"
  - Comprehensive error handling and user feedback

- **🆕 PDF Page Range Export**: Export specific pages from PDF documents
  - Select individual pages or page ranges (e.g., "1,3,5-8")
  - Export to text or images with intuitive page selection UI
  - Support for both separate and merged output modes
  - Performance optimized for large documents

- **🆕 Excel Worksheet Range Export**: Advanced Excel processing capabilities
  - Choose specific worksheets to export to Markdown or CSV
  - Multi-worksheet selection with preview functionality
  - Organized output with separate directories for each export session
  - Support for complex Excel files with multiple sheets

- **🆕 PowerPoint Slide Range Export**: Convert specific slides to Markdown
  - Select individual slides or slide ranges
  - Extract slide content with proper formatting
  - Handle complex PowerPoint layouts and structures
  - Efficient ZIP-based processing for .pptx files

- **🆕 Unified Page Range Selector**: Consistent UI across all document types
  - Reusable component for page, worksheet, and slide selection
  - Input validation with real-time feedback
  - Support for various range formats (single, ranges, mixed)
  - Accessibility-focused design

#### Enhanced
- **CSV Table Extraction**: Now supports page range selection for PDF tables
- **Performance Improvements**: Optimized document processing for large files
- **Error Handling**: Enhanced error reporting and recovery mechanisms
- **Testing Suite**: 148+ automated tests ensuring reliability
- **CI/CD Compatibility**: All tests compatible with automated environments

#### Technical Improvements
- Modular converter architecture with base classes
- Enhanced internationalization with new message keys
- Improved file validation and preprocessing
- Better memory management for large document processing
- Comprehensive logging and debugging capabilities

### Fixed
- UI interaction tests now skip in automated environments
- File path resolution issues in test environments
- Compilation errors with missing method references
- Race conditions in batch processing operations

## [0.1.7] - 2025-07-11

### Added
- **PDF to Images Conversion**: Convert PDF pages to PNG images using poppler-utils
  - One-click conversion with 300 DPI standard quality
  - Cross-platform tool detection and installation guidance
  - Simplified workflow with zero user configuration required
  - Batch processing support for multiple PDF files
  - Interactive installation guide with platform-specific instructions
  - Graceful degradation when poppler-utils is not installed

### Technical Changes
- New modular architecture for PDF conversion with separate components:
  - `ToolDetection` utility for cross-platform poppler-utils detection
  - `PdfToImageConverter` for conversion logic with progress tracking
  - `InstallationGuidePanel` WebView for user-friendly setup guidance
  - Command handlers for both single file and batch operations
- Enhanced internationalization support for PDF conversion features
- Improved error handling and user feedback systems

## [Unreleased]

### Planned Features

## [0.1.6] - 2025-07-09

### Added
- **Excel to CSV Conversion**: Complete implementation of Excel files to CSV format conversion
- Support for multiple worksheets with configurable output modes (separate files or combined)
- Configurable CSV encoding (UTF-8 or GBK for Chinese Excel compatibility)
- Configurable CSV delimiter (comma, semicolon, or tab)
- Optional metadata comments in CSV output
- Command palette and context menu integration for Excel to CSV conversion

### Improved
- Unified CSV writing architecture with CsvWriterBase inheritance pattern
- Code modularity improvements reducing duplication across converters
- Enhanced Chinese character encoding support with UTF-8 BOM for Excel compatibility
- Comprehensive English comments throughout codebase for international development

### Fixed
- Chinese character encoding issues in CSV output files
- Code architecture improvements with better inheritance patterns
- Enhanced test coverage for all conversion features

## [0.1.5] - 2025-07-09

### Added
- **PDF Table Extraction**: Complete implementation of PDF table extraction to CSV
- Advanced table detection algorithms for PDF documents with single-space separation support
- Support for complex Chinese forex tables and multi-column data extraction
- Enhanced Word table extraction with improved CSV output formatting
- Table output mode selection (separate files vs combined file)
- Excel compatibility with UTF-8 BOM for proper Chinese character display

### Improved
- Simplified PDF parsing architecture using only reliable pdf-parse library
- Enhanced table detection for various table formats (tab, comma, space-separated)
- Better error handling and user feedback for table extraction operations
- Code quality improvements with English comments throughout codebase
- Comprehensive test coverage with real-world PDF and Word documents

### Fixed
- PDF table parsing issues with single-space separated data
- I18n string interpolation for Excel conversion messages
- Console output cleanup for production-ready code

## [0.1.4] - 2025-07-08

### Added
- **PowerPoint Support**: Full conversion of .pptx presentations to Markdown
- Intelligent slide content extraction with proper text formatting
- Speaker notes support with automatic linking to slides
- Comprehensive presentation metadata extraction (author, title, subject, slide count)
- User-friendly warnings for legacy .ppt format with conversion guidance

### Improved
- Enhanced user experience with proper progress reporting for PowerPoint conversion
- Updated translations and documentation for PowerPoint features
- Codebase cleanup - removed unnecessary test commands for cleaner interface

### Fixed
- Progress reporting issues during PowerPoint conversion
- Text extraction quality improvements for complex slide layouts

## [0.1.3] - 2025-07-04

### Added
- Directory structure preservation in batch conversion
- Enhanced subfolder handling with original hierarchy 

### Improved
- Conversion workflow with better progress reporting
- Translations for subfolder structure features

### Fixed
- Additional context menu integration issues

## [0.1.2]

### Added
- Enhanced folder batch conversion
- File count preview before batch conversion
- Conversion confirmation dialog
- Total duration tracking for batch operations

### Fixed
- Folder context menu integration
- Updated internationalization for new UI elements

## [0.1.1]

### Changed
- Updated extension branding to "OneClick Markdown Converter"
- Enhanced GitHub Pages website with Chinese version
- Improved color scheme with modern purple-teal gradients
- Updated internationalization support
- Enhanced documentation and user guides

## [0.1.0]

### Added
- Published to VS Code Marketplace
- Comprehensive GitHub Pages website
- Professional packaging and distribution
- Custom extension icon
- Complete documentation and guides

## [0.0.1]

### Added
- Initial release
- Word to Markdown conversion
- Excel to Markdown conversion  
- PDF to text conversion
- Batch conversion functionality
- VS Code integration
- English and Chinese bilingual support