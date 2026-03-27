# 微信公众号自动排版工具 - 使用文档

## 📖 简介

`wechat-formatter.js` 是一个专为微信公众号设计的自动排版工具，可以将 Markdown 文档快速转换为符合微信公众号风格的 HTML 格式。

### 核心功能

- ✅ **Markdown 转公众号 HTML** - 完美转换各种 Markdown 语法
- ✅ **智能样式处理** - 自动应用微信公众号友好的样式
- ✅ **图片自动上传** - 支持批量上传图片到微信服务器
- ✅ **可复制 HTML 输出** - 一键复制，直接粘贴到公众号编辑器

---

## 🚀 快速开始

### 安装依赖

本工具使用 Node.js 原生模块，无需额外安装依赖。

确保你的系统已安装 Node.js (v14+)：

```bash
node --version
```

### 基础使用

1. **准备 Markdown 文件**

创建或准备一个 Markdown 文件，例如 `article.md`：

```markdown
# 我的第一篇文章

这是第一段内容，介绍文章的背景。

## 主要内容

这里是一些**重点内容**需要强调。

### 代码示例

```javascript
console.log('Hello, WeChat!');
```

> 这是一段引用文字

- 列表项 1
- 列表项 2
- 列表项 3

![图片描述](https://example.com/image.jpg)

[点击这里](https://example.com) 访问链接。
```

2. **运行排版工具**

```bash
node wechat-formatter.js article.md -o output.html
```

3. **复制 HTML 到公众号**

打开生成的 `output.html` 文件，全选复制，然后粘贴到微信公众号编辑器即可。

---

## 📋 命令行选项

```bash
node wechat-formatter.js <input.md> [options]
```

| 选项 | 简写 | 说明 | 示例 |
|------|------|------|------|
| `--output` | `-o` | 指定输出文件路径 | `-o output.html` |
| `--upload` | `-u` | 自动上传图片到微信 | `-u` |
| `--token` | `-t` | 微信 access_token | `-t YOUR_TOKEN` |
| `--copy` | `-c` | 复制到剪贴板 | `-c` |
| `--style` | `-s` | 自定义样式配置文件 | `-s style.json` |
| `--help` | `-h` | 显示帮助信息 | `-h` |

### 使用示例

```bash
# 基础转换
node wechat-formatter.js article.md

# 转换并保存
node wechat-formatter.js article.md -o output.html

# 转换并复制到剪贴板
node wechat-formatter.js article.md -c

# 上传图片并转换
node wechat-formatter.js article.md -u -t YOUR_ACCESS_TOKEN -o output.html

# 使用自定义样式
node wechat-formatter.js article.md -s my-style.json -o output.html
```

---

## 🎨 样式配置

### 默认样式

工具内置了微信公众号友好的默认样式：

- **一级标题**：居中，18px，底部绿色边框
- **二级标题**：16px，绿色，左侧绿色竖线
- **三级标题**：15px，深灰色
- **段落**：15px，1.8 倍行距，两端对齐
- **代码块**：浅灰背景，圆角边框
- **引用块**：左侧绿色竖线，斜体
- **链接**：绿色，虚线下划线

### 自定义样式

创建 `style.json` 文件自定义样式：

```json
{
  "styles": {
    "h1": {
      "fontSize": "20px",
      "color": "#ff6600",
      "fontWeight": "bold",
      "textAlign": "center",
      "margin": "30px 0 15px 0"
    },
    "h2": {
      "fontSize": "18px",
      "color": "#ff6600",
      "fontWeight": "bold",
      "margin": "25px 0 12px 0"
    },
    "p": {
      "fontSize": "16px",
      "color": "#333",
      "lineHeight": "2.0",
      "margin": "20px 0"
    },
    "code": {
      "backgroundColor": "#2d2d2d",
      "color": "#f8f8f2",
      "borderRadius": "8px",
      "padding": "20px"
    }
  },
  "container": {
    "maxWidth": "700px",
    "padding": "30px",
    "backgroundColor": "#fafafa"
  }
}
```

使用自定义样式：

```bash
node wechat-formatter.js article.md -s style.json -o output.html
```

---

## 📸 图片上传功能

### 获取微信 Access Token

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入「开发」→「基本配置」
3. 获取 AppID 和 AppSecret
4. 调用接口获取 access_token：

