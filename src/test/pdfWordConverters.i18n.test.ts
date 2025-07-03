import * as assert from 'assert';
import { I18n } from '../i18n';

/**
 * Test suite for PDF and Word converter internationalization
 */
suite('PDF and Word Converter I18n Tests', () => {
  
  suite('PDF Converter I18n', () => {
    test('Should load PDF specific English messages', () => {
      I18n.initialize();
      
      const fileInfoMessage = I18n.getMessage('pdf.fileInfo');
      assert.strictEqual(fileInfoMessage, '## File Information');
      
      const textContentMessage = I18n.getMessage('pdf.textContent');
      assert.strictEqual(textContentMessage, '## Text Content');
    });

    test('Should support PDF message interpolation', () => {
      I18n.initialize();
      
      const cannotReadMessage = I18n.getMessage('pdf.cannotReadFile', 'Permission denied');
      assert.strictEqual(cannotReadMessage, 'Cannot read PDF file: Permission denied');
      
      const cannotParseMessage = I18n.getMessage('pdf.cannotParseFile', 'Invalid format');
      assert.strictEqual(cannotParseMessage, 'Cannot parse PDF file: Invalid format');
    });
  });

  suite('Word Converter I18n', () => {
    test('Should load Word specific English messages', () => {
      I18n.initialize();
      
      const fileInfoMessage = I18n.getMessage('word.fileInfo');
      assert.strictEqual(fileInfoMessage, '📊 File Information');
      
      const importantNoticeMessage = I18n.getMessage('word.importantNotice');
      assert.strictEqual(importantNoticeMessage, '⚠️ Important Notice');
      
      const contentMessage = I18n.getMessage('word.content');
      assert.strictEqual(contentMessage, '## Content');
    });

    test('Should support Word message interpolation', () => {
      I18n.initialize();
      
      const convertedFromMessage = I18n.getMessage('word.convertedFrom', 'test.docx');
      assert.strictEqual(convertedFromMessage, '*Converted from: test.docx*');
      
      const processingErrorMessage = I18n.getMessage('word.processingDocxError', 'File corrupted');
      assert.strictEqual(processingErrorMessage, 'Error occurred while processing .docx file: File corrupted');
    });

    test('Should handle complex Word conversion messages', () => {
      I18n.initialize();
      
      const docFormatNotice = I18n.getMessage('word.docFormatNotice');
      assert.ok(docFormatNotice.includes('.doc'));
      assert.ok(docFormatNotice.includes('.docx'));
      
      const extractionFailed = I18n.getMessage('word.extractionFailed', 'Timeout error');
      assert.strictEqual(extractionFailed, '*Quick extraction failed: Timeout error*');
    });
  });

  test('Should handle error message fallbacks', () => {
    I18n.initialize();
    
    // Test with missing keys
    const missingPdfMessage = I18n.getMessage('pdf.nonExistentKey');
    assert.strictEqual(missingPdfMessage, 'pdf.nonExistentKey');
    
    const missingWordMessage = I18n.getMessage('word.nonExistentKey');
    assert.strictEqual(missingWordMessage, 'word.nonExistentKey');
  });
});
