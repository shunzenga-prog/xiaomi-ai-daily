#!/usr/bin/env node
/**
 * OpenClaw Webhook 处理器示例
 * 
 * 功能：
 * 1. 接收外部 Webhook 事件
 * 2. 验证签名
 * 3. 转发到 OpenClaw
 * 4. 支持 GitHub、微信公众号等平台
 * 
 * 使用：
 *   npm install express crypto axios
 *   node webhook-handler-example.js
 */

const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

// ==================== 配置 ====================
const CONFIG = {
  // Webhook 服务器配置
  port: process.env.WEBHOOK_PORT || 3000,
  
  // OpenClaw 配置
  openclaw: {
    url: process.env.OPENCLAW_URL || 'http://127.0.0.1:18789',
    token: process.env.OPENCLAW_TOKEN || 'your-openclaw-token'
  },
  
  // Webhook 密钥
  secret: process.env.WEBHOOK_SECRET || 'your-webhook-secret',
  
  // GitHub 配置
  github: {
    secret: process.env.GITHUB_SECRET || 'your-github-secret'
  },
  
  // 微信配置
  wechat: {
    token: process.env.WECHAT_TOKEN || 'your-wechat-token'
  }
};

// ==================== 工具函数 ====================

/**
 * 验证 HMAC-SHA256 签名
 */
function verifySignature(payload, signature, secret) {
  if (!signature) return false;
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(signature)
    );
  } catch (e) {
    return false;
  }
}

/**
 * 格式化时间戳
 */
function formatTimestamp(timestamp) {
  return new Date(timestamp).toISOString();
}

/**
 * 记录日志
 */
function log(level, message, data = {}) {
  const timestamp = formatTimestamp(Date.now());
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, JSON.stringify(data, null, 2));
}

// ==================== Webhook 处理器类 ====================

class WebhookHandler {
  constructor(config) {
    this.config = config;
    this.app = express();
    this.app.use(express.json());
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // 请求日志
    this.app.use((req, res, next) => {
      log('info', `${req.method} ${req.path}`, {
        headers: req.headers,
        ip: req.ip
      });
      next();
    });
  }

