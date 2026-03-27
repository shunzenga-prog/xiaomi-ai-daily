# 🚀 微信公众号排版工具 - 快速参考卡

## 一键使用

```bash
# 最简单的方式
node wechat-formatter.js 你的文章.md -o 输出.html -c
```

## 常用命令

| 需求 | 命令 |
|------|------|
| 基础转换 | `node wechat-formatter.js article.md` |
| 保存到文件 | `node wechat-formatter.js article.md -o output.html` |
| 复制到剪贴板 | `node wechat-formatter.js article.md -c` |
| 上传图片 | `node wechat-formatter.js article.md -u -t TOKEN` |
| 自定义样式 | `node wechat-formatter.js article.md -s style.json` |
| 查看帮助 | `node wechat-formatter.js -h` |

## Markdown 语法速查

```markdown
# 一级标题
## 二级标题
### 三级标题

**粗体文字**
*斜体文字*
`行内代码`

```javascript
// 代码块
console.log('Hello');
```

> 引用文字

- 列表项
- 列表项

[链接文字](https://url.com)
![图片描述](https://url.com/image.jpg)

---
```

## 工作流程

1. ✍️ 用 Markdown 写作（推荐 VS Code、Typora）
2. 🔄 运行转换命令
3. 📋 复制生成的 HTML
4. 📤 粘贴到微信公众号编辑器
5. 👀 预览并发布

## 样式定制

编辑 `custom-style.json` 调整：
- 字体大小、颜色
- 间距、边距
- 边框、背景色

## 获取帮助

- 详细文档：`wechat-formatter-usage.md`
- 完整说明：`README-WECHAT-FORMATTER.md`
- 样式示例：`custom-style.json`
- 示例文章：`example-article.md`

---

**提示**: 生成的 HTML 可以直接粘贴到微信公众号编辑器，无需额外调整！
