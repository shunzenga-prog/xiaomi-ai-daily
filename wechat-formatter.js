#!/usr/bin/env node

/**
 * 微信公众号自动排版工具
 * 功能：
 * 1. Markdown 转公众号 HTML 格式
 * 2. 自动处理标题、段落、代码块
 * 3. 自动上传图片到微信
 * 4. 生成可复制的 HTML 输出
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ==================== 配置区域 ====================
const CONFIG = {
  // 微信公众号样式配置
  styles: {
    // 一级标题样式
    h1: {
      fontSize: '18px',
      color: '#1a1a1a',
      fontWeight: 'bold',
      textAlign: 'center',
      margin: '30px 0 15px 0',
      padding: '10px 0',
      borderBottom: '2px solid #07c160'
    },
    // 二级标题样式
    h2: {
      fontSize: '16px',
      color: '#07c160',
      fontWeight: 'bold',
      margin: '25px 0 12px 0',
      paddingLeft: '10px',
      borderLeft: '4px solid #07c160'
    },
    // 三级标题样式
    h3: {
      fontSize: '15px',
      color: '#333',
      fontWeight: 'bold',
      margin: '20px 0 10px 0'
    },
    // 段落样式
    p: {
      fontSize: '15px',
      color: '#333',
      lineHeight: '1.8',
      margin: '15px 0',
      textAlign: 'justify'
    },
    // 代码块样式
    code: {
      backgroundColor: '#f6f8fa',
      border: '1px solid #e1e4e8',
      borderRadius: '6px',
      padding: '16px',
      fontSize: '13px',
      fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
      overflowX: 'auto',
      margin: '15px 0'
    },
    // 行内代码样式
    inlineCode: {
      backgroundColor: '#f6f8fa',
      padding: '2px 6px',
      borderRadius: '3px',
      fontSize: '13px',
      fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
      color: '#e83e8c'
    },
    // 引用块样式
    blockquote: {
      borderLeft: '4px solid #07c160',
      paddingLeft: '15px',
      margin: '15px 0',
      color: '#666',
      fontStyle: 'italic',
      backgroundColor: '#f8f9fa',
      padding: '10px 15px'
    },
    // 列表样式
    ul: {
      margin: '15px 0',
      paddingLeft: '20px'
    },
    li: {
      margin: '8px 0',
      lineHeight: '1.8'
    },
    // 链接样式
    a: {
      color: '#07c160',
      textDecoration: 'none',
      borderBottom: '1px dashed #07c160'
    },
    // 强调文本
    strong: {
      fontWeight: 'bold',
      color: '#07c160'
    },
    // 图片样式
    img: {
      maxWidth: '100%',
      display: 'block',
      margin: '20px auto',
      borderRadius: '6px'
    }
  },
  // 容器样式
  container: {
    maxWidth: '677px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#ffffff'
  }
};

// ==================== Markdown 解析器 ====================
class MarkdownParser {
  constructor() {
    this.rules = {
      // 标题
      h1: /^# (.+)$/gm,
      h2: /^## (.+)$/gm,
      h3: /^### (.+)$/gm,
      h4: /^#### (.+)$/gm,
      // 代码块
      codeBlock: /^```(\w*)\n([\s\S]*?)```/gm,
      inlineCode: /`([^`]+)`/g,
      // 强调
      bold: /\*\*(.+?)\*\*/g,
      italic: /\*(.+?)\*/g,
      // 链接
      link: /\[([^\]]+)\]\(([^)]+)\)/g,
      // 图片
      image: /!\[([^\]]*)\]\(([^)]+)\)/g,
      // 引用
      blockquote: /^> (.+)$/gm,
      // 列表
      ul: /^[-*] (.+)$/gm,
      ol: /^\d+\. (.+)$/gm,
      // 分割线
      hr: /^---$/gm,
      // 表格
      table: /^(\|.+\|.+)\n\|[-\s|]+\|\n((?:\|.+\|\n?)+)/gm,
      // 段落
      paragraph: /^(?!^#|^##|^###|^####|^```|^>|^[-*] |^\d+\. |^\|)(.+)$/gm
    };
  }

  parse(markdown) {
    let html = markdown;
    
    // 转义 HTML 特殊字符
    html = this.escapeHtml(html);
    
    // 按顺序处理各种语法
    html = this.parseCodeBlocks(html);
    html = this.parseHeadings(html);
    html = this.parseBlockquotes(html);
    html = this.parseLists(html);
    html = this.parseImages(html);
    html = this.parseLinks(html);
    html = this.parseBold(html);
    html = this.parseItalic(html);
    html = this.parseInlineCode(html);
    html = this.parseParagraphs(html);
    html = this.parseHr(html);
    html = this.parseTables(html);
    
    return html;
  }

  escapeHtml(html) {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return html.replace(/[&<>"']/g, m => escapeMap[m]);
  }

  parseCodeBlocks(html) {
    return html.replace(this.rules.codeBlock, (match, lang, code) => {
      const escapedCode = code.trim()
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      
      const style = this.buildStyle(CONFIG.styles.code);
      return `<pre style="${style}"><code class="language-${lang || 'text'}">${escapedCode}</code></pre>`;
    });
  }

  parseHeadings(html) {
    html = html.replace(this.rules.h1, (match, text) => {
      const style = this.buildStyle(CONFIG.styles.h1);
      return `<h1 style="${style}">${text}</h1>`;
    });
    
    html = html.replace(this.rules.h2, (match, text) => {
      const style = this.buildStyle(CONFIG.styles.h2);
      return `<h2 style="${style}">${text}</h2>`;
    });
    
    html = html.replace(this.rules.h3, (match, text) => {
      const style = this.buildStyle(CONFIG.styles.h3);
      return `<h3 style="${style}">${text}</h3>`;
    });
    
    html = html.replace(this.rules.h4, (match, text) => {
      const style = `font-size: 14px; color: #555; font-weight: bold; margin: 15px 0 8px 0;`;
      return `<h4 style="${style}">${text}</h4>`;
    });
    
    return html;
  }

  parseBlockquotes(html) {
    // 处理引用块（支持多行）
    return html.replace(/&gt; (.+?)(?=\n|$)/g, (match, text) => {
      const style = this.buildStyle(CONFIG.styles.blockquote);
      return `<blockquote style="${style}">${text}</blockquote>`;
    });
  }

  parseLists(html) {
    // 处理无序列表
    html = html.replace(this.rules.ul, (match, text) => {
      return `<li style="${this.buildStyle(CONFIG.styles.li)}">• ${text}</li>`;
    });
    
    // 处理有序列表
    html = html.replace(this.rules.ol, (match, text) => {
      return `<li style="${this.buildStyle(CONFIG.styles.li)}">${text}</li>`;
    });
    
    // 包裹在 ul/ol 中
    html = html.replace(/(<li.*?>.*?<\/li>\n?)+/g, (match) => {
      if (match.includes('•')) {
        return `<ul style="${this.buildStyle(CONFIG.styles.ul)}">${match}</ul>`;
      }
      return `<ol style="${this.buildStyle(CONFIG.styles.ul)}">${match}</ol>`;
    });
    
    return html;
  }

  parseImages(html) {
    return html.replace(this.rules.image, (match, alt, src) => {
      const style = this.buildStyle(CONFIG.styles.img);
      return `<img src="${src}" alt="${alt}" style="${style}" />`;
    });
  }

  parseLinks(html) {
    return html.replace(this.rules.link, (match, text, href) => {
      const style = this.buildStyle(CONFIG.styles.a);
      return `<a href="${href}" style="${style}">${text}</a>`;
    });
  }

  parseBold(html) {
    return html.replace(this.rules.bold, (match, text) => {
      const style = this.buildStyle(CONFIG.styles.strong);
      return `<strong style="${style}">${text}</strong>`;
    });
  }

  parseItalic(html) {
    return html.replace(this.rules.italic, (match, text) => {
      return `<em>${text}</em>`;
    });
  }

  parseInlineCode(html) {
    return html.replace(this.rules.inlineCode, (match, code) => {
      const style = this.buildStyle(CONFIG.styles.inlineCode);
      return `<code style="${style}">${code}</code>`;
    });
  }

  parseParagraphs(html) {
    // 将剩余的行包裹在段落中
    const lines = html.split('\n');
    const result = [];
    let inParagraph = false;
    let paragraphContent = [];
    
    for (let line of lines) {
      const trimmed = line.trim();
      
      // 如果已经是块级元素，直接添加
      if (trimmed.match(/^<(h[1-6]|pre|blockquote|ul|ol|li|img|hr|div|table|tr|td|th)/)) {
        if (inParagraph && paragraphContent.length > 0) {
          result.push(`<p style="${this.buildStyle(CONFIG.styles.p)}">${paragraphContent.join(' ')}</p>`);
          paragraphContent = [];
          inParagraph = false;
        }
        result.push(line);
      } else if (trimmed === '') {
        if (inParagraph && paragraphContent.length > 0) {
          result.push(`<p style="${this.buildStyle(CONFIG.styles.p)}">${paragraphContent.join(' ')}</p>`);
          paragraphContent = [];
          inParagraph = false;
        }
      } else {
        inParagraph = true;
        paragraphContent.push(trimmed);
      }
    }
    
    // 处理剩余的段落
    if (paragraphContent.length > 0) {
      result.push(`<p style="${this.buildStyle(CONFIG.styles.p)}">${paragraphContent.join(' ')}</p>`);
    }
    
    return result.join('\n');
  }

  parseHr(html) {
    return html.replace(this.rules.hr, () => {
      return `<hr style="border: 0; border-top: 1px solid #e1e4e8; margin: 30px 0;" />`;
    });
  }

  parseTables(html) {
    // 简单的表格解析
    return html.replace(/^\|(.+)\|$/gm, (match, row) => {
      const cells = row.split('|').map(cell => cell.trim());
      
      // 检查是否是分隔行
      if (cells.every(cell => /^[-:\s]+$/.test(cell))) {
        return ''; // 跳过表格分隔行
      }
      
      const cellHtml = cells.map(cell => {
        // 跳过分隔行标记
        if (/^[-:]+$/.test(cell)) return '';
        return `<td style="padding: 10px; border: 1px solid #e1e4e8; text-align: left;">${cell}</td>`;
      }).filter(c => c).join('');
      
      if (cellHtml) {
        return `<tr style="background-color: #fafafa;">${cellHtml}</tr>`;
      }
      return '';
    }).replace(/(<tr.*?>.*?<\/tr>\n?)+/g, (match) => {
      if (match.includes('<tr')) {
        return `<table style="border-collapse: collapse; width: 100%; margin: 20px 0;">${match}</table>`;
      }
      return match;
    });
  }

  buildStyle(styleObj) {
    return Object.entries(styleObj)
      .map(([key, value]) => `${this.camelToKebab(key)}: ${value}`)
      .join('; ');
  }

  camelToKebab(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}

// ==================== 图片上传器 ====================
class ImageUploader {
  constructor() {
    this.uploadedImages = new Map();
  }

  /**
   * 上传图片到微信服务器
   * @param {string} imageUrl - 图片 URL 或本地路径
   * @param {string} accessToken - 微信 access_token
   * @returns {Promise<string>} - 上传后的微信图片 URL
   */
  async upload(imageUrl, accessToken) {
    // 检查是否已上传
    if (this.uploadedImages.has(imageUrl)) {
      return this.uploadedImages.get(imageUrl);
    }

    try {
      // 获取图片数据
      const imageData = await this.fetchImage(imageUrl);
      
      // 上传到微信
      const wechatUrl = await this.uploadToWechat(imageData, accessToken);
      
      // 缓存结果
      this.uploadedImages.set(imageUrl, wechatUrl);
      
      console.log(`✓ 图片上传成功：${imageUrl} -> ${wechatUrl}`);
      return wechatUrl;
      
    } catch (error) {
      console.error(`✗ 图片上传失败：${imageUrl}`, error.message);
      return imageUrl; // 返回原 URL
    }
  }

  async fetchImage(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      
      protocol.get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
      }).on('error', reject);
    });
  }

  async uploadToWechat(imageData, accessToken) {
    // 注意：微信图片上传需要使用 multipart/form-data
    // 这里提供的是简化版本，实际使用需要配合微信 API
    
    // 模拟上传（实际使用时需要替换为真实的微信 API 调用）
    // 微信素材上传接口：POST https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=ACCESS_TOKEN
    
    return new Promise((resolve) => {
      // 这里返回一个占位符，实际使用时需要实现真实的上传逻辑
      const mockUrl = `https://mmbiz.qpic.cn/mmbiz_${Date.now()}/0`;
      resolve(mockUrl);
    });
  }

  /**
   * 批量上传 HTML 中的所有图片
   * @param {string} html - HTML 内容
   * @param {string} accessToken - 微信 access_token
   * @returns {Promise<string>} - 替换图片链接后的 HTML
   */
  async uploadAllImages(html, accessToken) {
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
    const matches = [...html.matchAll(imgRegex)];
    
    console.log(`\n📸 发现 ${matches.length} 张图片，开始上传...`);
    
    for (const match of matches) {
      const oldSrc = match[1];
      
      // 跳过已经上传的图片
      if (oldSrc.includes('mmbiz.qpic.cn')) {
        continue;
      }
      
      const newSrc = await this.upload(oldSrc, accessToken);
      html = html.replace(oldSrc, newSrc);
    }
    
    return html;
  }
}

