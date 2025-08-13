import * as vscode from 'vscode';
import * as path from 'path';
import { I18n } from '../i18n';

export async function debugPdfEnvironment() {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const currentWorkdir = process.cwd();
    
    const debugInfo = [
      I18n.t('debug.currentWorkDir', currentWorkdir),
      I18n.t('debug.vscodeWorkspace', workspaceFolders ? workspaceFolders[0].uri.fsPath : I18n.t('debug.none')),
      I18n.t('debug.extensionDir', path.dirname(__dirname)),
      I18n.t('debug.projectRootDir', path.dirname(path.dirname(__dirname))),
    ];
    
    // Check pdf-parse related paths
    const nodeModulesPath = path.join(currentWorkdir, 'node_modules', 'pdf-parse');
    const testFilePath = path.join(nodeModulesPath, 'test', 'data', '05-versions-space.pdf');
    
    debugInfo.push(I18n.t('debug.pdfParseModulePath', nodeModulesPath));
    debugInfo.push(I18n.t('debug.testFilePath', testFilePath));
    
    const fs = require('fs');
    debugInfo.push(I18n.t('debug.nodeModulesExists', fs.existsSync(path.join(currentWorkdir, 'node_modules'))));
    debugInfo.push(I18n.t('debug.pdfParseExists', fs.existsSync(nodeModulesPath)));
    debugInfo.push(I18n.t('debug.testFileExists', fs.existsSync(testFilePath)));
    
    // Try testing pdf-parse
    try {
      const pdfParse = require('pdf-parse');
      debugInfo.push(I18n.t('debug.pdfParseLoadSuccess', typeof pdfParse));
    } catch (error: any) {
      debugInfo.push(I18n.t('debug.pdfParseLoadFailed', error.message));
    }
    
    const message = debugInfo.join('\n');
    await vscode.window.showInformationMessage(
      I18n.t('debug.debugInfoTitle'),
      { detail: message, modal: true },
      I18n.t('debug.copyToClipboard')
    );
    
    console.log('PDF Environment Debug Info:', message);
    
  } catch (error: any) {
    vscode.window.showErrorMessage(I18n.t('debug.debugFailed', error.message));
  }
}
