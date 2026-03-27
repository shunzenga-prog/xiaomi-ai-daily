#!/usr/bin/env node
/**
 * 微信公众号自动排版工具
 *
 * 功能特性：
 * - Markdown 转微信公众号 HTML 格式
 * - 支持自定义主题样式（代码块、引用、标题等）
 * - 支持自动添加版权信息、关注引导
 * - 支持代码高亮
 *
 * 使用方法：
 *   node wechat-formatter.js input.md -o output.html
 *   node wechat-formatter.js input.md --theme dark
 *   node wechat-formatter.js --help
 */

import { marked } from 'marked';
import hljs from 'highlight.js';
import { program } from 'commander';
import fs from 'fs/promises';
import path from 'path';

// ==================== 主题配置 ====================

export const themes = {
  // 默认主题
  default: {
    name: '默认',
    colors: {
      primary: '#3f3f3f',
      secondary: '#666666',
      accent: '#35b378',
      background: '#ffffff',
      codeBackground: '#f6f8fa',
      codeColor: '#24292e',
      blockquoteBackground: '#f0f7ff',
      blockquoteBorder: '#35b378',
      linkColor: '#35b378'
    },
    fonts: {
      body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      code: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace'
    },
    lineHeight: 1.8,
    paragraphSpacing: '1em',
    titlePrefix: ''
  },

  // 深色主题
  dark: {
    name: '深色',
    colors: {
      primary: '#e6e6e6',
      secondary: '#a0a0a0',
      accent: '#61d9a8',
      background: '#1e1e1e',
      codeBackground: '#2d2d2d',
      codeColor: '#d4d4d4',
      blockquoteBackground: '#2d3748',
      blockquoteBorder: '#61d9a8',
      linkColor: '#61d9a8'
    },
    fonts: {
      body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      code: '"Fira Code", Consolas, Monaco, monospace'
    },
    lineHeight: 1.8,
    paragraphSpacing: '1em',
    titlePrefix: ''
  },

  // 简洁主题
  minimal: {
    name: '简洁',
    colors: {
      primary: '#333333',
      secondary: '#888888',
      accent: '#000000',
      background: '#ffffff',
      codeBackground: '#fafafa',
      codeColor: '#333333',
      blockquoteBackground: '#fafafa',
      blockquoteBorder: '#333333',
      linkColor: '#333333'
    },
    fonts: {
      body: 'Georgia, "Times New Roman", serif',
      code: 'Consolas, Monaco, monospace'
    },
    lineHeight: 2,
    paragraphSpacing: '1.5em',
    titlePrefix: ''
  },

  // 科技主题
  tech: {
    name: '科技',
    colors: {
      primary: '#2c3e50',
      secondary: '#7f8c8d',
      accent: '#3498db',
      background: '#ffffff',
      codeBackground: '#ecf0f1',
      codeColor: '#2c3e50',
      blockquoteBackground: '#ebf5fb',
      blockquoteBorder: '#3498db',
      linkColor: '#3498db'
    },
    fonts: {
      body: '"PingFang SC", "Microsoft YaHei", sans-serif',
      code: '"Source Code Pro", Consolas, monospace'
    },
    lineHeight: 1.75,
    paragraphSpacing: '0.8em',
    titlePrefix: '📚 '
  }
};

// ==================== 微信样式渲染器 ====================

export class WeChatRenderer {
  constructor(theme = 'default', options = {}) {
    this.theme = typeof theme === 'string' ? themes[theme] || themes.default : theme;
    this.options = {
      highlightCode: true,
      addFooter: true,
      addCopyright: true,
      addQRCode: false,
      authorName: '',
      articleTitle: '',
      publishDate: '',
      ...options
    };
  }

  /**
   * 转换 Markdown 到微信 HTML
   */
  convert(markdown) {
    // 配置 marked
    const renderer = this._createRenderer();
    marked.setOptions({
      renderer,
      highlight: this.options.highlightCode ? this._highlightCode.bind(this) : null,
      breaks: true,
      gfm: true
    });

    let html = marked(markdown);

    // 添加包装器和样式
    html = this._wrapHtml(html);

    // 添加页脚
    if (this.options.addFooter) {
      html += this._createFooter();
    }

    return html;
  }

