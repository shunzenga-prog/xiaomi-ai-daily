# ClawHub 技能搜索报告

**日期：** 2026-03-28 21:40  
**目的：** 寻找现成的技能方案，避免重复开发

---

## 🎯 boss 的关键提醒

**教训：** 先搜索有没有现成方案，不要自己从头设计！

---

## 📊 发现的现成技能

### 热点追踪相关

| 技能名称 | 描述 | 评分 | 可用性 |
|----------|------|------|--------|
| hotspot-aggregator | 热点聚合器 | 3.129 | ⭐⭐⭐ 高度匹配 |
| xiaohongshu-hotspot-writer1 | 小红书热点写作 | 3.282 | ⭐⭐⭐ 小红书方向 |
| ai-hotspot-daily | AI热点日报 | 3.089 | ⭐⭐⭐ AI方向 |

### AI趋势相关

| 技能名称 | 描述 | 评分 | 可用性 |
|----------|------|------|--------|
| github-ai-trends | GitHub AI趋势 | 3.562 | ⭐⭐⭐ 技术趋势 |
| openclaw-trends | OpenClaw趋势 | 3.198 | ⭐⭐⭐ 官方趋势 |
| google-trends | Google趋势 | 3.527 | ⭐⭐⭐ 通用趋势 |

### 内容策划相关

| 技能名称 | 描述 | 评分 | 可用性 |
|----------|------|------|--------|
| content-brainstorm | 自媒体选题策划 | 1.118 | ⭐⭐⭐ 选题方向 |
| content-ideas-generator | 内容创意生成器 | 1.084 | ⭐⭐⭐ 创意方向 |

### AI新闻相关

| 技能名称 | 描述 | 评分 | 可用性 |
|----------|------|------|--------|
| ai-news-researcher | AI新闻研究员 | 3.383 | ⭐⭐⭐ 新闻方向 |
| news-aggregator | 新闻聚合器 | 3.578 | ⭐⭐⭐ 通用新闻 |

---

## 💡 我自己创建的技能对比

### hotspot-tracker（我创建的）

**问题：**
- ❌ SKILL.md 太冗长（理论、模板、公式）
- ❌ 没有实际可执行脚本
- ❌ 不符合 skill-creator 规范

### hotspot-aggregator（现成的）

**预期优势：**
- ✅ 可能已有完整实现
- ✅ 经过他人验证
- ✅ 符合 AgentSkills 规范

---

## 🔧 学习的 Skill 规范

从 skill-creator SKILL.md 学到：

1. **Concise is Key** - 不要冗余，SKILL.md 应简洁（<5k words）
2. **三层加载系统**
   - 元数据始终在 context
   - SKILL.md body 触发时加载
   - references/scripts/assets 按需加载
3. **结构规范**
   ```
   skill-name/
   ├── SKILL.md (required)
   └── scripts/ (可执行脚本)
   └── references/ (详细文档)
   └── assets/ (输出资源)
   ```
4. **不要包含**
   - README.md ❌
   - CHANGELOG.md ❌
   - 其他辅助文档 ❌

---

## 📝 行动计划

### 立即行动

1. **等待 ClawHub API限制重置**
2. **安装以下技能：**
   - hotspot-aggregator（热点聚合）
   - ai-news-researcher（AI新闻研究）
   - content-brainstorm（内容策划）

### 后续优化

1. **删除或优化自己创建的技能**
   - hotspot-tracker → 等安装现成版本后决定
   - lobster-dispatcher → 简化 SKILL.md

2. **按规范重构技能**
   - 简化 SKILL.md，去掉理论部分
   - 加入具体命令/脚本
   - 详细内容移到 references/

---

## 📌 待安装清单

```bash
# 等 API 重置后执行
clawhub install hotspot-aggregator --dir skills
clawhub install ai-news-researcher --dir skills
clawhub install content-brainstorm --dir skills
```

---

## 🎯 核心收获

**boss 的提醒让我明白：**

1. **不要重复造轮子** - ClawHub 有现成的技能 marketplace
2. **先搜索再开发** - 避免浪费时间自己瞎设计
3. **学习规范** - skill-creator 提供了完整的技能开发规范
4. **长期维护** - 安装现成技能后也要持续更新和优化

---

*报告生成：小咪 🐱*  
*下次更新：安装现成技能后*