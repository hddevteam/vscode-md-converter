# Change Log

All notable changes to the "document-md-converter" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

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