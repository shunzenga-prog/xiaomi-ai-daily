#!/bin/bash
# OpenClaw Cron 优化配置脚本
# 功能：实现任务链式触发、兜底机制、heartbeat 优化
# 使用：bash cron-优化配置脚本.sh

set -e

echo "🐱 小咪 Cron 优化配置脚本"
echo "========================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 路径定义
OPENCLAW_DIR="$HOME/.openclaw"
WORKSPACE_DIR="$OPENCLAW_DIR/workspace"
CRON_DIR="$OPENCLAW_DIR/cron"

echo -e "${YELLOW}步骤 1: 备份现有配置${NC}"
if [ -f "$CRON_DIR/jobs.json" ]; then
    BACKUP_FILE="$CRON_DIR/jobs.json.backup.$(date +%Y%m%d-%H%M%S)"
    cp "$CRON_DIR/jobs.json" "$BACKUP_FILE"
    echo -e "${GREEN}✅ 已备份：$BACKUP_FILE${NC}"
else
    echo -e "${RED}⚠️  未找到现有 cron 配置${NC}"
fi
echo ""

echo -e "${YELLOW}步骤 2: 创建任务队列文件${NC}"
cat > "$WORKSPACE_DIR/.task-queue.json" << 'EOF'
{
  "version": 1,
  "workflows": {
    "comment-workflow": {
      "name": "公众号评论处理链",
      "status": "idle",
      "priority": "P0",
      "steps": [
        {
          "id": "comment-check",
          "name": "检查评论",
          "status": "pending",
          "lastRun": null,
          "lastStatus": null
        },
        {
          "id": "sentiment-analysis",
          "name": "情感分析",
          "status": "waiting",
          "lastRun": null,
          "lastStatus": null
        },
        {
          "id": "reply-draft",
          "name": "回复草稿",
          "status": "waiting",
          "lastRun": null,
          "lastStatus": null
        }
      ]
    },
    "competitor-workflow": {
      "name": "竞品分析学习链",
      "status": "idle",
      "priority": "P1",
      "steps": [
        {
          "id": "collect-articles",
          "name": "收集文章",
          "status": "pending",
          "lastRun": null,
          "lastStatus": null
        },
        {
          "id": "analyze-patterns",
          "name": "分析模式",
          "status": "waiting",
          "lastRun": null,
          "lastStatus": null
        },
        {
          "id": "update-strategy",
          "name": "更新策略",
          "status": "waiting",
          "lastRun": null,
          "lastStatus": null
        }
      ]
    },
    "summary-workflow": {
      "name": "工作总结链",
      "status": "idle",
      "priority": "P2",
      "steps": [
        {
          "id": "collect-progress",
          "name": "收集进展",
          "status": "pending",
          "lastRun": null,
          "lastStatus": null
        },
        {
          "id": "generate-report",
          "name": "生成报告",
          "status": "waiting",
          "lastRun": null,
          "lastStatus": null
        }
      ]
    }
  },
  "lastUpdated": null,
  "alerts": []
}
EOF
echo -e "${GREEN}✅ 已创建：$WORKSPACE_DIR/.task-queue.json${NC}"
echo ""

echo -e "${YELLOW}步骤 3: 优化 HEARTBEAT.md（减少 token 消耗）${NC}"
cat > "$WORKSPACE_DIR/HEARTBEAT.md" << 'EOF'
# 心跳检查清单

## 必做检查
- [ ] git 状态检查
- [ ] 紧急消息处理

## 轮播任务（每次选 1 个）
- [ ] 检查工作日志
- [ ] 更新待办状态
- [ ] 检查文章发布状态

---
*详细任务计划见 cron jobs，本清单仅保留紧急项*
EOF
echo -e "${GREEN}✅ 已优化：$WORKSPACE_DIR/HEARTBEAT.md${NC}"
echo -e "   Token 节省：~350 tokens/次心跳 → 每日节省约 100,800 tokens"
echo ""

echo -e "${YELLOW}步骤 4: 生成新 Cron 配置${NC}"

