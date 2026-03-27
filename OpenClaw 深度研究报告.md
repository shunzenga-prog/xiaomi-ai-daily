# OpenClaw 深度研究报告

> 研究时间：2026 年 3 月 27 日  
> 研究范围：Gateway 运行机制、多 Agent 协作、Skill 开发、生产部署、性能优化、安全加固  
> 版本参考：OpenClaw 2026.3 最新版

---

## 目录

1. [Gateway 运行机制详解](#1-gateway-运行机制详解)
2. [多 Agent 协作模式](#2-多 agent-协作模式)
3. [Skill 开发完整教程](#3-skill-开发完整教程)
4. [生产环境部署方案](#4-生产环境部署方案)
5. [性能优化技巧](#5-性能优化技巧)
6. [安全加固措施](#6-安全加固措施)
7. [最佳实践总结](#7-最佳实践总结)

---

## 1. Gateway 运行机制详解

### 1.1 核心架构概览

OpenClaw Gateway 是整个系统的**控制平面（Control Plane）**，采用单一长连接 WebSocket 架构，统一管理所有消息表面和客户端连接。

```
┌─────────────────────────────────────────────────────────┐
│                    消息渠道层                              │
│  WhatsApp │ Telegram │ Slack │ Discord │ Signal │ iMessage │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   Gateway (控制平面)                      │
│  • WebSocket 服务器 (默认 127.0.0.1:18789)                │
│  • 会话管理 │ 工具调度 │ 事件推送 │ 健康检查              │
│  • Canvas 主机 │ WebChat │ 自动化 (Cron/Webhook)         │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               ▼                      ▼
        ┌─────────────┐        ┌─────────────┐
        │  Pi Agent   │        │   Nodes     │
        │  (RPC 模式)  │        │ (macOS/iOS/ │
        │  工具流式输出 │        │  Android)   │
        └─────────────┘        └─────────────┘
```

### 1.2 连接生命周期

**WebSocket 协议流程：**

1. **握手阶段**：客户端发送 `connect` 请求（必须为第一帧）
2. **认证阶段**：如配置 `OPENCLAW_GATEWAY_TOKEN`，需在 `connect.params.auth.token` 中提供
3. **设备配对**：新设备需配对批准，Gateway 颁发设备令牌用于后续连接
4. **事件订阅**：订阅 `tick`、`agent`、`presence`、`health` 等事件
5. **请求处理**：发送 `agent`、`send`、`health` 等请求

**关键协议特性：**

- **幂等性键**：副作用方法（`send`、`agent`）需幂等性键以安全重试
- **节点角色**：Nodes 连接时需声明 `role: "node"` 及能力列表
- **本地信任**：本地连接（loopback 或 tailnet 地址）可自动批准

### 1.3 会话管理模型

**会话键（Session Key）格式：**

```
# 主会话（默认 DM 连续性）
agent:<agentId>:main

# 按发送者隔离（推荐多用户场景）
agent:<agentId>:<channel>:direct:<peerId>

# 群组会话
agent:<agentId>:<channel>:group:<groupId>

# Telegram 话题隔离
agent:<agentId>:<channel>:group:<groupId>-topic:<threadId>
```

**DM 作用域配置（`session.dmScope`）：**

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| `main` | 所有 DM 共享主会话 | 单用户场景 |
| `per-peer` | 按发送者 ID 隔离 | 多用户但跨渠道连续性 |
| `per-channel-peer` | 按渠道 + 发送者隔离 | **推荐**多用户收件箱 |
| `per-account-channel-peer` | 按账号 + 渠道 + 发送者隔离 | 多账号收件箱 |

**安全警告**：如果多个用户可向 Agent 发送 DM，**必须**设置 `dmScope: "per-channel-peer"`，否则用户间上下文会泄露。

### 1.4 Agent 循环（Agent Loop）

完整的 Agent 执行生命周期：

```
1. 入口：Gateway RPC `agent` 或 `agent.wait`
   ↓
2. 会话解析：根据 sessionKey/sessionId 加载或创建会话
   ↓
3. 上下文组装：
   - 加载 Skills 快照
   - 注入 Bootstrap 文件（AGENTS.md、SOUL.md、TOOLS.md 等）
   - 构建系统提示词
   ↓
4. 模型推理：调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   ↓
5. 流式输出：
   - `lifecycle` 事件（start/end/error）
   - `assistant` 事件（文本增量）
   - `tool` 事件（工具调用）
   ↓
6. 工具执行：串行化工具调用，防止会话竞争
   ↓
7. 持久化：将会话历史写入 JSONL 文件
   ↓
8. 完成：发送最终回复，触发 announce（如为子 Agent）
```

**队列与并发：**

- **会话车道（Session Lane）**：每个会话键串行执行，防止工具/会话竞争
- **全局车道**：可选全局并发限制
- **消息渠道队列模式**：collect/steer/followup，详见 [Command Queue](/concepts/queue)

### 1.5 钩子系统（Hooks）

**内部钩子（Gateway Hooks）：**

- `agent:bootstrap`：构建 bootstrap 文件时运行，可添加/移除上下文文件
- 命令钩子：`/new`、`/reset`、`/stop` 等命令事件

**插件钩子（Plugin Hooks）：**

- `before_model_resolve`：模型解析前覆盖 provider/model
- `before_prompt_build`：提示词构建前注入上下文
- `before_tool_call` / `after_tool_call`：拦截工具调用
- `tool_result_persist`：工具结果持久化前转换
- `message_received` / `message_sending` / `message_sent`：消息生命周期
- `session_start` / `session_end`：会话生命周期边界

**钩子决策规则：**

- `before_tool_call`: `{ block: true }` 终止并阻止低优先级处理程序
- `message_sending`: `{ cancel: true }` 终止并阻止低优先级处理程序

---

## 2. 多 Agent 协作模式

### 2.1 子 Agent 架构

子 Agent 是从现有 Agent 运行中派生的后台 Agent 运行，运行在独立会话中，完成后向请求者聊天渠道**announce**结果。

**会话键层级：**

| 深度 | 会话键形状 | 角色 | 可派生子 Agent |
|------|-----------|------|---------------|
| 0 | `agent:<id>:main` | 主 Agent | 总是 |
| 1 | `agent:<id>:subagent:<uuid>` | 子 Agent（协调器） | 仅当 `maxSpawnDepth >= 2` |
| 2 | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子 Agent（叶子工作器） | 从不 |

**配置示例：**

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2,        // 允许子 Agent 派生子代（默认：1）
        maxChildrenPerAgent: 5,  // 每个 Agent 会话最大活跃子代数（默认：5）
        maxConcurrent: 8,        // 全局并发车道上限（默认：8）
        runTimeoutSeconds: 900,  // sessions_spawn 默认超时（0=无超时）
        archiveAfterMinutes: 60, // 子 Agent 会话自动归档时间
      },
    },
  },
}
```

### 2.2 派生方式

**方式一：Slash 命令（用户手动派生）**

```bash
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

- 非阻塞，立即返回 runId
- 完成后向请求者聊天渠道发送摘要/结果消息
- 支持 `--model` 和 `--thinking` 覆盖默认值

**方式二：Tool 调用（编程派生）**

```json
{
  "tool": "sessions_spawn",
  "params": {
    "task": "研究气候变化对农业的影响",
    "label": "气候研究",
    "model": "anthropic/claude-sonnet-4-6",
    "thinking": "high",
    "thread": false,
    "mode": "run",
    "cleanup": "keep"
  }
}
```

**参数说明：**

- `task`（必需）：子 Agent 任务描述
- `label`（可选）：任务标签，用于标识
- `model`（可选）：覆盖子 Agent 模型
- `thinking`（可选）：思考级别（off/minimal/low/medium/high/xhigh）
- `runTimeoutSeconds`：运行超时（秒）
- `thread`：是否请求渠道线程绑定（默认 false）
- `mode`：`run`（一次性）或 `session`（持久会话）
- `cleanup`：`delete`（完成后归档）或 `keep`（保留）

### 2.3 线程绑定会话（Thread-Bound Sessions）

**适用渠道**：目前仅 Discord 支持持久线程绑定子 Agent 会话。

**工作流程：**

1. 使用 `sessions_spawn` 派生，设置 `thread: true`
2. OpenClaw 创建或绑定线程到该子 Agent 会话
3. 该线程中的后续用户消息路由到同一子 Agent 会话
4. 使用 `/focus`、`/unfocus`、`/agents` 管理绑定状态

**配置：**

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,    // 空闲自动解绑时间
      maxAgeHours: 0,   // 最大年龄（0=无限制）
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 168,  // 7 天
      },
    },
  },
}
```

**手动控制命令：**

- `/focus <target>`：绑定当前线程到子 Agent/会话目标
- `/unfocus`：移除当前绑定线程的绑定
- `/agents`：列出活跃运行和绑定状态
- `/session idle <duration>`：设置空闲自动解绑时间
- `/session max-age <duration>`：设置硬上限年龄

### 2.4 协调器模式（Orchestrator Pattern）

当 `maxSpawnDepth >= 2` 时，启用协调器模式：

```
主 Agent（深度 0）
    ↓ 派生