  /**
   * 创建自定义渲染器
   */
  _createRenderer() {
    const renderer = new marked.Renderer();
    const theme = this.theme;

    // 标题
    renderer.heading = (text, level) => {
      const sizes = ['1.5em', '1.3em', '1.1em', '1em', '0.9em', '0.85em'];
      const marginTop = level === 1 ? '1.5em' : '1em';
      const marginBottom = '0.8em';

      return `<h${level} style="
        font-size: ${sizes[level - 1]};
        font-weight: bold;
        color: ${theme.colors.primary};
        margin-top: ${marginTop};
        margin-bottom: ${marginBottom};
        line-height: 1.4;
      ">${theme.titlePrefix}${text}</h${level}>`;
    };

    // 段落
    renderer.paragraph = (text) => {
      return `<p style="
        color: ${theme.colors.primary};
        line-height: ${theme.lineHeight};
        margin-top: 0;
        margin-bottom: ${theme.paragraphSpacing};
        text-align: justify;
      ">${text}</p>`;
    };

    // 链接
    renderer.link = (href, title, text) => {
      return `<a href="${href}" style="
        color: ${theme.colors.linkColor};
        text-decoration: none;
        border-bottom: 1px solid ${theme.colors.linkColor};
      ">${text}</a>`;
    };

    // 粗体
    renderer.strong = (text) => {
      return `<strong style="font-weight: bold; color: ${theme.colors.primary};">${text}</strong>`;
    };

    // 斜体
    renderer.em = (text) => {
      return `<em style="font-style: italic;">${text}</em>`;
    };

    // 列表项
    renderer.listitem = (text) => {
      return `<li style="
        color: ${theme.colors.primary};
        line-height: ${theme.lineHeight};
        margin-bottom: 0.3em;
      ">${text}</li>`;
    };

    // 无序列表
    renderer.list = (body, ordered) => {
      const tag = ordered ? 'ol' : 'ul';
      const listStyle = ordered ? 'decimal' : 'disc';
      return `<${tag} style="
        padding-left: 1.5em;
        margin: 0.8em 0;
        list-style-type: ${listStyle};
      ">${body}</${tag}>`;
    };

    // 代码块
    renderer.code = (code, language) => {
      const highlighted = this.options.highlightCode
        ? this._highlightCode(code, language)
        : this._escapeHtml(code);

      return `<pre style="
        background-color: ${theme.colors.codeBackground};
        padding: 1em;
        border-radius: 8px;
        overflow-x: auto;
        margin: 1em 0;
        font-size: 0.9em;
      "><code style="
        font-family: ${theme.fonts.code};
        color: ${theme.colors.codeColor};
        line-height: 1.6;
        white-space: pre;
        display: block;
      ">${highlighted}</code></pre>`;
    };

    // 行内代码
    renderer.codespan = (code) => {
      return `<code style="
        background-color: ${theme.colors.codeBackground};
        padding: 0.2em 0.4em;
        border-radius: 4px;
        font-family: ${theme.fonts.code};
        font-size: 0.9em;
        color: ${theme.colors.codeColor};
      ">${this._escapeHtml(code)}</code>`;
    };

    // 引用
    renderer.blockquote = (quote) => {
      return `<blockquote style="
        background-color: ${theme.colors.blockquoteBackground};
        border-left: 4px solid ${theme.colors.blockquoteBorder};
        padding: 1em 1.5em;
        margin: 1em 0;
        color: ${theme.colors.secondary};
        font-style: italic;
      ">${quote}</blockquote>`;
    };

    // 水平线
    renderer.hr = () => {
      return `<hr style="
        border: none;
        border-top: 1px solid ${theme.colors.secondary};
        margin: 1.5em 0;
        opacity: 0.3;
      ">`;
    };

    // 图片
    renderer.image = (href, title, text) => {
      return `<img src="${href}" alt="${text}" style="
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1em auto;
        border-radius: 8px;
      ">`;
    };

    // 表格
    renderer.table = (header, body) => {
      return `<table style="
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
        font-size: 0.9em;
      "><thead style="
        background-color: ${theme.colors.codeBackground};
      ">${header}</thead><tbody>${body}</tbody></table>`;
    };

    renderer.tablerow = (content) => {
      return `<tr style="border-bottom: 1px solid ${theme.colors.secondary}40;">${content}</tr>`;
    };

    renderer.tablecell = (content, flags) => {
      const tag = flags.header ? 'th' : 'td';
      const align = flags.align ? `text-align: ${flags.align};` : '';
      return `<${tag} style="
        padding: 0.5em;
        border: 1px solid ${theme.colors.secondary}40;
        ${align}
      ">${content}</${tag}>`;
    };

    return renderer;
  }

