#!/usr/bin/env python3
"""抓取网页内容的脚本"""

import urllib.request
import re
import html
import json
import sys

def fetch_juejin(url):
    """抓取掘金文章"""
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            content = response.read().decode('utf-8')
            
            # 尝试多种方式提取内容
            # 方法1: 从 __NEXT_DATA__ 中提取
            next_data_match = re.search(r'<script id="__NEXT_DATA__[^>]*>(.*?)</script>', content)
            if next_data_match:
                try:
                    data = json.loads(next_data_match.group(1))
                    article = data.get('props', {}).get('initialState', {}).get('article', {})
                    if article:
                        content_text = article.get('article_content', '')
                        if content_text:
                            return html.unescape(content_text)
                except:
                    pass
            
            # 方法2: 从 description meta 标签提取
            desc_match = re.search(r'name="description" content="([^"]+)"', content)
            if desc_match:
                desc = html.unescape(desc_match.group(1))
                return desc
            
            return None
    except Exception as e:
        return f"Error: {str(e)}"

def fetch_general(url):
    """通用网页抓取"""
    headers = {'User-Agent': 'Mozilla/5.0'}
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            content = response.read().decode('utf-8')
            
            # 移除 script 和 style 标签
            content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL)
            content = re.sub(r'<style[^>]*>.*?</style>', '', content, flags=re.DOTALL)
            
            # 提取文本
            content = re.sub(r'<[^>]+>', ' ', content)
            content = html.unescape(content)
            
            # 清理空白
            content = re.sub(r'\s+', ' ', content)
            
            return content.strip()[:5000]
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python fetch_article.py <url>")
        sys.exit(1)
    
    url = sys.argv[1]
    
    if 'juejin.cn' in url:
        result = fetch_juejin(url)
    else:
        result = fetch_general(url)
    
    print(result)