---
name: lobster-dispatcher
description: 智能分配龙虾任务，避免闲置。根据任务类型自动匹配最适合的龙虾，记录任务状态和效果。触发：派活、分配任务、龙虾在干嘛。
---

# 龙虾调度器

智能管理龙虾军团，让每个龙虾都有活干。

## ⚠️ 核心原则：Agent 是动力

**Agent（龙虾军团）是创作的动力引擎！**

- 不维护的 agent 会闲置、退化
- 每次心跳必须检查龙虾状态
- 龙虾效果直接影响创作质量

## 触发场景

- "派活"、"分配任务"
- "龙虾在干嘛"
- 定时任务检查龙虾状态

## 快速使用

```python
# 1. 检查龙虾状态
sessions_list()

# 2. 分配任务
sessions_spawn(
  label="research-lobster",
  task="追踪今日AI热点",
  model="qwen3.5-plus",
  mode="run"
)

# 3. 记录到 MAINTENANCE.md
```

## 龙虾能力（简版）

| 龙虾 | 适合任务 |
|------|----------|
| 🦞 代码 | 写脚本、搭服务 |
| 🔍 研究 | 热点追踪、竞品分析 |
| 🎨 设计 | 排版、封面设计 |
| 📁 档案 | 整理、memory维护 |
| 🏄 冲浪 | 找案例、收集素材 |
| 📱 运营 | 发布、互动 |

**详细能力矩阵见** `references/lobster-capability-matrix.md`

## 调度原则

1. **优先级匹配**：P0 紧急 → 立即分配
2. **负载均衡**：闲置龙虾优先
3. **协作模式**：复杂任务多龙虾协作

## 输出格式

```markdown
# 龙虾调度报告 - YYYY-MM-DD HH:MM

## 当前状态

| 龙虾 | 状态 | 任务 |
|------|------|------|
| 🦞 代码 | ✅ 完成 | Web查看器 |
| 🔍 研究 | 🏃 运行中 | 热点追踪 |
| 🎨 设计 | 😴 闲置 | - |

## 本次调度

- 分配：冲浪龙虾 → 找爆款案例
- 输出：reports/xiaohongshu-cases.md
```

---
*任务模板见 references/lobster-capability-matrix.md*