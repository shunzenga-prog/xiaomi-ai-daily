#!/usr/bin/env node
/**
 * 文章模板生成器
 *
 * 功能特性：
 * - 支持多种文章类型：技术教程、产品评测、心得体会、新闻资讯
 * - 根据类型生成结构化模板
 * - 支持变量替换和个性化配置
 * - 支持自定义模板
 *
 * 使用方法：
 *   node article-template-generator.js tutorial -o output.md
 *   node article-template-generator.js review --title "我的新手机"
 *   node article-template-generator.js --list
 */

import { program } from 'commander';
import fs from 'fs/promises';
import path from 'path';

// ==================== 模板定义 ====================

export const templates = {
  // 技术教程模板
  tutorial: {
    name: '技术教程',
    description: '适合编程教程、技术指南等文章',
    variables: ['title', 'author', 'date', 'tags', 'difficulty', 'duration'],
    content: `# {{title}}

> 作者：{{author}} | 日期：{{date}} | 难度：{{difficulty}} | 预计时长：{{duration}}

## 前言

<!-- 简要介绍本教程的目的和背景 -->

## 准备工作

### 环境要求

<!-- 列出所需的环境和工具 -->

- 操作系统：
- 编程语言版本：
- 依赖包：

### 相关知识

<!-- 列出读者需要预先了解的知识点 -->

## 正文

### 第一步：项目初始化

<!-- 详细步骤说明 -->

\`\`\`bash
# 示例代码
\`\`\`

### 第二步：核心实现

<!-- 详细步骤说明 -->

\`\`\`javascript
// 示例代码
\`\`\`

### 第三步：功能完善

<!-- 详细步骤说明 -->

## 常见问题

### 问题 1：XXX 怎么解决？

**解决方案：**

### 问题 2：XXX 报错怎么办？

**解决方案：**

## 总结

<!-- 总结本教程的要点 -->

## 参考资料

- [参考链接 1](url)
- [参考链接 2](url)

---

> 标签：{{tags}}
`
  },

  // 产品评测模板
  review: {
    name: '产品评测',
    description: '适合产品体验、测评报告等文章',
    variables: ['title', 'author', 'date', 'productName', 'productType', 'price'],
    content: `# {{title}}

> 作者：{{author}} | 日期：{{date}}

## 产品信息

| 项目 | 内容 |
|------|------|
| 产品名称 | {{productName}} |
| 产品类型 | {{productType}} |
| 参考价格 | {{price}} |

## 开箱体验

<!-- 描述产品的开箱过程和第一印象 -->

### 外观设计

<!-- 外观描述 -->

### 包装内容

- 产品本体
- 说明书
- 配件

## 详细评测

### 功能特性

<!-- 详细介绍产品功能 -->

1. **功能一**：描述
2. **功能二**：描述
3. **功能三**：描述

### 使用体验

<!-- 分享使用过程中的感受 -->

#### 优点

- ✅ 优点 1
- ✅ 优点 2
- ✅ 优点 3

#### 不足

- ❌ 不足 1
- ❌ 不足 2

### 性能测试

<!-- 如果有性能数据，在此展示 -->

| 测试项目 | 测试结果 |
|----------|----------|
| 项目 1 | 结果 1 |
| 项目 2 | 结果 2 |

## 与竞品对比

| 对比项 | 本产品 | 竞品 A | 竞品 B |
|--------|--------|--------|--------|
| 价格 | {{price}} | - | - |
| 特点 1 | ✓ | ✗ | ✓ |
| 特点 2 | ✓ | ✓ | ✗ |

## 总结

### 评分

| 评分项 | 分数（满分 5 分） |
|--------|-------------------|
| 外观设计 | ⭐⭐⭐⭐⭐ |
| 功能性 | ⭐⭐⭐⭐⭐ |
| 性价比 | ⭐⭐⭐⭐⭐ |
| **总评** | ⭐⭐⭐⭐⭐ |

### 购买建议

<!-- 给出购买建议 -->

---

> 本文仅代表个人观点，仅供参考。
`
  },

  // 心得体会模板
  experience: {
    name: '心得体会',
    description: '适合个人感悟、经验分享等文章',
    variables: ['title', 'author', 'date', 'category'],
    content: `# {{title}}

> 作者：{{author}} | 日期：{{date}} | 分类：{{category}}

## 缘起

<!-- 描述写作这篇文章的背景和契机 -->

## 主要内容

### 要点一

<!-- 详细阐述 -->

#### 背景

#### 思考

#### 结论

### 要点二

<!-- 详细阐述 -->

#### 背景

#### 思考

#### 结论

### 要点三

<!-- 详细阐述 -->

#### 背景

#### 思考

#### 结论

## 感悟与收获

<!-- 总结个人的感悟和收获 -->

1. **感悟一**：描述
2. **感悟二**：描述
3. **感悟三**：描述

## 给读者的建议

<!-- 给读者的建议 -->

## 后续计划

<!-- 后续的计划或行动 -->

---

> 如果这篇文章对你有帮助，欢迎点赞收藏 📚
`
  },

  // 新闻资讯模板
  news: {
    name: '新闻资讯',
    description: '适合新闻报道、行业动态等文章',
    variables: ['title', 'author', 'date', 'source'],
    content: `# {{title}}

> 来源：{{source}} | 作者：{{author}} | 日期：{{date}}

## 摘要

<!-- 简要概括新闻要点 -->

---

## 正文

### 事件背景

<!-- 描述事件的背景 -->

### 详细内容

<!-- 新闻主要内容 -->

> 引用原话或关键信息

### 相关数据

<!-- 如果有数据支持，在此展示 -->

| 数据项 | 数值 |
|--------|------|
| 数据 1 | 数值 1 |
| 数据 2 | 数值 2 |

### 影响分析

<!-- 分析事件的影响 -->

#### 对行业的影响

#### 对用户的影响

### 各方反应

<!-- 收集各方反应 -->

**官方回应：**

> 引用官方回应

**专家观点：**

> 引用专家观点

**用户反馈：**

> 引用用户反馈

## 相关链接

- [相关链接 1](url)
- [相关链接 2](url)

## 后续关注

<!-- 值得持续关注的点 -->

---

> 声明：本文内容仅供参考，请以官方信息为准。
`
  },

  // 读书笔记模板
  booknote: {
    name: '读书笔记',
    description: '适合书籍读后感、笔记整理等文章',
    variables: ['title', 'author', 'date', 'bookName', 'bookAuthor', 'rating'],
    content: `# {{title}}

> 书籍：{{bookName}} | 作者：{{bookAuthor}} | 评分：{{rating}}/10
> 笔记人：{{author}} | 日期：{{date}}

## 书籍简介

<!-- 简要介绍书籍内容 -->

## 核心观点

### 观点一

<!-- 摘录和解读 -->

> 原文摘录

**解读：**

### 观点二

<!-- 摘录和解读 -->

> 原文摘录

**解读：**

### 观点三

<!-- 摘录和解读 -->

> 原文摘录

**解读：**

## 精彩摘录

> 摘录 1

> 摘录 2

> 摘录 3

## 思维导图

\`\`\`
中心主题
├── 分支 1
│   ├── 子分支 1-1
│   └── 子分支 1-2
├── 分支 2
│   ├── 子分支 2-1
│   └── 子分支 2-2
└── 分支 3
\`\`\`

## 个人感悟

<!-- 分享个人感悟 -->

## 实践应用

<!-- 如何将书中知识应用到实践中 -->

## 推荐理由

<!-- 推荐这本书的理由 -->

1. 理由一
2. 理由二
3. 理由三

---

> 推荐阅读指数：⭐⭐⭐⭐⭐
`
  },

  // 项目复盘模板
  project: {
    name: '项目复盘',
    description: '适合项目总结、复盘报告等文章',
    variables: ['title', 'author', 'date', 'projectName', 'duration', 'teamSize'],
    content: `# {{title}}

> 项目：{{projectName}} | 周期：{{duration}} | 团队规模：{{teamSize}}人
> 作者：{{author}} | 日期：{{date}}

## 项目概述

### 项目背景

<!-- 描述项目背景 -->

### 项目目标

1. 目标一
2. 目标二
3. 目标三

### 项目成果

<!-- 描述项目最终成果 -->

## 过程回顾

### 规划阶段

<!-- 描述规划过程 -->

### 执行阶段

<!-- 描述执行过程 -->

### 收尾阶段

<!-- 描述收尾过程 -->

## 数据总结

| 指标 | 目标 | 实际 | 完成率 |
|------|------|------|--------|
| 指标 1 | - | - | -% |
| 指标 2 | - | - | -% |
| 指标 3 | - | - | -% |

## 成功经验

### 做得好的地方

1. **经验一**：描述
2. **经验二**：描述

### 可复制的做法

- 做法 1
- 做法 2

## 问题与改进

### 遇到的问题

1. **问题一**：描述
2. **问题二**：描述

### 改进措施

| 问题 | 改进措施 | 负责人 |
|------|----------|--------|
| 问题 1 | 措施 1 | - |
| 问题 2 | 措施 2 | - |

## 团队协作

<!-- 团队协作方面的总结 -->

## 经验教训

### 教训一

<!-- 描述教训 -->

### 教训二

<!-- 描述教训 -->

## 后续行动

- [ ] 行动项 1
- [ ] 行动项 2
- [ ] 行动项 3

## 致谢

<!-- 感谢相关人员 -->

---

> 本次复盘文档将归档保存，作为后续项目参考。
`
  }
};

