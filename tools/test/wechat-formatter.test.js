/**
 * 公众号排版工具测试
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { WeChatRenderer, themes } from '../wechat-formatter.js';

describe('公众号排版工具测试', () => {
  describe('主题配置', () => {
    it('存在默认主题', () => {
      assert.ok(themes.default);
      assert.strictEqual(themes.default.name, '默认');
    });

    it('存在所有主题', () => {
      assert.ok(themes.default);
      assert.ok(themes.dark);
      assert.ok(themes.minimal);
      assert.ok(themes.tech);
    });

    it('主题包含必要配置', () => {
      for (const [key, theme] of Object.entries(themes)) {
        assert.ok(theme.name, `主题 ${key} 缺少 name`);
        assert.ok(theme.colors, `主题 ${key} 缺少 colors`);
        assert.ok(theme.fonts, `主题 ${key} 缺少 fonts`);
      }
    });
  });

  describe('渲染器', () => {
    let renderer;

    beforeEach(() => {
      renderer = new WeChatRenderer('default');
    });

    it('创建渲染器实例', () => {
      assert.ok(renderer);
      assert.ok(renderer.theme);
    });

    it('转换空文本', () => {
      const html = renderer.convert('');
      assert.ok(html.includes('<section'));
    });

    it('转换标题', () => {
      const html = renderer.convert('# 测试标题');
      assert.ok(html.includes('<h1'));
      assert.ok(html.includes('测试标题'));
    });

    it('转换段落', () => {
      const html = renderer.convert('这是一个段落。');
      assert.ok(html.includes('<p'));
      assert.ok(html.includes('这是一个段落'));
    });

    it('转换代码块', () => {
      const html = renderer.convert('```javascript\nconsole.log("hello");\n```');
      assert.ok(html.includes('<pre'));
      assert.ok(html.includes('<code'));
    });

    it('转换行内代码', () => {
      const html = renderer.convert('这是 `代码` 测试');
      assert.ok(html.includes('<code'));
    });

    it('转换引用', () => {
      const html = renderer.convert('> 这是一段引用');
      assert.ok(html.includes('<blockquote'));
    });

    it('转换列表', () => {
      const html = renderer.convert('- 项目 1\n- 项目 2');
      assert.ok(html.includes('<ul'));
      assert.ok(html.includes('<li'));
    });

    it('转换有序列表', () => {
      const html = renderer.convert('1. 项目 1\n2. 项目 2');
      assert.ok(html.includes('<ol'));
    });

    it('转换链接', () => {
      const html = renderer.convert('[链接](https://example.com)');
      assert.ok(html.includes('<a'));
      assert.ok(html.includes('href="https://example.com"'));
    });

    it('转换粗体', () => {
      const html = renderer.convert('这是 **粗体** 文字');
      assert.ok(html.includes('<strong'));
    });

    it('转换斜体', () => {
      const html = renderer.convert('这是 *斜体* 文字');
      assert.ok(html.includes('<em'));
    });

    it('转换图片', () => {
      const html = renderer.convert('![图片](https://example.com/img.png)');
      assert.ok(html.includes('<img'));
      assert.ok(html.includes('src="https://example.com/img.png"'));
    });

    it('添加页脚', () => {
      const renderer = new WeChatRenderer('default', { addFooter: true });
      const html = renderer.convert('# 测试');
      assert.ok(html.includes('如果觉得文章有帮助'));
    });

    it('不添加页脚', () => {
      const renderer = new WeChatRenderer('default', { addFooter: false });
      const html = renderer.convert('# 测试');
      assert.ok(!html.includes('如果觉得文章有帮助'));
    });
  });

  describe('主题切换', () => {
    it('深色主题', () => {
      const renderer = new WeChatRenderer('dark');
      const html = renderer.convert('# 测试');
      assert.ok(html.includes('#1e1e1e')); // 深色背景
    });

    it('简洁主题', () => {
      const renderer = new WeChatRenderer('minimal');
      assert.strictEqual(renderer.theme.name, '简洁');
    });

    it('科技主题', () => {
      const renderer = new WeChatRenderer('tech');
      assert.strictEqual(renderer.theme.name, '科技');
    });
  });

  describe('自定义配置', () => {
    it('自定义作者名称', () => {
      const renderer = new WeChatRenderer('default', {
        addFooter: true,
        authorName: '测试作者'
      });
      const html = renderer.convert('# 测试');
      assert.ok(html.includes('测试作者'));
    });
  });

  describe('复杂 Markdown', () => {
    it('完整文章', () => {
      const markdown = `
# 文章标题

这是一段引言。

## 第一章

正文内容。

### 子章节

更多内容。

\`\`\`javascript
console.log("hello");
\`\`\`

> 引用文字

- 列表项 1
- 列表项 2

[链接](https://example.com)
`;

      const renderer = new WeChatRenderer('default');
      const html = renderer.convert(markdown);

      assert.ok(html.includes('<h1'));
      assert.ok(html.includes('<h2'));
      assert.ok(html.includes('<h3'));
      assert.ok(html.includes('<pre'));
      assert.ok(html.includes('<blockquote'));
      assert.ok(html.includes('<ul'));
      assert.ok(html.includes('<a'));
    });

    it('表格转换', () => {
      const markdown = `
| 列 1 | 列 2 |
|------|------|
| 数据 1 | 数据 2 |
`;
      const renderer = new WeChatRenderer('default');
      const html = renderer.convert(markdown);

      assert.ok(html.includes('<table'));
      assert.ok(html.includes('<thead'));
      assert.ok(html.includes('<tbody'));
    });
  });
});

console.log('✅ 公众号排版工具测试完成');