协调器子 Agent（深度 1）
    ↓ 派生多个
工作器子子 Agent（深度 2）
```

**工具策略按深度：**

- **深度 1（协调器）**：获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` 以管理子代
- **深度 1（叶子，当 maxSpawnDepth=1）**：无会话工具
- **深度 2（叶子工作器）**：无会话工具，`sessions_spawn` 始终拒绝

**Announce 链：**

1. 深度 2 工作器完成 → 向其父代（深度 1 协调器）announce
2. 深度 1 协调器接收 announce，综合结果，完成 → 向主 Agent announce
3. 主 Agent 接收 announce 并交付给用户

**级联停止：**

- `/stop`：停止所有深度 1 Agent 并级联到其深度 2 子代
- `/subagents kill <id>`：停止特定子 Agent 并级联
- `/subagents kill all`：停止所有子 Agent 并级联

### 2.5 认证模型

子 Agent 认证按 **Agent ID** 解析，而非会话类型：

- 子 Agent 会话键：`agent:<agentId>:subagent:<uuid>`
- 从该 Agent 的 `agentDir` 加载认证存储
- 主 Agent 的认证配置文件作为**后备**合并；Agent 配置文件在冲突时覆盖主配置文件

### 2.6 使用场景

**场景 1：并行研究任务**

```bash
# 派生多个子 Agent 并行研究不同主题
/subagents spawn main "研究 AI 在医疗诊断中的应用" --label 医疗 AI
/subagents spawn main "研究 AI 在金融风控中的应用" --label 金融 AI
/subagents spawn main "研究 AI 在教育领域的应用" --label 教育 AI
```

**场景 2：大型代码重构**

```json5
{
  // 主 Agent 作为协调器
  task: "重构整个认证模块",
  // 派生多个工作器处理不同子模块
  children: [
    "重构用户登录流程",
    "重构密码重置流程",
    "重构 OAuth 集成",
    "重构会话管理"
  ]
}
```

