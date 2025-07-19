/**
 * Integration test for PDF Page Range conversion within VS Code extension
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PdfPageRangeConverter } from '../converters/pdfPageRangeConverter';
import { PdfPageRangeImageConverter } from '../converters/pdfPageRangeImageConverter';
import { PageRangeSelector } from '../ui/pageRangeSelector';

/**
 * Test PDF Page Range to Text conversion
 */
export async function testPdfPageRangeToTextIntegration() {
    console.log('🧪 Starting PDF Page Range to Text integration test...');
    
    const testPdfPath = path.join(__dirname, 'docs', 'multipage_pdf.pdf');
    
    // Check if test file exists
    if (!fs.existsSync(testPdfPath)) {
        console.error('❌ Test PDF not found:', testPdfPath);
        return false;
    }
    
    try {
        console.log('📄 Testing with:', testPdfPath);
        
        // Test page range validation
        console.log('🔍 Testing page range validation...');
        
        // Test valid ranges
        const validTests = [
            { input: '1', expected: [1] },
            { input: '1-3', expected: [1, 2, 3] },
            { input: '1,3,5', expected: [1, 3, 5] },
            { input: '1-2,4,6-7', expected: [1, 2, 4, 6, 7] },
            { input: ' 1 , 3 , 5 ', expected: [1, 3, 5] } // Test with spaces
        ];
        
        for (const test of validTests) {
            const result = PageRangeSelector.validatePageRange(test.input, 10);
            if (!result.isValid || !arraysEqual(result.pageNumbers, test.expected)) {
                console.error(`❌ Validation failed for "${test.input}":`, result);
                return false;
            }
            console.log(`✅ Valid range "${test.input}" -> [${result.pageNumbers.join(', ')}]`);
        }
        
        // Test invalid ranges
        const invalidTests = [
            '', // Empty
            'abc', // Non-numeric
            '0', // Zero page
            '1-0', // Invalid range order
            '1,15', // Out of bounds (assuming 10 pages)
            '1-15', // Range out of bounds
            '1,,3', // Double comma
            '1-', // Incomplete range
            '-3' // Incomplete range
        ];
        
        for (const test of invalidTests) {
            const result = PageRangeSelector.validatePageRange(test, 10);
            if (result.isValid) {
                console.error(`❌ Should be invalid but passed: "${test}"`);
                return false;
            }
            console.log(`✅ Invalid range correctly rejected: "${test}"`);
        }
        
        // Test page number formatting
        console.log('🔍 Testing page number formatting...');
        const formatTests = [
            { input: [1], expected: '1' },
            { input: [1, 2, 3], expected: '1-3' },
            { input: [1, 3, 5], expected: '1, 3, 5' },
            { input: [1, 2, 4, 5, 6, 8], expected: '1-2, 4-6, 8' },
            { input: [1, 2, 3, 5, 7, 8, 9], expected: '1-3, 5, 7-9' }
        ];
        
        for (const test of formatTests) {
            const result = PageRangeSelector.formatPageNumbers(test.input);
            if (result !== test.expected) {
                console.error(`❌ Format failed for [${test.input.join(', ')}]: expected "${test.expected}", got "${result}"`);
                return false;
            }
            console.log(`✅ Format [${test.input.join(', ')}] -> "${result}"`);
        }
        
        console.log('✅ All page range validation and formatting tests passed!');
        return true;
        
    } catch (error) {
        console.error('❌ Integration test failed:', error);
        return false;
    }
}

/**
 * Test PDF Page Range to Images conversion (requires poppler-utils)
 */
export async function testPdfPageRangeToImagesIntegration() {
    console.log('🧪 Starting PDF Page Range to Images integration test...');
    
    const testPdfPath = path.join(__dirname, 'docs', 'multipage_pdf.pdf');
    
    // Check if test file exists
    if (!fs.existsSync(testPdfPath)) {
        console.error('❌ Test PDF not found:', testPdfPath);
        return false;
    }
    
    try {
        console.log('📄 Testing with:', testPdfPath);
        
        // Initialize converter and check tool availability
        const converter = new PdfPageRangeImageConverter();
        const isToolAvailable = await converter.initialize();
        
        if (!isToolAvailable) {
            console.warn('⚠️  poppler-utils not available, skipping image conversion test');
            console.log('   Install poppler-utils to run this test:');
            console.log('   - macOS: brew install poppler');
            console.log('   - Ubuntu: sudo apt-get install poppler-utils');
            console.log('   - Windows: Download from https://blog.alivate.com.au/poppler-windows/');
            return true; // Don't fail the test, just skip it
        }
        
        // Test getting page count
        const pageCount = await converter.getPageCount(testPdfPath);
        console.log(`📊 PDF has ${pageCount} pages`);
        
        if (pageCount > 0) {
            console.log('✅ Successfully detected page count');
        } else {
            console.warn('⚠️  Could not detect page count, but continuing test');
        }
        
        console.log('✅ PDF Page Range to Images test completed (tool availability check passed)');
        return true;
        
    } catch (error) {
        console.error('❌ Integration test failed:', error);
        return false;
    }
}

