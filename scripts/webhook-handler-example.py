#!/usr/bin/env python3
"""
OpenClaw Webhook 处理器示例 (Python 版本)

功能:
1. 接收外部 Webhook 事件
2. 验证签名
3. 转发到 OpenClaw
4. 支持 GitHub、微信公众号等平台

依赖:
    pip install flask requests python-dotenv

使用:
    python webhook-handler-example.py
"""

import os
import hmac
import hashlib
import requests
from datetime import datetime
from flask import Flask, request, jsonify
from functools import wraps

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ==================== 配置 ====================
class Config:
    # Webhook 服务器配置
    PORT = int(os.getenv('WEBHOOK_PORT', 3000))
    
    # OpenClaw 配置
    OPENCLAW_URL = os.getenv('OPENCLAW_URL', 'http://127.0.0.1:18789')
    OPENCLAW_TOKEN = os.getenv('OPENCLAW_TOKEN', 'your-openclaw-token')
    
    # Webhook 密钥
    WEBHOOK_SECRET = os.getenv('WEBHOOK_SECRET', 'your-webhook-secret')
    
    # GitHub 配置
    GITHUB_SECRET = os.getenv('GITHUB_SECRET', 'your-github-secret')
    
    # 微信配置
    WECHAT_TOKEN = os.getenv('WECHAT_TOKEN', 'your-wechat-token')
    
    # 调试模式
    DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'

config = Config()

# ==================== Flask 应用 ====================
app = Flask(__name__)

# ==================== 工具函数 ====================

def log(level, message, data=None):
    """记录日志"""
    timestamp = datetime.now().isoformat()
    log_data = {
        'timestamp': timestamp,
        'level': level.upper(),
        'message': message
    }
    if data:
        log_data['data'] = data
    print(f"[{timestamp}] [{level.upper()}] {message}")
    if data and config.DEBUG:
        import json
        print(json.dumps(data, indent=2, ensure_ascii=False))

def verify_signature(payload, signature, secret):
    """验证 HMAC-SHA256 签名"""
    if not signature:
        return False
    
    expected = 'sha256=' + hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected, signature)

def verify_wechat_signature(signature, timestamp, nonce, token):
    """验证微信签名"""
    hash_value = hashlib.sha1(
        ''.join(sorted([token, timestamp, nonce])).encode()
    ).hexdigest()
    return hash_value == signature

def forward_to_openclaw(source, data):
    """转发事件到 OpenClaw"""
    url = f'{config.OPENCLAW_URL}/hooks/{source}'
    
    log('info', f'Forwarding to OpenClaw: {url}')
    
    try:
        response = requests.post(
            url,
            json=data,
            headers={
                'Authorization': f'Bearer {config.OPENCLAW_TOKEN}',
                'Content-Type': 'application/json'
            },
            timeout=5
        )
        
        log('info', f'OpenClaw response: {response.status_code}')
        return response.status_code == 200, response.json() if response.ok else response.text
    except Exception as e:
        log('error', f'Forward to OpenClaw failed: {str(e)}')
        return False, str(e)

# ==================== 路由 ====================

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'uptime': datetime.now().timestamp()
    })

@app.route('/webhook/<source>', methods=['POST'])
def generic_webhook(source):
    """通用 Webhook 端点"""
    try:
        signature = request.headers.get('x-webhook-signature')
        payload = request.get_data(as_text=True)
        
        # 验证签名
        if signature and not verify_signature(payload, signature, config.WEBHOOK_SECRET):
            log('warn', 'Invalid signature', {'source': source})
            return jsonify({'error': 'Invalid signature'}), 403
        
        # 构建事件
        event = {
            'source': source,
            'type': request.headers.get('x-webhook-event', 'generic'),
            'action': request.headers.get('x-webhook-action'),
            'data': request.json,
            'timestamp': datetime.now().timestamp()
        }
        
        log('info', f'Received webhook: {source}', {'type': event['type']})
        
        # 转发到 OpenClaw
        success, result = forward_to_openclaw(source, event['data'])
        
        if success:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'error': 'Forward failed', 'details': result}), 500
            
    except Exception as e:
        log('error', f'Webhook processing failed: {str(e)}')
        return jsonify({'error': 'Internal error', 'message': str(e)}), 500

@app.route('/github', methods=['POST'])
def github_webhook():
    """GitHub Webhook 端点"""
    try:
        signature = request.headers.get('x-hub-signature-256')
        event = request.headers.get('x-github-event')
        payload = request.get_data(as_text=True)
        
        # 验证 GitHub 签名
        if signature and not verify_signature(payload, signature, config.GITHUB_SECRET):
            log('warn', 'Invalid GitHub signature')
            return jsonify({'error': 'Invalid GitHub signature'}), 403
        
        data = request.json
        log('info', 'GitHub event received', {
            'event': event,
            'action': data.get('action'),
            'repository': data.get('repository', {}).get('full_name'),
            'sender': data.get('sender', {}).get('login')
        })
        
        # 转发到 OpenClaw
        forward_data = {
            'source': 'github',
            'event': event,
            'action': data.get('action'),
            'repository': data.get('repository', {}).get('full_name'),
            'sender': data.get('sender', {}).get('login'),
            'issue': None,
            'pull_request': None,
            'commits': []
        }
        
        if 'issue' in data:
            forward_data['issue'] = {
                'number': data['issue'].get('number'),
                'title': data['issue'].get('title'),
                'body': data['issue'].get('body'),
                'state': data['issue'].get('state')
            }
        
        if 'pull_request' in data:
            forward_data['pull_request'] = {
                'number': data['pull_request'].get('number'),
                'title': data['pull_request'].get('title'),
                'state': data['pull_request'].get('state'),
                'action': data['pull_request'].get('action')
            }
        
        if 'commits' in data:
            forward_data['commits'] = [
                {
                    'id': c.get('id'),
                    'message': c.get('message'),
                    'author': c.get('author', {}).get('name')
                }
                for c in data['commits']
            ]
        
        forward_data['raw'] = data
        
        success, result = forward_to_openclaw('github', forward_data)
        
        if success:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'error': 'Forward failed', 'details': result}), 500
            
    except Exception as e:
        log('error', f'GitHub webhook failed: {str(e)}')
        return jsonify({'error': 'Internal error', 'message': str(e)}), 500