**场景 3：PR 批量审查**

```bash
# 获取所有 PR refs
git fetch origin '+refs/pull/*/head:refs/remotes/origin/pr/*'

# 为每个 PR 派生子 Agent 审查
bash pty:true background:true command:"codex exec '审查 PR #86'"
bash pty:true background:true command:"codex exec '审查 PR #87'"
```

---

## 3. Skill 开发完整教程

### 3.1 Skill 基础概念

**什么是 Skill？**

Skill 是模块化、自包含的包，通过提供专业知识、工作流和工具来扩展 Agent 能力。可将 Skill 视为特定领域或任务的"入职指南"——将通用 Agent 转变为具备程序性知识的专业 Agent。

**Skill 提供什么：**

1. **专业工作流**：特定领域的多步骤程序
2. **工具集成**：使用特定文件格式或 API 的说明
3. **领域专业知识**：公司特定知识、模式、业务逻辑
4. **捆绑资源**：复杂重复任务的脚本、参考资料和资产

### 3.2 Skill 目录结构

```
skill-name/
├── SKILL.md (必需)
│   ├── YAML frontmatter 元数据（必需）
│   │   ├── name: (必需)
│   │   └── description: (必需)
│   └── Markdown 指令（必需）
└── 捆绑资源（可选）
    ├── scripts/          - 可执行代码（Python/Bash 等）
    ├── references/       - 文档，按需加载到上下文
    └── assets/           - 输出中使用的文件（模板、图标等）
```

### 3.3 SKILL.md 格式

**YAML Frontmatter（必需字段）：**

```markdown
---
name: weather
description: 获取当前位置天气和预报。使用场景：用户询问天气、温度、预报。不用于：历史天气数据、严重天气警报。
homepage: https://wttr.in/:help
metadata:
  {
    "openclaw":
      {
        "emoji": "☔",
        "requires": { "bins": ["curl"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "curl",
              "bins": ["curl"],
              "label": "Install curl (brew)",
            },
          ],
      },
  }
---
```

**Frontmatter 字段参考：**

| 字段 | 必需 | 说明 |
|------|------|------|
| `name` | 是 | 唯一标识符（snake_case） |
| `description` | 是 | 单行描述，向 Agent 显示 |
| `homepage` | 否 | macOS Skills UI 显示为"Website" |
| `metadata.openclaw.os` | 否 | OS 过滤（`["darwin"]`、`["linux"]` 等） |
| `metadata.openclaw.requires.bins` | 否 | PATH 中必需的二进制文件 |
| `metadata.openclaw.requires.env` | 否 | 必需的环境变量 |
| `metadata.openclaw.requires.config` | 否 | 必需的配置键 |
| `metadata.openclaw.primaryEnv` | 否 | 与 `skills.entries.<name>.apiKey` 关联的环境变量 |
| `metadata.openclaw.install` | 否 | 安装器规范数组（brew/node/go/uv/download） |

**Metadata.openclaw 字段：**

- `always: true`：始终包含 Skill（跳过其他门控）
- `emoji`：macOS Skills UI 使用的表情符号
- `os`：平台列表（`darwin`、`linux`、`win32`）
- `requires.bins`：列表，每个必须存在于 PATH
- `requires.anyBins`：列表，至少一个必须存在于 PATH
- `requires.env`：列表，环境变量必须存在或在配置中提供
- `requires.config`：`openclaw.json` 路径列表，必须为真值
- `install`：安装器规范数组，macOS Skills UI 使用

### 3.4 Skill 开发流程

#### 步骤 1：理解 Skill 需求

通过具体示例明确 Skill 使用场景：

- "用户会如何触发这个 Skill？"
- "这个 Skill 应该支持哪些功能？"
- "能否给出使用示例？"

**示例**：构建 `pdf-editor` Skill 时询问：
- "用户会说'帮我旋转这个 PDF'还是'提取第 3 页'？"
- "是否需要支持批量处理？"
- "需要保持元数据吗？"

#### 步骤 2：规划可复用资源

分析每个示例，识别需要的脚本、参考资料和资产：

**示例分析**：`pdf-editor` Skill

1. 旋转 PDF 需要重复编写相同代码 → 需要 `scripts/rotate_pdf.py`
2. 不同 PDF 库有不同 API → 需要 `references/pdf-libraries.md`
3. 常见操作模式 → 需要 `references/common-operations.md`

**资源类型决策：**

| 资源类型 | 使用场景 | 示例 |
|----------|----------|------|
| `scripts/` | 需要确定性可靠性或重复编写的代码 | `scripts/rotate_pdf.py` |
| `references/` | 文档、模式、API 规范 | `references/api-docs.md` |
| `assets/` | 输出中使用的文件 | `assets/template.pptx` |

#### 步骤 3：初始化 Skill

使用初始化脚本创建 Skill 目录：

```bash
scripts/init_skill.py <skill-name> --path <output-directory> [--resources scripts,references,assets] [--examples]
```

**示例：**

```bash
# 创建基础 Skill
scripts/init_skill.py my-skill --path skills/public

# 创建带脚本和参考资料的 Skill
scripts/init_skill.py my-skill --path skills/public --resources scripts,references

# 创建带示例文件的 Skill
scripts/init_skill.py my-skill --path skills/public --resources scripts --examples
```

初始化脚本会：
- 在指定路径创建 Skill 目录
- 生成带有 proper frontmatter 和 TODO 占位符的 SKILL.md 模板
- 根据 `--resources` 创建资源目录
- 如设置 `--examples` 添加示例文件

