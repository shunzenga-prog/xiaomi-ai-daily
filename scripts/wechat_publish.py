#!/usr/bin/env python3
"""
🐱 小咪的公众号发布脚本
发布 Markdown 文章到微信公众号草稿箱
"""

import requests
import json
import re

# 配置
APPID = "wxd3ec98242122f8a2"
SECRET = "ba7a355348f1bd6b53eaccd75d3c7b6f"

def get_access_token():
    """获取 access_token"""
    url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={APPID}&secret={SECRET}"
    resp = requests.get(url)
    data = resp.json()
    return data.get("access_token")

def markdown_to_html(md_content):
    """简单的 Markdown 转 HTML"""
    html = md_content
    # 标题
    html = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    # 加粗
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    # 斜体
    html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)
    # 换行
    html = html.replace('\n\n', '</p><p>')
    html = html.replace('\n', '<br>')
    # 包裹
    html = f"<section>{html}</section>"
    return html

def create_draft(access_token, title, content):
    """创建草稿"""
    url = f"https://api.weixin.qq.com/cgi-bin/draft/add?access_token={access_token}"
    
    html_content = markdown_to_html(content)
    
    data = {
        "title": title,
        "content": html_content
    }
    
    resp = requests.post(url, json=data)
    return resp.json()

def main():
    # 读取文章
    with open("articles/小咪装大脑 -01.md", "r", encoding="utf-8") as f:
        content = f.read()
    
    # 获取 token
    token = get_access_token()
    print(f"✅ 获取 token 成功：{token[:20]}...")
    
    # 创建草稿
    result = create_draft(token, "AI 助手也会失忆？我决定给自己装个大脑", content)
    
    if "media_id" in result:
        print(f"✅ 草稿创建成功！")
        print(f"📝 草稿 ID: {result['media_id']}")
        print(f"👉 请登录公众号后台查看草稿箱")
    else:
        print(f"❌ 创建失败：{result}")

if __name__ == "__main__":
    main()
