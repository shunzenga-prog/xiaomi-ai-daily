---
name: article-pipeline
description: 文章创作完整流程。多Agent协作，包含分流、创作、护栏检查、审阅、润色、评估、人工确认、发布环节。触发：创作文章、写文章、文章pipeline。
---

# 文章创作链（Article Pipeline）

基于 OpenAI Agents SDK 模式的多 Agent 协作创作流程。

## 触发场景

- "创作一篇文章"
- "写文章"
- "执行文章pipeline"

## 架构设计

```
用户请求
    ↓
┌─────────────┐
│ 分流官      │ ← 分类任务
└─────┬───────┘
      ↓
┌─────────────┐
│ Guardrails  │ ← 输入验证
└─────┬───────┘
      ↓
┌─────────────┐
│ 创作官      │ ← 写初稿
└─────┬───────┘
      ↓
┌─────────────┐
│ Guardrails  │ ← 输出验证
└─────┬───────┘
      ↓
┌─────────────┐
│ 审阅官      │ ← 质量检查
└─────┬───────┘
      ↓
┌─────────────┐
│ 润色官      │ ← 语言优化
└─────┬───────┘
      ↓
┌─────────────┐
│ 评估官      │ ← 爆款评分
└─────┬───────┘
      ↓
┌─────────────┐
│ Human Loop  │ ← 人工确认（可选）
└─────┬───────┘
      ↓
┌─────────────┐
│ 发布官      │ ← 发布
└─────────────┘
```

## Context Variables

```python
context = {
    "platform": "xiaohongshu|wechat",
    "topic": "选题内容",
    "stage": "triage|creation|review|...",
    "revisions": 0,
    "issues": [],
    "score": 0,
    "human_review": False,  # 是否需要人工确认
}
```

## Stage 0: 分流官（Triage）

**职责：** 分类任务，分配正确的创作官

**决策逻辑：**
```
if 平台 == "小红书":
    handoff_to(xiaohongshu_creator)
elif 平台 == "公众号":
    handoff_to(wechat_creator)
else:
    ask_user("请选择平台")
```

**输出：** 确定平台 + Context Variables 初始化

---

## Stage 1: Guardrails（输入验证）

**职责：** 验证选题是否合适

**验证项：**
```
□ 时效性：新闻类是否在48小时内？
□ 敏感性：是否涉及敏感话题？
□ 可行性：是否有足够信息创作？
□ 合规性：是否符合平台规范？
```

**决策：**
- ✅ 通过 → 进入创作
- ❌ 不通过 → 返回问题，建议换选题

---

## Stage 2: 创作官（初稿）

**职责：** 根据 skills 写初稿

**选择 Skill：**
```
if platform == "小红书":
    使用 xiaohongshu-writer
else:
    使用 wechat-writer
```

**输出：** 初稿（标题 + 正文 + 封面建议）

---

## Stage 3: Guardrails（输出验证）

**职责：** 验证初稿是否符合规范

**验证项：**
```
□ 字数：是否符合平台要求？
□ 结构：是否完整？
□ 小咪风格：是否有真实实践？
□ 时效标注：是否正确标注？
```

**决策：**
- ✅ 通过 → 进入审阅
- ⚠️ 需修改 → 返回创作官修改
- ❌ 不合格 → 重新创作

---

## Stage 4: 审阅官（检查）

**职责：** 深度质量检查

**检查清单：**
```
□ 时效性验证
□ 真实性验证
□ 逻辑性检查
□ 完整性检查
□ 平台适配检查
```

**Handoff 机制：**
```python
def handoff_to_creator():
    context["revisions"] += 1
    context["issues"] = issues
    return creator_agent

# 如果有问题，handoff 回创作官
if issues:
    return handoff_to_creator()
```

**输出：** 审阅报告

---

## Stage 5: 润色官（优化）

**职责：** 语言优化

**优化维度：**
- 标题吸引力
- 开头抓眼球
- 正文流畅度
- 结尾互动引导

**输出：** 优化稿 + 优化说明

---

## Stage 6: 评估官（评分）

**职责：** 爆款潜力评估

**评分维度：**
```
标题（30%）: ⭐⭐⭐⭐⭐
内容（30%）: ⭐⭐⭐⭐⭐
体验（20%）: ⭐⭐⭐⭐⭐
传播（20%）: ⭐⭐⭐⭐⭐
```

**输出：** 总分 + 爆款潜力预测

---

## Stage 7: Human in the Loop（可选）

**职责：** 人工确认

**触发条件：**
```
context["human_review"] == True
# 或评分低于阈值
# 或首次发布
```

**流程：**
1. 发送终稿给用户
2. 等待用户确认
3. 根据反馈修改或发布

---

## Stage 8: 发布官（发布）

**职责：** 确认发布

**发布清单：**
```
□ 内容终稿确认
□ 封面图片准备
□ 发布时间选择
□ 平台确认
```

---

## 完整执行示例

```python
# 初始化 Context
context = {
    "platform": "小红书",
    "topic": "2026年最值得关注的AI工具",
    "human_review": True,
}

# 执行 Pipeline
result = article_pipeline.run(context)

# 流程自动执行
Stage 0: 分流官 → 确定小红书平台
Stage 1: Guardrails → 选题通过
Stage 2: 创作官 → 生成初稿
Stage 3: Guardrails → 初稿通过
Stage 4: 审阅官 → 质量检查
Stage 5: 润色官 → 语言优化
Stage 6: 评估官 → 评分预测
Stage 7: Human Loop → 等待用户确认
Stage 8: 发布官 → 发布确认
```

## 关键改进（学习自 OpenAI Agents SDK）

1. **分流官** - 智能分类任务
2. **Guardrails** - 输入输出双重验证
3. **Context Variables** - 上下文传递
4. **Handoff 机制** - Agent 间切换
5. **Human in the Loop** - 人工介入选项

---

*参考：OpenAI Swarm, OpenAI Agents SDK, AgentVerse*