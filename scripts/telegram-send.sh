#!/bin/bash
# Telegram 文件发送快捷脚本
# 用法: ./telegram-send.sh <文件路径> [说明文字] [--force-document]

FILE="$1"
MESSAGE="$2"
FORCE_DOC="$3"

if [ -z "$FILE" ]; then
  echo "用法: ./telegram-send.sh <文件路径> [说明文字] [--force-document]"
  exit 1
fi

# 构建命令
CMD="openclaw message send --channel telegram --target 5715993558 --media \"$FILE\""

if [ -n "$MESSAGE" ]; then
  CMD="$CMD --message \"$MESSAGE\""
fi

if [ "$FORCE_DOC" == "--force-document" ]; then
  CMD="$CMD --force-document"
fi

# 执行
echo "发送: $FILE"
eval $CMD