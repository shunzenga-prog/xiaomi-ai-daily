# OpenClaw Webhook 配置指南

> 完整指南：如何配置 Webhook 接收外部事件、集成公众号评论和 GitHub

---

## 📋 目录

1. [Webhook 基础配置](#1-webhook-基础配置)
2. [接收外部事件](#2-接收外部事件)
3. [公众号评论 Webhook 配置](#3-公众号评论-webhook-配置)
4. [GitHub Webhook 集成](#4-github-webhook-集成)
5. [Webhook 处理器示例代码](#5-webhook-处理器示例代码)
6. [测试 Webhook 触发流程](#6-测试-webhook-触发流程)
7. [安全最佳实践](#7-安全最佳实践)

---

## 1. Webhook 基础配置

### 1.1 启用 Webhook 功能

在 OpenClaw 配置文件 `~/.openclaw/openclaw.json` 中添加 `hooks` 配置：

```json
{
  "hooks": {
    "enabled": true,
    "token": "your-secret-token-here",
    "path": "/hooks",
    "allowedAgentIds": ["hooks", "main"],
    "defaultSessionKey": "hook:ingress",
    "allowRequestSessionKey": false,
    "allowedSessionKeyPrefixes": ["hook:"]
  }
}
```

### 1.2 配置参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | boolean | 是 | - | 是否启用 Webhook |
| `token` | string | 是 | - | 认证令牌（建议使用环境变量） |
| `path` | string | 否 | `/hooks` | Webhook 端点路径 |
| `allowedAgentIds` | array | 否 | `["*"]` | 允许路由的智能体 ID 列表 |
| `defaultSessionKey` | string | 否 | - | 默认会话键 |
| `allowRequestSessionKey` | boolean | 否 | `false` | 是否允许请求覆盖会话键 |
| `allowedSessionKeyPrefixes` | array | 否 | `[]` | 允许的会话键前缀 |

### 1.3 使用环境变量（推荐）

```json
{
  "hooks": {
    "enabled": true,
    "token": "${OPENCLAW_HOOKS_TOKEN}",
    "path": "/hooks"
  }
}
```

设置环境变量：
```bash
export OPENCLAW_HOOKS_TOKEN="your-secure-random-token"
```

### 1.4 重启 Gateway

配置完成后重启 Gateway 使配置生效：

```bash
# macOS 菜单栏应用
# 点击菜单栏图标 → Restart

# 或命令行重启
openclaw gateway restart
```

---

## 2. 接收外部事件

### 2.1 Webhook 端点

OpenClaw 提供以下 Webhook 端点：

| 端点 | 方法 | 说明 |
|------|------|------|
| `POST /hooks/wake` | POST | 唤醒主会话，触发心跳 |
| `POST /hooks/agent` | POST | 运行独立智能体任务 |
| `POST /hooks/<name>` | POST | 自定义映射端点 |

### 2.2 认证方式

请求必须包含认证令牌，支持以下两种方式：

**方式 1：Authorization Header（推荐）**
```http
Authorization: Bearer your-secret-token
```

**方式 2：Custom Header**
```http
x-openclaw-token: your-secret-token
```

❌ **不支持** URL 查询参数（`?token=xxx` 会返回 400 错误）

### 2.3 唤醒主会话 (`/hooks/wake`)

**用途**：当外部事件发生时，通知 OpenClaw 触发心跳处理

**请求示例**：
```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"新邮件收到","mode":"now"}'
```

**请求参数**：
```json
{
  "text": "事件描述",           // 必填：事件描述
  "mode": "now"                // 可选：now | next-heartbeat
}
```

**响应**：
- `200` - 成功
- `401` - 认证失败
- `400` - 参数错误

### 2.4 运行独立智能体 (`/hooks/agent`)

**用途**：触发独立的智能体处理任务

**请求示例**：
```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "总结最新邮件",
    "name": "Email",
    "wakeMode": "now",
    "deliver": true,
    "channel": "telegram"
  }'
```

**请求参数**：
```json
{
  "message": "处理指令",              // 必填：智能体提示词
  "name": "Email",                   // 可选：任务名称
  "agentId": "hooks",                // 可选：指定智能体
  "sessionKey": "hook:email:123",    // 可选：会话键（需配置允许）
  "wakeMode": "now",                 // 可选：now | next-heartbeat
  "deliver": true,                   // 可选：是否发送回复
  "channel": "telegram",             // 可选：发送渠道
  "to": "+8613800138000",           // 可选：接收者
  "model": "bailian/qwen3.5-plus",  // 可选：模型覆盖
  "thinking": "low",                 // 可选：思考级别
  "timeoutSeconds": 120              // 可选：超时时间
}
```

### 2.5 自定义映射端点

通过 `hooks.mappings` 配置自定义端点：

```json
{
  "hooks": {
    "enabled": true,
    "token": "${OPENCLAW_HOOKS_TOKEN}",
    "mappings": {
      "github": {
        "match": { "source": "github" },
        "action": "agent",
        "template": {
          "message": "GitHub 事件：{{event.action}} - {{event.repository}}",
          "name": "GitHub",
          "deliver": true,
          "channel": "telegram"
        }
      },
      "wechat-comment": {
        "match": { "source": "wechat" },
        "action": "agent",
        "template": {
          "message": "公众号评论：{{comment.user}} 说：{{comment.content}}",
          "name": "公众号",
          "deliver": true,
          "channel": "telegram"
        }
      }
    }
  }
}
```

---

## 3. 公众号评论 Webhook 配置

### 3.1 微信公众号后台配置

**步骤 1：登录公众号后台**
- 访问 https://mp.weixin.qq.com
- 使用管理员账号登录

**步骤 2：开发设置**
- 左侧菜单：`开发` → `基本配置`
- 或使用「公众号助手」小程序

**步骤 3：配置服务器**
```
URL: https://your-domain.com/wechat/webhook
Token: your-wechat-token
EncodingAESKey: (自动生成或手动填写)
```

**注意**：微信公众号原生不支持评论 Webhook，需要通过以下方式实现：

### 3.2 方案 A：使用第三方平台

**推荐平台**：
- 微盟
- 有赞
- 小鹅通

这些平台提供评论通知 API，可以转发到 OpenClaw。

### 3.3 方案 B：自建中间件（推荐）

创建 Node.js 中间件服务接收微信事件并转发到 OpenClaw：

**文件**：`wechat-webhook-bridge.js`
```javascript
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(express.json());

const WECHAT_TOKEN = 'your-wechat-token';
const OPENCLAW_URL = 'http://127.0.0.1:18789';
const OPENCLAW_TOKEN = 'your-openclaw-token';

// 微信验证
app.get('/wechat/webhook', (req, res) => {
  const { echostr, signature, timestamp, nonce } = req.query;
  
  const hash = crypto
    .createHash('sha1')
    .update([WECHAT_TOKEN, timestamp, nonce].sort().join(''))
    .digest('hex');
  
  if (hash === signature) {
    res.send(echostr);
  } else {
    res.status(403).send('Invalid signature');
  }
});

// 接收微信事件
app.post('/wechat/webhook', async (req, res) => {
  try {
    const { ToUserName, FromUserName, CreateTime, MsgType, Content } = req.body;
    
    // 转发到 OpenClaw
    await axios.post(
      `${OPENCLAW_URL}/hooks/wechat-comment`,
      {
        source: 'wechat',
        type: MsgType,
        content: Content,
        from: FromUserName,
        timestamp: CreateTime
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.send('success');
  } catch (error) {
    console.error('Forward error:', error);
    res.status(500).send('error');
  }
});

app.listen(3001, () => {
  console.log('WeChat webhook bridge running on port 3001');
});
```

### 3.4 方案 C：定期轮询公众号后台

使用 OpenClaw 心跳任务定期检查公众号评论：

**配置文件**：`~/.openclaw/openclaw.json`
```json
{
  "cron": {
    "entries": {
      "wechat-comments": {
        "enabled": true,
        "schedule": "0 */30 * * * *",
        "command": "node ~/.openclaw/scripts/check-wechat-comments.js"
      }
    }
  }
}
```

**检查脚本**：`check-wechat-comments.js`
```javascript
const axios = require('axios');

async function checkComments() {
  // 调用微信公众号 API 获取最新评论
  // 注意：需要公众号 API 权限
  const comments = await fetchWechatComments();
  
  if (comments.length > 0) {
    // 通知 OpenClaw
    await axios.post(
      'http://127.0.0.1:18789/hooks/wake',
      {
        text: `收到 ${comments.length} 条新评论`,
        mode: 'now'
      },
      {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN',
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

checkComments();
```

### 3.5 OpenClaw 配置映射

```json
{
  "hooks": {
    "enabled": true,
    "token": "${OPENCLAW_HOOKS_TOKEN}",
    "mappings": {
      "wechat-comment": {
        "match": { "source": "wechat" },
        "action": "agent",
        "template": {
          "message": "公众号收到新{{type}}：\n用户：{{from}}\n内容：{{content}}\n\n请帮忙回复或记录。",
          "name": "公众号评论",
          "deliver": true,
          "channel": "telegram",
          "model": "bailian/qwen3.5-plus"
        }
      }
    }
  }
}
```

---

## 4. GitHub Webhook 集成

### 4.1 GitHub 仓库配置

**步骤 1：进入仓库设置**
- 打开 GitHub 仓库
- 点击 `Settings` → `Webhooks` → `Add webhook`

**步骤 2：配置 Webhook**
```
Payload URL: https://your-domain.com/github/webhook
Content type: application/json
Secret: your-github-secret
```

**步骤 3：选择事件**
- ✅ Issues
- ✅ Issue comments
- ✅ Pull requests
- ✅ Pull request comments
- ✅ Push events
- ✅ Star events
- ✅ Release events

### 4.2 GitHub Webhook 中间件

创建 Node.js 服务接收 GitHub 事件：

**文件**：`github-webhook-bridge.js`
```javascript
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(express.json());

const GITHUB_SECRET = 'your-github-secret';
const OPENCLAW_URL = 'http://127.0.0.1:18789';
const OPENCLAW_TOKEN = 'your-openclaw-token';

// 验证 GitHub 签名
function verifyGitHubSignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', GITHUB_SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}

// 接收 GitHub Webhook
app.post('/github/webhook', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];
  const payload = JSON.stringify(req.body);
  
  // 验证签名
  if (signature && !verifyGitHubSignature(payload, signature)) {
    return res.status(403).send('Invalid signature');
  }
  
  try {
    const { action, repository, sender, issue, pull_request } = req.body;
    
    // 转发到 OpenClaw
    await axios.post(
      `${OPENCLAW_URL}/hooks/github`,
      {
        source: 'github',
        event: event,
        action: action,
        repository: repository?.full_name,
        sender: sender?.login,
        issue: issue ? {
          number: issue.number,
          title: issue.title,
          body: issue.body
        } : null,
        pull_request: pull_request ? {
          number: pull_request.number,
          title: pull_request.title,
          state: pull_request.state
        } : null,
        raw: req.body
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.status(200).send('ok');
  } catch (error) {
    console.error('Forward error:', error);
    res.status(500).send('error');
  }
});

app.listen(3002, () => {
  console.log('GitHub webhook bridge running on port 3002');
});
```

### 4.3 OpenClaw GitHub 映射配置

```json
{
  "hooks": {
    "enabled": true,
    "token": "${OPENCLAW_HOOKS_TOKEN}",
    "mappings": {
      "github": {
        "match": { "source": "github" },
        "action": "agent",
        "template": {
          "message": "GitHub 事件通知：\n\n📦 仓库：{{repository}}\n🔔 事件：{{event}}\n⚡ 操作：{{action}}\n👤 用户：{{sender}}\n\n{{#if issue}}\n📝 Issue #{{issue.number}}: {{issue.title}}\n{{/if}}\n\n{{#if pull_request}}\n🔀 PR #{{pull_request.number}}: {{pull_request.title}} ({{pull_request.state}})\n{{/if}}\n\n请处理或记录此事件。",
          "name": "GitHub",
          "deliver": true,
          "channel": "telegram",
          "model": "bailian/qwen3.5-plus"
        }
      }
    }
  }
}
```

### 4.4 常见 GitHub 事件处理

#### Issue 事件
```json
{
  "event": "issues",
  "action": "opened",
  "repository": "username/repo",
  "sender": "contributor",
  "issue": {
    "number": 123,
    "title": "Bug: 某个功能不工作",
    "body": "详细描述..."
  }
}
```

#### Pull Request 事件
```json
{
  "event": "pull_request",
  "action": "opened",
  "repository": "username/repo",
  "sender": "contributor",
  "pull_request": {
    "number": 456,
    "title": "Feature: 添加新功能",
    "state": "open"
  }
}
```

#### Push 事件
```json
{
  "event": "push",
  "repository": "username/repo",
  "sender": "developer",
  "ref": "refs/heads/main",
  "commits": [
    {
      "id": "abc123",
      "message": "修复 bug",
      "author": {
        "name": "Developer",
        "email": "dev@example.com"
      }
    }
  ]
}
```

---

## 5. Webhook 处理器示例代码

### 5.1 通用 Webhook 处理器（TypeScript）

**文件**：`webhook-handler.ts`
```typescript
import express, { Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';

interface WebhookConfig {
  port: number;
  openclawUrl: string;
  openclawToken: string;
  secret: string;
}

interface WebhookEvent {
  source: string;
  type: string;
  action?: string;
  data: Record<string, any>;
  timestamp: number;
}

class WebhookHandler {
  private app: express.Application;
  private config: WebhookConfig;

  constructor(config: WebhookConfig) {
    this.config = config;
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // 健康检查
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // 通用 Webhook 端点
    this.app.post('/webhook/:source', async (req: Request, res: Response) => {
      try {
        const { source } = req.params;
        const signature = req.headers['x-webhook-signature'] as string;
        const payload = JSON.stringify(req.body);

        // 验证签名
        if (signature && !this.verifySignature(payload, signature)) {
          return res.status(403).json({ error: 'Invalid signature' });
        }

        // 构建事件
        const event: WebhookEvent = {
          source,
          type: req.headers['x-webhook-event'] as string || 'generic',
          action: req.headers['x-webhook-action'] as string,
          data: req.body,
          timestamp: Date.now()
        };

        // 转发到 OpenClaw
        await this.forwardToOpenClaw(event);

        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal error' });
      }
    });

    // GitHub 专用端点
    this.app.post('/github', async (req: Request, res: Response) => {
      try {
        const signature = req.headers['x-hub-signature-256'] as string;
        const event = req.headers['x-github-event'] as string;
        const payload = JSON.stringify(req.body);

        if (signature && !this.verifyGitHubSignature(payload, signature)) {
          return res.status(403).json({ error: 'Invalid GitHub signature' });
        }

        await this.forwardToOpenClaw({
          source: 'github',
          type: event,
          action: req.body.action,
          data: req.body,
          timestamp: Date.now()
        });

        res.status(200).json({ success: true });
      } catch (error) {
        console.error('GitHub webhook error:', error);
        res.status(500).json({ error: 'Internal error' });
      }
    });
  }

  private verifySignature(payload: string, signature: string): boolean {
    const hmac = crypto.createHmac('sha256', this.config.secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(signature)
    );
  }

  private verifyGitHubSignature(payload: string, signature: string): boolean {
    const hmac = crypto.createHmac('sha256', this.config.secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(signature)
    );
  }

  private async forwardToOpenClaw(event: WebhookEvent): Promise<void> {
    await axios.post(
      `${this.config.openclawUrl}/hooks/${event.source}`,
      {
        source: event.source,
        ...event.data
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.openclawToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
  }

  public start(): void {
    this.app.listen(this.config.port, () => {
      console.log(`Webhook handler running on port ${this.config.port}`);
    });
  }
}

// 使用示例
const handler = new WebhookHandler({
  port: 3000,
  openclawUrl: 'http://127.0.0.1:18789',
  openclawToken: process.env.OPENCLAW_TOKEN || 'your-token',
  secret: process.env.WEBHOOK_SECRET || 'your-secret'
});

handler.start();
```

### 5.2 Python Webhook 处理器

**文件**：`webhook_handler.py`
```python
from flask import Flask, request, jsonify
import hmac
import hashlib
import requests
import os
from datetime import datetime

app = Flask(__name__)

OPENCLAW_URL = os.getenv('OPENCLAW_URL', 'http://127.0.0.1:18789')
OPENCLAW_TOKEN = os.getenv('OPENCLAW_TOKEN', 'your-token')
WEBHOOK_SECRET = os.getenv('WEBHOOK_SECRET', 'your-secret')

def verify_signature(payload, signature):
    """验证 Webhook 签名"""
    expected = 'sha256=' + hmac.new(
        WEBHOOK_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

def forward_to_openclaw(source, data):
    """转发事件到 OpenClaw"""
    try:
        response = requests.post(
            f'{OPENCLAW_URL}/hooks/{source}',
            json=data,
            headers={
                'Authorization': f'Bearer {OPENCLAW_TOKEN}',
                'Content-Type': 'application/json'
            },
            timeout=5
        )
        return response.status_code == 200
    except Exception as e:
        print(f'Forward error: {e}')
        return False

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

@app.route('/webhook/<source>', methods=['POST'])
def webhook(source):
    signature = request.headers.get('x-webhook-signature')
    payload = request.get_data(as_text=True)
    
    if signature and not verify_signature(payload, signature):
        return jsonify({'error': 'Invalid signature'}), 403
    
    event = {
        'source': source,
        **request.json
    }
    
    if forward_to_openclaw(source, event):
        return jsonify({'success': True}), 200
    else:
        return jsonify({'error': 'Forward failed'}), 500

@app.route('/github', methods=['POST'])
def github_webhook():
    signature = request.headers.get('x-hub-signature-256')
    event = request.headers.get('x-github-event')
    payload = request.get_data(as_text=True)
    
    if signature and not verify_signature(payload, signature):
        return jsonify({'error': 'Invalid signature'}), 403
    
    data = {
        'source': 'github',
        'event': event,
        **request.json
    }
    
    if forward_to_openclaw('github', data):
        return jsonify({'success': True}), 200
    else:
        return jsonify({'error': 'Forward failed'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=False)
```

### 5.3 OpenClaw Hook 处理器（TypeScript）

**文件**：`~/.openclaw/hooks/github-notify/handler.ts`
```typescript
const handler = async (event) => {
  // 只处理 GitHub 相关事件
  if (event.type !== "command" || event.action !== "github") {
    return;
  }

  const { repository, sender, action, issue, pull_request } = event.context;
  
  console.log(`[github-notify] Event received: ${action} by ${sender}`);
  
  // 根据事件类型生成不同的消息
  let message = `🔔 GitHub 通知\n\n`;
  message += `📦 仓库：${repository}\n`;
  message += `👤 用户：${sender}\n`;
  message += `⚡ 操作：${action}\n`;
  
  if (issue) {
    message += `\n📝 Issue #${issue.number}\n`;
    message += `标题：${issue.title}\n`;
  }
  
  if (pull_request) {
    message += `\n🔀 PR #${pull_request.number}\n`;
    message += `标题：${pull_request.title}\n`;
    message += `状态：${pull_request.state}\n`;
  }
  
  // 发送消息到用户
  event.messages.push(message);
};

export default handler;
```

**HOOK.md**
```markdown
---
name: github-notify
description: "处理 GitHub Webhook 通知"
metadata: { "openclaw": { "emoji": "🐙", "events": ["command:github"] } }
---

# GitHub 通知 Hook

处理来自 GitHub 的 Webhook 事件通知。

## 触发事件

- `command:github` - GitHub Webhook 事件

## 输出

推送格式化的 GitHub 事件通知到消息渠道。
```

---

## 6. 测试 Webhook 触发流程

### 6.1 本地测试工具

**使用 curl 测试**：
```bash
# 测试 /hooks/wake
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"text":"测试事件","mode":"now"}'

# 测试 /hooks/agent
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "这是一条测试消息",
    "name": "测试",
    "deliver": true,
    "channel": "telegram"
  }'

# 测试自定义端点
curl -X POST http://127.0.0.1:18789/hooks/github \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "source": "github",
    "event": "issues",
    "action": "opened",
    "repository": "test/repo",
    "sender": "tester",
    "issue": {
      "number": 1,
      "title": "测试 Issue"
    }
  }'
```

### 6.2 使用 ngrok 测试公网 Webhook

**步骤 1：安装 ngrok**
```bash
# macOS
brew install ngrok

# 或使用 npm
npm install -g ngrok
```

**步骤 2：启动 ngrok 隧道**
```bash
ngrok http 3000
```

**步骤 3：配置 GitHub/微信使用 ngrok URL**
```
Payload URL: https://xxxx.ngrok.io/github
```

### 6.3 测试脚本

**文件**：`test-webhook.sh`
```bash
#!/bin/bash

OPENCLAW_URL="http://127.0.0.1:18789"
TOKEN="your-token"

echo "=== 测试 Webhook 配置 ==="

# 测试 1: Wake Hook
echo -e "\n1️⃣  测试 /hooks/wake"
curl -s -X POST "$OPENCLAW_URL/hooks/wake" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"测试唤醒","mode":"now"}' | jq .

# 测试 2: Agent Hook
echo -e "\n2️⃣  测试 /hooks/agent"
curl -s -X POST "$OPENCLAW_URL/hooks/agent" \
  -H "x-openclaw-token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "测试消息",
    "name": "测试",
    "deliver": false
  }' | jq .

