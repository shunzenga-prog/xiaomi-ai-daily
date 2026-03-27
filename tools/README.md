# OpenClaw Tools

OpenClaw 工具集 - 包含 Webhook 处理、公众号排版、文章模板生成、数据分析等功能。

## 功能模块

### 1. Webhook 处理器 (`webhook-handler.js`)

支持多平台的 Webhook 接收和处理。

**支持平台：**
- GitHub
- GitLab
- Discord
- Slack
- Telegram
- 微信公众号

**使用方法：**

```bash
# 启动 Webhook 服务器
node webhook-handler.js --port 3000

# 使用配置文件
node webhook-handler.js --config ./config.json

# 详细日志模式
node webhook-handler.js --verbose
```

**API 接口：**

```javascript
import { WebhookHandler } from './webhook-handler.js';

const handler = new WebhookHandler({
  port: 3000,
  platforms: {
    github: { secret: 'your-secret' },
    wechat: { token: 'your-token' }
  }
});

// 注册事件处理器
handler.onEvent('github', 'push', (event) => {
  console.log('GitHub Push:', event.repository?.fullName);
});

handler.onEvent('wechat', 'text_message', (event) => {
  console.log('WeChat Message:', event.data?.content);
});

await handler.start();
```

**端点列表：**

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /health | 健康检查 |
| GET | /adapters | 已加载适配器列表 |
| POST | /webhook/:platform | 通用 Webhook 端点 |
| POST | /github | GitHub Webhook |
| POST | /gitlab | GitLab Webhook |
| POST | /discord | Discord Webhook |
| POST | /slack | Slack Webhook |
| POST | /telegram | Telegram Webhook |
| GET/POST | /wechat | 微信公众号 Webhook |
| POST | /wechat-comment | 公众号评论通知 |
| POST | /test | 测试端点 |

---

### 2. 公众号排版工具 (`wechat-formatter.js`)

将 Markdown 转换为微信公众号兼容的 HTML 格式。

**使用方法：**

```bash
# 基本用法
node wechat-formatter.js input.md -o output.html

# 指定主题
node wechat-formatter.js input.md --theme dark -o output.html

# 禁用代码高亮
node wechat-formatter.js input.md --no-highlight -o output.html

# 添加作者信息
node wechat-formatter.js input.md --author "作者名" -o output.html
```

**API 接口：**

```javascript
import { WeChatRenderer, themes } from './wechat-formatter.js';

const renderer = new WeChatRenderer('default', {
  highlightCode: true,
  addFooter: true,
  authorName: '作者名'
});

const html = renderer.convert(markdownContent);
```

**可用主题：**

| 主题 | 名称 | 说明 |
|------|------|------|
| `default` | 默认 | 清爽的默认主题 |
| `dark` | 深色 | 深色模式主题 |
| `minimal` | 简洁 | 极简风格 |
| `tech` | 科技 | 科技感主题 |

---

### 3. 文章模板生成器 (`article-template-generator.js`)

快速生成结构化的文章模板。

**使用方法：**

```bash
# 列出所有模板
node article-template-generator.js --list

# 生成技术教程模板
node article-template-generator.js tutorial -o article.md

# 生成产品评测模板
node article-template-generator.js review --title "产品评测" -o review.md

# 显示模板变量
node article-template-generator.js tutorial --variables
```

**API 接口：**

```javascript
import ArticleTemplateGenerator from './article-template-generator.js';

const generator = new ArticleTemplateGenerator();

// 列出模板
const templates = generator.listTemplates();

// 生成模板
const content = generator.generate('tutorial', {
  title: '我的教程',
  author: '作者名',
  date: '2024-01-01',
  difficulty: '中级',
  duration: '30分钟'
});

// 添加自定义模板
generator.addTemplate('custom', {
  name: '自定义模板',
  description: '自定义模板描述',
  variables: ['title', 'author'],
  content: '# {{title}}\n作者: {{author}}'
});
```

**内置模板：**

| 模板键 | 名称 | 说明 |
|--------|------|------|
| `tutorial` | 技术教程 | 编程教程、技术指南 |
| `review` | 产品评测 | 产品体验、测评报告 |
| `experience` | 心得体会 | 个人感悟、经验分享 |
| `news` | 新闻资讯 | 新闻报道、行业动态 |
| `booknote` | 读书笔记 | 书籍读后感、笔记整理 |
| `project` | 项目复盘 | 项目总结、复盘报告 |

---

### 4. 数据分析脚本 (`analytics.js`)

分析文章数据并生成报告。

**使用方法：**

```bash
# 分析示例数据
node analytics.js analyze --sample

# 分析数据文件
node analytics.js analyze --input data.json

# 包含趋势和分类分析
node analytics.js analyze --sample --trends --categories

# 导出数据
node analytics.js export --sample --format csv -o data.csv

# 生成报告
node analytics.js report --sample -o report.json
```

