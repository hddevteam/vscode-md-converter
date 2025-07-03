import * as fs from 'fs/promises';
import * as path from 'path';
import * as mammoth from 'mammoth';
import { I18n } from '../i18n';
import { ConversionResult, ConversionOptions } from '../types';
import { FileUtils } from '../utils/fileUtils';

export class WordToMarkdownConverter {
  /**
   * Clean up markdown text by removing unwanted HTML tags and fixing formatting issues
   */
  static cleanupMarkdown(markdown: string): string {
    let cleaned = markdown;
    
    // 移除 OLE 链接标签（如 <a id="OLE_LINK5"></a>）
    cleaned = cleaned.replace(/<a\s+id="OLE_LINK\d+"><\/a>/gi, '');
    
    // 移除其他空的锚点标签
    cleaned = cleaned.replace(/<a\s+[^>]*><\/a>/gi, '');
    
    // 移除不必要的HTML标签（但保留markdown链接）
    cleaned = cleaned.replace(/<\/?span[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/?div[^>]*>/gi, '');
    
    // 修复数字后不必要的反斜杠转义
    // 将 "1\" 或 "123\" 这样的模式改为 "1" 或 "123"
    cleaned = cleaned.replace(/(\d+)\\\s/g, '$1 ');
    cleaned = cleaned.replace(/(\d+)\\$/gm, '$1');
    
    // 修复其他常见的转义问题
    cleaned = cleaned.replace(/\\\./g, '.');
    cleaned = cleaned.replace(/\\,/g, ',');
    cleaned = cleaned.replace(/\\;/g, ';');
    cleaned = cleaned.replace(/\\:/g, ':');
    cleaned = cleaned.replace(/\\\+/g, '+');
    cleaned = cleaned.replace(/\\-/g, '-');
    cleaned = cleaned.replace(/\\\*/g, '*');
    cleaned = cleaned.replace(/\\=/g, '=');
    cleaned = cleaned.replace(/\\&/g, '&');
    cleaned = cleaned.replace(/\\#/g, '#');
    cleaned = cleaned.replace(/\\!/g, '!');
    
    // 清理多余的空行（保留段落间的适当间距）
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // 清理行尾多余的空格
    cleaned = cleaned.replace(/[ \t]+$/gm, '');
    
    return cleaned.trim();
  }

  /**
   * 将Word文档转换为Markdown
   */
  static async convert(inputPath: string, options?: ConversionOptions): Promise<ConversionResult> {
    const startTime = Date.now();
    
    try {
      // 验证文件
      const validation = await FileUtils.validateFile(inputPath);
      if (!validation.isValid) {
        return {
          success: false,
          inputPath,
          error: validation.error || '无效的文件格式'
        };
      }

      if (validation.fileType !== 'docx' && validation.fileType !== 'doc') {
        return {
          success: false,
          inputPath,
          error: `不支持的文件类型: ${validation.fileType || path.extname(inputPath)}`
        };
      }

      // 获取文件信息
      const fileStats = await fs.stat(inputPath);
      const fileName = path.basename(inputPath);
      const fileNameWithoutExt = path.basename(inputPath, path.extname(inputPath));
      const fileExtension = path.extname(inputPath).toLowerCase();
      
      let markdown = '';
      
      // 添加文档标题和元信息
      markdown += `# ${fileNameWithoutExt}\n\n`;
      markdown += `*转换自: ${fileName}*\n\n`;
      markdown += `---\n\n`;
      
      markdown += `## 📊 文件信息\n\n`;
      markdown += `- **文件名**: ${fileName}\n`;
      markdown += `- **文件大小**: ${FileUtils.formatFileSize(fileStats.size)}\n`;
      markdown += `- **修改日期**: ${fileStats.mtime.toLocaleString()}\n\n`;
      
      // 检查文件格式并相应处理
      if (fileExtension === '.doc') {
        // 处理 .doc 文件 - 提供明确的指导而不尝试可能挂起的转换
        markdown += `## ⚠️ 重要提示\n\n`;
        markdown += `此文件是旧版Word格式（.doc），当前转换器主要支持新版Word格式（.docx）。\n\n`;
        markdown += `**为获得最佳转换效果，请按以下步骤操作：**\n\n`;
        markdown += `1. **推荐方法**：转换为.docx格式\n`;
        markdown += `   - 在Microsoft Word中打开此文件\n`;
        markdown += `   - 选择"文件" > "另存为"\n`;
        markdown += `   - 选择格式为"Word文档 (*.docx)"\n`;
        markdown += `   - 保存后使用本扩展重新转换\n\n`;
        markdown += `2. **替代方法**：\n`;
        markdown += `   - 使用LibreOffice Writer打开并另存为.docx\n`;
        markdown += `   - 使用在线文档转换工具\n`;
        markdown += `   - 直接复制文档内容到新的Markdown文件\n\n`;
        
        // 简单尝试mammoth，但设置短超时
        try {
          markdown += `## 尝试提取的内容\n\n`;
          markdown += `*正在尝试从.doc文件中提取基本文本...*\n\n`;
          
          const buffer = await fs.readFile(inputPath);
          
          // 使用Promise.race来设置超时
          const extractionPromise = mammoth.extractRawText(buffer);
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('提取超时')), 5000); // 5秒超时
          });
          
          const result = await Promise.race([extractionPromise, timeoutPromise]);
          
          if (result.value && result.value.trim()) {
            // 基本的文本格式化
            let formattedText = result.value
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .join('\n\n');
            
            // 应用清理函数以移除不必要的转义字符等
            formattedText = WordToMarkdownConverter.cleanupMarkdown(formattedText);
            
            markdown += `**提取的文本：**\n\n`;
            markdown += formattedText;
            markdown += `\n\n*注意：以上内容可能不完整或格式化不准确。建议按照上述方法转换为.docx格式以获得更好的结果。*\n`;
          } else {
            markdown += `*无法从此.doc文件中提取文本内容。*\n\n`;
            markdown += `这可能是因为：\n`;
            markdown += `- 文件格式特殊或使用了旧版本的.doc格式\n`;
            markdown += `- 文件包含主要是图片或其他非文本元素\n`;
            markdown += `- 文件可能已损坏\n\n`;
            markdown += `**强烈建议使用上述推荐方法转换为.docx格式。**\n`;
          }
          
          // 显示转换消息
          if (result.messages && result.messages.length > 0) {
            markdown += `\n**转换信息：**\n\n`;
            for (const message of result.messages) {
              markdown += `- ${message.type}: ${message.message}\n`;
            }
          }
          
        } catch (docError) {
          markdown += `*快速提取失败：${docError instanceof Error ? docError.message : '未知错误'}*\n\n`;
          markdown += `**这是正常情况**，因为.doc格式较为复杂。请使用上述推荐方法转换为.docx格式。\n`;
        }
        
      } else {
        // 处理 .docx 文件
        try {
          const buffer = await fs.readFile(inputPath);
          
          // 使用mammoth的转换选项来更好地控制输出
          const options = {
            styleMap: "p[style-name='Heading 1'] => h1:fresh\np[style-name='Heading 2'] => h2:fresh\np[style-name='Heading 3'] => h3:fresh\np[style-name='Heading 4'] => h4:fresh\np[style-name='Heading 5'] => h5:fresh\np[style-name='Heading 6'] => h6:fresh\nr[style-name='Strong'] => strong\nr[style-name='Emphasis'] => em",
            ignoreEmptyParagraphs: true,
            convertImage: (image: any) => {
              // 转换图片为base64格式
              return {
                src: `data:${image.contentType};base64,${image.buffer.toString('base64')}`,
                altText: image.altText || 'Image'
              };
            }
          };
          
          const result = await mammoth.convertToMarkdown(buffer, options);
          
          // 添加转换警告信息（如果有）
          if (result.messages.length > 0) {
            markdown += `## ⚠️ 转换提示\n\n`;
            for (const message of result.messages) {
              if (message.type === 'warning') {
                markdown += `- ${message.message}\n`;
              }
            }
            markdown += `\n`;
          }
          
          // 添加文档内容
          markdown += `## 内容\n\n`;
          if (result.value && result.value.trim()) {
            let cleanedMarkdown = result.value;
            
            // 清理不需要的HTML标签和格式
            cleanedMarkdown = WordToMarkdownConverter.cleanupMarkdown(cleanedMarkdown);
            
            markdown += cleanedMarkdown;
          } else {
            markdown += `*此文档似乎没有可提取的文本内容。*\n\n`;
            markdown += `可能的原因：\n`;
            markdown += `- 文档主要包含图片或其他非文本元素\n`;
            markdown += `- 文档格式特殊或已损坏\n`;
            markdown += `- 文档被密码保护\n`;
          }
          
        } catch (docxError) {
          markdown += `## 转换错误\n\n`;
          markdown += `处理.docx文件时出错：${docxError instanceof Error ? docxError.message : '未知错误'}\n\n`;
          markdown += `**可能的解决方案：**\n`;
          markdown += `1. 确认文件未损坏且未被密码保护\n`;
          markdown += `2. 尝试在Microsoft Word中重新保存文件\n`;
          markdown += `3. 检查文件是否为有效的Word文档\n`;
        }
      }

      // 生成输出路径
      const config = FileUtils.getConfig();
      const outputDir = options?.outputDirectory || config.outputDirectory || path.dirname(inputPath);
      const outputPath = FileUtils.generateOutputPath(inputPath, '.md', outputDir);

      // 保存Markdown文件
      await FileUtils.writeFile(outputPath, markdown);

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        inputPath,
        outputPath,
        duration
      };
    } catch (error) {
      return {
        success: false,
        inputPath,
        error: `转换失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
}
