import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import { I18n } from '../i18n';

const execAsync = promisify(exec);

/**
 * Installation guide for different platforms
 */
export interface InstallationGuide {
  platform: string;
  instructions: string;
  command?: string;
  downloadUrl?: string;
  packageManager?: string;
}

/**
 * Tool availability detection result
 */
export interface ToolAvailability {
  isInstalled: boolean;
  version?: string;
  executablePath?: string;
  installationGuide: InstallationGuide;
}

/**
 * Tool detection utility class
 */
export class ToolDetection {
  
  /**
   * Detect if poppler-utils (pdftoppm) is installed
   */
  static async detectPopplerUtils(): Promise<ToolAvailability> {
    const installationGuide = this.getInstallationGuide();
    
    // Try different command variations for cross-platform compatibility
    const commands = ['pdftoppm', 'pdftoppm.exe'];
    
    for (const command of commands) {
      try {
        // Try to get version information
        const result = await execAsync(`${command} -v`);
        const output = result.stderr || result.stdout; // Version info might be in stderr
        
        if (output && output.includes('pdftoppm')) {
          const version = this.parseVersion(output);
          return {
            isInstalled: true,
            version,
            executablePath: command,
            installationGuide
          };
        }
      } catch (error) {
        // Continue to next command if this one fails
        continue;
      }
    }
    
    // If no command worked, tool is not installed
    return {
      isInstalled: false,
      installationGuide
    };
  }
  
  /**
   * Parse version information from command output
   */
  private static parseVersion(output: string): string {
    try {
      // Extract version from output like "pdftoppm version 21.03.0"
      const versionMatch = output.match(/version\s+(\d+\.\d+\.\d+)/i);
      if (versionMatch) {
        return versionMatch[1];
      }
      
      // Alternative pattern for different output formats
      const altMatch = output.match(/(\d+\.\d+\.\d+)/);
      if (altMatch) {
        return altMatch[1];
      }
      
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }
  
  /**
   * Get platform-specific installation guide
   */
  private static getInstallationGuide(): InstallationGuide {
    const platform = os.platform();
    
    switch (platform) {
      case 'darwin':
        return {
          platform: 'macOS',
          instructions: I18n.t('pdfToImage.macOSInstructions'),
          command: I18n.t('pdfToImage.macOSCommand'),
          downloadUrl: 'https://brew.sh/'
        };
      
      case 'win32':
        return {
          platform: 'Windows',
          instructions: I18n.t('pdfToImage.windowsInstructions'),
          downloadUrl: I18n.t('pdfToImage.windowsDownload'),
          packageManager: 'choco install poppler'
        };
      
      case 'linux':
        return {
          platform: 'Linux',
          instructions: I18n.t('pdfToImage.linuxInstructions'),
          command: I18n.t('pdfToImage.linuxCommand')
        };
      
      default:
        return {
          platform: 'Other',
          instructions: 'Please visit poppler documentation for installation instructions.',
          downloadUrl: 'https://poppler.freedesktop.org/'
        };
    }
  }
  
  /**
   * Verify installation by running a simple test command
   */
  static async verifyInstallation(): Promise<boolean> {
    try {
      const result = await this.detectPopplerUtils();
      return result.isInstalled;
    } catch (error) {
      return false;
    }
  }
}
