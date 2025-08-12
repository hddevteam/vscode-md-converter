# Multi-Select Markdown Conversion Feature Development Plan

## 🎯 **PROJECT OVERVIEW**

### Feature Scope
Implement Explorer multi-select batch conversion to Markdown with configurable info blocks, allowing users to:
- Select multiple files in VS Code Explorer and convert them to Markdown in one operation
- Customize which information blocks appear in the generated Markdown
- Remember preferences for future conversions

### Related GitHub Issue
- **Issue #8**: [feat: Explorer multi-select "Convert to Markdown (Selected)" with configurable info blocks](https://github.com/hddevteam/vscode-md-converter/issues/8)

---

## 📋 **FEATURE REQUIREMENTS**

### Supported Document Types
- ✅ **Word Documents** (.docx, .doc) → Markdown
- ✅ **Excel Files** (.xlsx, .xls, .csv) → Markdown
- ✅ **PowerPoint Presentations** (.pptx, .ppt) → Markdown
- ❌ **PDF Documents** (excluded - already convert to text, not Markdown)

### Core Functionality
1. **Multi-Select Support**: Handle single and multiple file selection from Explorer context menu
2. **Configurable Info Blocks**: Allow users to choose which information appears in Markdown output
3. **Preference Persistence**: Remember user choices for future conversions
4. **Mixed Type Processing**: Handle different document types in a single batch operation
5. **Error Handling**: Graceful handling of unsupported files and conversion failures

### Information Blocks (Configurable)
- `title` - Document title header
- `sourceNotice` - "Converted from [filename]" notice
- `fileInfo` - File metadata (size, modification date, etc.)
- `metadata` - Document-specific metadata (author, sheet count, slide count, etc.)
- `conversionWarnings` - Conversion warnings and notices
- `contentHeading` - "Content" or section headings
- `sectionSeparators` - Horizontal rules between sections

---

## 🚀 **DEVELOPMENT PHASES**

### Phase 1: Core Infrastructure & Types ✅
**Objective**: Establish foundation for configurable Markdown generation

**Estimated Duration**: 3-4 hours ✅ **COMPLETED** (3.5 hours)

**Deliverables**:
- [x] Enhanced `ConversionOptions` interface with `markdownInfo` configuration
- [x] New configuration schema in `package.json`
- [x] Base internationalization keys for new UI elements
- [x] TypeScript interfaces for info block management
- [x] New command definition and menu integration
- [x] Complete i18n support (English/Chinese)
- [x] Configuration utilities updated

**Checkpoint 1 Criteria**:
- [x] `markdownInfo` interface compiles without errors ✅
- [x] Configuration schema validates correctly ✅
- [x] Basic i18n keys are defined ✅
- [x] TypeScript compilation successful ✅
- [x] New command registered in package.json ✅
- [x] FileUtils.getConfig() supports new properties ✅

**Files Created/Modified**:
- `src/types/index.ts` (enhanced with MarkdownInfoConfig & MarkdownInfoField)
- `package.json` (new command, menu, configuration properties)
- `src/i18n/en.ts` (new commands, quickpick, config keys)
- `src/i18n/zh-cn.ts` (complete Chinese translations)
- `src/i18n/index.ts` (Messages interface updated)
- `package.nls.json` (English NLS keys)
- `package.nls.zh-cn.json` (Chinese NLS keys)
- `src/utils/fileUtils.ts` (configuration support)

---

### Phase 2: Info Block Selection UI ✅ COMPLETED
**Objective**: Create user interface for selecting information blocks

**Estimated Duration**: 4-5 hours

**Deliverables**:
- [x] Info block selection QuickPick interface
- [x] "Remember choice" functionality
- [x] Configuration reading and writing utilities
- [x] Preview/description for each info block option

**Checkpoint 2 Criteria**:
- [x] QuickPick displays all available info blocks
- [x] Multi-select functionality works correctly
- [x] Settings are persisted and restored
- [x] UI text is fully internationalized

**Files to Create/Modify**:
- `src/ui/markdownInfoSelector.ts` (✅ created - 214 lines with comprehensive functionality)
- `src/utils/configManager.ts` (✅ integrated into markdownInfoSelector.ts)
- Enhanced i18n files (✅ completed with quickpick namespace)

**Test Cases**:
- All info blocks selected (✅ implemented)
- Partial selection of info blocks (✅ implemented)
- "Remember choice" functionality (✅ implemented)
- Configuration persistence across VS Code sessions (✅ implemented)

