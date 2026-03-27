# Cron 优化配置使用指南

## 📋 配置概览

本次优化实现了任务链式触发、兜底机制和 heartbeat 优化。

### 当前 Cron 任务列表

| 任务名称 | 频率 | 类型 | 说明 |
|---------|------|------|------|
| 🛡️ 兜底检查 | 每 5 分钟 | systemEvent | **新增** 系统健康检查，任务失败告警 |
| 小咪进度汇报 | 每 30 分钟 | agentTurn | 向 boss 汇报当前工作状态 |
| 公众号评论检查 | 每小时 | systemEvent | P0 - 评论处理工作流 |
| 竞品分析学习 | 每 2 小时 | systemEvent | P1 - 竞品分析工作流 |
| 自动工作总结 | 每 4 小时 | systemEvent | P2 - 工作总结工作流 |
| 小咪每日早报 | 每天 8:00 | agentTurn | 每日计划汇报 |
| 小咪每日晚报 | 每天 20:00 | agentTurn | 每日总结汇报 |

---

## 🚀 核心功能

### 1. 任务链式触发

通过 `.task-queue.json` 文件管理工作流状态：

```bash
# 查看任务链状态
cat ~/.openclaw/workspace/.task-queue.json

# 使用协调器脚本管理任务链
~/.openclaw/workspace/scripts/task-chain-coordinator.sh status
```

**工作流说明：**

#### 公众号评论处理链（P0）
```
评论检查 → 情感分析 → 回复草稿
```

#### 竞品分析学习链（P1）
```
收集文章 → 分析模式 → 更新策略
```

#### 工作总结链（P2）
```
收集进展 → 生成报告
```

### 2. 兜底机制

**🛡️ 兜底检查** 每 5 分钟运行一次：
- 检查过去 5 分钟内是否有任务失败
- 处理紧急消息
- 检查系统健康状态
- 异常时记录到 `logs/alerts/`

### 3. Heartbeat 优化

**优化前：** ~400 tokens/次心跳
**优化后：** ~50 tokens/次心跳
**节省：** 87.5%（每日约 100,800 tokens）

优化后的 HEARTBEAT.md 仅保留紧急检查项，详细任务由 cron jobs 处理。

---

## 🔧 常用命令

### 查看任务状态
```bash
# 列出所有 cron 任务
openclaw cron list

# 查看调度器状态
openclaw cron status

# 查看任务运行历史
openclaw cron runs
```

### 管理任务
```bash
# 手动运行任务
openclaw cron run --name "🛡️ 兜底检查"

# 禁用任务
openclaw cron disable --id <任务 ID>

# 启用任务
openclaw cron enable --id <任务 ID>

# 删除任务
openclaw cron rm --id <任务 ID>
```

### 监控任务链
```bash
# 查看任务队列状态
cat ~/.openclaw/workspace/.task-queue.json

# 使用协调器脚本
~/.openclaw/workspace/scripts/task-chain-coordinator.sh status

# 标记任务完成（触发下一个任务）
~/.openclaw/workspace/scripts/task-chain-coordinator.sh complete comment-workflow comment-check
```

---

## 📁 相关文件

| 文件 | 说明 |
|------|------|
| `~/.openclaw/cron/jobs.json` | Cron 任务配置 |
| `~/.openclaw/workspace/.task-queue.json` | 任务链状态文件 |
| `~/.openclaw/workspace/HEARTBEAT.md` | 心跳检查清单（已优化） |
| `~/.openclaw/workspace/scripts/task-chain-coordinator.sh` | 任务链协调器 |
| `~/.openclaw/workspace/cron 优化配置报告.md` | 详细优化报告 |
| `~/.openclaw/workspace/cron-优化配置脚本.sh` | 配置脚本 |

---

## ⚙️ 任务链工作原理

### 状态流转

```
pending → running → completed
                ↓
            waiting (下一个任务)
```

### 自动触发机制

1. Cron 任务触发工作流的第一个步骤
2. 任务执行完成后，更新 `.task-queue.json` 状态
3. 协调器脚本检查并触发下一个任务
4. 兜底检查确保任务不丢失

### 示例：评论处理链

```json
{
  "workflows": {
    "comment-workflow": {
      "status": "running",
      "steps": [
        { "id": "comment-check", "status": "completed", "lastRun": "2026-03-27T15:30:00" },
        { "id": "sentiment-analysis", "status": "running", "lastRun": null },
        { "id": "reply-draft", "status": "waiting", "lastRun": null }
      ]
    }
  }
}
```

---

## 🎯 最佳实践

### 1. 任务设计原则
- **单一职责**：每个任务只做一件事
- **可恢复**：任务失败后可重试
- **可追踪**：状态记录到 `.task-queue.json`

### 2. 错误处理
- 兜底检查捕获失败任务
- 异常记录到 `logs/alerts/`
- 关键任务设置告警

### 3. 性能优化
- 避免任务重叠执行
- 使用 stagger 分散负载
- 定期清理旧日志

---

## 🔍 故障排查

### 任务未执行
```bash
# 检查调度器状态
openclaw cron status

# 检查任务是否启用
openclaw cron list | grep <任务名>

# 手动运行测试
openclaw cron run --name <任务名>
```

### 任务链卡住
```bash
# 查看任务队列状态
cat ~/.openclaw/workspace/.task-queue.json | jq '.'

# 重置任务链状态
echo '{"workflows":{},"lastUpdated":null}' > ~/.openclaw/workspace/.task-queue.json
```

### Heartbeat 异常
```bash
# 检查 HEARTBEAT.md 内容
cat ~/.openclaw/workspace/HEARTBEAT.md

# 确保内容简洁（<100 tokens）
```

---

## 📊 监控建议

### 日常检查
- [ ] 兜底检查运行正常（每 5 分钟）
- [ ] 任务队列状态正常
- [ ] 无异常告警日志

### 定期检查
- [ ] 每周清理旧日志
- [ ] 每月审查任务效率
- [ ] 根据需求调整任务频率

---

## 🆘 快速恢复

### 恢复原始配置
```bash
# 从备份恢复
cp ~/.openclaw/cron/jobs.json.backup.* ~/.openclaw/cron/jobs.json

# 重启 Gateway
openclaw gateway restart
```

### 重置所有任务
```bash
# 删除所有 cron 任务（谨慎！）
openclaw cron rm --id <ID>  # 逐个删除

# 重新运行配置脚本
bash ~/.openclaw/workspace/cron-优化配置脚本.sh
```

---

*最后更新：2026-03-27*
*小咪 🐱 优化师*