@app.route('/wechat', methods=['GET'])
def wechat_verify():
    """微信验证端点"""
    signature = request.args.get('signature')
    timestamp = request.args.get('timestamp')
    nonce = request.args.get('nonce')
    echostr = request.args.get('echostr')
    
    if verify_wechat_signature(signature, timestamp, nonce, config.WECHAT_TOKEN):
        log('info', 'WeChat verification success')
        return echostr
    else:
        log('warn', 'WeChat verification failed')
        return 'Invalid signature', 403

@app.route('/wechat', methods=['POST'])
def wechat_webhook():
    """微信消息接收端点"""
    try:
        data = request.get_data(as_text=True)
        # 微信消息可能是 XML 格式，这里简化处理 JSON
        import xml.etree.ElementTree as ET
        
        try:
            # 尝试解析 XML
            root = ET.fromstring(data)
            msg_data = {
                'ToUserName': root.find('ToUserName').text if root.find('ToUserName') is not None else None,
                'FromUserName': root.find('FromUserName').text if root.find('FromUserName') is not None else None,
                'CreateTime': int(root.find('CreateTime').text) if root.find('CreateTime') is not None else None,
                'MsgType': root.find('MsgType').text if root.find('MsgType') is not None else None,
                'Content': root.find('Content').text if root.find('Content') is not None else None,
                'Event': root.find('Event').text if root.find('Event') is not None else None
            }
        except ET.ParseError:
            # 如果是 JSON 格式
            import json
            msg_data = json.loads(data)
        
        log('info', 'WeChat message received', {
            'type': msg_data.get('MsgType'),
            'event': msg_data.get('Event'),
            'from': msg_data.get('FromUserName')
        })
        
        forward_data = {
            'source': 'wechat',
            'type': msg_data.get('MsgType'),
            'event': msg_data.get('Event'),
            'content': msg_data.get('Content'),
            'from': msg_data.get('FromUserName'),
            'to': msg_data.get('ToUserName'),
            'timestamp': msg_data.get('CreateTime', 0) * 1000 if msg_data.get('CreateTime') else datetime.now().timestamp() * 1000
        }
        
        success, result = forward_to_openclaw('wechat', forward_data)
        
        if success:
            return 'success', 200
        else:
            return 'error', 500
            
    except Exception as e:
        log('error', f'WeChat webhook failed: {str(e)}')
        return 'error', 500

@app.route('/wechat-comment', methods=['POST'])
def wechat_comment():
    """公众号评论通知端点"""
    try:
        data = request.json
        
        log('info', 'WeChat comment received', {
            'article': data.get('article', {}).get('title'),
            'user': data.get('user', {}).get('nickname'),
            'content': data.get('comment', {}).get('content')
        })
        
        forward_data = {
            'source': 'wechat-comment',
            'article': data.get('article'),
            'comment': data.get('comment'),
            'user': data.get('user')
        }
        
        success, result = forward_to_openclaw('wechat-comment', forward_data)
        
        if success:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'error': 'Forward failed', 'details': result}), 500
            
    except Exception as e:
        log('error', f'WeChat comment webhook failed: {str(e)}')
        return jsonify({'error': 'Internal error', 'message': str(e)}), 500

@app.route('/test', methods=['POST'])
def test_webhook():
    """测试端点"""
    try:
        log('info', 'Test webhook received', request.json)
        
        forward_data = {
            'source': 'test',
            'message': '这是一条测试消息',
            'data': request.json,
            'timestamp': datetime.now().timestamp()
        }
        
        success, result = forward_to_openclaw('test', forward_data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Test webhook forwarded successfully'
            }), 200
        else:
            return jsonify({'error': 'Forward failed', 'details': result}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== 启动服务 ====================

if __name__ == '__main__':
    print(f"""
╔═══════════════════════════════════════════════════════════╗
║         OpenClaw Webhook Handler (Python)                 ║
╠═══════════════════════════════════════════════════════════╣
║  Port: {str(config.PORT).ljust(52)}║
║  OpenClaw URL: {config.OPENCLAW_URL.ljust(44)}║
║  Environment: {('production' if not config.DEBUG else 'development').ljust(45)}║
╠═══════════════════════════════════════════════════════════╣
║  Available Endpoints:                                     ║
║    GET  /health          - 健康检查                       ║
║    POST /webhook/<source> - 通用 Webhook                  ║
║    POST /github          - GitHub Webhook                 ║
║    GET/POST /wechat      - 微信 Webhook                   ║
║    POST /wechat-comment  - 公众号评论                     ║
║    POST /test            - 测试端点                       ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    app.run(host='0.0.0.0', port=config.PORT, debug=config.DEBUG)
