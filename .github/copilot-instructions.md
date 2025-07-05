# Copilot Instructions for OneClick Markdown Converter Extension

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a VS Code extension project. Please use the get_vscode_api with a query as input to fetch the latest VS Code API references.

## Project Overview
This extension provides document conversion capabilities with full internationalization support:
- Word documents (.docx, .doc) to Markdown (.md)
- Excel files (.xlsx, .xls) and CSV to Markdown (.md)
- PDF files (.pdf) to TXT (.txt)
- Batch processing support for folders
- Multi-language interface (English and Chinese with extensible architecture)

## Project Status
- **VS Code Marketplace**: Published as "OneClick Markdown Converter" (luckyXmobile.document-md-converter)
- **GitHub Repository**: https://github.com/hddevteam/vscode-md-converter
- **GitHub Pages**: https://hddevteam.github.io/vscode-md-converter/
- **Current Version**: 0.1.1
- **License**: MIT

## GitHub Pages Management
The project includes a comprehensive marketing website hosted on GitHub Pages:
- **Location**: `/docs/` folder (GitHub Pages source)
- **URL**: https://hddevteam.github.io/vscode-md-converter/
- **Features**: 
  - Responsive design with modern purple-teal gradient color scheme
  - SEO optimized with meta tags and structured data
  - Interactive features and smooth animations
  - Multi-device compatibility
  - Analytics integration ready

### Updating the Website
When making changes to the extension that affect the website:
1. **Version Updates**: Update version numbers in `/docs/index.html` meta tags
2. **Feature Changes**: Update feature descriptions in the Features section
3. **Screenshots**: Update demo images in `/docs/assets/images/` if UI changes
4. **Links**: Ensure all marketplace and GitHub links are current
5. **SEO**: Update meta descriptions and keywords if functionality changes

### Website Structure
- `docs/index.html` - Main landing page
- `docs/assets/css/style.css` - Stylesheet with color scheme and animations
- `docs/assets/js/main.js` - Interactive functionality and analytics
- `docs/assets/images/` - Images and icon assets

## Coding Guidelines
1. **Follow TypeScript best practices** for VS Code extensions
2. **Use VS Code API properly** - always check API references before implementation
3. **Error handling** - provide comprehensive error handling and user feedback
4. **Progress tracking** - show progress for long-running operations
5. **File validation** - validate file formats before processing
6. **Memory efficiency** - handle large files without blocking the UI
7. **Internationalization (i18n)** - ALWAYS use the I18n system for user-facing text
8. **Code comments** - write all code comments in English for international collaboration
9. **Language consistency** - maintain consistent terminology across all supported languages
10. **Website synchronization** - when adding new features or changing functionality, update the GitHub Pages website accordingly
11. **Commit messages** - write all commit messages in English.

## Architecture
- `src/extension.ts` - Main extension entry point
- `src/commands/` - Command implementations for each conversion type
- `src/converters/` - Core conversion logic
- `src/ui/` - User interface components (progress, notifications, etc.)
- `src/utils/` - Utility functions for file operations
- `src/types/` - TypeScript type definitions
- `src/i18n/` - Internationalization support
  - `index.ts` - I18n manager and interface definitions
  - `en.ts` - English language pack
  - `zh-cn.ts` - Chinese language pack

## Key Features
- Command palette integration
- File explorer context menu integration
- Sidebar panel for batch operations
- Progress tracking with cancellation support
- Conversion history and results display
- Configurable output settings
- Multi-language interface support (English/Chinese)
- Automatic language detection based on VS Code locale

## Dependencies
- Use Node.js compatible libraries for document parsing
- Prefer lightweight libraries to keep extension size manageable
- Consider streaming for large file operations

## Internationalization (i18n) Guidelines

### Text Localization Rules
1. **NEVER hardcode user-facing text** - always use `I18n.t()` for any text shown to users
2. **Import I18n** in all files that display user messages: `import { I18n } from '../i18n'`
3. **Use consistent message keys** - follow the established naming convention in language files
4. **Test both languages** - ensure features work correctly in both English and Chinese

### I18n System Usage
```typescript
// ✅ Correct - using I18n system
vscode.window.showInformationMessage(I18n.t('success.conversionComplete', fileName));

// ❌ Wrong - hardcoded text
vscode.window.showInformationMessage('Conversion completed successfully');
```

### Adding New Text
1. Add the text key to `src/i18n/en.ts` (English)
2. Add the corresponding translation to `src/i18n/zh-cn.ts` (Chinese)
3. Update the `Messages` interface in `src/i18n/index.ts` if needed
4. Use `I18n.t('category.key')` in your code

### WebView Internationalization
- Use `vscode.env.language` to detect locale
- Create separate content for each language
- Set appropriate `lang` attribute in HTML

### Package.json Localization
- Use `%key%` format for localizable strings in package.json
- Create `package.nls.json` (English) and `package.nls.{locale}.json` files
- Update both files when adding new commands or configuration options

### Language Detection Priority
1. VS Code language setting (`vscode.env.language`)
2. Chinese variants (zh-cn, zh) → Chinese interface
3. All others → English interface (default)

### Adding New Languages
1. Create new language file: `src/i18n/{locale}.ts`
2. Implement all `Messages` interface properties
3. Add detection logic in `src/i18n/index.ts`
4. Create `package.nls.{locale}.json` for VS Code integration
5. Test thoroughly with the new locale
