import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { PdfTableToCsvConverter } from '../converters/pdfTableToCsv';

suite('PDF Table to CSV Integration Tests', () => {
    // 使用绝对路径指向源码目录中的测试文件
    const testPdfPath = path.join(__dirname, '..', '..', 'src', 'test', 'docs', 'PDF表格.pdf');
    const tempOutputDir = path.join(__dirname, '..', '..', 'temp_test_output');

    // 确保测试输出目录存在
    suiteSetup(async () => {
        if (!fs.existsSync(tempOutputDir)) {
            fs.mkdirSync(tempOutputDir, { recursive: true });
        }
    });

    // 清理测试输出
    suiteTeardown(async () => {
        if (fs.existsSync(tempOutputDir)) {
            const files = fs.readdirSync(tempOutputDir);
            for (const file of files) {
                fs.unlinkSync(path.join(tempOutputDir, file));
            }
            fs.rmdirSync(tempOutputDir);
        }
    });

    test('Should exist test PDF file', () => {
        assert.ok(fs.existsSync(testPdfPath), `Test PDF file should exist at: ${testPdfPath}`);
        
        const stats = fs.statSync(testPdfPath);
        assert.ok(stats.isFile(), 'Should be a file');
        assert.ok(stats.size > 0, 'File should not be empty');
        
        console.log(`✅ Test PDF found: ${path.basename(testPdfPath)} (${stats.size} bytes)`);
    });

    test('Should successfully process real PDF with tables', async function() {
        // 增加超时时间，因为PDF处理可能较慢
        this.timeout(30000);

        const result = await PdfTableToCsvConverter.convert(testPdfPath, {
            outputDirectory: tempOutputDir,
            tableOutputMode: 'separate'
        });

        // 基本验证
        assert.ok(result, 'Should return a result');
        assert.strictEqual(result.inputPath, testPdfPath, 'Input path should match');

        if (result.success) {
            console.log(`✅ Conversion successful! Found ${result.tableCount} tables`);
            
            // 验证表格数量
            assert.ok(result.tables, 'Should have tables array');
            assert.ok(result.tableCount !== undefined, 'Should have table count');
            assert.ok(result.csvPaths && result.csvPaths.length > 0, 'Should have CSV output paths');
            
            // 验证我们期望的两个外汇牌价表格
            assert.strictEqual(result.tableCount, 2, 'Should extract exactly 2 tables from the forex PDF');
            
            // 验证表格结构 - 每个表格应该有11行7列（表头+10行数据）
            result.tables!.forEach((table, index) => {
                assert.strictEqual(table.rowCount, 11, `Table ${index + 1} should have 11 rows (header + 10 data rows)`);
                assert.strictEqual(table.columnCount, 7, `Table ${index + 1} should have 7 columns`);
                assert.ok(table.sourceLocation?.page, `Table ${index + 1} should have page location`);
                
                // 验证表头
                const header = table.rows[0];
                assert.ok(header.includes('交易币'), 'Should have currency column header');
                assert.ok(header.includes('现汇卖出价'), 'Should have selling price column header');
                assert.ok(header.includes('现汇买入价'), 'Should have buying price column header');
            });

            // 验证CSV文件是否生成
            assert.strictEqual(result.csvPaths!.length, 2, 'Should generate 2 CSV files in separate mode');
            
            for (const csvPath of result.csvPaths!) {
                assert.ok(fs.existsSync(csvPath), `CSV file should exist: ${csvPath}`);
                
                const csvContent = fs.readFileSync(csvPath, 'utf8');
                assert.ok(csvContent.length > 0, 'CSV file should not be empty');
                
                const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
                assert.strictEqual(lines.length, 11, 'Each CSV should have 11 lines (header + 10 data rows)');
            }

            console.log('✅ PDF table extraction validation passed');

        } else {
            console.log(`❌ Conversion failed: ${result.error}`);
            assert.fail(`PDF conversion should succeed for test file, but failed with: ${result.error}`);
        }
    });

    test('Should handle PDF with table output mode: combined', async function() {
        this.timeout(30000);

        const result = await PdfTableToCsvConverter.convert(testPdfPath, {
            outputDirectory: tempOutputDir,
            tableOutputMode: 'combined'
        });

        if (result.success && result.csvPaths && result.csvPaths.length > 0) {
            // 在合并模式下，应该只有一个CSV文件
            assert.strictEqual(result.csvPaths.length, 1, 'Combined mode should produce one CSV file');
            
            const csvPath = result.csvPaths[0];
            assert.ok(fs.existsSync(csvPath), 'Combined CSV file should exist');
            
            const csvContent = fs.readFileSync(csvPath, 'utf8');
            const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
            
            // 合并模式应该包含两个表格的所有数据
            // 第一个表格11行 + 第二个表格10行（不重复表头）= 21行
            assert.ok(lines.length >= 20, 'Combined CSV should contain data from both tables');
            
            console.log(`✅ Combined mode validation passed: ${lines.length} lines`);
        } else {
            assert.fail('Combined mode conversion should succeed');
        }
    });

    test('Should extract meaningful table data structure', async function() {
        this.timeout(30000);

        const result = await PdfTableToCsvConverter.convert(testPdfPath, {
            outputDirectory: tempOutputDir
        });

        if (result.success && result.tables && result.tables.length > 0) {
            const firstTable = result.tables[0];
            
            // 验证表格结构
            assert.ok(firstTable.id, 'Table should have ID');
            assert.ok(firstTable.rows && firstTable.rows.length > 0, 'Table should have rows');
            assert.ok(firstTable.rowCount > 0, 'Table should have positive row count');
            assert.ok(firstTable.columnCount > 0, 'Table should have positive column count');
            
            // 验证数据一致性
            assert.strictEqual(firstTable.rows.length, firstTable.rowCount, 'Row count should match actual rows');
            
            if (firstTable.rows.length > 0) {
                assert.strictEqual(firstTable.rows[0].length, firstTable.columnCount, 'Column count should match actual columns');
            }

            // 验证源位置信息
            assert.ok(firstTable.sourceLocation, 'Table should have source location');
            assert.ok(firstTable.sourceLocation.page, 'Should have page number');

            console.log('✅ Table structure validation passed');
            console.log(`📊 First table: ${firstTable.rowCount}×${firstTable.columnCount} from page ${firstTable.sourceLocation.page}`);
        }
    });
});