#### 步骤 4：编辑 Skill

**编写指南：**

1. **Frontmatter**：
   - `name`：Skill 名称（小写，连字符分隔）
   - `description`：**主要触发机制**，包含"做什么"和"何时使用"
   
   **好的 description 示例：**
   ```markdown
   综合文档创建、编辑和分析，支持跟踪更改、评论、格式保留和文本提取。
   使用场景：(1) 创建新文档，(2) 修改或编辑内容，(3) 处理跟踪更改，
   (4) 添加评论，或任何其他文档任务
   ```

2. **Body**：
   - 使用祈使/不定式形式
   - 保持简洁（默认假设 Agent 已很聪明）
   - 仅添加 Agent 不知道的信息
   - 挑战每条信息："Agent 真的需要这个解释吗？"

**渐进式披露设计原则：**

Skill 使用三级加载系统管理上下文效率：

1. **元数据（name + description）**：始终在上下文中（~100 词）
2. **SKILL.md body**：Skill 触发时加载（<5k 词）
3. **捆绑资源**：按需加载（无限制，脚本可不读上下文执行）

**模式 1：高级指南带参考资料**

```markdown
# PDF 处理

## 快速开始

使用 pdfplumber 提取文本：
[代码示例]

## 高级功能

- **表单填写**：参见 [FORMS.md](FORMS.md) 完整指南
- **API 参考**：参见 [REFERENCE.md](REFERENCE.md) 所有方法
- **示例**：参见 [EXAMPLES.md](EXAMPLES.md) 常见模式
```

**模式 2：领域特定组织**

```
bigquery-skill/
├── SKILL.md（概述和导航）
└── reference/
    ├── finance.md（收入、账单指标）
    ├── sales.md（机会、管道）
    ├── product.md（API 使用、功能）
    └── marketing.md（活动、归因）
```

**模式 3：条件性详情**

```markdown
# DOCX 处理

## 创建文档

使用 docx-js 创建新文档。参见 [DOCX-JS.md](DOCX-JS.md)。

## 编辑文档

简单编辑直接修改 XML。

**跟踪更改**：参见 [REDLINING.md](REDLINING.md)
**OOXML 详情**：参见 [OOXML.md](OOXML.md)
```

#### 步骤 5：打包 Skill

开发完成后打包为可分发的 `.skill` 文件：

```bash
scripts/package_skill.py <path/to/skill-folder>
```

**可选输出目录：**

```bash
scripts/package_skill.py <path/to/skill-folder> ./dist
```

打包脚本会：
1. **自动验证** Skill（YAML frontmatter、命名约定、描述完整性等）
2. **创建 `.skill` 文件**（带所有文件的 zip，.skill 扩展名）

**安全限制**：symlink 被拒绝，存在 symlink 时打包失败。

#### 步骤 6：迭代

使用真实任务测试 Skill，根据表现改进：

1. 在真实任务上使用 Skill
2. 注意困难或低效之处
3. 识别 SKILL.md 或资源应如何更新
4. 实施更改并再次测试

### 3.5 Skill 加载与优先级

**Skill 加载位置：**

| 位置 | 优先级 | 范围 |
|------|--------|------|
| `<workspace>/skills/` | 最高 | 每 Agent |
| `~/.openclaw/skills/` | 中等 | 共享（所有 Agent） |
| 捆绑（随 OpenClaw 发布） | 最低 | 全局 |
| `skills.load.extraDirs` | 最低 | 自定义共享文件夹 |

**同名冲突处理**：工作区 > 管理/本地 > 捆绑

### 3.6 配置覆盖

在 `~/.openclaw/openclaw.json` 中配置 Skill：

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      "weather": { enabled: true },
      "sag": { enabled: false },
    },
  },
}
```

**规则：**

- `enabled: false`：禁用 Skill（即使已捆绑/安装）
- `env`：仅当变量未在进程中设置时注入
- `apiKey`：声明 `metadata.openclaw.primaryEnv` 的 Skill 的便捷方式
- `config`：自定义每 Skill 字段的可选包
- `allowBundled`：仅限捆绑 Skill 的可选白名单

### 3.7 最佳实践

**核心原则：**

1. **简洁是关键**
   - 上下文窗口是公共资源
   - 仅添加 Agent 不知道的信息
   - 挑战每条信息的必要性

2. **设置适当的自由度**
   - **高自由度**（文本指令）：多种方法有效时
   - **中自由度**（伪代码或带参数脚本）：存在首选模式时
   - **低自由度**（具体脚本，少参数）：操作脆弱、一致性关键时

3. **避免包含的内容**
   - README.md
   - INSTALLATION_GUIDE.md
   - QUICK_REFERENCE.md
   - CHANGELOG.md
   - 任何面向用户的文档

4. **命名规范**
   - 仅使用小写字母、数字和连字符
   - 首选动词引导的短短语
   - 按工具命名空间以提高清晰度（如 `gh-address-comments`）

---

## 4. 生产环境部署方案

### 4.1 部署架构选择

#### 方案 A：本地部署（推荐个人使用）

**适用场景**：个人工作站、家庭服务器

**架构：**
```
┌─────────────────┐
│   本地机器      │
│  (macOS/Linux)  │
│  ┌───────────┐  │
│  │  Gateway  │  │
│  │  (loopback)│ │
│  └─────┬─────┘  │
│        │        │
│  ┌─────┴─────┐  │
│  │ macOS App │  │
│  │  CLI      │  │
│  └───────────┘  │
└─────────────────┘
```

**配置：**

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { 
      mode: "token", 
      token: "长随机令牌" 
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
}
```