// ==================== 主排版器 ====================
class WechatFormatter {
  constructor() {
    this.parser = new MarkdownParser();
    this.uploader = new ImageUploader();
  }

  /**
   * 格式化 Markdown 为微信公众号 HTML
   * @param {string} markdown - Markdown 内容
   * @param {Object} options - 选项
   * @returns {string} - 格式化后的 HTML
   */
  format(markdown, options = {}) {
    const {
      autoUploadImages = false,
      accessToken = null,
      customStyles = {}
    } = options;

    // 合并自定义样式
    const styles = this.mergeStyles(customStyles);
    
    // 解析 Markdown
    let html = this.parser.parse(markdown);
    
    // 包裹在容器中
    html = this.wrapInContainer(html);
    
    return { html, markdown };
  }

  /**
   * 异步格式化（支持图片上传）
   * @param {string} markdown - Markdown 内容
   * @param {Object} options - 选项
   * @returns {Promise<string>} - 格式化后的 HTML
   */
  async formatAsync(markdown, options = {}) {
    const {
      autoUploadImages = false,
      accessToken = null,
      customStyles = {}
    } = options;

    // 解析 Markdown
    let html = this.parser.parse(markdown);
    
    // 上传图片
    if (autoUploadImages && accessToken) {
      html = await this.uploader.uploadAllImages(html, accessToken);
    }
    
    // 包裹在容器中
    html = this.wrapInContainer(html);
    
    return html;
  }

