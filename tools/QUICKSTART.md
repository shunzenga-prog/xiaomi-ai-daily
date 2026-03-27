# 🚀 模板生成器快速指南

> 3 分钟上手，开始高效创作

---

## 📦 一句话介绍

`template-generator.js` 是一个文章模板生成工具，基于爆款分析自动生成：
- ✅ 5 个爆款标题
- ✅ 3 个开头钩子
- ✅ 完整文章结构
- ✅ 金句建议
- ✅ 互动问题
- ✅ 发布前检查清单

---

## ⚡ 快速开始

### Step 1: 进入工具目录

```bash
cd /home/zengshun/.openclaw/workspace/tools
```

### Step 2: 查看可用模板

```bash
node template-generator.js list
```

输出：
```
📚 模板库

  tutorial   场景教程    40%  - 解决具体问题的实操指南
  review     工具测评    25%  - 对比分析 + 真实体验
  story      实战案例    20%  - 真实经历 + 情感共鸣
  opinion    观点输出    10%  - 趋势分析 + 独特见解
  resource   资源分享    5%   - 工具/资料/模板整理
```

### Step 3: 生成你的模板

**方式 A：预览模板结构**
```bash
node template-generator.js preview tutorial
```

**方式 B：生成并查看（输出到控制台）**
```bash
node template-generator.js generate tutorial "AI 自动化工作流"
```

**方式 C：导出为 Markdown 文件**
```bash
node template-generator.js export tutorial "AI 自动化工作流" ./templates/新模板.md
```

---

## 📋 常用命令速查

| 命令 | 作用 | 示例 |
|------|------|------|
| `list` | 列出所有模板 | `node template-generator.js list` |
| `preview [类型]` | 预览模板结构 | `node template-generator.js preview story` |
| `generate [类型] [主题]` | 生成模板（控制台） | `node template-generator.js generate review "Notion 测评"` |
| `export [类型] [主题] [路径]` | 导出模板（文件） | `node template-generator.js export story "我的创业故事" ./templates/story.md` |
| `--help` | 显示帮助 | `node template-generator.js --help` |

---

## 🎯 实战示例

### 示例 1：写教程文章

```bash
# 生成教程模板
node template-generator.js export tutorial "AI 写作技巧" ./templates/教程-AI 写作.md

# 打开生成的模板文件，填充内容
# 发布！
```

### 示例 2：写测评文章

```bash
# 生成测评模板
node template-generator.js export review "ChatGPT vs 文心一言" ./templates/测评-ChatGPT.md

# 按照模板结构填写对比内容
# 发布！
```

### 示例 3：写故事文章

```bash
# 生成故事模板
node template-generator.js export story "从 0 到 10 万粉" ./templates/故事-成长.md

# 填入你的真实经历
# 发布！
```

---

## 📊 模板类型说明

### 📘 tutorial - 场景教程（40%）
**适用：** 实操指南、技能分享、教程类文章

**结构：**
1. 痛点场景 → 2. 解决方案 → 3. 详细步骤 → 4. 案例佐证 → 5. 行动号召

**示例主题：**
- AI 自动化工作流搭建
- 提示词写作技巧
- 效率工具使用指南

---

### 🔍 review - 工具测评（25%）
**适用：** 产品对比、选购指南、使用体验

**结构：**
1. 测评背景 → 2. 产品概览 → 3. 深度体验 → 4. 对比总结 → 5. 购买建议

**示例主题：**
- ChatGPT vs 文心一言
- Notion vs Obsidian
- 5 款 AI 写作工具横评

---

### 📖 story - 实战案例（20%）
**适用：** 个人经历、成长故事、案例分享

**结构：**
1. 故事背景 → 2. 转折点 → 3. 行动过程 → 4. 结果展示 → 5. 感悟启发

**示例主题：**
- 我的 AI 创业故事
- 从 0 到 10 万粉的经历
- 那个不被看好的人后来怎样了

---

### 💡 opinion - 观点输出（10%）
**适用：** 趋势分析、行业洞察、观点文章

**结构：**
1. 现象引入 → 2. 主流观点 → 3. 深度分析 → 4. 趋势预判 → 5. 行动建议

**示例主题：**
- AI 智能体将爆发
- 关于 AI 写作，90% 的人都想错了
- 停止盲目追模型

---

### 🎁 resource - 资源分享（5%）
**适用：** 工具推荐、资料整理、资源包

**结构：**
1. 资源说明 → 2. 资源清单 → 3. 使用指南 → 4. 获取方式 → 5. 互动引导

**示例主题：**
- 10 个 AI 写作资源
- AI 创作者工具包
- 提示词模板合集

---

## 💡 使用技巧

### 技巧 1：先用预置模板
模板库中有 5 个预置模板，包含详细示例：
```bash
cd templates
# 打开任意模板参考
```

### 技巧 2：生成后手动优化
生成的模板是基础，根据实际情况调整：
- 替换主题相关的占位符
- 调整字数分配
- 增加个性化内容

### 技巧 3：建立自己的模板库
将生成的优质模板保存到 `templates/` 目录：
```bash
node template-generator.js export tutorial "我的主题" ./templates/我的专属模板.md
```

### 技巧 4：配合选题库使用
从选题库选择主题 → 生成模板 → 填充内容 → 发布

---

## ✅ 发布前检查

使用模板生成的文章，发布前检查：

### 标题（5 项）
- [ ] 包含具体数字
- [ ] 有身份标签
- [ ] 有量化结果
- [ ] 有情绪词
- [ ] 25 字以内

### 开头（4 项）
- [ ] 前 3 句能抓住注意力
- [ ] 用「你」直接对话读者
- [ ] 有具体场景或数据
- [ ] 有情绪递进

### 结构（4 项）
- [ ] 5 个以上小标题
- [ ] 小标题是问题/利益点
- [ ] 每 500 字有 1 张图
- [ ] 有实操指南

### 金句（3 项）
- [ ] 至少 3 句可转发的金句
- [ ] 金句不超过 30 字
- [ ] 有对仗或反差

### 互动（3 项）
- [ ] 结尾有提问
- [ ] 提问容易回答
- [ ] 有激励（资料/抽奖）

---

## 🆘 常见问题

### Q: 生成的模板不好用怎么办？
A: 模板是起点不是终点，根据实际情况调整结构和内容。

### Q: 可以修改模板生成器吗？
A: 当然！模板生成器是开源的，可以根据需求定制。

### Q: 如何保存生成的模板？
A: 使用 `export` 命令直接导出为 Markdown 文件。

### Q: 模板会限制创作自由吗？
A: 不会。模板提供的是经过验证的结构，熟练后可以自由发挥。

---

## 📞 需要帮助？

```bash
# 查看完整帮助
node template-generator.js --help
```

---

*快速指南 by template-generator.js*
*最后更新：2026-03-27*
