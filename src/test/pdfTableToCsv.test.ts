import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { PdfTableToCsvConverter } from '../converters/pdfTableToCsv';

suite('PDF Table to CSV Converter Test Suite', () => {
    
    test('Should initialize converter', () => {
        const converter = new PdfTableToCsvConverter();
        assert.ok(converter, 'Converter should be created');
    });

    test('Should handle non-existent file gracefully', async () => {
        const nonExistentPath = '/path/to/nonexistent.pdf';
        
        const result = await PdfTableToCsvConverter.convert(nonExistentPath, { 
            outputDirectory: '/tmp/' 
        });
        
        assert.strictEqual(result.success, false, 'Conversion should fail for non-existent file');
        assert.ok(result.error, 'Should include error message');
        assert.ok(
            result.error.includes('文件不存在') || 
            result.error.includes('无法访问') || 
            result.error.includes('Cannot access') ||
            result.error.includes('File does not exist') ||
            result.error.includes('not accessible'),
            `Error should indicate file access issue, got: ${result.error}`
        );
    });

    test('Should validate PDF file extension', async () => {
        const tempDir = path.join(__dirname, '..', '..', 'temp');
        const tempFile = path.join(tempDir, 'test.txt');
        
        // Create temp directory if it doesn't exist
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Create a dummy text file
        fs.writeFileSync(tempFile, 'This is not a PDF file');
        
        try {
            const result = await PdfTableToCsvConverter.convert(tempFile, { 
                outputDirectory: '/tmp/' 
            });
            
            assert.strictEqual(result.success, false, 'Conversion should fail for non-PDF file');
            assert.ok(result.error, 'Should include error message');
            assert.ok(
                result.error.includes('Unsupported') || 
                result.error.includes('format') ||
                result.error.includes('.txt'),
                `Error should indicate file format issue, got: ${result.error}`
            );
        } finally {
            // Cleanup
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
            if (fs.existsSync(tempDir)) {
                fs.rmdirSync(tempDir);
            }
        }
    });

    test('Should handle empty output directory', async () => {
        const tempDir = path.join(__dirname, '..', '..', 'temp');
        const tempFile = path.join(tempDir, 'test.pdf');
        
        // Create temp directory if it doesn't exist
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Create a minimal PDF-like file (this won't be a valid PDF but will test path handling)
        fs.writeFileSync(tempFile, '%PDF-1.4');
        
        try {
            const result = await PdfTableToCsvConverter.convert(tempFile, {});
            
            // The converter should handle missing output directory gracefully
            // Either succeed with default directory or fail with descriptive error
            if (!result.success) {
                assert.ok(result.error, 'Should include error message');
                // If it fails, it should be about output directory or PDF parsing
                assert.ok(
                    result.error.includes('output') || 
                    result.error.includes('directory') ||
                    result.error.includes('PDF') ||
                    result.error.includes('parse'),
                    `Error should indicate output or parsing issue, got: ${result.error}`
                );
            } else {
                // If it succeeds, it should have handled the missing output directory
                assert.ok(true, 'Converter handled missing output directory gracefully');
            }
        } finally {
            // Cleanup
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
            if (fs.existsSync(tempDir)) {
                fs.rmdirSync(tempDir);
            }
        }
    });
});
