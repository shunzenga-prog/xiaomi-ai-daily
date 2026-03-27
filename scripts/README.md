# OpenClaw Webhook 示例代码

本目录包含 OpenClaw Webhook 集成的完整示例代码。

## 📁 文件说明

```
scripts/
├── webhook-handler-example.js    # Node.js 版本 Webhook 处理器
├── webhook-handler-example.py    # Python 版本 Webhook 处理器
├── test-webhook.sh               # Webhook 测试脚本
├── package.json                  # Node.js 依赖配置
└── .env.example                  # 环境变量配置示例
```

## 🚀 快速开始

### 方式 1: Node.js 版本（推荐）

**1. 安装依赖**
```bash
cd scripts
npm install
```

**2. 配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，填入实际的令牌和密钥
```

**3. 启动服务**
```bash
npm start
```

**4. 测试**
```bash
./test-webhook.sh
```

### 方式 2: Python 版本

**1. 安装依赖**
```bash
pip install flask requests python-dotenv
```

**2. 配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件
```

**3. 启动服务**
```bash
python webhook-handler-example.py
```

## 📡 可用端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/webhook/:source` | POST | 通用 Webhook 端点 |
| `/github` | POST | GitHub Webhook |
| `/wechat` | GET/POST | 微信公众号 Webhook |
| `/wechat-comment` | POST | 公众号评论通知 |
| `/test` | POST | 测试端点 |

## 🔧 配置说明

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `WEBHOOK_PORT` | Webhook 服务端口 | 3000 |
| `WEBHOOK_SECRET` | Webhook 签名密钥 | - |
| `OPENCLAW_URL` | OpenClaw Gateway 地址 | http://127.0.0.1:18789 |
| `OPENCLAW_TOKEN` | OpenClaw 认证令牌 | - |
| `GITHUB_SECRET` | GitHub Webhook 密钥 | - |
| `WECHAT_TOKEN` | 微信验证令牌 | - |
| `DEBUG` | 调试模式 | false |

### OpenClaw 配置

在 `~/.openclaw/openclaw.json` 中添加：

```json
{
  "hooks": {
    "enabled": true,
    "token": "${OPENCLAW_HOOKS_TOKEN}",
    "path": "/hooks",
    "mappings": {
      "github": {
        "match": { "source": "github" },
        "action": "agent",
        "template": {
          "message": "GitHub 事件：{{event}} - {{action}}\n仓库：{{repository}}\n用户：{{sender}}",
          "name": "GitHub",
          "deliver": true,
          "channel": "telegram"
        }
      },
      "wechat-comment": {
        "match": { "source": "wechat-comment" },
        "action": "agent",
        "template": {
          "message": "公众号评论：{{user.nickname}} 在《{{article.title}}》中说：{{comment.content}}",
          "name": "公众号",
          "deliver": true,
          "channel": "telegram"
        }
      }
    }
  }
}
```

## 🧪 测试

### 使用测试脚本

```bash
# 运行所有测试
./test-webhook.sh

# 只测试 GitHub Webhook
./test-webhook.sh --github

# 只测试安全相关
./test-webhook.sh --security
```

### 手动测试

**测试健康检查**
```bash
curl http://127.0.0.1:3000/health
```

**测试 GitHub Webhook**
```bash
curl -X POST http://127.0.0.1:3000/github \
  -H "Content-Type: application/json" \
  -H "x-github-event: issues" \
  -d '{
    "action": "opened",
    "repository": {"full_name": "test/repo"},
    "sender": {"login": "tester"},
    "issue": {"number": 1, "title": "测试"}
  }'
```

**测试通用 Webhook**
```bash
curl -X POST http://127.0.0.1:3000/webhook/custom \
  -H "Content-Type: application/json" \
  -d '{"message": "测试消息"}'
```

## 🔒 安全建议

1. **使用强随机令牌**
   ```bash
   openssl rand -hex 32
   ```

2. **仅监听本地或内网**
   ```javascript
   // 仅监听本地
   app.listen(3000, '127.0.0.1')
   
   // 或通过 Nginx 反向代理限制访问
   ```

3. **启用 HTTPS（生产环境）**
   ```bash
   # 使用 Let's Encrypt
   certbot --nginx -d your-domain.com
   ```

4. **定期更换密钥**
   - 至少每 90 天更换一次
   - 使用密钥管理工具

5. **监控和日志**
   ```bash
   # 查看日志
   tail -f ~/.openclaw/gateway.log | grep webhook
   ```

## 📚 相关文档

- [Webhook 配置指南](../docs/webhook 配置指南.md)
- [OpenClaw 官方文档](https://docs.openclaw.ai/automation/webhook)
- [GitHub Webhook 文档](https://docs.github.com/en/developers/webhooks-and-events)
- [微信公众号开发文档](https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Access_Overview.html)

## 🐛 故障排除

**问题 1: Webhook 不触发**
- 检查 `hooks.enabled` 是否为 `true`
- 确认 Gateway 已重启
- 查看 Gateway 日志

**问题 2: 签名验证失败**
- 确认密钥配置一致
- 检查请求头格式
- 使用测试脚本验证

**问题 3: 连接被拒绝**
- 确认 OpenClaw Gateway 正在运行
- 检查端口配置
- 确认防火墙设置

## 📝 许可证

MIT License

---

*创建时间：2026-03-27*
*作者：小咪的 AI 工具官*
