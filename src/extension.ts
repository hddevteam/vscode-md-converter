import * as vscode from 'vscode';
import { convertWordToMarkdown } from './commands/convertWordToMarkdown';
import { convertExcelToMarkdown } from './commands/convertExcelToMarkdown';
import { convertExcelToCsv } from './commands/convertExcelToCsv';
import { convertPdfToText } from './commands/convertPdfToText';
import { convertPdfToImage, batchConvertPdfToImage } from './commands/convertPdfToImage';
import { convertPowerPointToMarkdown } from './commands/convertPowerPointToMarkdown';
import { convertMarkdownToWord } from './commands/convertMarkdownToWord';
import { convertWordTablesToCsv } from './commands/convertWordTablesToCsv';
import { convertPdfTablesToCsv } from './commands/convertPdfTablesToCsv';
import { convertPdfPagesToText } from './commands/convertPdfPagesToText';
import { convertPdfPagesToImages } from './commands/convertPdfPagesToImages';
import { convertExcelWorksheetsToMarkdown, convertExcelWorksheetsToCsv } from './commands/convertExcelWorksheetsRange';
import { convertPowerPointSlidesToMarkdown } from './commands/convertPowerPointSlidesRange';
import { batchConvert } from './commands/batchConvert';
import { openConverter } from './commands/openConverter';
import { debugPdfEnvironment } from './commands/debugPdfEnvironment';
import { I18n } from './i18n';

/**
 * Called when the extension is activated
 */
export async function activate(context: vscode.ExtensionContext) {
  try {
    console.log(I18n.t('extension.activating'));
    console.log('Extension context:', context.extensionPath);

    // Register commands
    console.log('Registering commands...');
    const commands = [
      vscode.commands.registerCommand(
        'document-md-converter.convertWordToMarkdown',
        async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
          console.log('Executing Word to Markdown command, URI:', uri?.fsPath, 'URIs:', uris?.map(u => u.fsPath));
          return convertWordToMarkdown(uri, uris);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.convertExcelToMarkdown',
        async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
          console.log('Executing Excel to Markdown command, URI:', uri?.fsPath, 'URIs:', uris?.map(u => u.fsPath));
          return convertExcelToMarkdown(uri, uris);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.convertExcelToCsv',
        async (uri?: vscode.Uri) => {
          console.log('Executing Excel to CSV command, URI:', uri?.fsPath);
          return convertExcelToCsv(uri);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.convertPdfToText',
        async (uri?: vscode.Uri) => {
          console.log('Executing PDF to Text command, URI:', uri?.fsPath);
          return convertPdfToText(uri);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.convertPdfToImage',
        async (uri?: vscode.Uri) => {
          console.log('Executing PDF to Image command, URI:', uri?.fsPath);
          return convertPdfToImage(uri);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.convertPowerPointToMarkdown',
        async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
          console.log('Executing PowerPoint to Markdown command, URI:', uri?.fsPath, 'URIs:', uris?.map(u => u.fsPath));
          return convertPowerPointToMarkdown(uri, uris);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.convertMarkdownToWord',
        async (uri?: vscode.Uri) => {
          console.log('Executing Markdown to Word command, URI:', uri?.fsPath);
          return convertMarkdownToWord(uri);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.convertWordTablesToCsv',
        async (uri?: vscode.Uri) => {
          console.log('Executing Word Tables to CSV command, URI:', uri?.fsPath);
          return convertWordTablesToCsv(uri);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.convertPdfTablesToCsv',
        async (uri?: vscode.Uri) => {
          console.log('Executing PDF Tables to CSV command, URI:', uri?.fsPath);
          return convertPdfTablesToCsv(uri);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.convertPdfPagesToText',
        async (uri?: vscode.Uri) => {
          console.log('Executing PDF Pages to Text command, URI:', uri?.fsPath);
          return convertPdfPagesToText(uri);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.convertPdfPagesToImages',
        async (uri?: vscode.Uri) => {
          console.log('Executing PDF Pages to Images command, URI:', uri?.fsPath);
          return convertPdfPagesToImages(uri);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.convertExcelWorksheetsToMarkdown',
        async (uri?: vscode.Uri) => {
          console.log('Executing Excel Worksheets to Markdown command, URI:', uri?.fsPath);
          return convertExcelWorksheetsToMarkdown(uri);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.convertExcelWorksheetsToCsv',
        async (uri?: vscode.Uri) => {
          console.log('Executing Excel Worksheets to CSV command, URI:', uri?.fsPath);
          return convertExcelWorksheetsToCsv(uri);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.convertPowerPointSlidesToMarkdown',
        async (uri?: vscode.Uri) => {
          console.log('Executing PowerPoint Slides to Markdown command, URI:', uri?.fsPath);
          return convertPowerPointSlidesToMarkdown(uri);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.batchConvert',
        async (uri?: vscode.Uri) => {
          console.log('Executing batch conversion command, URI:', uri?.fsPath);
          return batchConvert(uri);
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.openConverter',
        () => {
          console.log('Executing open converter command');
          return openConverter();
        }
      ),
      vscode.commands.registerCommand(
        'document-md-converter.debugPdfEnvironment',
        () => {
          console.log('Executing PDF environment debug command');
          return debugPdfEnvironment();
        }
      )
    ];

    // Add commands to subscriptions
    console.log(`Registered ${commands.length} commands`);
    commands.forEach(command => context.subscriptions.push(command));

    // Verify commands are successfully registered
    const registeredCommands = await vscode.commands.getCommands(true);
    const ourCommands = registeredCommands.filter(cmd => cmd.startsWith('document-md-converter.'));
    console.log('Registered document converter commands:', ourCommands);

  // Show welcome message
  const config = vscode.workspace.getConfiguration('documentConverter');
  const showWelcome = config.get('showWelcomeMessage', true);
  
  if (showWelcome) {
    vscode.window.showInformationMessage(
      I18n.t('extension.welcomeMessage'),
      I18n.t('extension.welcomeButton')
    ).then(selection => {
      if (selection === I18n.t('extension.welcomeButton')) {
        config.update('showWelcomeMessage', false, true);
      }
    });
  }
    
    console.log(I18n.t('extension.activated'));
  } catch (error) {
    console.error('Document converter extension activation failed:', error);
    vscode.window.showErrorMessage(`${I18n.t('extension.activationFailed')}: ${error instanceof Error ? error.message : I18n.t('error.unknownError')}`);
  }
}

/**
 * Called when the extension is deactivated
 */
export function deactivate() {
  // Clean up resources
  console.log(I18n.t('extension.deactivated'));
}
