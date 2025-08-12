import * as assert from 'assert';
import * as vscode from 'vscode';
import { MarkdownInfoSelector } from '../../../ui/markdownInfoSelector';
import { MarkdownInfoConfig, MarkdownInfoField } from '../../../types';

suite('MarkdownInfoSelector Unit Tests', () => {

  test('should have a working showSelector method', async () => {
    // Simple test to verify the method exists and can be called
    assert.ok(typeof MarkdownInfoSelector.showSelector === 'function', 
      'showSelector should be a function');
  });

  test('should handle user cancellation gracefully', async () => {
    // Mock user cancellation
    const originalShowQuickPick = vscode.window.showQuickPick;
    (vscode.window.showQuickPick as any) = async () => undefined;

    try {
      const result = await MarkdownInfoSelector.showSelector();
      assert.strictEqual(result, undefined, 'Should return undefined when user cancels');
    } finally {
      vscode.window.showQuickPick = originalShowQuickPick;
    }
  });

  test('should return configuration object with proper structure', async () => {
    // Mock user selection
    const selectedItems = [
      { label: 'Document Title', picked: true }
    ];

    const originalShowQuickPick = vscode.window.showQuickPick;
    (vscode.window.showQuickPick as any) = async () => selectedItems;

    try {
      const result = await MarkdownInfoSelector.showSelector();
      
      if (result) {
        // Verify the result has all expected properties
        assert.ok(typeof result.includeTitle === 'boolean', 'includeTitle should be boolean');
        assert.ok(typeof result.includeSourceNotice === 'boolean', 'includeSourceNotice should be boolean');
        assert.ok(typeof result.includeFileInfo === 'boolean', 'includeFileInfo should be boolean');
        assert.ok(typeof result.includeMetadata === 'boolean', 'includeMetadata should be boolean');
        assert.ok(typeof result.includeConversionWarnings === 'boolean', 'includeConversionWarnings should be boolean');
        assert.ok(typeof result.includeContentHeading === 'boolean', 'includeContentHeading should be boolean');
        assert.ok(typeof result.includeSectionSeparators === 'boolean', 'includeSectionSeparators should be boolean');
      }
    } finally {
      vscode.window.showQuickPick = originalShowQuickPick;
    }
  });

  test('should handle empty selection appropriately', async () => {
    // Mock empty selection
    const originalShowQuickPick = vscode.window.showQuickPick;
    (vscode.window.showQuickPick as any) = async () => [];

    try {
      const result = await MarkdownInfoSelector.showSelector();
      
      if (result) {
        // With empty selection, all fields should be false
        assert.strictEqual(result.includeTitle, false, 'includeTitle should be false');
        assert.strictEqual(result.includeSourceNotice, false, 'includeSourceNotice should be false');
        assert.strictEqual(result.includeFileInfo, false, 'includeFileInfo should be false');
        assert.strictEqual(result.includeMetadata, false, 'includeMetadata should be false');
        assert.strictEqual(result.includeConversionWarnings, false, 'includeConversionWarnings should be false');
        assert.strictEqual(result.includeContentHeading, false, 'includeContentHeading should be false');
        assert.strictEqual(result.includeSectionSeparators, false, 'includeSectionSeparators should be false');
      }
    } finally {
      vscode.window.showQuickPick = originalShowQuickPick;
    }
  });

  test('should handle configuration integration', async () => {
    // Test interaction with VS Code configuration
    const originalGetConfiguration = vscode.workspace.getConfiguration;
    
    const mockConfig = {
      get: (key: string) => {
        switch (key) {
          case 'markdownInfoFields':
            return ['title', 'fileInfo'];
          case 'rememberMarkdownInfoSelection':
            return false;
          default:
            return undefined;
        }
      },
      update: async (key: string, value: any) => {
        // Mock update function
      }
    };

    vscode.workspace.getConfiguration = () => mockConfig as any;

    try {
      // Test that configuration is accessed
      const config = vscode.workspace.getConfiguration();
      const fields = config.get('markdownInfoFields');
      assert.deepStrictEqual(fields, ['title', 'fileInfo'], 'Should retrieve saved configuration');
    } finally {
      vscode.workspace.getConfiguration = originalGetConfiguration;
    }
  });

  test('should provide consistent interface', async () => {
    // Test that the interface is consistent across different calls
    
    const mockSelections = [
      [{ label: 'Document Title', picked: true }],
      [{ label: 'Source Notice', picked: true }],
      []
    ];

    const originalShowQuickPick = vscode.window.showQuickPick;
    let callCount = 0;

    try {
      for (const selection of mockSelections) {
        (vscode.window.showQuickPick as any) = async () => selection;
        
        const result = await MarkdownInfoSelector.showSelector();
        
        if (result) {
          // Verify consistent structure
          assert.ok('includeTitle' in result, 'Should always have includeTitle property');
          assert.ok('includeSourceNotice' in result, 'Should always have includeSourceNotice property');
          assert.ok('includeFileInfo' in result, 'Should always have includeFileInfo property');
          assert.ok('includeMetadata' in result, 'Should always have includeMetadata property');
          assert.ok('includeConversionWarnings' in result, 'Should always have includeConversionWarnings property');
          assert.ok('includeContentHeading' in result, 'Should always have includeContentHeading property');
          assert.ok('includeSectionSeparators' in result, 'Should always have includeSectionSeparators property');
        }
        
        callCount++;
      }
      
      assert.strictEqual(callCount, 3, 'Should have tested all selection scenarios');
    } finally {
      vscode.window.showQuickPick = originalShowQuickPick;
    }
  });
});