  /**
   * 代码高亮
   */
  _highlightCode(code, language) {
    if (!language) {
      return this._escapeHtml(code);
    }

    try {
      const lang = hljs.getLanguage(language) ? language : 'plaintext';
      return hljs.highlight(code, { language: lang }).value;
    } catch {
      return this._escapeHtml(code);
    }
  }

  /**
   * HTML 转义
   */
  _escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * 包装 HTML
   */
  _wrapHtml(html) {
    const theme = this.theme;

    return `<section style="
      font-family: ${theme.fonts.body};
      font-size: 16px;
      color: ${theme.colors.primary};
      background-color: ${theme.colors.background};
      padding: 1em;
      line-height: ${theme.lineHeight};
    ">
${html}
</section>`;
  }

  /**
   * 创建页脚
   */
  _createFooter() {
    const theme = this.theme;
    const parts = [];

    // 分隔线
    parts.push(`<hr style="
      border: none;
      border-top: 1px solid ${theme.colors.secondary};
      margin: 2em 0 1em;
      opacity: 0.3;
    ">`);

    // 版权信息
    if (this.options.addCopyright) {
      const author = this.options.authorName || '作者';
      const date = this.options.publishDate || new Date().toLocaleDateString('zh-CN');

      parts.push(`<p style="
        color: ${theme.colors.secondary};
        font-size: 0.85em;
        text-align: center;
        margin: 0.5em 0;
      ">© ${date} ${author} · 保留所有权利</p>`);
    }

    // 关注引导
    parts.push(`<p style="
      color: ${theme.colors.secondary};
      font-size: 0.85em;
      text-align: center;
      margin: 1em 0;
    ">如果觉得文章有帮助，欢迎点赞、在看、转发支持 👍</p>`);

    return parts.join('\n');
  }
}

// ==================== CLI 入口 ====================

program
  .name('wechat-formatter')
  .description('微信公众号 Markdown 排版工具')
  .version('1.0.0')
  .argument('<input>', '输入 Markdown 文件路径')
  .option('-o, --output <file>', '输出 HTML 文件路径')
  .option('-t, --theme <name>', '主题名称 (default, dark, minimal, tech)', 'default')
  .option('--no-highlight', '禁用代码高亮')
  .option('--no-footer', '不添加页脚')
  .option('--author <name>', '作者名称')
  .option('--title <title>', '文章标题')
  .action(async (input, options) => {
    try {
      // 读取输入文件
      const markdown = await fs.readFile(input, 'utf-8');

      // 创建渲染器
      const renderer = new WeChatRenderer(options.theme, {
        highlightCode: options.highlight !== false,
        addFooter: options.footer !== false,
        authorName: options.author,
        articleTitle: options.title
      });

      // 转换
      const html = renderer.convert(markdown);

      // 输出
      if (options.output) {
        await fs.writeFile(options.output, html);
        console.log(`✅ 已生成: ${options.output}`);
      } else {
        console.log(html);
      }

    } catch (error) {
      console.error('❌ 错误:', error.message);
      process.exit(1);
    }
  });

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}