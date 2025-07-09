import * as assert from 'assert';
import * as path from 'path';
import { TableExtractorBase } from '../../../converters/tableExtractorBase';
import { TableData, TableExtractionOptions } from '../../../types';

suite('TableExtractorBase Tests', () => {
  test('generateCsvContent should create valid CSV', () => {
    const tableData: TableData = {
      id: '01',
      title: 'Test Table',
      rows: [
        ['Name', 'Age', 'City'],
        ['John', '30', 'New York'],
        ['Jane', '25', 'London']
      ],
      rowCount: 3,
      columnCount: 3,
      sourceLocation: {
        page: 1
      }
    };

    const options: TableExtractionOptions = {
      outputMode: 'separate',
      encoding: 'utf8',
      delimiter: ',',
      includeHeaders: true,
      includeMetadata: true,
      mergedCellStrategy: 'repeat',
      minRows: 2,
      minColumns: 2
    };

    const csvContent = (TableExtractorBase as any).generateCsvContent(tableData, options, true);
    
    // 验证CSV内容包含标题
    assert.ok(csvContent.includes('Test Table'));
    // 验证CSV内容包含数据
    assert.ok(csvContent.includes('Name,Age,City'));
    assert.ok(csvContent.includes('John,30,New York'));
  });

  test('cleanTableData should remove empty rows', () => {
    const rows = [
      ['', '', ''],
      ['Name', 'Age', 'City'],
      ['John', '30', 'New York'],
      ['', '', '']
    ];

    const cleaned = (TableExtractorBase as any).cleanTableData(rows);
    
    // 应该移除空行
    assert.strictEqual(cleaned.length, 2);
    assert.deepStrictEqual(cleaned[0], ['Name', 'Age', 'City']);
    assert.deepStrictEqual(cleaned[1], ['John', '30', 'New York']);
  });

  test('validateTable should reject invalid tables', () => {
    const options: TableExtractionOptions = {
      outputMode: 'separate',
      encoding: 'utf8',
      delimiter: ',',
      includeHeaders: true,
      includeMetadata: true,
      mergedCellStrategy: 'repeat',
      minRows: 2,
      minColumns: 2
    };

    // 测试行数不足
    const invalidRows1 = [['Name', 'Age']];
    assert.strictEqual((TableExtractorBase as any).validateTable(invalidRows1, options), false);

    // 测试列数不足
    const invalidRows2 = [['Name'], ['John']];
    assert.strictEqual((TableExtractorBase as any).validateTable(invalidRows2, options), false);

    // 测试有效表格
    const validRows = [['Name', 'Age'], ['John', '30']];
    assert.strictEqual((TableExtractorBase as any).validateTable(validRows, options), true);
  });

  test('processMergedCells should handle repeat strategy', () => {
    const tableData: TableData = {
      id: '01',
      rows: [
        ['Department', 'Q1', 'Q2'],
        ['Sales', '100', '120'],
        ['', '150', '130']
      ],
      rowCount: 3,
      columnCount: 3,
      mergedCells: [
        {
          startRow: 1,
          endRow: 2,
          startCol: 0,
          endCol: 0,
          value: 'Sales'
        }
      ]
    };

    const options: TableExtractionOptions = {
      outputMode: 'separate',
      encoding: 'utf8',
      delimiter: ',',
      includeHeaders: true,
      includeMetadata: true,
      mergedCellStrategy: 'repeat',
      minRows: 2,
      minColumns: 2
    };

    const processed = (TableExtractorBase as any).processMergedCells(tableData, options);
    
    // 验证合并单元格的值被重复
    assert.strictEqual(processed[1][0], 'Sales');
    assert.strictEqual(processed[2][0], 'Sales');
  });
});
