import * as vscode from 'vscode';
import { I18n } from '../i18n';
import { InstallationGuide } from '../utils/toolDetection';

/**
 * Installation guide WebView panel manager
 */
export class InstallationGuidePanel {
  private static currentPanel: InstallationGuidePanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  /**
   * Create or show installation guide panel
   */
  public static createOrShow(guide: InstallationGuide) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (InstallationGuidePanel.currentPanel) {
      InstallationGuidePanel.currentPanel.panel.reveal(column);
      InstallationGuidePanel.currentPanel.update(guide);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'pdfToImageInstallation',
      I18n.t('pdfToImage.installationGuide'),
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    InstallationGuidePanel.currentPanel = new InstallationGuidePanel(panel, guide);
  }

  private constructor(panel: vscode.WebviewPanel, guide: InstallationGuide) {
    this.panel = panel;
    this.update(guide);

    // Listen for when the panel is disposed
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'checkInstallation':
            this.handleCheckInstallation();
            break;
          case 'openDownloadLink':
            if (message.url) {
              vscode.env.openExternal(vscode.Uri.parse(message.url));
            }
            break;
        }
      },
      null,
      this.disposables
    );
  }

  /**
   * Update the webview content
   */
  private update(guide: InstallationGuide) {
    this.panel.webview.html = this.getWebviewContent(guide);
  }

  /**
   * Handle check installation request from webview
   */
  private async handleCheckInstallation() {
    // Import here to avoid circular dependency
    const { ToolDetection } = await import('../utils/toolDetection.js');
    
    const availability = await ToolDetection.detectPopplerUtils();
    
    if (availability.isInstalled) {
      this.panel.webview.postMessage({
        command: 'installationResult',
        success: true,
        message: I18n.t('pdfToImage.installationSuccessful')
      });
      
      // Show success message and close panel
      vscode.window.showInformationMessage(
        I18n.t('pdfToImage.installationSuccessful')
      );
      this.dispose();
    } else {
      this.panel.webview.postMessage({
        command: 'installationResult',
        success: false,
        message: I18n.t('pdfToImage.installationFailed')
      });
    }
  }

  /**
   * Generate HTML content for the webview
   */
  private getWebviewContent(guide: InstallationGuide): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${I18n.t('pdfToImage.installationGuide')}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .header h1 {
            color: var(--vscode-textLink-foreground);
            margin: 0;
            font-size: 24px;
        }
        
        .platform-section {
            margin: 25px 0;
            padding: 20px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 8px;
            border-left: 4px solid var(--vscode-textLink-foreground);
        }
        
        .platform-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: var(--vscode-textLink-foreground);
        }
        
        .step {
            margin: 12px 0;
            padding-left: 20px;
        }
        
        .command-box {
            background-color: var(--vscode-textCodeBlock-background);
            color: var(--vscode-textPreformat-foreground);
            padding: 12px;
            border-radius: 4px;
            font-family: 'Courier New', Consolas, monospace;
            font-size: 14px;
            margin: 10px 0;
            border: 1px solid var(--vscode-panel-border);
            position: relative;
        }
        
        .command-box .copy-btn {
            position: absolute;
            right: 8px;
            top: 8px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 4px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .command-box .copy-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .action-buttons {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            margin: 0 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .warning {
            background-color: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            color: var(--vscode-inputValidation-warningForeground);
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        
        .status-message {
            padding: 10px;
            border-radius: 4px;
            margin: 15px 0;
            text-align: center;
        }
        
        .status-success {
            background-color: var(--vscode-inputValidation-infoBackground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
            color: var(--vscode-inputValidation-infoForeground);
        }
        
        .status-error {
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            color: var(--vscode-inputValidation-errorForeground);
        }
        
        #statusMessage {
            display: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔧 ${I18n.t('pdfToImage.installationGuide')}</h1>
        <p>${I18n.t('pdfToImage.toolNotFound')}</p>
    </div>

    <div class="platform-section">
        <div class="platform-title">${this.getPlatformIcon(guide.platform)} ${guide.platform}</div>
        <div class="step">${guide.instructions}</div>
        ${guide.command ? `
        <div class="command-box">
            <span>${guide.command}</span>
            <button class="copy-btn" onclick="copyCommand('${guide.command}')">Copy</button>
        </div>
        ` : ''}
        ${guide.downloadUrl ? `
        <div class="step">
            <a href="#" onclick="openDownloadLink('${guide.downloadUrl}')" class="btn btn-secondary">
                📥 Download
            </a>
        </div>
        ` : ''}
        ${guide.packageManager ? `
        <div class="step">
            <strong>Alternative (Package Manager):</strong>
            <div class="command-box">
                <span>${guide.packageManager}</span>
                <button class="copy-btn" onclick="copyCommand('${guide.packageManager}')">Copy</button>
            </div>
        </div>
        ` : ''}
    </div>

    <div class="warning">
        <strong>⚠️ Important:</strong> ${I18n.t('pdfToImage.verifyInstallation')}
    </div>

    <div id="statusMessage" class="status-message"></div>

    <div class="action-buttons">
        <button class="btn" onclick="checkInstallation()">
            🔍 ${I18n.t('pdfToImage.checkInstallation')}
        </button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function copyCommand(command) {
            navigator.clipboard.writeText(command).then(() => {
                showStatus('Command copied to clipboard!', 'success');
            }).catch(() => {
                showStatus('Failed to copy command', 'error');
            });
        }

        function openDownloadLink(url) {
            vscode.postMessage({
                command: 'openDownloadLink',
                url: url
            });
        }

        function checkInstallation() {
            showStatus('${I18n.t('pdfToImage.checkInstallation')}...', 'info');
            vscode.postMessage({
                command: 'checkInstallation'
            });
        }

        function showStatus(message, type) {
            const statusEl = document.getElementById('statusMessage');
            statusEl.textContent = message;
            statusEl.className = 'status-message status-' + type;
            statusEl.style.display = 'block';
            
            if (type === 'success') {
                setTimeout(() => {
                    statusEl.style.display = 'none';
                }, 3000);
            }
        }

        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'installationResult':
                    if (message.success) {
                        showStatus(message.message, 'success');
                    } else {
                        showStatus(message.message, 'error');
                    }
                    break;
            }
        });
    </script>
</body>
</html>`;
  }

  /**
   * Get platform-specific icon
   */
  private getPlatformIcon(platform: string): string {
    switch (platform.toLowerCase()) {
      case 'macos':
        return '🍎';
      case 'windows':
        return '🪟';
      case 'linux':
        return '🐧';
      default:
        return '💻';
    }
  }

  /**
   * Dispose of the panel
   */
  public dispose() {
    InstallationGuidePanel.currentPanel = undefined;

    // Clean up our resources
    this.panel.dispose();

    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
