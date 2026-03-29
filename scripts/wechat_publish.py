#!/usr/bin/env python3
"""
🐱 小咪的公众号发布脚本
发布 Markdown 文章到微信公众号草稿箱

用法: python wechat_publish.py <文章路径> [标题]
"""

import requests
import json
import re
import os
import sys

# 从 .env 文件读取敏感信息
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

load_env()
APPID = os.getenv("WECHAT_APPID")
SECRET = os.getenv("WECHAT_SECRET")

def get_access_token():
    """获取 access_token"""
    url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={APPID}&secret={SECRET}"
    resp = requests.get(url)
    data = resp.json()
    return data.get("access_token")

def upload_thumb(access_token, image_path):
    """上传封面图，获取 thumb_media_id"""
    url = f"https://api.weixin.qq.com/cgi-bin/material/add_material?access_token={access_token}&type=thumb"
    
    with open(image_path, "rb") as f:
        files = {"media": f}
        resp = requests.post(url, files=files)
    
    data = resp.json()
    return data.get("media_id")

def markdown_to_html(md_content):
    """Markdown 转 HTML（支持公众号）"""
    html = md_content
    
    # 1. 先处理表格（公众号需要 HTML 表格）
    # 匹配 markdown 表格
    table_pattern = r'\|(.+)\|\n\|[-:\| ]+\|\n((?:\|.+\|\n?)+)'
    
    def convert_table(match):
        header_line = match.group(1).strip()
        body_lines = match.group(2).strip().split('\n')
        
        # 解析表头
        headers = [cell.strip() for cell in header_line.split('|') if cell.strip()]
        
        # 解析表体
        rows = []
        for line in body_lines:
            cells = [cell.strip() for cell in line.split('|') if cell.strip()]
            if cells:
                rows.append(cells)
        
        # 构建 HTML 表格
        table_html = '<table style="width:100%;border-collapse:collapse;margin:1em 0;">'
        
        # 表头
        table_html += '<thead><tr>'
        for h in headers:
            table_html += f'<th style="border:1px solid #ddd;padding:8px;background:#f5f5f5;text-align:left;">{h}</th>'
        table_html += '</tr></thead>'
        
        # 表体
        table_html += '<tbody>'
        for row in rows:
            table_html += '<tr>'
            for cell in row:
                table_html += f'<td style="border:1px solid #ddd;padding:8px;">{cell}</td>'
            table_html += '</tr>'
        table_html += '</tbody></table>'
        
        return table_html
    
    html = re.sub(table_pattern, convert_table, html, flags=re.MULTILINE)
    
    # 2. 标题
    html = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    
    # 3. 加粗
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    
    # 4. 斜体
    html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)
    
    # 5. 引用
    html = re.sub(r'^> (.*?)$', r'<blockquote style="border-left:3px solid #ccc;padding-left:1em;color:#666;">\1</blockquote>', html, flags=re.MULTILINE)
    
    # 6. 换行
    html = html.replace('\n\n', '</p><p>')
    html = html.replace('\n', '<br>')
    
    # 7. 包裹
    html = f"<section style=\"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\">{html}</section>"
    
    return html

def create_draft(access_token, title, content, thumb_media_id):
    """创建草稿"""
    url = f"https://api.weixin.qq.com/cgi-bin/draft/add?access_token={access_token}"
    
    html_content = markdown_to_html(content)
    
    # 正确的格式（需要 thumb_media_id）
    data = {
        "articles": [{
            "title": title,
            "content": html_content,
            "thumb_media_id": thumb_media_id,
            "author": "小咪",
            "digest": "智能体元年、NVIDIA Blackwell、政策定调、市场数据"
        }]
    }
    
    # 关键：使用 ensure_ascii=False 避免中文被转成 unicode 编码
    json_data = json.dumps(data, ensure_ascii=False).encode('utf-8')
    
    resp = requests.post(url, data=json_data, headers={'Content-Type': 'application/json'})
    return resp.json()

def main():
    if len(sys.argv) < 2:
        print("用法: python wechat_publish.py <文章路径> [标题]")
        sys.exit(1)
    
    article_path = sys.argv[1]
    
    # 从文件名提取标题，或使用命令行参数
    if len(sys.argv) >= 3:
        title = sys.argv[2]
    else:
        # 从文章第一行提取标题
        with open(article_path, "r", encoding="utf-8") as f:
            first_line = f.readline().strip()
            title = first_line.lstrip("# ").strip()
    
    # 读取文章
    with open(article_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 获取 token
    token = get_access_token()
    if not token:
        print("❌ 获取 token 失败")
        sys.exit(1)
    print(f"✅ 获取 token 成功")
    
    # 上传封面图
    thumb_path = os.path.join(os.path.dirname(article_path), "images", "ai-cover-unsplash.jpg")
    if os.path.exists(thumb_path):
        thumb_media_id = upload_thumb(token, thumb_path)
        if thumb_media_id:
            print(f"✅ 封面图上传成功: {thumb_media_id}")
        else:
            print("⚠️ 封面图上传失败，尝试不使用封面图")
            thumb_media_id = ""
    else:
        print("⚠️ 封面图不存在，尝试不使用封面图")
        thumb_media_id = ""
    
    # 创建草稿
    print(f"📝 标题: {title} (长度: {len(title)})")
    result = create_draft(token, title, content, thumb_media_id)
    
    if "media_id" in result:
        print(f"✅ 草稿创建成功！")
        print(f"📝 草稿 ID: {result['media_id']}")
        print(f"👉 请登录公众号后台查看草稿箱")
    else:
        print(f"❌ 创建失败：{result}")

if __name__ == "__main__":
    main()