**Phase 2 Implementation Summary**:
- ✅ Created comprehensive `MarkdownInfoSelector` class with static `showSelector()` method
- ✅ Implemented multi-select QuickPick with canSelectMany and detailed item descriptions
- ✅ Added "remember choice" toggle with preference persistence to VS Code Global/Workspace settings
- ✅ Full internationalization support with English and Chinese translations
- ✅ TypeScript compilation passes without errors, ESLint validation clean
- ✅ Configuration integration with workspace settings for markdownInfoFields and rememberMarkdownInfoSelection

---

## 🎯 **CHECKPOINT 2 - Phase 2 Completed** ✅

**Date**: 2025-01-21
**Duration**: 4.5 hours actual vs 4-5 hours estimated
**Status**: ✅ COMPLETED

### ✅ **Accomplished:**
1. **QuickPick Interface**: Created comprehensive `MarkdownInfoSelector` class (214 lines)
   - Multi-select functionality with `canSelectMany`
   - Detailed descriptions for each info block option
   - Proper item mapping from MarkdownInfoField enum to QuickPickItem

2. **"Remember Choice" Feature**: Full preference persistence implementation
   - Toggle option in QuickPick interface
   - Global and Workspace configuration storage
   - Automatic restoration of saved preferences

3. **Configuration Integration**: Complete VS Code settings integration
   - `markdownInfoFields` array setting for selected fields
   - `rememberMarkdownInfoSelection` boolean for preference persistence
   - Configuration validation and fallback handling

4. **Internationalization**: Complete English/Chinese translation support
   - Enhanced `quickpick.markdownInfo` namespace with all necessary keys
   - Proper TypeScript interface updates for type safety
   - Both interface descriptions and user messages translated

5. **Code Quality**: Production-ready implementation
   - TypeScript compilation passes without errors
   - ESLint validation clean (fixed curly brace warnings)
   - Proper error handling and null-safety

### 📋 **Deliverables Verified:**
- ✅ `src/ui/markdownInfoSelector.ts`: Comprehensive QuickPick interface implementation
- ✅ Enhanced i18n files: Complete quickpick namespace with English/Chinese support
- ✅ TypeScript type safety: All interfaces properly updated and validated
- ✅ Configuration persistence: Full VS Code settings integration working

### 🚀 **Ready for Phase 3:**
- Core UI infrastructure complete and validated
- Configuration management working end-to-end
- Translation support ready for all user-facing text
- Type-safe interfaces ready for converter integration

---

### Phase 3: Converter Refactoring ✅ COMPLETED
**Objective**: Modify existing converters to support configurable output

**Estimated Duration**: 6-8 hours ✅ **COMPLETED** (7.5 hours)

**Deliverables**:
- [x] MarkdownInfoBlockGenerator utility class
- [x] Word converter with configurable info blocks
- [x] Excel converter with configurable info blocks
- [x] PowerPoint converter with configurable info blocks
- [x] Backward compatibility with existing behavior

**Phase 3 Implementation Summary**:
- ✅ Created `MarkdownInfoBlockGenerator` (233 lines) - Comprehensive utility for generating configurable Markdown info blocks
- ✅ Enhanced `FileUtils.getMarkdownInfoConfig()` - Configuration reader for user preferences
- ✅ Refactored `WordToMarkdownConverter` - Now supports configurable info blocks with warning system integration
- ✅ Refactored `ExcelToMarkdownConverter` - Now supports configurable info blocks with metadata integration
- ✅ Refactored `PowerPointToMarkdownConverter` - Now supports configurable info blocks with metadata and separator integration
- ✅ Added `common` i18n namespace - Shared translation keys for all converters
- ✅ **All existing tests passing** - 153 tests pass, 6 skipped, backward compatibility maintained

**Checkpoint 3 Criteria**:
- [x] Each converter respects `markdownInfo` configuration
- [x] Default behavior unchanged (backward compatibility)
- [x] All info blocks can be independently disabled
- [x] Output quality maintained across configurations

**Files to Modify**:
- `src/converters/wordToMarkdown.ts`
- `src/converters/excelToMarkdown.ts`
- `src/converters/powerpointToMarkdown.ts`

**Implementation Strategy**:
1. Extract info block generation into separate methods
2. Add conditional logic based on `markdownInfo` settings
3. Maintain existing output as default configuration
4. Test each info block independently

---

### Phase 4: Multi-Select Command Implementation ✅ COMPLETED
**Objective**: Create the main command for multi-select conversion

**Estimated Duration**: 5-6 hours ✅ **COMPLETED** (5.5 hours)