// ==================== 模板生成器类 ====================

export class ArticleTemplateGenerator {
  constructor(customTemplates = {}) {
    this.templates = { ...templates, ...customTemplates };
  }

  /**
   * 获取模板列表
   */
  listTemplates() {
    return Object.entries(this.templates).map(([key, template]) => ({
      key,
      name: template.name,
      description: template.description,
      variables: template.variables
    }));
  }

  /**
   * 生成文章模板
   */
  generate(templateKey, variables = {}) {
    const template = this.templates[templateKey];

    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    let content = template.content;

    // 替换变量
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value || '');
    }

    // 清理未替换的变量
    content = content.replace(/{{[^}]+}}/g, '');

    return content;
  }

  /**
   * 添加自定义模板
   */
  addTemplate(key, template) {
    this.templates[key] = template;
    return this;
  }

  /**
   * 从文件加载模板
   */
  async loadTemplateFromFile(key, filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const name = path.basename(filePath, path.extname(filePath));

    this.templates[key] = {
      name,
      description: `自定义模板: ${name}`,
      variables: this._extractVariables(content),
      content
    };

    return this;
  }

  /**
   * 提取模板变量
   */
  _extractVariables(content) {
    const regex = /{{([^}]+)}}/g;
    const variables = new Set();
    let match;

    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1].trim());
    }

    return Array.from(variables);
  }

  /**
   * 保存模板到文件
   */
  async saveTemplateToFile(templateKey, filePath) {
    const template = this.templates[templateKey];
    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }
    await fs.writeFile(filePath, template.content);
    return this;
  }
}