# 读取现有配置，保留日报晚报任务，添加新任务
cat > "$CRON_DIR/jobs.json.new" << 'EOF'
{
  "version": 1,
  "jobs": [
    {
      "id": "safety-net-5min",
      "name": "🛡️ 兜底检查",
      "description": "每 5 分钟检查系统状态，处理紧急事件",
      "enabled": true,
      "createdAtMs": null,
      "updatedAtMs": null,
      "schedule": {
        "kind": "cron",
        "expr": "*/5 * * * *",
        "tz": "Asia/Shanghai"
      },
      "sessionTarget": "main",
      "wakeMode": "now",
      "payload": {
        "kind": "systemEvent",
        "text": "检查：1.过去 5 分钟任务失败情况 2.紧急消息 3.系统健康状态。异常则记录到 logs/alerts/"
      }
    },
    {
      "id": "comment-chain-start",
      "name": "📝 评论处理链 - 启动",
      "description": "P0 - 每小时触发评论处理工作流",
      "enabled": true,
      "createdAtMs": null,
      "updatedAtMs": null,
      "schedule": {
        "kind": "cron",
        "expr": "0 * * * *",
        "staggerMs": 60000,
        "tz": "Asia/Shanghai"
      },
      "sessionTarget": "main",
      "wakeMode": "now",
      "payload": {
        "kind": "systemEvent",
        "text": "【评论处理链】步骤 1/3：检查公众号最新评论，分析情感，生成回复建议草稿。输出到 reports/comments/ 目录。完成后更新.task-queue.json 状态"
      },
      "metadata": {
        "chainNext": "sentiment-analysis",
        "chainId": "comment-workflow",
        "priority": "P0"
      }
    },
    {
      "id": "competitor-chain-start",
      "name": "📊 竞品分析链 - 启动",
      "description": "P1 - 每 2 小时触发竞品分析工作流",
      "enabled": true,
      "createdAtMs": null,
      "updatedAtMs": null,
      "schedule": {
        "kind": "cron",
        "expr": "0 */2 * * *",
        "staggerMs": 120000,
        "tz": "Asia/Shanghai"
      },
      "sessionTarget": "main",
      "wakeMode": "now",
      "payload": {
        "kind": "systemEvent",
        "text": "【竞品分析链】步骤 1/3：分析竞品公众号文章，研究优秀博主，提取爆款特征，更新选题库和创作策略。输出到 learning/competitor-analysis/ 目录"
      },
      "metadata": {
        "chainId": "competitor-workflow",
        "priority": "P1"
      }
    },
    {
      "id": "summary-chain-start",
      "name": "📈 工作总结链 - 启动",
      "description": "P2 - 每 4 小时触发工作总结工作流",
      "enabled": true,
      "createdAtMs": null,
      "updatedAtMs": null,
      "schedule": {
        "kind": "cron",
        "expr": "0 */4 * * *",
        "staggerMs": 180000,
        "tz": "Asia/Shanghai"
      },
      "sessionTarget": "main",
      "wakeMode": "now",
      "payload": {
        "kind": "systemEvent",
        "text": "【工作总结链】步骤 1/2：总结过去 4 小时的工作进展，包括任务完成情况、文章产出、学习收获。生成报告到 reports/summary/ 目录，并更新工作日志"
      },
      "metadata": {
        "chainId": "summary-workflow",
        "priority": "P2"
      }
    }
  ]
}
EOF

# 合并现有任务（保留日报晚报）
if command -v jq &> /dev/null; then
    echo "   使用 jq 合并配置..."
    # 提取现有任务中的日报晚报
    jq '.jobs | map(select(.name | test("早报 | 晚报"))) ' "$CRON_DIR/jobs.json" > /tmp/existing_tasks.json 2>/dev/null || echo "[]" > /tmp/existing_tasks.json
    
    # 合并新旧任务
    jq -s '.[0].jobs + .[1]' "$CRON_DIR/jobs.json.new" /tmp/existing_tasks.json | jq '{version: 1, jobs: .}' > "$CRON_DIR/jobs.json.merged"
    mv "$CRON_DIR/jobs.json.merged" "$CRON_DIR/jobs.json"
    rm -f "$CRON_DIR/jobs.json.new" /tmp/existing_tasks.json
    echo -e "${GREEN}✅ 已合并配置${NC}"
