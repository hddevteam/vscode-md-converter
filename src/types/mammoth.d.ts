declare module 'mammoth' {
  export interface MammothOptions {
    styleMap?: string;
    includeDefaultStyleMap?: boolean;
    includeEmbeddedStyleMap?: boolean;
    ignoreEmptyParagraphs?: boolean;
    convertImage?: (image: {
      contentType: string;
      buffer: Buffer;
      altText?: string;
    }) => Promise<{src: string; altText?: string}> | {src: string; altText?: string};
    idPrefix?: string;
    transformDocument?: (document: any) => any;
  }

  export interface MammothResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
      error?: Error;
    }>;
  }

  export function convertToHtml(input: any, options?: MammothOptions): Promise<MammothResult>;
  export function convertToMarkdown(input: any, options?: MammothOptions): Promise<MammothResult>;
  export function extractRawText(input: any): Promise<MammothResult>;
}
