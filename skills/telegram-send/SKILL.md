---
name: telegram-send
description: 向 Telegram 发送文件、图片、文档。支持本地路径和 URL。触发：发 Telegram、发文件、发图片、Telegram 发送。
---

# Telegram 文件发送

向 boss 的 Telegram 发送文件、图片、文档。

## 触发场景

- "发 Telegram"
- "发文件给 boss"
- "发图片"
- "把这个发给 Telegram"

## 快速命令

```bash
# 发送图片（自动压缩）
openclaw message send --channel telegram --target 5715993558 --media <文件路径>

# 发送文件（保持原格式，避免压缩）
openclaw message send --channel telegram --target 5715993558 --media <文件路径> --force-document

# 发送带文字说明
openclaw message send --channel telegram --target 5715993558 --media <文件路径> --message "<说明文字>"
```

## 支持的媒体类型

| 类型 | 说明 | 推荐参数 |
|------|------|----------|
| 图片 | PNG、JPEG | 默认会压缩，用 `--force-document` 保持原格式 |
| PDF | 文档 | 默认作为文档发送 |
| 音频 | MP3、OGG | 可作为语音消息 |
| 视频 | MP4 | 默认作为视频 |
| 其他文件 | 任意格式 | 使用 `--force-document` |

## 使用示例

### 发送报告 PDF
```bash
openclaw message send --channel telegram \
  --target 5715993558 \
  --media ./reports/article-ai-hotspot-2026-03-28.pdf \
  --force-document \
  --message "AI热点速递文章 PDF 版"
```

### 发送幻灯片图片
```bash
openclaw message send --channel telegram \
  --target 5715993558 \
  --media ./reports/slides/slide-01.png \
  --message "第1张幻灯片"
```

### 发送 Web URL 图片
```bash
openclaw message send --channel telegram \
  --target 5715993558 \
  --media https://example.com/image.png \
  --message "来自网络的图片"
```

## 注意事项

1. **本地文件路径**：需要放在 `~/.openclaw/` 或 workspace 目录内
2. **文件大小限制**：Telegram 限制 50MB（图片压缩后更小）
3. **图片压缩**：默认会压缩图片，用 `--force-document` 避免压缩
4. **URL 图片**：支持 HTTP(S) URL，直接发送不下载

## 配置

- boss Telegram ID: `5715993558`
- 默认发送到 boss 的 DM