// ==================== CLI 入口 ====================

program
  .name('article-template-generator')
  .description('文章模板生成器')
  .version('1.0.0')
  .argument('[template]', '模板类型 (tutorial, review, experience, news, booknote, project)')
  .option('-o, --output <file>', '输出文件路径')
  .option('-t, --title <title>', '文章标题')
  .option('-a, --author <author>', '作者名称', '佚名')
  .option('-d, --date <date>', '日期', new Date().toLocaleDateString('zh-CN'))
  .option('--list', '列出所有可用模板')
  .option('--variables', '显示模板变量')
  .action(async (templateKey, options) => {
    const generator = new ArticleTemplateGenerator();

    // 列出模板
    if (options.list) {
      console.log('\n可用的文章模板：\n');
      generator.listTemplates().forEach(t => {
        console.log(`  ${t.key.padEnd(12)} - ${t.name}`);
        console.log(`                ${t.description}`);
        console.log(`                变量: ${t.variables.join(', ')}`);
        console.log();
      });
      return;
    }

    // 显示模板变量
    if (options.variables && templateKey) {
      const template = generator.templates[templateKey];
      if (template) {
        console.log(`\n模板 "${template.name}" 的变量：`);
        template.variables.forEach(v => console.log(`  - ${v}`));
      } else {
        console.log(`模板 "${templateKey}" 不存在`);
      }
      return;
    }

    // 生成模板
    if (!templateKey) {
      console.log('请指定模板类型，或使用 --list 查看可用模板');
      return;
    }

    const variables = {
      title: options.title || '未命名文章',
      author: options.author,
      date: options.date,
      productName: options.title,
      bookName: options.title,
      projectName: options.title,
      difficulty: '初级',
      duration: '30分钟',
      tags: '待添加',
      category: '其他',
      productType: '产品',
      price: '待定',
      source: '网络',
      bookAuthor: '未知',
      rating: '8',
      teamSize: '1'
    };

    try {
      const content = generator.generate(templateKey, variables);

      if (options.output) {
        await fs.writeFile(options.output, content);
        console.log(`✅ 已生成: ${options.output}`);
      } else {
        console.log(content);
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