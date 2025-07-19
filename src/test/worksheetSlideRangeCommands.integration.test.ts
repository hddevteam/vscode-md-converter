import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

suite('Worksheet and Slide Range Commands Integration Tests', () => {
  const testDataDir = path.join(__dirname, 'docs');
  const tempDir = path.join(__dirname, 'temp', 'command_integration_test');

  setup(async () => {
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  teardown(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
  });

  test('should register Excel worksheet commands', async () => {
    const commands = await vscode.commands.getCommands(true);
    
    const expectedCommands = [
      'document-md-converter.convertExcelWorksheetsToMarkdown',
      'document-md-converter.convertExcelWorksheetsToCsv'
    ];
    
    for (const command of expectedCommands) {
      assert.ok(
        commands.includes(command),
        `Command ${command} should be registered`
      );
    }
    
    console.log('Excel worksheet commands are properly registered');
  });

  test('should register PowerPoint slide commands', async () => {
    const commands = await vscode.commands.getCommands(true);
    
    const expectedCommands = [
      'document-md-converter.convertPowerPointSlidesToMarkdown'
    ];
    
    for (const command of expectedCommands) {
      assert.ok(
        commands.includes(command),
        `Command ${command} should be registered`
      );
    }
    
    console.log('PowerPoint slide commands are properly registered');
  });

  test('should have proper command categories', async () => {
    // This test verifies that commands are properly categorized in package.json
    // The actual validation would happen during VS Code extension loading
    
    const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
    const packageContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    const commands = packageJson.contributes.commands;
    const newCommands = commands.filter((cmd: any) => 
      cmd.command.includes('ExcelWorksheets') || 
      cmd.command.includes('PowerPointSlides')
    );
    
    assert.ok(newCommands.length >= 3, 'Should have at least 3 new commands');
    
    for (const command of newCommands) {
      assert.strictEqual(
        command.category,
        'OneClick Markdown Converter',
        `Command ${command.command} should have correct category`
      );
    }
    
    console.log('Commands have proper categories');
  });

  test('should have proper menu entries', async () => {
    const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
    const packageContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    const explorerMenus = packageJson.contributes.menus['explorer/context'];
    const newMenus = explorerMenus.filter((menu: any) => 
      menu.command.includes('ExcelWorksheets') || 
      menu.command.includes('PowerPointSlides')
    );
    
    assert.ok(newMenus.length >= 3, 'Should have menu entries for new commands');
    
    // Check Excel worksheet menus
    const excelMenus = newMenus.filter((menu: any) => 
      menu.command.includes('ExcelWorksheets')
    );
    for (const menu of excelMenus) {
      assert.ok(
        menu.when.includes('.xlsx') || menu.when.includes('.xls'),
        'Excel worksheet commands should have proper file type conditions'
      );
    }
    
    // Check PowerPoint slide menus
    const pptMenus = newMenus.filter((menu: any) => 
      menu.command.includes('PowerPointSlides')
    );
    for (const menu of pptMenus) {
      assert.ok(
        menu.when.includes('.pptx') || menu.when.includes('.ppt'),
        'PowerPoint slide commands should have proper file type conditions'
      );
    }
    
    console.log('Menu entries are properly configured');
  });

  test('should have proper localization keys', async () => {
    // Test English localization
    const englishNlsPath = path.join(__dirname, '..', '..', 'package.nls.json');
    const englishContent = await fs.readFile(englishNlsPath, 'utf8');
    const englishNls = JSON.parse(englishContent);
    
    const expectedKeys = [
      'commands.convertExcelWorksheetsToMarkdown',
      'commands.convertExcelWorksheetsToCsv',
      'commands.convertPowerPointSlidesToMarkdown'
    ];
    
    for (const key of expectedKeys) {
      assert.ok(
        englishNls[key],
        `English localization should have key ${key}`
      );
    }
    
    // Test Chinese localization
    const chineseNlsPath = path.join(__dirname, '..', '..', 'package.nls.zh-cn.json');
    const chineseContent = await fs.readFile(chineseNlsPath, 'utf8');
    const chineseNls = JSON.parse(chineseContent);
    
    for (const key of expectedKeys) {
      assert.ok(
        chineseNls[key],
        `Chinese localization should have key ${key}`
      );
    }
    
    console.log('Localization keys are properly defined');
  });

  test('should have proper i18n message definitions', async () => {
    // Test that i18n English messages include new message keys
    const enPath = path.join(__dirname, '..', 'i18n', 'en.js');
    const enContent = await fs.readFile(enPath, 'utf8');
    
    // Check for Excel-specific messages
    assert.ok(
      enContent.includes('worksheetSelectionTitle'),
      'Should have Excel worksheet selection messages'
    );
    assert.ok(
      enContent.includes('selectWorksheets'),
      'Should have worksheet selection messages'
    );
    
    // Check for PowerPoint-specific messages
    assert.ok(
      enContent.includes('slidesConversionComplete'),
      'Should have PowerPoint slide completion messages'
    );
    assert.ok(
      enContent.includes('continueAnyway'),
      'Should have PowerPoint continuation messages'
    );
    
    console.log('I18n message definitions are complete');
  });

  test('should execute commands without throwing errors', async () => {
    // Test that commands can be executed (though they may show file picker dialogs)
    // This is a basic smoke test to ensure commands are properly wired
    
    try {
      // These commands will likely show file picker dialogs and then return
      // We're just testing that they don't throw immediate errors
      const excelCommand1 = vscode.commands.executeCommand(
        'document-md-converter.convertExcelWorksheetsToMarkdown'
      );
      
      const excelCommand2 = vscode.commands.executeCommand(
        'document-md-converter.convertExcelWorksheetsToCsv'
      );
      
      const pptCommand = vscode.commands.executeCommand(
        'document-md-converter.convertPowerPointSlidesToMarkdown'
      );
      
      // Note: These commands will likely be cancelled by the user or return early
      // We're mainly testing that they don't throw synchronous errors
      
      console.log('Commands can be executed without immediate errors');
    } catch (error) {
      // Only fail if the error is not related to user cancellation or file selection
      if (!(error instanceof Error) || !error.message.includes('cancel')) {
        throw error;
      }
    }
  });
});
