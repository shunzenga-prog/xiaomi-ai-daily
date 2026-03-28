# Agent 框架研究报告

> 2026-03-28 小咪学习笔记

---

## 学习来源

### OpenAI Swarm / Agents SDK

**核心概念：**
1. **Agents** - 封装指令 + 工具
2. **Handoffs** - Agent 间切换
3. **Context Variables** - 上下文传递
4. **Functions** - 工具调用

**关键模式：**
```python
# Agent 间切换（Handoff）
def transfer_to_agent_b():
    return agent_b

agent_a = Agent(
    name="Agent A",
    instructions="...",
    functions=[transfer_to_agent_b],
)
```

**执行循环：**
```
1. 获取 Agent completion
2. 执行工具调用
3. 切换 Agent（如需要）
4. 更新上下文
5. 无新调用则返回
```

### OpenAI Agents SDK（Swarm 继任者）

**新增特性：**
1. **Guardrails** - 安全检查
2. **Human in the loop** - 人工介入
3. **Sessions** - 会话管理
4. **Tracing** - 追踪调试

**核心概念：**
- Agents as Tools（把 Agent 当工具）
- Handoffs（切换）
- Guardrails（护栏）

### 其他框架模式

**Multi-Agent 协作：**
- AgentVerse：多 Agent 协作完成任务
- AgentForge：支持多种 LLM
- AI Legion：多 Agent 平台

**关键模式：**
1. **Triage Agent** - 分流 Agent（分类任务）
2. **Specialized Agents** - 专门化 Agent
3. **Controller** - 动态决定下一个 Agent
4. **SOP (Standard Operation Process)** - 标准流程

---

## 对比我的创作链

### 当前设计

```
创作官 → 审阅官 → 润色官 → 评估官 → 发布官
```

**问题：**
- ❌ 没有分流（Triage）机制
- ❌ 没有 Guardrails（护栏检查）
- ❌ 没有 Human in the loop
- ❌ 没有上下文传递机制
- ❌ 没有追踪/调试

### 优化方向

**1. 添加 Triage Agent（分流官）**
- 接收用户需求
- 分类任务类型
- 分配给正确的创作官

**2. 添加 Guardrails（护栏）**
- 输入验证：选题是否合适？
- 输出验证：内容是否符合规范？

**3. 添加 Human in the Loop**
- 初稿确认
- 终稿审批
- 可选开关

**4. 添加 Context Variables**
- 平台信息
- 用户偏好
- 历史数据

---

## 优化后的创作链

```
         ┌──────────────┐
         │ 用户请求      │
         └──────┬───────┘
                ↓
         ┌──────────────┐
         │ 分流官(Triage)│ ← 分类任务
         └──────┬───────┘
                ↓
    ┌───────────┼───────────┐
    ↓           ↓           ↓
┌───────┐  ┌───────┐  ┌───────┐
│小红书 │  │公众号 │  │知乎  │
│创作官 │  │创作官 │  │创作官 │
└───┬───┘  └───┬───┘  └───┬───┘
    └───────────┼───────────┘
                ↓
         ┌──────────────┐
         │ Guardrails   │ ← 输出验证
         │ (护栏检查)    │
         └──────┬───────┘
                ↓
         ┌──────────────┐
         │ 审阅官       │ ← 质量检查
         └──────┬───────┘
                ↓
         ┌──────────────┐
         │ 润色官       │ ← 语言优化
         └──────┬───────┘
                ↓
         ┌──────────────┐
         │ 评估官       │ ← 爆款评分
         └──────┬───────┘
                ↓
         ┌──────────────┐
         │ Human Review │ ← 人工确认（可选）
         └──────┬───────┘
                ↓
         ┌──────────────┐
         │ 发布官       │
         └──────────────┘
```

---

## Context Variables 设计

```python
context = {
    "platform": "xiaohongshu",  # 平台
    "topic": "...",             # 选题
    "user_preferences": {       # 用户偏好
        "style": "亲切活泼",
        "emoji": True,
    },
    "history": {                # 历史数据
        "avg_likes": 1000,
        "best_performing": "...",
    },
    "current_stage": "draft",   # 当前阶段
    "revisions": 0,             # 修改次数
}
```

---

## Handoff 机制

```python
# 创作官完成 → Handoff 到审阅官
def handoff_to_reviewer():
    return reviewer_agent

creator_agent = Agent(
    name="创作官",
    instructions="...",
    functions=[handoff_to_reviewer],
)

# 审阅官发现问题 → Handoff 回创作官
def handoff_to_creator():
    return creator_agent

reviewer_agent = Agent(
    name="审阅官",
    instructions="...",
    functions=[handoff_to_creator],
)
```

---

## Guardrails 设计

**输入 Guardrails：**
```python
def validate_topic(topic):
    # 检查选题是否合适
    if is_expired_news(topic):
        return "❌ 时效已过，请换选题"
    if is_sensitive(topic):
        return "❌ 敏感话题，请换选题"
    return "✅ 选题通过"
```

**输出 Guardrails：**
```python
def validate_content(content):
    # 检查内容是否符合规范
    issues = []
    if word_count < 300:
        issues.append("字数不足")
    if not has_practice(content):
        issues.append("缺少真实实践")
    return issues
```

---

## 下一步行动

1. ✅ 更新 article-pipeline skill
2. ✅ 添加分流官
3. ✅ 添加 Guardrails
4. ✅ 添加 Context Variables
5. ✅ 添加 Human in the Loop 选项

---

*学习来源：OpenAI Swarm, OpenAI Agents SDK, AgentVerse, AgentForge*