# 📝 微信公众号自动排版工具

> 一键将 Markdown 转换为微信公众号友好的 HTML 格式

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14-green.svg)

---

## ✨ 特性

- 🎯 **Markdown 转换** - 完美支持标题、段落、列表、代码块等
- 🎨 **微信风格** - 内置符合微信公众号审美的样式
- 📸 **图片上传** - 自动上传图片到微信服务器（需 access_token）
- 📋 **一键复制** - 生成可直接粘贴到公众号编辑器的 HTML
- 🔧 **高度可定制** - 支持自定义样式配置
- 🚀 **零依赖** - 使用 Node.js 原生模块，无需安装额外包

---

## 📦 快速开始

### 1. 准备环境

确保已安装 Node.js (v14+):

```bash
node --version
```

### 2. 使用方法

#### 方式一：命令行工具

```bash
# 基础使用
node wechat-formatter.js article.md -o output.html

# 复制到剪贴板
node wechat-formatter.js article.md -c

# 上传图片到微信
node wechat-formatter.js article.md -u -t YOUR_ACCESS_TOKEN -o output.html

# 使用自定义样式
node wechat-formatter.js article.md -s custom-style.json -o output.html
```

#### 方式二：快速脚本

```bash
./quick-start.sh article.md output.html
```

#### 方式三：编程接口

```javascript
const { WechatFormatter } = require('./wechat-formatter');

const formatter = new WechatFormatter();

// 同步转换
const result = formatter.format('# 标题\n\n内容');
console.log(result.html);

// 异步转换（带图片上传）
const html = await formatter.formatAsync(markdown, {
  autoUploadImages: true,
  accessToken: 'YOUR_TOKEN'
});
```

---

## 📋 命令行选项

| 选项 | 简写 | 说明 |
|------|------|------|
| `--output` | `-o` | 输出文件路径 |
| `--upload` | `-u` | 自动上传图片到微信 |
| `--token` | `-t` | 微信 access_token |
| `--copy` | `-c` | 复制到剪贴板 |
| `--style` | `-s` | 自定义样式文件 |
| `--help` | `-h` | 显示帮助 |

---

## 🎨 样式配置

创建 `style.json` 自定义样式：

```json
{
  "styles": {
    "h1": {
      "fontSize": "20px",
      "color": "#1a1a1a",
      "fontWeight": "bold"
    },
    "p": {
      "fontSize": "16px",
      "lineHeight": "1.9"
    }
  }
}
```

参考 `custom-style.json` 查看完整配置示例。

---

## 📸 图片上传

### 获取微信 Access Token

```bash
curl "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=YOUR_APPID&secret=YOUR_APPSECRET"
```

### 使用图片上传

```bash
node wechat-formatter.js article.md -u -t YOUR_ACCESS_TOKEN
```

工具会自动：
1. 检测 Markdown 中的所有图片
2. 下载并上传到微信服务器
3. 替换为微信 CDN 链接

---

## 📄 文件说明

```
wechat-formatter/
├── wechat-formatter.js      # 主程序
├── wechat-formatter-usage.md # 详细使用文档
├── README-WECHAT-FORMATTER.md # 本文件
├── quick-start.sh           # 快速启动脚本
├── custom-style.json        # 自定义样式示例
├── example-article.md       # 示例 Markdown
└── example-output.html      # 示例输出
```

---

## 💡 使用技巧

### 1. 批量处理

```bash
for file in articles/*.md; do
  node wechat-formatter.js "$file" -o "output/$(basename "$file" .md).html"
done
```

### 2. 配合 Git

```bash
# 保存排版后的 HTML 到 git
node wechat-formatter.js article.md -o docs/article.html
git add docs/article.html
git commit -m "添加排版后的文章"
```

### 3. 工作流建议

1. 在 Markdown 中写作（推荐 Typora、VS Code）
2. 使用工具转换为 HTML
3. 复制 HTML 到微信公众号编辑器
4. 预览并调整（如需要）
5. 发布

---

## ❓ 常见问题

### 图片不显示？

- 检查图片链接是否可公开访问
- 使用 `-u` 选项上传到微信服务器
- 确保 access_token 有效

### 样式不符合预期？

- 创建自定义样式文件
- 参考 `custom-style.json` 调整参数

### 无法复制到剪贴板？

- Linux: 安装 `xclip`
- macOS: 使用 `pbcopy`（自带）
- Windows: 手动打开 HTML 文件复制

---

## 📝 Markdown 语法支持

| 语法 | 示例 | 说明 |
|------|------|------|
| 标题 | `# H1`, `## H2` | 支持 1-4 级标题 |
| 粗体 | `**文字**` | 加粗显示 |
| 斜体 | `*文字*` | 斜体显示 |
| 代码 | `` `code` `` | 行内代码 |
| 代码块 | ` ```js ` | 多行代码 |
| 引用 | `> 文字` | 引用块 |
| 列表 | `- 项目` | 无序/有序列表 |
| 链接 | `[文字](url)` | 超链接 |
| 图片 | `![描述](url)` | 图片 |
| 分割线 | `---` | 水平线 |
| 表格 | `\|col\|` | Markdown 表格 |

---

## 🔗 相关资源

- [微信公众平台](https://mp.weixin.qq.com/)
- [Markdown 语法指南](https://markdown.com.cn/)
- [微信开发文档](https://developers.weixin.qq.com/)

---

## 📄 许可证

MIT License

---

**Made with ❤️ for content creators**