# 测试 3: GitHub 事件
echo -e "\n3️⃣  测试 GitHub 事件"
curl -s -X POST "$OPENCLAW_URL/hooks/github" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "github",
    "event": "issues",
    "action": "opened",
    "repository": "test/repo",
    "sender": "tester",
    "issue": {
      "number": 1,
      "title": "测试 Issue"
    }
  }' | jq .

# 测试 4: 无效令牌
echo -e "\n4️⃣  测试无效令牌（应返回 401）"
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST "$OPENCLAW_URL/hooks/wake" \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"text":"测试"}'

echo -e "\n=== 测试完成 ==="
```

### 6.4 查看日志

**Gateway 日志**：
```bash
# 实时查看 Webhook 相关日志
tail -f ~/.openclaw/gateway.log | grep -i webhook

# 或查看最近的日志
tail -n 100 ~/.openclaw/gateway.log
```

**诊断命令**：
```bash
# 检查 Webhook 配置
openclaw config show hooks

# 检查 Gateway 状态
openclaw gateway status
```

---

## 7. 安全最佳实践

### 7.1 令牌管理

✅ **推荐做法**：
```bash
# 使用环境变量
export OPENCLAW_HOOKS_TOKEN=$(openssl rand -hex 32)

# 在配置中引用
{
  "hooks": {
    "token": "${OPENCLAW_HOOKS_TOKEN}"
  }
}
```

❌ **避免**：
```json
{
  "hooks": {
    "token": "hardcoded-secret-in-config"  // 不要硬编码
  }
}
```

### 7.2 网络隔离

**方案 1：仅本地访问**
```json
{
  "gateway": {
    "bind": "loopback",  // 仅监听 127.0.0.1
    "port": 18789
  }
}
```

**方案 2：使用 Tailscale**
```json
{
  "gateway": {
    "tailscale": {
      "mode": "on",
      "resetOnExit": false
    }
  }
}
```

**方案 3：反向代理**
```nginx
# Nginx 配置示例
location /hooks {
    allow 10.0.0.0/8;      # 仅允许内网
    allow 192.168.0.0/16;
    deny all;
    
    proxy_pass http://127.0.0.1:18789;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### 7.3 速率限制

配置速率限制防止暴力攻击：

```json
{
  "gateway": {
    "rateLimit": {
      "enabled": true,
      "windowMs": 60000,    // 1 分钟窗口
      "max": 100            // 最多 100 次请求
    }
  }
}
```

### 7.4 会话键安全

```json
{
  "hooks": {
    "defaultSessionKey": "hook:ingress",
    "allowRequestSessionKey": false,        // 禁止请求覆盖
    "allowedSessionKeyPrefixes": ["hook:"]  // 限制前缀
  }
}
```

### 7.5 智能体路由限制

```json
{
  "hooks": {
    "allowedAgentIds": ["hooks", "main"]  // 仅允许特定智能体
  }
}
```

### 7.6 审计日志

启用命令日志 Hook：
```bash
openclaw hooks enable command-logger
```

查看日志：
```bash
# 查看最近的 Webhook 调用
grep webhook ~/.openclaw/logs/commands.log | tail -20

# 格式化查看
grep webhook ~/.openclaw/logs/commands.log | jq .
```

---

## 📎 附录

### A. 响应码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 认证失败 |
| 413 | 负载过大 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |

### B. 常见问题

**Q1: Webhook 不触发怎么办？**
- 检查 `hooks.enabled` 是否为 `true`
- 确认 Gateway 已重启
- 检查令牌是否正确
- 查看 Gateway 日志

**Q2: 如何调试 Webhook？**
```bash
# 启用详细日志
tail -f ~/.openclaw/gateway.log | grep -E "webhook|hook"
```

**Q3: 公众号评论无法实时推送？**
- 微信公众号原生不支持评论 Webhook
- 使用第三方平台或定期轮询方案
- 考虑使用「公众号助手」小程序手动查看

### C. 相关文档

- [OpenClaw Webhook 官方文档](/automation/webhook)
- [OpenClaw Hooks 官方文档](/automation/hooks)
- [GitHub Webhook 文档](https://docs.github.com/en/developers/webhooks-and-events)
- [微信公众号开发文档](https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Access_Overview.html)

---

*最后更新：2026-03-27*
*作者：小咪的 AI 工具官*