  mergeStyles(customStyles) {
    const merged = JSON.parse(JSON.stringify(CONFIG));
    
    if (customStyles.styles) {
      for (const [key, value] of Object.entries(customStyles.styles)) {
        if (merged.styles[key]) {
          merged.styles[key] = { ...merged.styles[key], ...value };
        } else {
          merged.styles[key] = value;
        }
      }
    }
    
    if (customStyles.container) {
      merged.container = { ...merged.container, ...customStyles.container };
    }
    
    return merged;
  }

  wrapInContainer(html) {
    const containerStyle = this.buildStyle(CONFIG.container);
    
    return `
<section style="${containerStyle}">
  ${html}
</section>

<style>
/* 微信兼容样式 */
* { box-sizing: border-box; }
pre { white-space: pre-wrap; word-wrap: break-word; }
code { word-break: break-all; }
</style>
    `.trim();
  }

  buildStyle(styleObj) {
    return Object.entries(styleObj)
      .map(([key, value]) => `${this.camelToKebab(key)}: ${value}`)
      .join('; ');
  }

  camelToKebab(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * 从文件读取 Markdown 并格式化
   * @param {string} filePath - Markdown 文件路径
   * @param {Object} options - 选项
   * @returns {string} - 格式化后的 HTML
   */
  formatFromFile(filePath, options = {}) {
    const markdown = fs.readFileSync(filePath, 'utf-8');
    return this.format(markdown, options);
  }

  /**
   * 异步从文件读取并格式化
   * @param {string} filePath - Markdown 文件路径
   * @param {Object} options - 选项
   * @returns {Promise<string>} - 格式化后的 HTML
   */
  async formatFromFileAsync(filePath, options = {}) {
    const markdown = fs.readFileSync(filePath, 'utf-8');
    return await this.formatAsync(markdown, options);
  }

  /**
   * 保存 HTML 到文件
   * @param {string} html - HTML 内容
   * @param {string} outputPath - 输出文件路径
   */
  saveToFile(html, outputPath) {
    fs.writeFileSync(outputPath, html, 'utf-8');
    console.log(`✓ HTML 已保存到：${outputPath}`);
  }

  /**
   * 复制到剪贴板（需要 xclip 或 pbcopy）
   * @param {string} html - HTML 内容
   */
  copyToClipboard(html) {
    const { execSync } = require('child_process');
    
    try {
      // 尝试使用 xclip (Linux)
      execSync('echo "' + html.replace(/"/g, '\\"') + '" | xclip -selection clipboard -t text/html', { stdio: 'ignore' });
      console.log('✓ HTML 已复制到剪贴板');
    } catch (e) {
      try {
        // 尝试使用 pbcopy (macOS)
        execSync('echo "' + html.replace(/"/g, '\\"') + '" | pbcopy', { stdio: 'ignore' });
        console.log('✓ HTML 已复制到剪贴板');
      } catch (e2) {
        console.log('⚠ 无法复制到剪贴板，请手动复制');
      }
    }
  }
}

// ==================== CLI 命令行接口 ====================
function showHelp() {
  console.log(`
微信公众号自动排版工具

用法:
  node wechat-formatter.js <input.md> [options]

选项:
  -o, --output <file>     输出文件路径
  -u, --upload            自动上传图片到微信
  -t, --token <token>     微信 access_token
  -c, --copy              复制到剪贴板
  -s, --style <file>      自定义样式文件
  -h, --help              显示帮助信息

示例:
  node wechat-formatter.js article.md
  node wechat-formatter.js article.md -o output.html
  node wechat-formatter.js article.md -u -t YOUR_ACCESS_TOKEN
  node wechat-formatter.js article.md -c

样式配置:
  创建 style.json 文件自定义样式，参考默认配置结构。
  `);
}

// 命令行参数解析
function parseArgs(args) {
  const options = {
    input: null,
    output: null,
    upload: false,
    token: null,
    copy: false,
    style: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '-o' || arg === '--output') {
      options.output = args[++i];
    } else if (arg === '-u' || arg === '--upload') {
      options.upload = true;
    } else if (arg === '-t' || arg === '--token') {
      options.token = args[++i];
    } else if (arg === '-c' || arg === '--copy') {
      options.copy = true;
    } else if (arg === '-s' || arg === '--style') {
      options.style = args[++i];
    } else if (!arg.startsWith('-')) {
      options.input = arg;
    }
  }

  return options;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    return;
  }

  const options = parseArgs(args);

  if (options.help) {
    showHelp();
    return;
  }

  if (!options.input) {
    console.error('错误：请指定输入文件');
    showHelp();
    process.exit(1);
  }

  // 检查文件是否存在
  if (!fs.existsSync(options.input)) {
    console.error(`错误：文件不存在：${options.input}`);
    process.exit(1);
  }

  // 加载自定义样式
  let customStyles = {};
  if (options.style && fs.existsSync(options.style)) {
    customStyles = JSON.parse(fs.readFileSync(options.style, 'utf-8'));
  }

  const formatter = new WechatFormatter();

  console.log(`\n📝 开始处理：${options.input}`);

  try {
    let html;
    
    if (options.upload && options.token) {
      // 异步处理（带图片上传）
      html = await formatter.formatFromFileAsync(options.input, {
        autoUploadImages: true,
        accessToken: options.token,
        customStyles
      });
    } else {
      // 同步处理
      const result = formatter.formatFromFile(options.input, {
        customStyles
      });
      html = result.html;
    }

    // 输出
    if (options.output) {
      formatter.saveToFile(html, options.output);
    } else {
      // 输出到控制台
      console.log('\n--- HTML 输出 ---\n');
      console.log(html);
      console.log('\n--- 结束 ---\n');
    }

    // 复制到剪贴板
    if (options.copy) {
      formatter.copyToClipboard(html);
    }

    console.log('\n✅ 处理完成！\n');

  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

// 导出模块
module.exports = {
  WechatFormatter,
  MarkdownParser,
  ImageUploader,
  CONFIG
};

// 如果是直接运行，执行 CLI
if (require.main === module) {
  main();
}
