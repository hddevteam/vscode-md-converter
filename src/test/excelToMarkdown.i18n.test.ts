import * as assert from 'assert';
import { I18n } from '../i18n';

/**
 * Test suite for Excel to Markdown converter internationalization
 */
suite('ExcelToMarkdown I18n Tests', () => {
  test('Should load English messages by default', () => {
    // Reset I18n
    I18n.initialize();
    
    // Test basic message retrieval
    const fileInfoMessage = I18n.getMessage('excel.fileInfo');
    assert.strictEqual(fileInfoMessage, '📊 File Information');
    
    const emptyWorksheetMessage = I18n.getMessage('excel.emptyWorksheet');
    assert.strictEqual(emptyWorksheetMessage, '*This worksheet is empty*');
  });

  test('Should support message interpolation', () => {
    I18n.initialize();
    
    // Test message with placeholders
    const dimensionsMessage = I18n.getMessage('excel.dataDimensionsValue', 10, 5);
    assert.strictEqual(dimensionsMessage, '10 rows x 5 columns');
    
    const rowsLimitMessage = I18n.getMessage('excel.rowsLimitNotice', 100);
    assert.strictEqual(rowsLimitMessage, '*Note: Data rows exceed 100 rows, showing only the first 100 rows*');
  });

  test('Should return path as fallback for missing keys', () => {
    I18n.initialize();
    
    const missingMessage = I18n.getMessage('excel.nonExistentKey');
    assert.strictEqual(missingMessage, 'excel.nonExistentKey');
  });

  test('Should handle shorthand t() method', () => {
    I18n.initialize();
    
    const message1 = I18n.t('excel.fileInfo');
    const message2 = I18n.getMessage('excel.fileInfo');
    assert.strictEqual(message1, message2);
  });
});