**API 接口：**

```javascript
import Analytics, { generateSampleData } from './analytics.js';

const analytics = new Analytics();

// 加载数据
await analytics.loadData(generateSampleData(30));

// 基础统计
const stats = analytics.getBasicStats();

// 趋势分析
const trends = analytics.analyzeTrends('date', 'readCount');

// 分类分析
const categories = analytics.analyzeByCategory('category', 'readCount');

// 排名
const topArticles = analytics.getTopItems('readCount', 10);

// 生成报告
const report = analytics.generateReport({
  includeTrends: true,
  includeCategories: true
});

// 导出
const csv = analytics.toCsv();
const json = analytics.toJson();

// 终端可视化
const barChart = analytics.renderBarChart(categories, {
  title: '分类排行',
  labelField: 'name',
  valueField: 'total'
});
```

---

## 项目结构

```
tools/
├── adapters/                    # 平台适配器
│   ├── base-adapter.js          # 适配器基类
│   ├── github-adapter.js        # GitHub 适配器
│   ├── gitlab-adapter.js        # GitLab 适配器
│   ├── discord-adapter.js       # Discord 适配器
│   ├── slack-adapter.js         # Slack 适配器
│   ├── telegram-adapter.js      # Telegram 适配器
│   ├── wechat-adapter.js        # 微信公众号适配器
│   └── index.js                 # 适配器导出
├── lib/                         # 工具库
│   └── utils.js                 # 公共工具函数
├── templates/                   # 模板文件目录
├── themes/                      # 主题文件目录
├── test/                        # 测试文件
│   ├── webhook-handler.test.js
│   ├── wechat-formatter.test.js
│   ├── article-template-generator.test.js
│   ├── analytics.test.js
│   └── run-all-tests.js
├── webhook-handler.js           # Webhook 处理器
├── wechat-formatter.js          # 公众号排版工具
├── article-template-generator.js # 文章模板生成器
├── analytics.js                 # 数据分析脚本
├── config.example.json          # 示例配置文件
├── package.json
└── README.md
```

---

## 安装依赖

```bash
cd tools
npm install
```

## 运行测试

```bash
# 运行所有测试
npm test

# 运行单个测试
npm run test:webhook
npm run test:formatter
npm run test:generator
npm run test:analytics
```

## 环境变量配置

可以通过环境变量配置各个平台：

```bash
# Webhook 服务器
export WEBHOOK_PORT=3000
export WEBHOOK_HOST=0.0.0.0

# GitHub
export GITHUB_SECRET=your-github-secret

# GitLab
export GITLAB_SECRET=your-gitlab-secret

# Discord
export DISCORD_PUBLIC_KEY=your-discord-public-key

# Slack
export SLACK_SIGNING_SECRET=your-slack-signing-secret
export SLACK_BOT_TOKEN=your-slack-bot-token

# Telegram
export TELEGRAM_BOT_TOKEN=your-telegram-bot-token
export TELEGRAM_SECRET_TOKEN=your-telegram-secret-token

# 微信公众号
export WECHAT_TOKEN=your-wechat-token
export WECHAT_ENCODING_AES_KEY=your-aes-key
export WECHAT_APP_ID=your-app-id

# OpenClaw
export OPENCLAW_URL=http://127.0.0.1:18789
export OPENCLAW_TOKEN=your-openclaw-token
```

## 开发指南

### 添加新的平台适配器

1. 在 `adapters/` 目录创建新文件，如 `new-platform-adapter.js`
2. 继承 `BaseAdapter` 类
3. 实现必要的方法：`verifySignature`, `parseEvent`
4. 在 `adapters/index.js` 中导出新适配器

```javascript
// adapters/new-platform-adapter.js
import { BaseAdapter } from './base-adapter.js';

export class NewPlatformAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'new-platform';
  }

  async verifySignature(req, rawBody) {
    // 实现签名验证
  }

  async parseEvent(req) {
    // 解析事件
    return {
      platform: this.name,
      event: 'event_type',
      data: req.body
    };
  }
}
```

### 添加新主题

在 `wechat-formatter.js` 的 `themes` 对象中添加新主题：

```javascript
export const themes = {
  // ... 现有主题
  custom: {
    name: '自定义',
    colors: {
      primary: '#333',
      // ... 其他颜色配置
    },
    fonts: {
      body: '字体配置',
      code: '代码字体'
    },
    lineHeight: 1.8,
    paragraphSpacing: '1em'
  }
};
```

### 添加新模板

在 `article-template-generator.js` 的 `templates` 对象中添加：

```javascript
export const templates = {
  // ... 现有模板
  custom: {
    name: '自定义模板',
    description: '模板描述',
    variables: ['title', 'author', 'date'],
    content: `# {{title}}\n...`
  }
};
```

## 许可证

MIT License