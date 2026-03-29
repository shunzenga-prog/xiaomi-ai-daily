#!/usr/bin/env python3
"""
🐱 文章配图生成脚本
根据文章段落内容智能生成配图

用法: python generate-article-images.py <文章路径>

输出：在文章中插入配图标签，并上传到公众号
"""

import requests
import re
import os
import sys
import json
from urllib.parse import quote

# 配图主题库（高质量、简洁风格）
IMAGE_TEMPLATES = {
    "tech_blue": [
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop",
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop",
    ],
    "ai_circuit": [
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=400&fit=crop",
    ],
    "code_dark": [
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop",
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop",
    ],
    "workspace": [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop",
        "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&h=400&fit=crop",
    ],
    "idea": [
        "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=800&h=400&fit=crop",
    ],
}

KEYWORD_TO_IMAGE = {
    "发布": "tech_blue", "上线": "tech_blue", "模型": "ai_circuit",
    "ai": "ai_circuit", "gpt": "ai_circuit", "openai": "ai_circuit",
    "代码": "code_dark", "编程": "code_dark", "编码": "code_dark",
    "开发者": "workspace", "团队": "workspace", "项目": "workspace",
    "建议": "idea", "方法": "idea",
    "default": "tech_blue",
}


def get_paragraph_theme(paragraph, previous_themes=None):
    """根据段落内容智能匹配图片主题"""
    text_lower = paragraph.lower()
    
    if previous_themes is None:
        previous_themes = []
    
    # 按优先级匹配关键词
    matched_theme = None
    for keyword, theme in KEYWORD_TO_IMAGE.items():
        if keyword in text_lower:
            # 避免最近2张重复
            if theme not in previous_themes[-2:]:
                matched_theme = theme
                break
    
    # 如果没匹配到或重复了
    if not matched_theme:
        available_themes = [t for t in IMAGE_TEMPLATES.keys() 
                          if t not in previous_themes[-2:]]
        if available_themes:
            matched_theme = available_themes[0]
        else:
            matched_theme = "tech_abstract"
    
    return matched_theme


def get_image_for_theme(theme, index=0):
    """获取主题对应的图片 URL"""
    templates = IMAGE_TEMPLATES.get(theme, IMAGE_TEMPLATES["tech_blue"])
    return templates[index % len(templates)]


def find_image_positions(content, min_distance=400):
    """找到适合插入图片的位置，配图 2-3 张"""
    paragraphs = content.split('\n\n')
    
    positions = []
    char_count = 0
    last_image_pos = 0
    used_themes = []
    
    for i, para in enumerate(paragraphs):
        para_len = len(para)
        
        is_special = (
            para.strip().startswith('|') or
            para.strip().startswith('```') or
            para.strip().startswith('>') or
            para.strip().startswith('#') or
            para.strip().startswith('---') or
            para.strip() == '' or
            '```' in para
        )
        
        should_insert = False
        
        if not is_special and (char_count - last_image_pos) >= min_distance:
            text_content = re.sub(r'[`\*\|#]', '', para.strip())
            if len(text_content) >= 60:
                should_insert = True
        
        if should_insert:
            theme = get_paragraph_theme(para, used_themes)
            used_themes.append(theme)
            
            summary = para[:50].replace('\n', ' ')
            if len(para) > 50:
                summary += '...'
            
            positions.append({
                'index': i,
                'position': char_count,
                'paragraph': summary,
                'theme': theme
            })
            last_image_pos = char_count
        
        char_count += para_len + 2
    
    # 限制 2-3 张配图
    if len(positions) > 3:
        # 取前 3 张，均匀分布
        positions = positions[:3]
    elif len(positions) == 1 and len(content) > 1000:
        # 如果只有1张但文章较长，尝试再加1张
        pass
    
    return positions


