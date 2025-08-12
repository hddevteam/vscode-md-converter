import * as vscode from 'vscode';
import { MarkdownInfoField, MarkdownInfoConfig } from '../types';
import { FileUtils } from '../utils/fileUtils';
import { I18n } from '../i18n';

/**
 * UI component for selecting Markdown information blocks
 */
export class MarkdownInfoSelector {
  
  /**
   * Show QuickPick interface for selecting Markdown info blocks
   * @param currentSelection Optional current selection to pre-select items
   * @returns Selected info configuration or undefined if cancelled
   */
  static async showSelector(currentSelection?: MarkdownInfoConfig): Promise<MarkdownInfoConfig | undefined> {
    // Get current configuration from settings
    const config = FileUtils.getConfig();
    const defaultFields = config.markdownInfoFields;
    
    // Create QuickPick items
    const items = this.createQuickPickItems(currentSelection, defaultFields);
    
    // Show multi-select QuickPick
    const selectedItems = await vscode.window.showQuickPick(items, {
      canPickMany: true,
      title: I18n.t('quickpick.markdownInfo.title'),
      placeHolder: I18n.t('quickpick.markdownInfo.placeholder'),
      ignoreFocusOut: true
    });
    
    if (!selectedItems) {
      return undefined; // User cancelled
    }
    
    // Convert selected items to MarkdownInfoConfig
    const selectedConfig = this.convertSelectionToConfig(selectedItems);
    
    // Ask if user wants to remember this choice
    if (config.rememberMarkdownInfoSelection) {
      const rememberChoice = await this.askToRememberChoice();
      if (rememberChoice) {
        await this.saveAsDefault(selectedConfig);
      }
    }
    
    return selectedConfig;
  }
  
  /**
   * Create QuickPick items for all available info blocks
   */
  private static createQuickPickItems(
    currentSelection?: MarkdownInfoConfig, 
    defaultFields?: MarkdownInfoField[]
  ): vscode.QuickPickItem[] {
    const allFields: MarkdownInfoField[] = [
      'title',
      'sourceNotice', 
      'fileInfo',
      'metadata',
      'conversionWarnings',
      'contentHeading',
      'sectionSeparators'
    ];
    
    return allFields.map(field => {
      // Determine if this item should be selected by default
      let picked = false;
      if (currentSelection) {
        // Use current selection if provided
        picked = this.isFieldSelected(field, currentSelection);
      } else if (defaultFields) {
        // Use default configuration
        picked = defaultFields.includes(field);
      }
      
      return {
        label: I18n.t(`quickpick.markdownInfo.options.${field}`),
        description: I18n.t(`quickpick.markdownInfo.descriptions.${field}`),
        picked,
        // Store the field name for later conversion
        detail: field
      };
    });
  }
  
  /**
   * Check if a field is selected in the current configuration
   */
  private static isFieldSelected(field: MarkdownInfoField, config: MarkdownInfoConfig): boolean {
    switch (field) {
      case 'title': return config.includeTitle ?? false;
      case 'sourceNotice': return config.includeSourceNotice ?? false;
      case 'fileInfo': return config.includeFileInfo ?? false;
      case 'metadata': return config.includeMetadata ?? false;
      case 'conversionWarnings': return config.includeConversionWarnings ?? false;
      case 'contentHeading': return config.includeContentHeading ?? false;
      case 'sectionSeparators': return config.includeSectionSeparators ?? false;
      default: return false;
    }
  }
  
  /**
   * Convert selected QuickPick items to MarkdownInfoConfig
   */
  private static convertSelectionToConfig(selectedItems: vscode.QuickPickItem[]): MarkdownInfoConfig {
    const selectedFields = selectedItems.map(item => item.detail as MarkdownInfoField);
    
    return {
      includeTitle: selectedFields.includes('title'),
      includeSourceNotice: selectedFields.includes('sourceNotice'),
      includeFileInfo: selectedFields.includes('fileInfo'),
      includeMetadata: selectedFields.includes('metadata'),
      includeConversionWarnings: selectedFields.includes('conversionWarnings'),
      includeContentHeading: selectedFields.includes('contentHeading'),
      includeSectionSeparators: selectedFields.includes('sectionSeparators')
    };
  }
  
  /**
   * Ask user if they want to remember this choice as default
   */
  private static async askToRememberChoice(): Promise<boolean> {
    const items = [
      {
        label: I18n.t('quickpick.rememberChoice'),
        description: I18n.t('quickpick.markdownInfo.rememberDescription'),
        isRememberChoice: true
      }
    ];
    
    const choice = await vscode.window.showQuickPick(items, {
      title: I18n.t('quickpick.markdownInfo.rememberTitle'),
      placeHolder: I18n.t('quickpick.markdownInfo.rememberPlaceholder'),
      ignoreFocusOut: true
    });
    
    return choice?.isRememberChoice ?? false;
  }
  
  /**
   * Save selected configuration as default in settings
   */
  private static async saveAsDefault(config: MarkdownInfoConfig): Promise<void> {
    const selectedFields: MarkdownInfoField[] = [];
    
    if (config.includeTitle) { selectedFields.push('title'); }
    if (config.includeSourceNotice) { selectedFields.push('sourceNotice'); }
    if (config.includeFileInfo) { selectedFields.push('fileInfo'); }
    if (config.includeMetadata) { selectedFields.push('metadata'); }
    if (config.includeConversionWarnings) { selectedFields.push('conversionWarnings'); }
    if (config.includeContentHeading) { selectedFields.push('contentHeading'); }
    if (config.includeSectionSeparators) { selectedFields.push('sectionSeparators'); }
    
    // Update workspace configuration
    const wsConfig = vscode.workspace.getConfiguration('documentConverter');
    await wsConfig.update('markdownInfoFields', selectedFields, vscode.ConfigurationTarget.Global);
    
    // Show confirmation message
    vscode.window.showInformationMessage(
      I18n.t('quickpick.markdownInfo.defaultSaved')
    );
  }
  
  /**
   * Get default configuration from current settings
   */
  static getDefaultConfig(): MarkdownInfoConfig {
    const config = FileUtils.getConfig();
    const fields = config.markdownInfoFields;
    
    return {
      includeTitle: fields.includes('title'),
      includeSourceNotice: fields.includes('sourceNotice'),
      includeFileInfo: fields.includes('fileInfo'),
      includeMetadata: fields.includes('metadata'),
      includeConversionWarnings: fields.includes('conversionWarnings'),
      includeContentHeading: fields.includes('contentHeading'),
      includeSectionSeparators: fields.includes('sectionSeparators')
    };
  }
  
  /**
   * Create configuration with all options enabled (for testing/fallback)
   */
  static getAllEnabledConfig(): MarkdownInfoConfig {
    return {
      includeTitle: true,
      includeSourceNotice: true,
      includeFileInfo: true,
      includeMetadata: true,
      includeConversionWarnings: true,
      includeContentHeading: true,
      includeSectionSeparators: true
    };
  }
  
  /**
   * Create configuration with minimal options (title and content only)
   */
  static getMinimalConfig(): MarkdownInfoConfig {
    return {
      includeTitle: true,
      includeSourceNotice: false,
      includeFileInfo: false,
      includeMetadata: false,
      includeConversionWarnings: false,
      includeContentHeading: true,
      includeSectionSeparators: false
    };
  }
}
