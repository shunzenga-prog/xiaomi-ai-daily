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