def insert_images(content, positions):
    """在指定位置插入图片"""
    paragraphs = content.split('\n\n')
    
    # 从后往前插入，避免索引变化
    for pos in reversed(positions):
        image_url = get_image_for_theme(pos['theme'], len(positions) - positions.index(pos))
        
        # 生成图片标签
        image_tag = f'\n\n![配图]({image_url})\n'
        
        # 在段落后插入图片
        paragraphs.insert(pos['index'] + 1, image_tag.strip())
    
    return '\n\n'.join(paragraphs)


def upload_to_wechat(image_url, access_token):
    """下载图片并上传到公众号"""
    # 下载图片
    print(f"  📥 下载图片: {image_url[:60]}...")
    resp = requests.get(image_url, timeout=30)
    
    if resp.status_code != 200:
        print(f"  ⚠️ 下载失败: HTTP {resp.status_code}")
        return None
    
    # 保存临时文件
    temp_path = f"/tmp/article_image_{hash(image_url)}.jpg"
    with open(temp_path, 'wb') as f:
        f.write(resp.content)
    
    # 上传到公众号
    url = f"https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token={access_token}"
    
    with open(temp_path, 'rb') as f:
        files = {'media': f}
        resp = requests.post(url, files=files)
    
    data = resp.json()
    
    if 'url' in data:
        print(f"  ✅ 上传成功: {data['url'][:50]}...")
        return data['url']
    else:
        print(f"  ⚠️ 上传失败: {data}")
        return None


def process_article_images(content, access_token=None):
    """处理文章配图，考虑内容语境"""
    print("🎨 分析文章配图位置...")
    
    # 找到插入位置（使用智能主题匹配）
    positions = find_image_positions(content)
    
    if not positions:
        print("  ℹ️ 文章较短，无需配图")
        return content
    
    print(f"  📍 找到 {len(positions)} 个配图位置")
    
    # 显示匹配结果
    for i, pos in enumerate(positions):
        print(f"    [{i+1}] 主题: {pos['theme']} | 段落: {pos['paragraph'][:50]}...")
    
    # 如果有 access_token，上传图片到公众号
    if access_token:
        print("📤 上传图片到公众号...")
        for pos in positions:
            image_url = get_image_for_theme(pos['theme'], positions.index(pos))
            wechat_url = upload_to_wechat(image_url, access_token)
            
            if wechat_url:
                pos['wechat_url'] = wechat_url
            else:
                pos['wechat_url'] = image_url
    else:
        for pos in positions:
            pos['wechat_url'] = get_image_for_theme(pos['theme'], positions.index(pos))
    
    # 插入图片
    result = insert_images_with_urls(content, positions)
    
    print(f"✅ 配图完成，共插入 {len(positions)} 张图片")
    return result


def insert_images_with_urls(content, positions):
    """使用公众号 URL 插入图片"""
    paragraphs = content.split('\n\n')
    
    offset = 0
    for pos in positions:
        image_url = pos.get('wechat_url', get_image_for_theme(pos['theme'], 0))
        
        # 生成 HTML 图片标签（公众号支持）
        image_tag = f'<img src="{image_url}" style="width:100%;margin:1em 0;">'
        
        # 在段落后插入
        insert_index = pos['index'] + 1 + offset
        paragraphs.insert(insert_index, image_tag)
        offset += 1
    
    return '\n\n'.join(paragraphs)


def main():
    if len(sys.argv) < 2:
        print("用法: python generate-article-images.py <文章路径> [--token <access_token>]")
        sys.exit(1)
    
    article_path = sys.argv[1]
    
    # 获取 access_token（可选）
    access_token = None
    if "--token" in sys.argv:
        token_idx = sys.argv.index("--token") + 1
        access_token = sys.argv[token_idx] if token_idx < len(sys.argv) else None
    
    # 读取文章
    with open(article_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 处理配图
    result = process_article_images(content, access_token)
    
    # 输出到新文件
    output_path = article_path.replace('.md', '-with-images.md')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(result)
    
    print(f"\n✅ 已保存到: {output_path}")
    return output_path


if __name__ == "__main__":
    main()