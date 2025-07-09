import * as assert from 'assert';
import { debugPdfContent } from './debugPdf';

suite('PDF Debug Tests', () => {
    test('Debug PDF content extraction', async function() {
        this.timeout(10000);
        
        try {
            await debugPdfContent();
            assert.ok(true, 'Debug completed successfully');
        } catch (error) {
            console.error('Debug failed:', error);
            throw error;
        }
    });
});
