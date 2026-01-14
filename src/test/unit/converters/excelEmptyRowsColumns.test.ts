import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as xlsx from 'xlsx';
import { ExcelToMarkdownConverter } from '../../../converters/excelToMarkdown';
import { ExcelToCsvConverter } from '../../../converters/excelToCsv';

/**
 * TDD Test: Handling empty rows and columns in Excel conversion
 * 
 * Problem: When Excel contains large areas of empty rows or columns, 
 * redundant information appears in converted Markdown/CSV files.
 * 
 * Scenarios:
 * 1. Data followed by many empty rows
 * 2. Data followed by many empty columns
 * 3. Empty rows/columns interspersed within data
 * 4. Completely empty worksheet
 */
suite('Excel Empty Rows and Columns Tests', () => {
  let testDir: string;

  setup(async () => {
    testDir = path.join(__dirname, '../../temp/empty-rows-cols-test');
    await fs.mkdir(testDir, { recursive: true });
  });

  teardown(async () => {
    // Clean up test files
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  /**
   * Helper function: Create test Excel file
   */
  async function createTestExcel(
    fileName: string,
    sheetData: { name: string; data: any[][] }[]
  ): Promise<string> {
    const workbook = xlsx.utils.book_new();

    for (const sheet of sheetData) {
      const worksheet = xlsx.utils.aoa_to_sheet(sheet.data);
      xlsx.utils.book_append_sheet(workbook, worksheet, sheet.name);
    }

    const filePath = path.join(testDir, fileName);
    xlsx.writeFile(workbook, filePath);
    return filePath;
  }

  /**
   * Helper function: Count rows and columns in Markdown table
   */
  function countMarkdownTableDimensions(markdown: string): { rows: number; cols: number } {
    const lines = markdown.split('\n');
    const tableLines = lines.filter(line => line.trim().startsWith('|'));
    
    if (tableLines.length === 0) {
      return { rows: 0, cols: 0 };
    }

    // Subtract separator row
    const dataRows = tableLines.length > 1 ? tableLines.length - 1 : 0;
    
    // Calculate columns from first row
    const firstRow = tableLines[0];
    const cols = firstRow.split('|').filter(cell => cell.trim().length > 0).length;

    return { rows: dataRows, cols };
  }

  /**
   * Helper function: Count rows and columns in CSV content
   */
  function countCsvDimensions(csvContent: string): { rows: number; cols: number } {
    const lines = csvContent.trim().split('\n');
    
    // Skip potential metadata lines (starting with #)
    const dataLines = lines.filter(line => !line.trim().startsWith('#'));
    
    if (dataLines.length === 0) {
      return { rows: 0, cols: 0 };
    }

    const rows = dataLines.length;
    
    // Use first row to count columns
    const firstRow = dataLines[0];
    const cols = firstRow.split(',').length;

    return { rows, cols };
  }

  test('should filter out trailing empty rows (Markdown)', async () => {
    // Arrange: Create Excel with valid data and large amount of trailing empty rows
    const testData = [
      ['Name', 'Age', 'City'],
      ['Alice', 30, 'New York'],
      ['Bob', 25, 'Los Angeles'],
      // Add 50 empty rows
      ...Array(50).fill([]),
    ];

    const filePath = await createTestExcel('trailing-empty-rows.xlsx', [
      { name: 'Sheet1', data: testData }
    ]);

    // Act: Convert to Markdown
    const result = await ExcelToMarkdownConverter.convert(filePath);

    // Assert: Success and file existence
    assert.strictEqual(result.success, true, 'Conversion should succeed');
    assert.ok(result.outputPath, 'Output path should exist');

    // Read result
    const markdown = await fs.readFile(result.outputPath!, 'utf8');
    
    // Count dimensions
    const dimensions = countMarkdownTableDimensions(markdown);
    
    // Should only have 3 rows of data
    assert.strictEqual(dimensions.rows, 3, `Should only have 3 rows, but got ${dimensions.rows}`);
    assert.strictEqual(dimensions.cols, 3, 'Should have 3 columns');
  });

  test('should filter out trailing empty columns (Markdown)', async () => {
    // Arrange: Create Excel with valid data and many trailing empty columns
    const testData = [
      ['Name', 'Age', 'City', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''], 
      ['Alice', 30, 'New York', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Bob', 25, 'Los Angeles', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ];

    const filePath = await createTestExcel('trailing-empty-cols.xlsx', [
      { name: 'Sheet1', data: testData }
    ]);

    // Act: Convert to Markdown
    const result = await ExcelToMarkdownConverter.convert(filePath);

    // Assert
    assert.strictEqual(result.success, true, 'Conversion should succeed');
    assert.ok(result.outputPath, 'Output path should exist');

    const markdown = await fs.readFile(result.outputPath!, 'utf8');
    const dimensions = countMarkdownTableDimensions(markdown);
    
    // Should only have 3 columns
    assert.strictEqual(dimensions.rows, 3, 'Should have 3 rows');
    assert.strictEqual(dimensions.cols, 3, `Should only have 3 columns, but got ${dimensions.cols}`);
  });

  test('should filter out trailing empty rows (CSV)', async () => {
    // Arrange
    const testData = [
      ['Name', 'Age', 'City'],
      ['Alice', 30, 'New York'],
      ['Bob', 25, 'Los Angeles'],
      ...Array(50).fill([]),
    ];

    const filePath = await createTestExcel('trailing-empty-rows-csv.xlsx', [
      { name: 'Sheet1', data: testData }
    ]);

    // Act: Convert to CSV
    const result = await ExcelToCsvConverter.convert(filePath);

    // Assert
    assert.strictEqual(result.success, true, 'Conversion should succeed');
    assert.ok(result.outputPaths, 'Output paths should exist');
    assert.strictEqual(result.outputPaths!.length, 1, 'Should have 1 output file');

    const csvContent = await fs.readFile(result.outputPaths![0], 'utf8');
    const dimensions = countCsvDimensions(csvContent);
    
    // Should only have 3 rows
    assert.strictEqual(dimensions.rows, 3, `Should only have 3 rows, but got ${dimensions.rows}`);
  });

  test('should filter out trailing empty columns (CSV)', async () => {
    // Arrange
    const testData = [
      ['Name', 'Age', 'City', ...Array(17).fill('')],
      ['Alice', 30, 'New York', ...Array(17).fill('')],
      ['Bob', 25, 'Los Angeles', ...Array(17).fill('')],
    ];

    const filePath = await createTestExcel('trailing-empty-cols-csv.xlsx', [
      { name: 'Sheet1', data: testData }
    ]);

    // Act: Convert to CSV
    const result = await ExcelToCsvConverter.convert(filePath);

    // Assert
    assert.strictEqual(result.success, true);
    const csvContent = await fs.readFile(result.outputPaths![0], 'utf8');
    const dimensions = countCsvDimensions(csvContent);
    
    // Should only have 3 columns
    assert.strictEqual(dimensions.cols, 3, `Should only have 3 columns, but got ${dimensions.cols}`);
  });

  test('should handle empty rows and columns in the middle (Markdown)', async () => {
    // Arrange: Mixed complex data
    const testData = [
      ['Name', 'Age', '', 'City', '', '', '', ''], // Empty in middle and trailing
      ['Alice', 30, '', 'New York', '', '', '', ''],
      ['', '', '', '', '', '', '', ''], // Completely empty row
      ['Bob', 25, '', 'LA', '', '', '', ''],
      ...Array(20).fill([]), // Trailing empty rows
    ];

    const filePath = await createTestExcel('mixed-empty.xlsx', [
      { name: 'Sheet1', data: testData }
    ]);

    // Act
    const result = await ExcelToMarkdownConverter.convert(filePath);

    // Assert
    assert.strictEqual(result.success, true);
    const markdown = await fs.readFile(result.outputPath!, 'utf8');
    const dimensions = countMarkdownTableDimensions(markdown);
    
    // Should only have 3 rows of data (excluding redundant empty row and trailing empty rows)
    assert.strictEqual(dimensions.rows, 3, `Should only have 3 rows, but got ${dimensions.rows}`);
    
    // Column count should not exceed 4 (valid columns)
    assert.ok(dimensions.cols <= 4, `Columns should not exceed 4, but got ${dimensions.cols}`);
  });

  test('should gracefully handle completely empty worksheets (Markdown)', async () => {
    // Arrange: Create completely empty worksheet
    const testData = [
      ...Array(100).fill(Array(50).fill('')),
    ];

    const filePath = await createTestExcel('completely-empty.xlsx', [
      { name: 'EmptySheet', data: testData }
    ]);

    // Act
    const result = await ExcelToMarkdownConverter.convert(filePath);

    // Assert
    assert.strictEqual(result.success, true);
    const markdown = await fs.readFile(result.outputPath!, 'utf8');
    
    // Should contain "empty" notice
    assert.ok(
      markdown.includes('worksheet is empty') || 
      markdown.includes('工作表为空'),
      `Should display empty worksheet notice. Output:\n${markdown.substring(0, 500)}`
    );
    
    // Should not have a table
    const dimensions = countMarkdownTableDimensions(markdown);
    assert.strictEqual(dimensions.rows, 0, 'Completely empty worksheet should not generate a table');
  });

  test('should gracefully handle completely empty worksheets (CSV)', async () => {
    // Arrange
    const testData = [
      ...Array(100).fill(Array(50).fill('')),
    ];

    const filePath = await createTestExcel('completely-empty-csv.xlsx', [
      { name: 'EmptySheet', data: testData }
    ]);

    // Act
    const result = await ExcelToCsvConverter.convert(filePath);

    // Assert
    assert.strictEqual(result.success, true);
    
    // Should generate empty CSV or tiny content
    if (result.outputPaths && result.outputPaths.length > 0) {
      const csvContent = await fs.readFile(result.outputPaths[0], 'utf8');
      const dimensions = countCsvDimensions(csvContent);
      
      assert.ok(dimensions.rows === 0 || dimensions.rows <= 1, 
        `Completely empty worksheet should generate empty CSV, but got ${dimensions.rows} rows`);
    }
  });

  test('should correctly handle cells with only spaces or empty characters', async () => {
    // Arrange: Cells with various "empty" values
    const testData = [
      ['Name', 'Age', 'Notes'],
      ['Alice', 30, 'Normal'],
      ['Bob', '', '   '], // Empty string and spaces
      ['Charlie', 25, '\t\n'], // Tabs and newlines
      ...Array(30).fill([]), // Trailing empty rows
    ];

    const filePath = await createTestExcel('whitespace-cells.xlsx', [
      { name: 'Sheet1', data: testData }
    ]);

    // Act
    const result = await ExcelToMarkdownConverter.convert(filePath);

    // Assert
    assert.strictEqual(result.success, true);
    const markdown = await fs.readFile(result.outputPath!, 'utf8');
    const dimensions = countMarkdownTableDimensions(markdown);
    
    // Should have 4 rows (header + 3 data rows)
    assert.strictEqual(dimensions.rows, 4, `Should have 4 rows, but got ${dimensions.rows}`);
    assert.strictEqual(dimensions.cols, 3, 'Should have 3 columns');
  });
});
