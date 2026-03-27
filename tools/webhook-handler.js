#!/usr/bin/env node
/**
 * OpenClaw Webhook 处理器 - 生产版本
 *
 * 功能特性：
 * - 支持 GitHub, GitLab, Discord, Slack, Telegram, 微信公众号等多平台
 * - 统一的平台适配器架构
 * - 增强的签名验证和错误处理
 * - 支持自定义事件处理器
 * - CLI 和 API 双接口
 *
 * 使用方法：
 *   node webhook-handler.js [options]
 *   node webhook-handler.js --port 3000
 *   node webhook-handler.js --config ./webhook.config.json
 */

import express from 'express';
import { createAdapter, getSupportedAdapters } from './adapters/index.js';
import { Logger, ResponseBuilder, EventEmitter } from './lib/utils.js';
import { program } from 'commander';

// ==================== 配置 ====================

const DEFAULT_CONFIG = {
  port: parseInt(process.env.WEBHOOK_PORT) || 3000,
  host: process.env.WEBHOOK_HOST || '0.0.0.0',

  openclaw: {
    url: process.env.OPENCLAW_URL || 'http://127.0.0.1:18789',
    token: process.env.OPENCLAW_TOKEN || ''
  },

  // 平台密钥配置
  platforms: {
    github: {
      secret: process.env.GITHUB_SECRET || ''
    },
    gitlab: {
      secret: process.env.GITLAB_SECRET || ''
    },
    discord: {
      publicKey: process.env.DISCORD_PUBLIC_KEY || ''
    },
    slack: {
      signingSecret: process.env.SLACK_SIGNING_SECRET || '',
      botToken: process.env.SLACK_BOT_TOKEN || ''
    },
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      secretToken: process.env.TELEGRAM_SECRET_TOKEN || ''
    },
    wechat: {
      token: process.env.WECHAT_TOKEN || '',
      encodingAESKey: process.env.WECHAT_ENCODING_AES_KEY || '',
      appId: process.env.WECHAT_APP_ID || ''
    }
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  }
};

// ==================== Webhook 处理器核心类 ====================

