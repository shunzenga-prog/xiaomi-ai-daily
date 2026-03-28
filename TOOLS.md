# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## 🐱 小咪的服务

### Web 报告查看器

- **地址**: http://localhost:8080
- **用途**: 查看 Markdown 报告、幻灯片、图片
- **启动命令**: `node scripts/web-viewer/server.js`
- **目录**: `/home/zengshun/.openclaw/workspace/scripts/web-viewer/`
- **状态**: ✅ 已启动（2026-03-28）

**可用路径:**
- `/` - 主页（报告列表）
- `/reports/slides/` - 幻灯片目录（16张）
- `/reports/` - 全部报告文件

**注意**: 如果服务停了，可以用 `node scripts/web-viewer/server.js` 重新启动

**字体问题**: 如果中文显示为方框，是因为系统缺少中文字体。解决方案：在 HTML 中使用 Google Fonts 的 Noto Sans SC 字体（已在 md2img.js 中配置）

### 📱 Telegram 配置

- **boss Telegram ID**: `5715993558`
- **发送文件**: 使用 `telegram-send` skill
- **快捷命令**: `openclaw message send --channel telegram --target 5715993558 --media <文件>`
- **脚本**: `scripts/telegram-send.sh <文件> [说明] [--force-document]`

---

Add whatever helps you do your job. This is your own cheat sheet.