```bash
curl "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=YOUR_APPID&secret=YOUR_APPSECRET"
```

### 使用图片上传

```bash
node wechat-formatter.js article.md -u -t YOUR_ACCESS_TOKEN -o output.html
```

工具会自动：
1. 检测 Markdown 中的所有图片链接
2. 下载图片并上传到微信服务器
3. 替换 HTML 中的图片链接为微信 CDN 链接

> ⚠️ 注意：图片上传功能需要有效的微信 access_token，且图片链接必须是可公开访问的 URL。

---

## 🔧 编程接口

除了命令行，你还可以在 Node.js 项目中直接使用：

```javascript
const { WechatFormatter } = require('./wechat-formatter');

const formatter = new WechatFormatter();

// 同步转换
const markdown = `
# 标题

这是内容。
`;

const result = formatter.format(markdown);
console.log(result.html);

// 异步转换（带图片上传）
async function convertWithImages() {
  const html = await formatter.formatAsync(markdown, {
    autoUploadImages: true,
    accessToken: 'YOUR_ACCESS_TOKEN'
  });
  console.log(html);
}

// 从文件读取
const result = formatter.formatFromFile('article.md');
formatter.saveToFile(result.html, 'output.html');
```

---

## 📝 Markdown 语法支持

| Markdown 语法 | 示例 | 效果 |
|--------------|------|------|
| 一级标题 | `# 标题` | 大号居中标题 |
| 二级标题 | `## 标题` | 带绿色竖线的标题 |
| 三级标题 | `### 标题` | 普通小标题 |
| 粗体 | `**文字**` | 加粗绿色文字 |
| 斜体 | `*文字*` | 斜体文字 |
| 行内代码 | `` `code` `` | 灰色背景代码 |
| 代码块 | ` ```js ... ``` ` | 完整代码块 |
| 引用 | `> 文字` | 带竖线的引用块 |
| 无序列表 | `- 项目` | 圆点列表 |
| 有序列表 | `1. 项目` | 数字列表 |
| 链接 | `[文字](url)` | 绿色链接 |
| 图片 | `![描述](url)` | 自适应图片 |
| 分割线 | `---` | 水平分割线 |

---

## 💡 最佳实践

### 1. 文章结构建议

```markdown
# 吸引人的标题

> 导语或摘要，概括文章核心内容

## 背景介绍

交代文章背景和写作目的。

## 核心内容

分点论述主要内容。

### 子话题 1

详细说明...

### 子话题 2

详细说明...

## 总结

总结全文，呼应开头。
```

### 2. 图片优化

- 使用高质量图片（建议宽度 677px 以上）
- 图片格式推荐 JPG 或 PNG
- 单张图片大小不超过 5MB
- 添加有意义的 alt 描述

### 3. 代码展示

- 代码块不宜过长，必要时分段
- 添加语言标识以便高亮
- 复杂代码添加注释说明

### 4. 排版细节

- 段落之间保持适当间距
- 避免大段连续文字
- 适当使用引用强调重点
- 列表项保持简洁

---

## ❓ 常见问题

### Q: 为什么图片没有显示？

A: 检查以下几点：
1. 图片链接是否可公开访问
2. 是否需要上传到微信服务器
3. 图片格式是否支持

### Q: 样式和预期不一样？

A: 可以自定义样式配置文件，参考「样式配置」章节。

### Q: 如何批量处理多篇文章？

A: 使用 shell 脚本批量处理：

```bash
for file in articles/*.md; do
  node wechat-formatter.js "$file" -o "output/$(basename "$file" .md).html"
done
```

### Q: 复制到剪贴板失败？

A: 确保系统安装了 `xclip` (Linux) 或使用 macOS 的 `pbcopy`。也可以手动打开 HTML 文件复制。

---

## 📄 输出示例

转换后的 HTML 可以直接粘贴到微信公众号编辑器，效果如下：

- 标题自动居中，带有品牌色装饰
- 段落间距适中，阅读舒适
- 代码块有高亮背景和圆角
- 图片自适应宽度，居中显示
- 整体风格符合微信生态

---

## 📞 技术支持

如有问题或建议，欢迎反馈。

---

**版本**: 1.0.0  
**最后更新**: 2026-03-27