export class WebhookHandler extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = new Logger('WebhookHandler');
    this.app = express();
    this.adapters = new Map();
    this.rawBodyBuffer = new Map();
    this.server = null;

    this._setupMiddleware();
    this._setupRoutes();
    this._setupAdapters();
  }

  /**
   * 设置中间件
   */
  _setupMiddleware() {
    // 捕获原始请求体
    this.app.use((req, res, next) => {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => {
        req.rawBody = Buffer.concat(chunks).toString('utf8');
        next();
      });
    });

    // JSON 解析
    this.app.use(express.json({
      verify: (req, res, buf) => {
        req.rawBody = buf.toString('utf8');
      }
    }));

    // URL 编码解析
    this.app.use(express.urlencoded({ extended: true }));

    // XML 解析（微信需要）
    this.app.use((req, res, next) => {
      if (req.is('text/xml') || req.is('application/xml')) {
        this._parseXml(req.rawBody || req.body)
          .then(parsed => {
            req.body = parsed;
            next();
          })
          .catch(err => {
            this.logger.error('XML parse error', { error: err.message });
            next();
          });
      } else {
        next();
      }
    });

    // 请求日志
    this.app.use((req, res, next) => {
      this.logger.debug('Incoming request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      next();
    });
  }

  /**
   * 解析 XML
   */
  async _parseXml(xml) {
    // 简单的 XML 解析，适用于微信消息格式
    const result = {};
    const regex = /<(\w+)><!\[CDATA\[(.*?)\]\]><\/\1>|<(\w+)>(.*?)<\/\3>/g;
    let match;

    while ((match = regex.exec(xml)) !== null) {
      const key = match[1] || match[3];
      const value = match[2] || match[4];
      if (!result[key]) {
        result[key] = [value];
      } else {
        result[key].push(value);
      }
    }

    return { xml: result };
  }

  /**
   * 设置路由
   */
  _setupRoutes() {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json(ResponseBuilder.success({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: Date.now(),
        adapters: Array.from(this.adapters.keys())
      }));
    });

    // 支持的适配器列表
    this.app.get('/adapters', (req, res) => {
      res.json(ResponseBuilder.success({
        supported: getSupportedAdapters(),
        loaded: Array.from(this.adapters.keys())
      }));
    });

    // 通用 Webhook 端点
    this.app.post('/webhook/:platform', this._handleWebhook.bind(this));

    // 平台专用端点
    this.app.get('/github', this._handleVerification.bind(this, 'github'));
    this.app.post('/github', this._handleWebhook.bind(this, 'github'));
    this.app.get('/gitlab', this._handleVerification.bind(this, 'gitlab'));
    this.app.post('/gitlab', this._handleWebhook.bind(this, 'gitlab'));
    this.app.post('/discord', this._handleWebhook.bind(this, 'discord'));
    this.app.post('/slack', this._handleWebhook.bind(this, 'slack'));
    this.app.post('/telegram', this._handleWebhook.bind(this, 'telegram'));
    this.app.get('/wechat', this._handleWechatVerification.bind(this));
    this.app.post('/wechat', this._handleWebhook.bind(this, 'wechat'));

    // 公众号评论通知（第三方平台）
    this.app.post('/wechat-comment', async (req, res) => {
      try {
        const { comment, article, user } = req.body;

        const event = {
          platform: 'wechat-comment',
          event: 'comment',
          timestamp: Date.now(),
          data: {
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
          }
        };

        this.emit('event', event);
        this.logger.info('WeChat comment received', event.data);

        res.json(ResponseBuilder.success({ received: true }));
      } catch (error) {
        this.logger.error('WeChat comment handler error', { error: error.message });
        res.status(500).json(ResponseBuilder.error(error.message));
      }
    });

    // 测试端点
    this.app.post('/test', async (req, res) => {
      try {
        const event = {
          platform: 'test',
          event: 'test',
          timestamp: Date.now(),
          data: req.body
        };

        this.emit('event', event);
        this.logger.info('Test webhook received', req.body);

        res.json(ResponseBuilder.success({
          message: 'Test webhook received',
          event
        }));
      } catch (error) {
        res.status(500).json(ResponseBuilder.error(error.message));
      }
    });

    // 404 处理
    this.app.use((req, res) => {
      res.status(404).json(ResponseBuilder.error('Not found', 404));
    });

    // 错误处理
    this.app.use((err, req, res, next) => {
      this.logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack
      });
      res.status(500).json(ResponseBuilder.error('Internal server error', 500));
    });
  }

  /**
   * 设置适配器
   */
  _setupAdapters() {
    for (const [name, config] of Object.entries(this.config.platforms)) {
      const adapter = createAdapter(name, config);
      if (adapter) {
        this.adapters.set(name, adapter);
        this.logger.info('Adapter loaded', { platform: name });
      }
    }
  }

  /**
   * 处理验证请求
   */
  async _handleVerification(platform, req, res) {
    res.json(ResponseBuilder.success({
      platform,
      message: 'Verification endpoint ready'
    }));
  }

  /**
   * 处理微信公众号验证
   */
  async _handleWechatVerification(req, res) {
    const adapter = this.adapters.get('wechat');
    if (adapter) {
      const handled = await adapter.handleVerification(req, res);
      if (!handled) {
        res.status(400).send('Bad request');
      }
    } else {
      res.status(501).json(ResponseBuilder.error('WeChat adapter not configured', 501));
    }
  }

  /**
   * 处理 Webhook 请求
   */
  async _handleWebhook(platformOrReq, reqOrRes, next) {
    // 处理两种调用方式
    let platform, req, res;
    if (typeof platformOrReq === 'string') {
      platform = platformOrReq;
      req = reqOrRes;
      res = next;
    } else {
      req = platformOrReq;
      res = reqOrRes;
      platform = req.params.platform;
    }

    try {
      const adapter = this.adapters.get(platform);

      if (!adapter) {
        this.logger.warn('Unknown platform', { platform });
        return res.status(400).json(ResponseBuilder.error(`Unknown platform: ${platform}`, 400));
      }

      // 验证签名
      const isValid = await adapter.verifySignature(req, req.rawBody);
      if (!isValid) {
        this.logger.warn('Invalid signature', { platform });
        return res.status(403).json(ResponseBuilder.error('Invalid signature', 403));
      }

      // 解析事件
      const event = await adapter.parseEvent(req);

      // 触发事件
      this.emit('event', event);
      this.emit(`${platform}:${event.event}`, event);
      this.logger.info('Webhook received', {
        platform,
        event: event.event,
        action: event.action || event.data?.action
      });

      // 格式化响应
      const response = adapter.formatResponse(event);
      res.json(response);

    } catch (error) {
      this.logger.error('Webhook handler error', {
        platform,
        error: error.message,
        stack: error.stack
      });
      res.status(500).json(ResponseBuilder.error(error.message, 500));
    }
  }

  /**
   * 注册事件处理器
   */
  onEvent(platform, eventType, handler) {
    if (typeof platform === 'function') {
      // 通用事件处理器
      this.on('event', platform);
    } else {
      this.on(`${platform}:${eventType}`, handler);
    }
    return this;
  }

  /**
   * 启动服务器
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, this.config.host, () => {
          this._printBanner();
          resolve(this.server);
        });

        // 优雅关闭
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 停止服务器
   */
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.logger.info('Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * 打印启动信息
   */
  _printBanner() {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║              OpenClaw Webhook Handler v1.0.0                   ║
╠════════════════════════════════════════════════════════════════╣
║  Server: ${`${this.config.host}:${this.config.port}`.padEnd(54)}║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(49)}║
╠════════════════════════════════════════════════════════════════╣
║  Supported Platforms:                                          ║
${Array.from(this.adapters.keys()).map(p => `║    - ${p.padEnd(58)}║`).join('\n')}
╠════════════════════════════════════════════════════════════════╣
║  Endpoints:                                                    ║
║    GET  /health              - 健康检查                        ║
║    GET  /adapters            - 已加载适配器列表                ║
║    POST /webhook/:platform   - 通用 Webhook 端点               ║
║    POST /github              - GitHub Webhook                  ║
║    POST /gitlab              - GitLab Webhook                  ║
║    POST /discord             - Discord Webhook                 ║
║    POST /slack               - Slack Webhook                   ║
║    POST /telegram            - Telegram Webhook                ║
║    GET/POST /wechat          - 微信公众号 Webhook               ║
║    POST /wechat-comment      - 公众号评论通知                  ║
║    POST /test                - 测试端点                        ║
╚════════════════════════════════════════════════════════════════╝
    `);
  }
}

// ==================== CLI 入口 ====================

program
  .name('webhook-handler')
  .description('OpenClaw Webhook 处理器 - 多平台支持')
  .version('1.0.0')
  .option('-p, --port <port>', '服务端口', '3000')
  .option('-h, --host <host>', '服务主机', '0.0.0.0')
  .option('-c, --config <file>', '配置文件路径')
  .option('-v, --verbose', '详细日志输出')
  .action(async (options) => {
    if (options.verbose) {
      process.env.DEBUG = 'true';
    }

    const config = {
      port: parseInt(options.port),
      host: options.host
    };

    // 如果指定了配置文件，加载它
    if (options.config) {
      try {
        const { default: configData } = await import(options.config, { assert: { type: 'json' } });
        Object.assign(config, configData);
      } catch (error) {
        console.error(`Failed to load config file: ${error.message}`);
        process.exit(1);
      }
    }

    const handler = new WebhookHandler(config);

    // 注册示例事件处理器
    handler.onEvent('github', 'push', (event) => {
      console.log(`📦 GitHub Push: ${event.repository?.fullName} - ${event.data?.commits?.length || 0} commits`);
    });

    handler.onEvent('github', 'pull_request', (event) => {
      console.log(`🔀 GitHub PR: ${event.data?.title} - ${event.action}`);
    });

    handler.onEvent('wechat', 'text_message', (event) => {
      console.log(`💬 WeChat Message: ${event.data?.content}`);
    });

    handler.onEvent((event) => {
      // 通用事件日志
      if (process.env.DEBUG === 'true') {
        console.log('Event:', JSON.stringify(event, null, 2));
      }
    });

    try {
      await handler.start();
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  });

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

export default WebhookHandler;