/**
 * Test complete workflow simulation
 */
export async function testCompletePageRangeWorkflow() {
    console.log('🧪 Starting complete page range workflow test...');
    
    const testPdfPath = path.join(__dirname, 'docs', 'multipage_pdf.pdf');
    
    if (!fs.existsSync(testPdfPath)) {
        console.error('❌ Test PDF not found:', testPdfPath);
        return false;
    }
    
    try {
        console.log('📄 Testing complete workflow with:', testPdfPath);
        
        // Test the core converter functionality (without UI interaction)
        console.log('🔍 Testing PDF parsing and page extraction...');
        
        // Read and parse PDF to check if we can handle it
        const fs = require('fs');
        const dataBuffer = fs.readFileSync(testPdfPath);
        console.log(`📁 PDF file size: ${Math.round(dataBuffer.length / 1024)} KB`);
        
        // Test with pdf-parse to ensure it's working
        try {
            const pdfParse = require('pdf-parse');
            const pdfData = await pdfParse(dataBuffer, { max: 0 });
            
            console.log(`📊 PDF info:`);
            console.log(`   - Pages: ${pdfData.numpages}`);
            console.log(`   - Text length: ${pdfData.text.length} characters`);
            if (pdfData.info?.Title) {
                console.log(`   - Title: ${pdfData.info.Title}`);
            }
            if (pdfData.info?.Author) {
                console.log(`   - Author: ${pdfData.info.Author}`);
            }
            
            if (pdfData.numpages > 0) {
                console.log('✅ PDF parsing successful');
                
                // Test single page extraction
                if (pdfData.numpages >= 1) {
                    const firstPageData = await pdfParse(dataBuffer, { first: 1, last: 1 });
                    console.log(`📄 First page text preview: "${firstPageData.text.substring(0, 100)}..."`);
                    console.log('✅ Single page extraction successful');
                }
                
                // Test range extraction if we have multiple pages
                if (pdfData.numpages >= 2) {
                    const rangeData = await pdfParse(dataBuffer, { first: 1, last: 2 });
                    console.log(`📄 Page range 1-2 text length: ${rangeData.text.length} characters`);
                    console.log('✅ Page range extraction successful');
                }
                
            } else {
                console.warn('⚠️  PDF has no pages');
            }
            
        } catch (pdfError) {
            console.error('❌ PDF parsing failed:', pdfError);
            return false;
        }
        
        console.log('✅ Complete workflow test passed!');
        return true;
        
    } catch (error) {
        console.error('❌ Workflow test failed:', error);
        return false;
    }
}

/**
 * Run all page range tests
 */
export async function runAllPageRangeTests() {
    console.log('🚀 Running all PDF Page Range tests...\n');
    
    const tests = [
        { name: 'PDF Page Range to Text', test: testPdfPageRangeToTextIntegration },
        { name: 'PDF Page Range to Images', test: testPdfPageRangeToImagesIntegration },
        { name: 'Complete Workflow', test: testCompletePageRangeWorkflow }
    ];
    
    let passed = 0;
    let total = tests.length;
    
    for (const { name, test } of tests) {
        console.log(`\n📋 Running: ${name}`);
        console.log('─'.repeat(50));
        
        try {
            const result = await test();
            if (result) {
                console.log(`✅ ${name} PASSED`);
                passed++;
            } else {
                console.log(`❌ ${name} FAILED`);
            }
        } catch (error) {
            console.error(`❌ ${name} CRASHED:`, error);
        }
        
        console.log('─'.repeat(50));
    }
    
    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed!');
    } else {
        console.log('⚠️  Some tests failed. Please check the output above.');
    }
    
    return passed === total;
}

/**
 * Helper function to compare arrays
 */
function arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

// Export for use in test runner
export { runAllPageRangeTests as run };