**优点**：
- 最低延迟
- 数据完全本地
- 无需网络暴露

**缺点**：
- 依赖本地机器在线
- 无法远程访问（除非配置隧道）

#### 方案 B：VPS 部署（推荐团队/远程访问）

**适用场景**：云服务器、需要 24/7 在线、团队协作

**架构：**
```
┌─────────────────┐         ┌─────────────────┐
│     VPS         │         │   本地设备      │
│  (Linux/ARM)    │         │ (macOS/iOS/Android)│
│  ┌───────────┐  │  Tailscale │  ┌───────────┐  │
│  │  Gateway  │◄─┼─────────────►│   Node    │  │
│  │  (tailnet)│  │         │  └───────────┘  │
│  └─────┬─────┘  │         │                 │
│        │        │         │  ┌───────────┐  │
│  ┌─────┴─────┐  │         │  │  CLI      │  │
│  │   Nodes   │  │         │  │  WebChat  │  │
│  └───────────┘  │         │  └───────────┘  │
└─────────────────┘         └─────────────────┘
```

**推荐 VPS 提供商：**

| 提供商 | 特点 | 适用场景 |
|--------|------|----------|
| Oracle Cloud | Always Free ARM 层 | 免费长期运行 |
| DigitalOcean | 简单付费 VPS | 小型团队 |
| Hetzner | 性价比高 | 欧洲用户 |
| Railway | 一键部署 | 快速原型 |
| Fly.io | Fly Machines | 全球分布 |

**配置：**

```json5
{
  gateway: {
    mode: "remote",
    bind: "tailnet",  // 或 "lan"（内网）
    auth: {
      mode: "password",
      password: "${OPENCLAW_GATEWAY_PASSWORD}",
    },
    tailscale: {
      mode: "serve",  // 或 "funnel"（公开）
    },
  },
  gateway: {
    trustedProxies: ["127.0.0.1"],  // 如使用反向代理
  },
}
```

**优点**：
- 24/7 在线
- 远程访问
- 可配对多个 Node

**缺点**：
- 需要网络配置
- 数据在云端
- 成本

#### 方案 C：Docker 部署（隔离环境）

**适用场景**：需要隔离、CI/CD、快速部署

**架构：**
```
┌─────────────────────────────────┐
│         Docker Host             │
│  ┌───────────────────────────┐  │
│  │   OpenClaw Container      │  │
│  │  ┌─────────────────────┐  │  │
│  │  │      Gateway        │  │  │
│  │  │  (127.0.0.1:18789)  │  │  │
│  │  └─────────────────────┘  │  │
│  │  ┌─────────────────────┐  │  │
│  │  │   Sandbox (可选)    │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
│  绑定挂载：~/.openclaw          │
└─────────────────────────────────┘
```

**快速部署：**

```bash
# 构建镜像
./scripts/docker/setup.sh

# 或使用预构建镜像
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
./scripts/docker/setup.sh

# 查看仪表板
docker compose run --rm openclaw-cli dashboard --no-open
```

**环境变量：**

| 变量 | 用途 |
|------|------|
| `OPENCLAW_IMAGE` | 使用远程镜像而非本地构建 |
| `OPENCLAW_DOCKER_APT_PACKAGES` | 构建时安装额外 apt 包 |
| `OPENCLAW_EXTENSIONS` | 预安装扩展依赖 |
| `OPENCLAW_EXTRA_MOUNTS` | 额外主机绑定挂载 |
| `OPENCLAW_HOME_VOLUME` | 在命名 Docker 卷中持久化 `/home/node` |
| `OPENCLAW_SANDBOX` | 选择沙盒引导（`1`、`true`、`yes`、`on`） |

**健康检查：**

```bash
# 存活探针
curl -fsS http://127.0.0.1:18789/healthz

# 就绪探针
curl -fsS http://127.0.0.1:18789/readyz

# 深度健康快照（需认证）
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### 4.2 沙盒配置

**启用 Agent 沙盒：**

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",  // off | non-main | all
        scope: "agent",    // session | agent | shared
        docker: {
          network: "bridge",  // 避免使用 "host"
          setupCommand: "apt-get update && apt-get install -y curl git",
        },
      },
    },
  },
}
```

**沙盒模式：**

- `off`：禁用沙盒
- `non-main`：仅非主会话在沙盒中运行（推荐）
- `all`：所有会话在沙盒中运行

**沙盒范围：**

- `session`：每会话独立容器
- `agent`：每 Agent 共享容器
- `shared`：所有 Agent 共享容器

**注意事项：**

- 沙盒二进制必须存在于容器内
- 使用 `setupCommand` 安装所需包
- 避免 `network: "host"`（安全风险）
- 沙盒网络需要出口访问

### 4.3 反向代理配置

**Nginx 配置示例：**

