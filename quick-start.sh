#!/bin/bash

# 微信公众号排版工具 - 快速使用脚本

echo "🎨 微信公众号自动排版工具"
echo "========================"
echo ""

# 检查输入文件
if [ -z "$1" ]; then
    echo "用法：./quick-start.sh <markdown 文件> [输出文件]"
    echo ""
    echo "示例:"
    echo "  ./quick-start.sh article.md"
    echo "  ./quick-start.sh article.md output.html"
    echo ""
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="${2:-output.html}"

# 检查文件是否存在
if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ 错误：文件不存在 - $INPUT_FILE"
    exit 1
fi

echo "📝 输入文件：$INPUT_FILE"
echo "📄 输出文件：$OUTPUT_FILE"
echo ""

# 运行排版工具
node wechat-formatter.js "$INPUT_FILE" -o "$OUTPUT_FILE" -c

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 完成！HTML 已保存到：$OUTPUT_FILE"
    echo "📋 内容已复制到剪贴板，可以直接粘贴到微信公众号编辑器"
    echo ""
    echo "💡 提示：打开 $OUTPUT_FILE 查看完整 HTML 代码"
else
    echo ""
    echo "❌ 处理失败，请检查错误信息"
    exit 1
fi
