#!/usr/bin/env python3
"""
🐱 流程图生成工具
将文章中的文字流程图转换为图片

用法: python generate-flowchart.py <文章路径>
"""

import re
import os
import sys

def extract_flowcharts(content):
    """提取文章中的代码块流程图"""
    pattern = r'```\n(.*?)```'
    matches = re.findall(pattern, content, re.DOTALL)
    
    flowcharts = []
    for match in matches:
        # 检查是否像流程图（包含箭头或树形结构）
        if '→' in match or '↓' in match or '├' in match or '│' in match:
            flowcharts.append(match.strip())
    
    return flowcharts


def flowchart_to_mermaid(flowchart_text):
    """将文字流程图转换为 Mermaid 语法"""
    lines = flowchart_text.split('\n')
    
    # 检测流程图类型
    if '→' in flowchart_text and '↓' in flowchart_text:
        # 复杂流程图
        return convert_complex_flowchart(lines)
    elif '├' in flowchart_text or '│' in flowchart_text:
        # 决策树
        return convert_decision_tree(lines)
    else:
        # 简单流程
        return convert_simple_flow(lines)


def convert_simple_flow(lines):
    """转换简单流程（A → B → C）"""
    mermaid = "flowchart LR\n"
    
    nodes = {}
    node_id = 0
    
    for line in lines:
        if '→' in line:
            parts = [p.strip() for p in line.split('→')]
            for i, part in enumerate(parts):
                if part not in nodes:
                    nodes[part] = f"N{node_id}"
                    node_id += 1
                    mermaid += f"    {nodes[part]}[\"{part}\"]\n"
                
                if i < len(parts) - 1:
                    next_part = parts[i + 1]
                    if next_part not in nodes:
                        nodes[next_part] = f"N{node_id}"
                        node_id += 1
                        mermaid += f"    {nodes[next_part]}[\"{next_part}\"]\n"
                    mermaid += f"    {nodes[part]} --> {nodes[next_part]}\n"
    
    return mermaid


def convert_complex_flowchart(lines):
    """转换复杂流程图"""
    mermaid = "flowchart TB\n"
    
    nodes = {}
    node_id = 0
    
    for line in lines:
        line = line.strip()
        if not line or line == '↓':
            continue
        
        # 处理横向流程
        if '→' in line:
            parts = [p.strip() for p in line.split('→')]
            for part in parts:
                if part and part not in nodes:
                    nodes[part] = f"N{node_id}"
                    node_id += 1
                    # 转义特殊字符
                    safe_text = part.replace('"', "'")
                    mermaid += f"    {nodes[part]}[\"{safe_text}\"]\n"
    
    # 添加连接（简化版）
    prev_node = None
    for line in lines:
        line = line.strip()
        if '→' in line:
            parts = [p.strip() for p in line.split('→') if p.strip()]
            for i, part in enumerate(parts):
                if part and part in nodes:
                    if i > 0 and parts[i-1] in nodes:
                        mermaid += f"    {nodes[parts[i-1]]} --> {nodes[part]}\n"
    
    return mermaid


def convert_decision_tree(lines):
    """转换决策树"""
    mermaid = "flowchart TD\n"
    
    nodes = {}
    node_id = 0
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # 移除树形符号
        clean = re.sub(r'[├└│─]+', '', line).strip()
        
        if clean and clean not in nodes:
            nodes[clean] = f"N{node_id}"
            node_id += 1
            safe_text = clean.replace('"', "'")
            mermaid += f"    {nodes[clean]}[\"{safe_text}\"]\n"
    
    return mermaid


def generate_flowchart_image(mermaid_code, output_path):
    """使用 Mermaid CLI 或在线服务生成图片"""
    # 方法1: 使用 mermaid.ink（无需安装）
    import base64
    import requests
    
    # 编码 Mermaid 代码
    encoded = base64.b64encode(mermaid_code.encode()).decode()
    
    # 使用 mermaid.ink API
    url = f"https://mermaid.ink/img/{encoded}"
    
    print(f"  📥 生成流程图: {url[:60]}...")
    
    try:
        resp = requests.get(url, timeout=30)
        if resp.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(resp.content)
            print(f"  ✅ 流程图已保存: {output_path}")
            return True
        else:
            print(f"  ⚠️ 生成失败: HTTP {resp.status_code}")
            return False
    except Exception as e:
        print(f"  ⚠️ 生成异常: {e}")
        return False


def process_article_flowcharts(content, output_dir):
    """处理文章中的所有流程图"""
    flowcharts = extract_flowcharts(content)
    
    if not flowcharts:
        print("  ℹ️ 未发现流程图")
        return content
    
    print(f"  📍 发现 {len(flowcharts)} 个流程图")
    
    os.makedirs(output_dir, exist_ok=True)
    
    for i, fc in enumerate(flowcharts):
        print(f"\n  处理流程图 {i+1}:")
        print(f"    原文: {fc[:50]}...")
        
        # 转换为 Mermaid
        mermaid = flowchart_to_mermaid(fc)
        print(f"    Mermaid: {mermaid[:100]}...")
        
        # 生成图片
        output_path = os.path.join(output_dir, f"flowchart-{i+1}.png")
        if generate_flowchart_image(mermaid, output_path):
            # 替换文章中的流程图
            old_block = f"```\n{fc}\n```"
            new_block = f"![流程图]({output_path})"
            content = content.replace(old_block, new_block, 1)
    
    return content


def main():
    if len(sys.argv) < 2:
        print("用法: python generate-flowchart.py <文章路径>")
        sys.exit(1)
    
    article_path = sys.argv[1]
    
    with open(article_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    output_dir = os.path.join(os.path.dirname(article_path), "images")
    
    result = process_article_flowcharts(content, output_dir)
    
    # 保存结果
    output_path = article_path.replace('.md', '-with-flowcharts.md')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(result)
    
    print(f"\n✅ 已保存到: {output_path}")


if __name__ == "__main__":
    main()