```nginx
server {
    listen 443 ssl;
    server_name openclaw.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # HSTS（如 Gateway 本身终止 HTTPS）
    add_header Strict-Transport-Security "max-age=31536000" always;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 覆盖传入的转发头（安全做法）
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Gateway 配置：**

```json5
{
  gateway: {
    trustedProxies: ["127.0.0.1"],
    auth: {
      mode: "password",
      password: "${OPENCLAW_GATEWAY_PASSWORD}",
    },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000",
      },
    },
  },
}
```

### 4.4 systemd 服务配置

**创建服务文件：**

```ini
# /etc/systemd/system/openclaw.service
[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
Type=simple
User=openclaw
Group=openclaw
WorkingDirectory=/home/openclaw
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Environment=OPENCLAW_NO_RESPAWN=1
ExecStart=/usr/bin/openclaw gateway
Restart=always
RestartSec=2
TimeoutStartSec=90

# 安全加固
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

**启用服务：**

```bash
sudo systemctl daemon-reload
sudo systemctl enable openclaw
sudo systemctl start openclaw
sudo systemctl status openclaw
```

**性能优化：**

```bash
# 启用 Node 编译缓存
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

---

## 5. 性能优化技巧

### 5.1 上下文窗口管理

**自动压缩（Auto-Compaction）：**

当会话接近或超过模型上下文窗口时，OpenClaw 触发自动压缩。

**配置：**

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "auto",  // auto | manual | off
        targetTokens: 0.8,  // 目标使用率（80% 触发）
        model: "openrouter/anthropic/claude-sonnet-4-6",  // 可选专用压缩模型
        identifierPolicy: "strict",  // 保留不透明标识符
      },
    },
  },
}
```

**手动压缩：**

```
/compact 关注决策和待决问题
```

**压缩 vs 修剪：**

- **压缩**：总结旧对话并**持久化**到 JSONL
- **会话修剪**：每请求**内存中**修剪旧工具结果

### 5.2 流式输出优化

**块流式输出（Block Streaming）：**

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "on",  // "on" | "off"
      blockStreamingBreak: "text_end",  // "text_end" | "message_end"
      blockStreamingChunk: {
        minChars: 500,
        maxChars: 2000,
        breakPreference: "paragraph",  // paragraph | newline | sentence
      },
      blockStreamingCoalesce: {
        minChars: 1500,
        maxChars: 4000,
        idleMs: 500,
      },
      humanDelay: {
        mode: "natural",  // off | natural | custom
        minMs: 800,
        maxMs: 2500,
      },
    },
  },
}
```

**渠道覆盖：**

```json5
{
  channels: {
    telegram: {
      blockStreaming: true,
      streaming: "partial",  // off | partial | block | progress
      textChunkLimit: 4096,
      chunkMode: "length",  // length | newline
    },
    discord: {
      blockStreaming: true,
      maxLinesPerMessage: 17,  // 避免 UI 裁剪
    },
  },
}
```

**流式模式映射：**

| 渠道 | `off` | `partial` | `block` | `progress` |
|------|-------|-----------|---------|------------|
| Telegram | ✅ | ✅ | ✅ | 映射到 `partial` |
| Discord | ✅ | ✅ | ✅ | 映射到 `partial` |
| Slack | ✅ | ✅ | ✅ | ✅ |

### 5.3 会话维护

**自动维护配置：**

```json5
{
  session: {
    maintenance: {
      mode: "enforce",  // warn | enforce
      pruneAfter: "45d",  // 修剪超过 45 天的条目
      maxEntries: 800,  // 最大条目数
      rotateBytes: "20mb",  // sessions.json 轮换大小
      resetArchiveRetention: "14d",  // 归档保留时间
      maxDiskBytes: "1gb",  // 会话目录磁盘上限
      highWaterBytes: "800mb",  // 高水位线（80%）
    },
  },
}
```

**手动维护：**

```bash
# 预览将删除的内容
openclaw sessions cleanup --dry-run

# 强制执行清理
openclaw sessions cleanup --enforce

# JSON 输出
openclaw sessions cleanup --dry-run --json
```

**性能提示：**

- 大型会话存储会增加写入延迟
- 同时设置时间和数量限制（`pruneAfter` + `maxEntries`）
- 为大型部署设置 `maxDiskBytes` + `highWaterBytes`
- 保持 `highWaterBytes` 明显低于 `maxDiskBytes`（默认 80%）

### 5.4 模型选择与成本优化

**模型故障转移：**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["openai/gpt-5.2", "google/gemini-2.5-pro"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { 
          alias: "Sonnet",
          cost: { input: 0.003, output: 0.015 },  // 每 1K token 美元
        },
      },
    },
  },
}
```

**子 Agent 成本优化：**

```json5
{
  agents: {
    defaults: {
      subagents: {
        model: "openai/gpt-4o-mini",  // 子 Agent 使用更便宜模型
        thinking: "low",  // 降低思考级别
      },
    },
  },
}
```

**图片优化：**

```json5
{
  agents: {
    defaults: {
      imageMaxDimensionPx: 800,  // 降低默认 1200，减少视觉 token 使用
      imageGenerationModel: "openai/dall-e-3",
    },
  },
}
```

### 5.5 启动性能优化

**小型 VM 优化：**

```bash
# 启用 Node 模块编译缓存
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache

# 避免自重生开销
export OPENCLAW_NO_RESPAWN=1
```

**systemd 优化：**

```ini
[Service]
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Environment=OPENCLAW_NO_RESPAWN=1
TimeoutStartSec=90  # 增加启动超时
```

**首次运行预热：**

```bash
# 预热编译缓存
openclaw status
openclaw health
openclaw skills list
```

### 5.6 渠道健康监控

**配置：**

```json5
{
  gateway: {
    channelHealthCheckMinutes: 5,  // 健康检查间隔
    channelStaleEventThresholdMinutes: 30,  // 陈旧事件阈值
    channelMaxRestartsPerHour: 10,  // 每小时最大重启次数
  },
  channels: {
    telegram: {
      healthMonitor: { enabled: true },
      accounts: {
        alerts: {
          healthMonitor: { enabled: true },
        },
      },
    },
  },
}
```

