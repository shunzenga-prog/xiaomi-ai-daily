/**
 * Webhook 处理器测试
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { WebhookHandler } from '../webhook-handler.js';
import { GitHubAdapter, GitLabAdapter, DiscordAdapter, SlackAdapter, TelegramAdapter, WeChatAdapter } from '../adapters/index.js';
import { verifyHmacSha256, verifyWechatSignature, Logger, ResponseBuilder } from '../lib/utils.js';

describe('工具库测试', () => {
  describe('签名验证', () => {
    it('HMAC-SHA256 签名验证 - 有效签名', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';
      const hmac = crypto.createHmac('sha256', secret);
      const signature = 'sha256=' + hmac.update(payload).digest('hex');

      assert.strictEqual(verifyHmacSha256(payload, signature, secret), true);
    });

    it('HMAC-SHA256 签名验证 - 无效签名', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';
      const signature = 'sha256=invalid';

      assert.strictEqual(verifyHmacSha256(payload, signature, secret), false);
    });

    it('微信签名验证', () => {
      const token = 'test-token';
      const timestamp = '1234567890';
      const nonce = 'test-nonce';
      const arr = [token, timestamp, nonce].sort();
      const signature = crypto.createHash('sha1').update(arr.join('')).digest('hex');

      assert.strictEqual(verifyWechatSignature(token, timestamp, nonce, signature), true);
    });
  });

  describe('Logger', () => {
    it('创建日志实例', () => {
      const logger = new Logger('Test');
      assert.ok(logger);
      assert.strictEqual(typeof logger.info, 'function');
      assert.strictEqual(typeof logger.warn, 'function');
      assert.strictEqual(typeof logger.error, 'function');
    });
  });

  describe('ResponseBuilder', () => {
    it('成功响应', () => {
      const response = ResponseBuilder.success({ data: 'test' });
      assert.strictEqual(response.success, true);
      assert.strictEqual(response.data, 'test');
      assert.ok(response.timestamp);
    });

    it('错误响应', () => {
      const response = ResponseBuilder.error('Test error', 400);
      assert.strictEqual(response.success, false);
      assert.strictEqual(response.error.code, 400);
      assert.strictEqual(response.error.message, 'Test error');
    });
  });
});

describe('适配器测试', () => {
  describe('GitHub 适配器', () => {
    let adapter;

    before(() => {
      adapter = new GitHubAdapter({ secret: 'test-secret' });
    });

    it('创建适配器实例', () => {
      assert.ok(adapter);
      assert.strictEqual(adapter.name, 'github');
    });

    it('解析 Push 事件', async () => {
      const req = {
        headers: {
          'x-github-event': 'push'
        },
        body: {
          ref: 'refs/heads/main',
          repository: {
            id: 1,
            name: 'test-repo',
            full_name: 'user/test-repo',
            html_url: 'https://github.com/user/test-repo'
          },
          sender: {
            login: 'testuser'
          },
          commits: [{ id: 'abc123', message: 'Test commit' }]
        }
      };

      const event = await adapter.parseEvent(req);
      assert.strictEqual(event.platform, 'github');
      assert.strictEqual(event.event, 'push');
      assert.ok(event.repository);
      assert.ok(event.sender);
    });

    it('解析 Pull Request 事件', async () => {
      const req = {
        headers: {
          'x-github-event': 'pull_request'
        },
        body: {
          action: 'opened',
          pull_request: {
            number: 1,
            title: 'Test PR',
            state: 'open'
          },
          repository: { full_name: 'user/test-repo' }
        }
      };

      const event = await adapter.parseEvent(req);
      assert.strictEqual(event.event, 'pull_request');
      assert.strictEqual(event.action, 'opened');
    });
  });

  describe('GitLab 适配器', () => {
    let adapter;

    before(() => {
      adapter = new GitLabAdapter({ secret: 'test-secret' });
    });

    it('创建适配器实例', () => {
      assert.strictEqual(adapter.name, 'gitlab');
    });

    it('解析 Push 事件', async () => {
      const req = {
        headers: {
          'x-gitlab-event': 'Push Hook'
        },
        body: {
          object_kind: 'push',
          ref: 'refs/heads/main',
          project: {
            id: 1,
            name: 'test-project',
            web_url: 'https://gitlab.com/user/test-project'
          },
          commits: [{ id: 'abc123', message: 'Test' }]
        }
      };

      const event = await adapter.parseEvent(req);
      assert.strictEqual(event.platform, 'gitlab');
      assert.ok(event.project);
    });
  });

  describe('WeChat 适配器', () => {
    let adapter;

    before(() => {
      adapter = new WeChatAdapter({ token: 'test-token' });
    });

    it('创建适配器实例', () => {
      assert.strictEqual(adapter.name, 'wechat');
    });

    it('解析文本消息', async () => {
      const req = {
        query: {},
        body: {
          xml: {
            ToUserName: ['gh_xxx'],
            FromUserName: ['user123'],
            CreateTime: ['1234567890'],
            MsgType: ['text'],
            Content: ['Hello']
          }
        }
      };

      const event = await adapter.parseEvent(req);
      assert.strictEqual(event.platform, 'wechat');
      assert.strictEqual(event.event, 'text_message');
      assert.strictEqual(event.data.content, 'Hello');
    });

    it('解析订阅事件', async () => {
      const req = {
        query: {},
        body: {
          xml: {
            ToUserName: ['gh_xxx'],
            FromUserName: ['user123'],
            CreateTime: ['1234567890'],
            MsgType: ['event'],
            Event: ['subscribe']
          }
        }
      };

      const event = await adapter.parseEvent(req);
      assert.strictEqual(event.event, 'subscribe');
    });
  });

  describe('Telegram 适配器', () => {
    let adapter;

    before(() => {
      adapter = new TelegramAdapter({ botToken: 'test-token' });
    });

    it('创建适配器实例', () => {
      assert.strictEqual(adapter.name, 'telegram');
    });

    it('解析消息', async () => {
      const req = {
        headers: {},
        body: {
          message: {
            message_id: 1,
            from: { id: 123, first_name: 'Test' },
            chat: { id: 123, type: 'private' },
            text: 'Hello'
          }
        }
      };

      const event = await adapter.parseEvent(req);
      assert.strictEqual(event.platform, 'telegram');
      assert.strictEqual(event.event, 'message');
      assert.strictEqual(event.data.text, 'Hello');
    });
  });

  describe('Slack 适配器', () => {
    let adapter;

    before(() => {
      adapter = new SlackAdapter({ signingSecret: 'test-secret' });
    });

    it('创建适配器实例', () => {
      assert.strictEqual(adapter.name, 'slack');
    });

    it('解析 Slash 命令', async () => {
      const req = {
        headers: {},
        body: {
          token: 'test-token',
          team_id: 'T123',
          user_id: 'U123',
          command: '/hello',
          text: 'world'
        }
      };

      const event = await adapter.parseEvent(req);
      assert.strictEqual(event.platform, 'slack');
      assert.strictEqual(event.event, 'slash_command');
      assert.strictEqual(event.data.command, '/hello');
    });
  });

  describe('Discord 适配器', () => {
    let adapter;

    before(() => {
      adapter = new DiscordAdapter({ publicKey: 'test-key' });
    });

    it('创建适配器实例', () => {
      assert.strictEqual(adapter.name, 'discord');
    });

    it('解析 PING 事件', async () => {
      const req = {
        headers: {},
        body: { type: 1 }
      };

      const event = await adapter.parseEvent(req);
      assert.strictEqual(event.platform, 'discord');
      assert.strictEqual(event.event, 'ping');
    });
  });
});

describe('WebhookHandler 测试', () => {
  let handler;

  before(() => {
    handler = new WebhookHandler({ port: 3099 });
  });

  it('创建处理器实例', () => {
    assert.ok(handler);
    assert.ok(handler.app);
  });

  it('加载适配器', () => {
    assert.ok(handler.adapters.size > 0);
  });

  it('事件发射器', () => {
    let received = false;
    handler.onEvent('test', 'event', () => {
      received = true;
    });
    handler.emit('test:event', { test: true });
    assert.strictEqual(received, true);
  });
});

console.log('✅ Webhook 处理器测试完成');