  setupRoutes() {
    // 健康检查端点
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: Date.now(),
        uptime: process.uptime()
      });
    });

    // 通用 Webhook 端点
    this.app.post('/webhook/:source', async (req, res) => {
      try {
        const { source } = req.params;
        const signature = req.headers['x-webhook-signature'];
        const payload = JSON.stringify(req.body);

        // 验证签名
        if (signature && !verifySignature(payload, signature, this.config.secret)) {
          log('warn', 'Invalid signature', { source });
          return res.status(403).json({ error: 'Invalid signature' });
        }

        // 构建事件
        const event = {
          source,
          type: req.headers['x-webhook-event'] || 'generic',
          action: req.headers['x-webhook-action'],
          data: req.body,
          timestamp: Date.now()
        };

        log('info', 'Received webhook', { source, type: event.type });

        // 转发到 OpenClaw
        await this.forwardToOpenClaw(source, event.data);

        res.status(200).json({ success: true });
      } catch (error) {
        log('error', 'Webhook processing failed', { error: error.message });
        res.status(500).json({ error: 'Internal error', message: error.message });
      }
    });

    // GitHub Webhook 端点
    this.app.post('/github', async (req, res) => {
      try {
        const signature = req.headers['x-hub-signature-256'];
        const event = req.headers['x-github-event'];
        const payload = JSON.stringify(req.body);

        // 验证 GitHub 签名
        if (signature && !verifySignature(payload, signature, this.config.github.secret)) {
          log('warn', 'Invalid GitHub signature');
          return res.status(403).json({ error: 'Invalid GitHub signature' });
        }

        log('info', 'GitHub event received', {
          event,
          action: req.body.action,
          repository: req.body.repository?.full_name,
          sender: req.body.sender?.login
        });

        // 转发到 OpenClaw
        await this.forwardToOpenClaw('github', {
          source: 'github',
          event,
          action: req.body.action,
          repository: req.body.repository?.full_name,
          sender: req.body.sender?.login,
          issue: req.body.issue ? {
            number: req.body.issue.number,
            title: req.body.issue.title,
            body: req.body.issue.body,
            state: req.body.issue.state
          } : null,
          pull_request: req.body.pull_request ? {
            number: req.body.pull_request.number,
            title: req.body.pull_request.title,
            state: req.body.pull_request.state,
            action: req.body.pull_request.action
          } : null,
          commits: req.body.commits?.map(c => ({
            id: c.id,
            message: c.message,
            author: c.author?.name
          })) || [],
          raw: req.body
        });

        res.status(200).json({ success: true });
      } catch (error) {
        log('error', 'GitHub webhook failed', { error: error.message });
        res.status(500).json({ error: 'Internal error', message: error.message });
      }
    });

    // 微信 Webhook 端点（验证 + 接收）
    this.app.get('/wechat', (req, res) => {
      const { echostr, signature, timestamp, nonce } = req.query;
      
      // 微信验证
      const hash = crypto
        .createHash('sha1')
        .update([this.config.wechat.token, timestamp, nonce].sort().join(''))
        .digest('hex');
      
      if (hash === signature) {
        log('info', 'WeChat verification success');
        res.send(echostr);
      } else {
        log('warn', 'WeChat verification failed');
        res.status(403).send('Invalid signature');
      }
    });

    this.app.post('/wechat', async (req, res) => {
      try {
        const { ToUserName, FromUserName, CreateTime, MsgType, Content, Event } = req.body;
        
        log('info', 'WeChat message received', {
          type: MsgType,
          event: Event,
          from: FromUserName
        });

        // 转发到 OpenClaw
        await this.forwardToOpenClaw('wechat', {
          source: 'wechat',
          type: MsgType,
          event: Event,
          content: Content,
          from: FromUserName,
          to: ToUserName,
          timestamp: CreateTime * 1000
        });

        res.send('success');
      } catch (error) {
        log('error', 'WeChat webhook failed', { error: error.message });
        res.status(500).send('error');
      }
    });

    // 公众号评论通知端点（第三方平台）
    this.app.post('/wechat-comment', async (req, res) => {
      try {
        const { comment, article, user } = req.body;
        
        log('info', 'WeChat comment received', {
          article: article?.title,
          user: user?.nickname,
          content: comment?.content
        });

        await this.forwardToOpenClaw('wechat-comment', {
          source: 'wechat-comment',
          article: {
            title: article?.title,
            url: article?.url
          },
          comment: {
            content: comment?.content,
            createdAt: comment?.created_at
          },
          user: {
            nickname: user?.nickname,
            avatar: user?.avatar
          }
        });

        res.status(200).json({ success: true });
      } catch (error) {
        log('error', 'WeChat comment webhook failed', { error: error.message });
        res.status(500).json({ error: 'Internal error' });
      }
    });

    // 测试端点
    this.app.post('/test', async (req, res) => {
      try {
        log('info', 'Test webhook received', req.body);
        
        await this.forwardToOpenClaw('test', {
          source: 'test',
          message: '这是一条测试消息',
          data: req.body,
          timestamp: Date.now()
        });

        res.status(200).json({ 
          success: true,
          message: 'Test webhook forwarded successfully'
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  async forwardToOpenClaw(source, data) {
    const url = `${this.config.openclaw.url}/hooks/${source}`;
    
    log('info', 'Forwarding to OpenClaw', { url, source });

    try {
      const response = await axios.post(url, data, {
        headers: {
          'Authorization': `Bearer ${this.config.openclaw.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      log('info', 'OpenClaw response', { 
        status: response.status,
        data: response.data 
      });
      
      return response.data;
    } catch (error) {
      log('error', 'Forward to OpenClaw failed', {
        status: error.response?.status,
        message: error.message
      });
      throw error;
    }
  }

  start() {
    this.app.listen(this.config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║           OpenClaw Webhook Handler Started                ║
╠═══════════════════════════════════════════════════════════╣
║  Port: ${String(this.config.port).padEnd(52)}║
║  OpenClaw URL: ${this.config.openclaw.url.padEnd(44)}║
║  Environment: ${process.env.NODE_ENV || 'development'.padEnd(45)}║
╠═══════════════════════════════════════════════════════════╣
║  Available Endpoints:                                     ║
║    GET  /health          - 健康检查                       ║
║    POST /webhook/:source - 通用 Webhook                   ║
║    POST /github          - GitHub Webhook                 ║
║    GET/POST /wechat      - 微信 Webhook                   ║
║    POST /wechat-comment  - 公众号评论                     ║
║    POST /test            - 测试端点                       ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  }
}

// ==================== 启动服务 ====================

const handler = new WebhookHandler(CONFIG);
handler.start();

// 优雅退出
process.on('SIGINT', () => {
  log('info', 'Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('info', 'Shutting down...');
  process.exit(0);
});
