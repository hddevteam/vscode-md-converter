import * as fs from 'fs/promises';
import * as path from 'path';

// 简单的PDF文本提取测试
async function debugPdfContent() {
    try {
        // 动态导入pdf-parse
        const pdfParse = require('pdf-parse');
        
        const testPdfPath = path.join(__dirname, '..', '..', 'src', 'test', 'docs', 'PDF表格.pdf');
        console.log(`Reading PDF from: ${testPdfPath}`);
        
        const buffer = await fs.readFile(testPdfPath);
        console.log(`PDF file size: ${buffer.length} bytes`);
        
        const data = await pdfParse(buffer);
        
        console.log('\n=== PDF Info ===');
        console.log(`Pages: ${data.numpages}`);
        console.log(`Text length: ${data.text.length}`);
        console.log(`Info:`, data.info);
        console.log(`Metadata:`, data.metadata);
        
        console.log('\n=== Raw Text Content ===');
        console.log(`"${data.text}"`);
        
        console.log('\n=== Text Lines ===');
        const lines: string[] = data.text.split('\n');
        lines.forEach((line: string, index: number) => {
            console.log(`Line ${index}: "${line}"`);
        });
        
        console.log('\n=== Text Analysis ===');
        console.log(`Total lines: ${lines.length}`);
        console.log(`Non-empty lines: ${lines.filter((line: string) => line.trim().length > 0).length}`);
        console.log(`Lines with numbers: ${lines.filter((line: string) => /\d/.test(line)).length}`);
        console.log(`Lines with tabs: ${lines.filter((line: string) => line.includes('\t')).length}`);
        console.log(`Lines with spaces (2+): ${lines.filter((line: string) => /\s{2,}/.test(line)).length}`);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

export { debugPdfContent };