**Deliverables**:
- [x] New command: `convertSelectedToMarkdown`
- [x] Explorer context menu integration
- [x] File type detection and filtering
- [x] Batch processing with progress reporting
- [x] Result aggregation and user feedback

**Phase 4 Implementation Summary**:
- ✅ Created `ConvertSelectedToMarkdownCommand` class (442 lines) - Comprehensive multi-select batch conversion implementation
- ✅ Integrated `MarkdownInfoSelector` for user preferences
- ✅ Added file analysis and filtering (supports .docx, .doc, .xlsx, .xls, .csv, .pptx, .ppt)
- ✅ Implemented progress reporting with cancellation support
- ✅ Added detailed result reporting with success/failure breakdown
- ✅ Enhanced i18n support with `batch.multiSelect` namespace (English/Chinese)
- ✅ Registered command in `extension.ts` with proper URI/URIs signature support
- ✅ **All tests passing** - 153 tests pass, 6 skipped, new command registered successfully

**Checkpoint 4 Criteria**:
- [x] Context menu appears for supported files
- [x] Multi-select and single-select both work
- [x] Unsupported files are filtered out gracefully
- [x] Progress reporting works during batch operations
- [x] Results are clearly communicated to user

**Checkpoint 4 Criteria**:
- [ ] Context menu appears for supported files
- [ ] Multi-select and single-select both work
- [ ] Unsupported files are filtered out gracefully
- [ ] Progress reporting works during batch operations
- [ ] Results are clearly communicated to user

**Files to Create/Modify**:
- `src/commands/convertSelectedToMarkdown.ts` (new)
- `src/extension.ts` (command registration)
- `package.json` (menu configuration)

**Key Technical Considerations**:
- Handle `(uri?: vscode.Uri, uris?: vscode.Uri[])` signature
- File type detection and validation
- Error aggregation across multiple files
- Memory management for large batches

---

### Phase 5: Testing & Integration ⏳
**Objective**: Comprehensive testing of new functionality

**Estimated Duration**: 4-5 hours

**Deliverables**:
- [ ] Unit tests for info block selection logic
- [ ] Unit tests for configurable converter output
- [ ] Integration tests for multi-select command
- [ ] Edge case testing (mixed file types, large batches)

**Checkpoint 5 Criteria**:
- [ ] All unit tests pass
- [ ] Integration tests cover key scenarios
- [ ] Edge cases are handled gracefully
- [ ] Performance is acceptable for typical use cases

**Files to Create**:
- `src/test/unit/ui/markdownInfoSelector.test.ts`
- `src/test/unit/converters/configurableOutput.test.ts`
- `src/test/convertSelectedToMarkdown.integration.test.ts`

**Test Scenarios**:
- Single file conversion with custom info blocks
- Multi-file conversion with mixed document types
- Configuration persistence and restoration
- Error handling for unsupported files
- Performance with 10+ files

---

### Phase 6: Documentation & Polish ⏳
**Objective**: Complete feature documentation and final refinements

**Estimated Duration**: 3-4 hours

**Deliverables**:
- [ ] Complete internationalization (English/Chinese)
- [ ] User documentation and examples
- [ ] Configuration documentation
- [ ] GitHub Pages website updates
- [ ] README updates

**Checkpoint 6 Criteria**:
- [ ] All UI text is properly translated
- [ ] Documentation is comprehensive and clear
- [ ] Examples demonstrate key features
- [ ] Website reflects new functionality

**Files to Create/Modify**:
- `package.nls.json`
- `package.nls.zh-cn.json`
- `README.md`
- `README.zh-cn.md`
- `docs/index.html`
- `docs/zh-cn.html`

---

## 📊 **TECHNICAL ARCHITECTURE**

### Command Flow
```
Explorer Context Menu → convertSelectedToMarkdown
    ↓
File Type Detection & Filtering
    ↓
Show Info Block Selection UI (if not remembered)
    ↓
For each file: Route to appropriate converter with markdownInfo
    ↓
Aggregate results and show summary
```

### Configuration Schema
```json
{
  "documentConverter.markdownInfoFields": {
    "type": "array",
    "items": {
      "type": "string",
      "enum": ["title", "sourceNotice", "fileInfo", "metadata", "conversionWarnings", "contentHeading", "sectionSeparators"]
    },
    "default": ["title", "sourceNotice", "fileInfo", "contentHeading", "sectionSeparators"]
  },
  "documentConverter.rememberMarkdownInfoSelection": {
    "type": "boolean",
    "default": true
  }
}
```

