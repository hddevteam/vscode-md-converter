/**
 * Unit tests for PageRangeSelector
 */

import * as assert from 'assert';
import { suite, test } from 'mocha';
import { PageRangeSelector } from '../../../ui/pageRangeSelector';

suite('PageRangeSelector', () => {
    
    suite('validatePageRange', () => {
        const totalPages = 10;
        
        test('should validate single page numbers', () => {
            const result = PageRangeSelector.validatePageRange('5', totalPages);
            assert.strictEqual(result.isValid, true);
            assert.deepStrictEqual(result.pageNumbers, [5]);
        });
        
        test('should validate page ranges', () => {
            const result = PageRangeSelector.validatePageRange('3-8', totalPages);
            assert.strictEqual(result.isValid, true);
            assert.deepStrictEqual(result.pageNumbers, [3, 4, 5, 6, 7, 8]);
        });
        
        test('should validate multiple pages', () => {
            const result = PageRangeSelector.validatePageRange('1,3,5', totalPages);
            assert.strictEqual(result.isValid, true);
            assert.deepStrictEqual(result.pageNumbers, [1, 3, 5]);
        });
        
        test('should validate mixed ranges and single pages', () => {
            const result = PageRangeSelector.validatePageRange('1-3,5,7-9', totalPages);
            assert.strictEqual(result.isValid, true);
            assert.deepStrictEqual(result.pageNumbers, [1, 2, 3, 5, 7, 8, 9]);
        });
        
        test('should handle spaces in input', () => {
            const result = PageRangeSelector.validatePageRange(' 1 , 3 , 5 ', totalPages);
            assert.strictEqual(result.isValid, true);
            assert.deepStrictEqual(result.pageNumbers, [1, 3, 5]);
        });
        
        test('should remove duplicates and sort', () => {
            const result = PageRangeSelector.validatePageRange('5,3,1,3,5', totalPages);
            assert.strictEqual(result.isValid, true);
            assert.deepStrictEqual(result.pageNumbers, [1, 3, 5]);
        });
        
        test('should reject empty input', () => {
            const result = PageRangeSelector.validatePageRange('', totalPages);
            assert.strictEqual(result.isValid, false);
            assert.ok(result.error);
        });
        
        test('should reject non-numeric input', () => {
            const result = PageRangeSelector.validatePageRange('abc', totalPages);
            assert.strictEqual(result.isValid, false);
            assert.ok(result.error);
        });
        
        test('should reject page numbers out of bounds', () => {
            const result = PageRangeSelector.validatePageRange('15', totalPages);
            assert.strictEqual(result.isValid, false);
            assert.ok(result.error);
        });
        
        test('should reject zero or negative page numbers', () => {
            const result = PageRangeSelector.validatePageRange('0', totalPages);
            assert.strictEqual(result.isValid, false);
            assert.ok(result.error);
        });
        
        test('should reject invalid range order', () => {
            const result = PageRangeSelector.validatePageRange('8-3', totalPages);
            assert.strictEqual(result.isValid, false);
            assert.ok(result.error);
        });
        
        test('should reject incomplete ranges', () => {
            const result = PageRangeSelector.validatePageRange('1-', totalPages);
            assert.strictEqual(result.isValid, false);
            assert.ok(result.error);
            
            const result2 = PageRangeSelector.validatePageRange('-5', totalPages);
            assert.strictEqual(result2.isValid, false);
            assert.ok(result2.error);
        });
    });
    
    suite('formatPageNumbers', () => {
        test('should format empty array', () => {
            const result = PageRangeSelector.formatPageNumbers([]);
            assert.strictEqual(result, '');
        });
        
        test('should format single page', () => {
            const result = PageRangeSelector.formatPageNumbers([5]);
            assert.strictEqual(result, '5');
        });
        
        test('should format consecutive pages as range', () => {
            const result = PageRangeSelector.formatPageNumbers([1, 2, 3, 4, 5]);
            assert.strictEqual(result, '1-5');
        });
        
        test('should format non-consecutive pages separately', () => {
            const result = PageRangeSelector.formatPageNumbers([1, 3, 5]);
            assert.strictEqual(result, '1, 3, 5');
        });
        
        test('should format mixed consecutive and non-consecutive pages', () => {
            const result = PageRangeSelector.formatPageNumbers([1, 2, 3, 5, 7, 8, 9]);
            assert.strictEqual(result, '1-3, 5, 7-9');
        });
        
        test('should handle two consecutive pages as range', () => {
            const result = PageRangeSelector.formatPageNumbers([3, 4]);
            assert.strictEqual(result, '3-4');
        });
        
        test('should handle complex patterns', () => {
            const result = PageRangeSelector.formatPageNumbers([1, 2, 4, 5, 6, 8, 10, 11, 12]);
            assert.strictEqual(result, '1-2, 4-6, 8, 10-12');
        });
    });
});