**禁用特定渠道自动重启：**

```json5
{
  channels: {
    telegram: {
      healthMonitor: { enabled: false },  // 禁用自动重启
    },
  },
}
```

---

## 6. 安全加固措施

### 6.1 安全审计

**运行安全审计：**

```bash
# 快速审计
openclaw security audit

# 深度审计（含实时 Gateway 探测）
openclaw security audit --deep

# 自动修复
openclaw security audit --fix

# JSON 输出
openclaw security audit --json
```

**关键检查项：**

| 检查 ID | 严重性 | 说明 | 修复路径 |
|---------|--------|------|----------|
| `fs.state_dir.perms_world_writable` | critical | 状态目录全局可写 | 修复 `~/.openclaw` 权限 |
| `gateway.bind_no_auth` | critical | 远程绑定无认证 | 配置 `gateway.auth.*` |
| `gateway.tailscale_funnel` | critical | 公开互联网暴露 | 设置 `gateway.tailscale.mode` |
| `tools.exec.security_full_configured` | critical | 主机 exec 使用 `security="full"` | 调整 `tools.exec.security` |
| `security.exposure.open_channels_with_exec` | critical | 公开渠道可访问 exec | 配置 `dmPolicy` 和工具策略 |

### 6.2 强化基线配置

**60 秒强化基线：**

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { 
      mode: "token", 
      token: "替换为长随机令牌" 
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { 
      security: "deny", 
      ask: "always" 
    },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { 
      dmPolicy: "pairing", 
      groups: { "*": { requireMention: true } } 
    },
  },
}
```

### 6.3 渠道访问控制

**DM 策略：**

```json5
{
  channels: {
    telegram: {
      dmPolicy: "pairing",  // pairing | allowlist | open | disabled
      allowFrom: ["tg:123456789"],  // 仅 allowlist/open 模式需要
    },
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+1234567890"],
    },
  },
}
```

**群组策略：**

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["guild:123456789"],
      groups: {
        "*": {
          requireMention: true,  // 需要提及机器人
        },
      },
    },
  },
}
```

### 6.4 工具策略

**全局工具策略：**

```json5
{
  tools: {
    profile: "minimal",  // minimal | messaging | standard | full
    deny: [
      "browser",
      "canvas",
      "cron",
      "gateway",
      "nodes",
      "sessions_spawn",
      "sessions_send",
    ],
    fs: {
      workspaceOnly: true,  // 限制文件系统访问
    },
    exec: {
      security: "allowlist",  // deny | allowlist | full
      ask: "on-miss",  // off | on-miss | always
      strictInlineEval: true,  // 内联解释器评估始终需要批准
      safeBins: ["cat", "grep", "sed", "awk"],  // 仅 stdin 安全二进制
    },
  },
}
```