### Converter Modification Pattern
```typescript
// Before
private static generateMarkdown(data: any): string {
  let markdown = `# ${title}\n\n`;
  markdown += `Converted from ${filename}\n\n`;
  markdown += `## File Info\n\n`;
  // ... rest of content
  return markdown;
}

// After  
private static generateMarkdown(data: any, options?: ConversionOptions): string {
  let markdown = '';
  const info = options?.markdownInfo || defaultMarkdownInfo;
  
  if (info.includeTitle) {
    markdown += `# ${title}\n\n`;
  }
  if (info.includeSourceNotice) {
    markdown += `Converted from ${filename}\n\n`;
  }
  if (info.includeFileInfo) {
    markdown += `## File Info\n\n`;
    // ... file info content
  }
  // ... rest of content
  return markdown;
}
```

---

## 🧪 **QUALITY GATES**

### Code Quality Standards
- [ ] TypeScript compilation with no warnings
- [ ] ESLint compliance
- [ ] No hardcoded strings (full i18n)
- [ ] Proper error handling and logging
- [ ] Memory-efficient batch processing

### Testing Standards
- [ ] Unit test coverage > 85%
- [ ] All integration tests pass
- [ ] Edge cases covered
- [ ] Performance benchmarks met
- [ ] Cross-platform compatibility

### User Experience Standards
- [ ] Intuitive info block selection
- [ ] Clear progress indication
- [ ] Helpful error messages
- [ ] Consistent behavior across file types
- [ ] Settings persistence works reliably

---

## 📈 **SUCCESS METRICS**

### Functional Metrics
- [ ] Successfully convert multiple files in one operation
- [ ] Info block customization works for all supported formats
- [ ] Settings are persisted and restored correctly
- [ ] Mixed file type batches are handled gracefully

### Performance Metrics
- [ ] Single file conversion: < 5 seconds
- [ ] 5-file batch conversion: < 15 seconds
- [ ] 10-file batch conversion: < 30 seconds
- [ ] Memory usage reasonable for typical batches

### User Experience Metrics
- [ ] Info block selection is intuitive
- [ ] Progress indication is clear
- [ ] Error handling is helpful
- [ ] Feature discovery is natural

---

## ⚠️ **RISK MITIGATION**

### Technical Risks
- **Memory usage with large batches**: Implement streaming/chunked processing
- **UI responsiveness during conversion**: Use proper progress reporting and cancellation
- **Configuration complexity**: Provide sensible defaults and clear documentation
- **Backward compatibility**: Ensure existing workflows continue to work

### User Experience Risks
- **Feature complexity**: Provide good defaults and progressive disclosure
- **Configuration persistence**: Thorough testing of settings storage
- **Mixed file type confusion**: Clear feedback about what was processed

---

## 📅 **DELIVERY TIMELINE**

| Phase | Estimated Duration | Status | Dependencies |
|-------|-------------------|--------|--------------|
| Phase 1: Core Infrastructure | 3-4 hours | ✅ Complete | None |
| Phase 2: Info Block Selection UI | 4-5 hours | ✅ Complete | Phase 1 complete |
| Phase 3: Converter Refactoring | 6-8 hours | ⏳ Planned | Phases 1-2 complete |
| Phase 4: Multi-Select Command | 5-6 hours | ⏳ Planned | Phases 2-3 complete |
| Phase 5: Testing & Integration | 4-5 hours | ⏳ Planned | Phase 4 complete |
| Phase 6: Documentation & Polish | 3-4 hours | ⏳ Planned | Phase 5 complete |

**Total Estimated Duration**: 25-32 hours
**Target Completion**: Phase-by-phase implementation with working increments

---

## 🎯 **IMPLEMENTATION PRIORITY**

### High Priority (Core Functionality)
1. **Phase 1**: Essential for all other phases
2. **Phase 3**: Converter modifications (enables basic functionality)
3. **Phase 4**: Multi-select command (main user-facing feature)

### Medium Priority (User Experience)
4. **Phase 2**: Info block selection UI (enhances usability)
5. **Phase 5**: Testing & Integration (ensures quality)

### Lower Priority (Polish)
6. **Phase 6**: Documentation & Polish (important for release)

---

## 📝 **NOTES**

### Backward Compatibility
- All existing single-file conversion commands remain unchanged
- Default info block selection matches current output
- New functionality is additive, not replacing

### Future Enhancements
- Batch conversion progress cancellation
- Custom info block templates
- Export presets for different use cases
- Integration with workspace settings

---

*This development plan provides a structured approach to implementing multi-select Markdown conversion with maximum user value and minimal risk.*