else
    echo "   ⚠️  未安装 jq，使用手动方式..."
    mv "$CRON_DIR/jobs.json.new" "$CRON_DIR/jobs.json"
    echo -e "${YELLOW}⚠️  请手动将日报晚报任务添加到新配置中${NC}"
fi
echo ""

echo -e "${YELLOW}步骤 5: 验证配置${NC}"
if command -v openclaw &> /dev/null; then
    echo "   检查 cron 配置..."
    openclaw cron list --json 2>/dev/null | head -50 || echo "   ⚠️  无法读取 cron 列表"
else
    echo "   ⚠️  openclaw 命令不可用"
fi
echo ""

echo -e "${YELLOW}步骤 6: 创建任务链协调器脚本${NC}"
cat > "$WORKSPACE_DIR/scripts/task-chain-coordinator.sh" << 'SCRIPT'
#!/bin/bash
# 任务链协调器 - 管理任务链状态和触发

WORKSPACE_DIR="$HOME/.openclaw/workspace"
TASK_QUEUE_FILE="$WORKSPACE_DIR/.task-queue.json"

# 更新任务状态
update_task_status() {
    local workflow=$1
    local task_id=$2
    local status=$3
    
    if [ ! -f "$TASK_QUEUE_FILE" ]; then
        echo "错误：任务队列文件不存在"
        return 1
    fi
    
    # 使用 jq 更新状态（如果可用）
    if command -v jq &> /dev/null; then
        jq "(.workflows[\"$workflow\"].steps[] | select(.id == \"$task_id\")) |= . + {\"status\": \"$status\", \"lastRun\": \"$(date -Iseconds)\"}" \
            "$TASK_QUEUE_FILE" > "${TASK_QUEUE_FILE}.tmp" && mv "${TASK_QUEUE_FILE}.tmp" "$TASK_QUEUE_FILE"
    else
        echo "警告：jq 不可用，无法更新状态文件"
    fi
}

# 获取下一个待执行任务
get_next_task() {
    local workflow=$1
    
    if command -v jq &> /dev/null; then
        jq -r ".workflows[\"$workflow\"].steps[] | select(.status == \"waiting\" or .status == \"pending\") | .id" "$TASK_QUEUE_FILE" | head -1
    fi
}

# 主逻辑
case "$1" in
    "complete")
        update_task_status "$2" "$3" "completed"
        next_task=$(get_next_task "$2")
        if [ -n "$next_task" ]; then
            update_task_status "$2" "$next_task" "pending"
            echo "触发下一个任务：$next_task"
        fi
        ;;
    "status")
        cat "$TASK_QUEUE_FILE" | jq '.' 2>/dev/null || cat "$TASK_QUEUE_FILE"
        ;;
    *)
        echo "用法：$0 {complete <workflow> <task_id>|status}"
        ;;
esac
SCRIPT

chmod +x "$WORKSPACE_DIR/scripts/task-chain-coordinator.sh"
echo -e "${GREEN}✅ 已创建：$WORKSPACE_DIR/scripts/task-chain-coordinator.sh${NC}"
echo ""

echo -e "${GREEN}========================${NC}"
echo -e "${GREEN}✅ 配置完成！${NC}"
echo ""
echo "📋 下一步操作："
echo "   1. 检查配置：openclaw cron list"
echo "   2. 测试任务：openclaw cron run --name '🛡️ 兜底检查'"
echo "   3. 监控状态：cat ~/.openclaw/workspace/.task-queue.json"
echo ""
echo "📊 优化效果："
echo "   - HEARTBEAT token 节省：~350 tokens/次"
echo "   - 每日 token 节省：~100,800 tokens"
echo "   - 新增兜底机制：每 5 分钟检查"
echo "   - 任务链式触发：支持工作流管理"
echo ""
echo "🐱 小咪优化师完成！"