**每 Agent 工具策略：**

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: {
          profile: "standard",
          exec: {
            security: "full",  // 主 Agent 允许完整 exec
          },
        },
      },
      {
        id: "public",
        tools: {
          profile: "messaging",
          deny: ["exec", "browser", "fs"],  // 公开 Agent 禁用危险工具
        },
      },
    ],
  },
}
```

### 6.5 Exec 批准配置

**批准模式：**

- `deny`：拒绝所有主机执行
- `allowlist`：仅允许白名单中的命令
- `full`：允许所有命令（需确认）

**批准提示模式：**

- `off`：从不提示
- `on-miss`：仅当命令不在白名单时提示
- `always`：始终提示

**白名单配置**（`~/.openclaw/exec-approvals.json`）：

```json
{
  "allowlist": [
    {
      "path": "/usr/bin/git",
      "args": ["status", "diff", "log"],
      "ask": "on-miss"
    },
    {
      "path": "/usr/bin/npm",
      "args": ["install", "run", "test"],
      "ask": "always"
    }
  ],
  "autoAllowSkills": false,  // 禁用 Skill 自动允许
  "strictInlineEval": true  // 内联评估始终需要批准
}
```

**安全二进制（Safe Bins）：**

```json5
{
  tools: {
    exec: {
      safeBins: ["cat", "grep", "sed", "awk", "jq"],
      safeBinTrustedDirs: ["/bin", "/usr/bin", "/opt/openclaw/bin"],
      safeBinProfiles: {
        "jq": {
          minPositional: 1,
          maxPositional: 2,
          allowedValueFlags: ["-r", "-c", "."],
          deniedFlags: ["--argjson"],
        },
      },
    },
  },
}
```

### 6.6 凭证存储映射

**凭证位置：**

| 凭证类型 | 存储位置 |
|----------|----------|
| WhatsApp | `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` |
| Telegram Bot Token | 配置/env 或 `channels.telegram.tokenFile` |
| Discord Bot Token | 配置/env 或 SecretRef |
| Slack Tokens | 配置/env (`channels.slack.*`) |
| 配对白名单 | `~/.openclaw/credentials/<channel>-allowFrom.json` |
| 模型认证配置文件 | `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` |
| 文件后端密钥 | `~/.openclaw/secrets.json`（可选） |

**权限加固：**

```bash
# 限制 ~/.openclaw 权限
chmod 700 ~/.openclaw
chmod 600 ~/.openclaw/openclaw.json
chmod 600 ~/.openclaw/credentials/*

# 递归修复
find ~/.openclaw -type f -exec chmod 600 {} \;
find ~/.openclaw -type d -exec chmod 700 {} \;
```

### 6.7 网络安全

**Tailscale 配置：**

```json5
{
  gateway: {
    tailscale: {
      mode: "serve",  // serve（tailnet 专用）| funnel（公开）| off
      resetOnExit: true,  // 退出时重置 Serve/Funnel
    },
    auth: {
      mode: "password",  // Funnel 必需
      password: "${OPENCLAW_GATEWAY_PASSWORD}",
    },
  },
}
```

**SSH 隧道：**

```bash
# 本地转发
ssh -N -L 18789:127.0.0.1:18789 user@host

# 远程转发
ssh -N -R 18789:127.0.0.1:18789 user@host
```

**防火墙规则（UFW）：**

```bash
# 默认拒绝入站
sudo ufw default deny incoming

# 允许 SSH（如需要）
sudo ufw allow 22/tcp

# 允许 Tailscale
sudo ufw allow from 100.64.0.0/10

# 启用防火墙
sudo ufw enable
```

### 6.8 定期安全审计

**使用 cron 调度定期审计：**

```bash
# 每日安全审计
openclaw cron add --name "healthcheck:security-audit" \
  --schedule "0 3 * * *" \
  --command "openclaw security audit --deep --json > /var/log/openclaw/security-audit.json"

# 每周版本检查
openclaw cron add --name "healthcheck:update-status" \
  --schedule "0 9 * * 1" \
  --command "openclaw update status"
```

**健康检查 Skill 调度：**

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    sessionRetention: "24h",
  },
}
```

---

## 7. 最佳实践总结

### 7.1 部署最佳实践

1. **个人使用**：本地部署 + loopback 绑定 + token 认证
2. **团队使用**：VPS 部署 + Tailscale Serve + 每用户独立 Gateway
3. **生产环境**：Docker 部署 + 沙盒 + 反向代理 + 监控

### 7.2 开发最佳实践

1. **Skill 开发**：
   - 保持简洁，仅添加必要信息
   - 使用渐进式披露设计
   - 避免冗余文档文件
   - 测试真实场景

2. **多 Agent 协作**：
   - 主 Agent 使用高质量模型
   - 子 Agent 使用经济模型
   - 设置合理的超时和并发限制
   - 使用 announce 链综合结果

3. **工具使用**：
   - 默认最小权限
   - 敏感操作需要批准
   - 沙盒隔离非主会话
   - 定期审计工具策略

### 7.3 运维最佳实践

1. **监控**：
   - 启用健康检查
   - 配置告警通知
   - 定期检查日志
   - 监控资源使用

2. **备份**：
   - 定期备份 `~/.openclaw`
   - 版本化配置
   - 测试恢复流程
   - 离线存储凭证

3. **更新**：
   - 订阅发布通知
   - 测试环境先行
   - 回滚计划
   - 定期运行 `openclaw doctor`

### 7.4 安全最佳实践

1. **访问控制**：
   - 始终启用配对或白名单
   - 多用户场景使用 `dmScope: "per-channel-peer"`
   - 限制群组提及要求
   - 定期审查允许列表

2. **凭证管理**：
   - 使用环境变量或密钥管理器
   - 避免硬编码凭证
   - 定期轮换令牌
   - 限制文件权限

3. **网络暴露**：
   - 首选 loopback + SSH/Tailscale 隧道
   - 避免公开暴露
   - 使用强认证
   - 启用 HTTPS

### 7.5 性能最佳实践

1. **上下文管理**：
   - 启用自动压缩
   - 配置会话维护
   - 使用专用压缩模型
   - 定期手动压缩

2. **模型优化**：
   - 配置故障转移
   - 子 Agent 使用经济模型
   - 优化图片尺寸
   - 监控 token 使用

3. **启动优化**：
   - 启用编译缓存
   - 预热常用命令
   - 优化 systemd 配置
   - 使用 SSD 存储

---

## 附录：常用命令速查

### Gateway 管理

```bash
# 启动 Gateway
openclaw gateway

# 后台运行
openclaw gateway --background

# 重启
openclaw gateway restart

# 状态
openclaw gateway status

# 健康检查
openclaw health

# 日志
openclaw logs
```

### Agent 操作

```bash
# 发送消息
openclaw agent --message "Hello"

# 带思考级别
openclaw agent --message "Complex task" --thinking high

# 指定模型
openclaw agent --message "Task" --model anthropic/claude-sonnet-4-6
```

### 会话管理

```bash
# 列出会话
openclaw sessions list

# 清理会话
openclaw sessions cleanup --enforce

# 查看状态
openclaw status
```

### Skill 管理

```bash
# 列出 Skill
openclaw skills list

# 安装 Skill
openclaw skills install <skill-slug>

# 更新 Skill
openclaw skills update --all

# 启用/禁用
openclaw config set skills.entries.<name>.enabled true|false
```

### 安全审计

```bash
# 快速审计
openclaw security audit

# 深度审计
openclaw security audit --deep

# 自动修复
openclaw security audit --fix

# 诊断
openclaw doctor
```

### 配置管理

```bash
# 获取配置
openclaw config get <key>

# 设置配置
openclaw config set <key> <value>

# 删除配置
openclaw config unset <key>

# 交互式配置
openclaw configure
```

---

## 参考资源

- **官方文档**：https://docs.openclaw.ai
- **GitHub 仓库**：https://github.com/openclaw/openclaw
- **Discord 社区**：https://discord.gg/clawd
- **ClawHub（Skill 注册表）**：https://clawhub.com
- **DeepWiki**：https://deepwiki.com/openclaw/openclaw

---

*本报告基于 OpenClaw 2026.3 最新版编写，具体配置和命令可能随版本更新而变化。建议定期查阅官方文档获取最新信息。*
