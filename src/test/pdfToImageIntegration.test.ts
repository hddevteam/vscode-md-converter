/**
 * Integration test for PDF to Image conversion within VS Code extension
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { convertPdfToImage } from '../commands/convertPdfToImage';

export async function testPdfToImageIntegration() {
    console.log('🧪 Starting PDF to Image integration test...');
    
    const testPdfPath = path.join(__dirname, 'docs', 'multipage_pdf.pdf');
    
    // Check if test file exists
    if (!fs.existsSync(testPdfPath)) {
        console.error('❌ Test PDF not found:', testPdfPath);
        return false;
    }
    
    try {
        // Create a mock URI for the test
        const testUri = vscode.Uri.file(testPdfPath);
        
        console.log('📄 Testing with:', testPdfPath);
        
        // Call our actual command function
        await convertPdfToImage(testUri);
        
        // Check if output was created
        const expectedOutputDir = path.join(path.dirname(testPdfPath), path.basename(testPdfPath, '.pdf') + '_images');
        
        if (fs.existsSync(expectedOutputDir)) {
            const files = fs.readdirSync(expectedOutputDir);
            const imageFiles = files.filter(f => f.endsWith('.png'));
            
            console.log(`✅ Success! Generated ${imageFiles.length} images in:`, expectedOutputDir);
            imageFiles.forEach((file, index) => {
                const filePath = path.join(expectedOutputDir, file);
                const stats = fs.statSync(filePath);
                const sizeKB = Math.round(stats.size / 1024);
                console.log(`  ${index + 1}. ${file} (${sizeKB} KB)`);
            });
            
            return true;
        } else {
            console.log('❌ Output directory not found:', expectedOutputDir);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Integration test failed:', error);
        return false;
    }
}

// Export for use in test runner
export { testPdfToImageIntegration as run };
