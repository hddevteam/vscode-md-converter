# Copilot Instructions for Document Converter Extension

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a VS Code extension project. Please use the get_vscode_api with a query as input to fetch the latest VS Code API references.

## Project Overview
This extension provides document conversion capabilities:
- Word documents (.docx, .doc) to Markdown (.md)
- Excel files (.xlsx, .xls) and CSV to Markdown (.md)
- PDF files (.pdf) to TXT (.txt)
- Batch processing support for folders

## Coding Guidelines
1. **Follow TypeScript best practices** for VS Code extensions
2. **Use VS Code API properly** - always check API references before implementation
3. **Error handling** - provide comprehensive error handling and user feedback
4. **Progress tracking** - show progress for long-running operations
5. **File validation** - validate file formats before processing
6. **Memory efficiency** - handle large files without blocking the UI

## Architecture
- `src/extension.ts` - Main extension entry point
- `src/commands/` - Command implementations for each conversion type
- `src/converters/` - Core conversion logic
- `src/ui/` - User interface components (progress, notifications, etc.)
- `src/utils/` - Utility functions for file operations
- `src/types/` - TypeScript type definitions

## Key Features
- Command palette integration
- File explorer context menu integration
- Sidebar panel for batch operations
- Progress tracking with cancellation support
- Conversion history and results display
- Configurable output settings

## Dependencies
- Use Node.js compatible libraries for document parsing
- Prefer lightweight libraries to keep extension size manageable
- Consider streaming for large file operations
