#!/bin/bash
#
# 🐱 小咪的自主 Cron 任务设置脚本
# 配置数据官的 3 个核心自主任务
#
# 用法：./setup-cron-tasks.sh
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 工作区路径
WORKSPACE="/home/zengshun/.openclaw/workspace"
LOG_DIR="$WORKSPACE/logs/cron"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🐱 小咪的自主 Cron 任务设置               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# 检查 OpenClaw 是否可用
if ! command -v openclaw &> /dev/null; then
    echo -e "${RED}❌ 错误：未找到 openclaw 命令${NC}"
    echo "请先安装 OpenClaw"
    exit 1
fi

echo -e "${GREEN}✅ OpenClaw 已安装${NC}"

# 创建日志目录
echo -e "${YELLOW}📁 创建日志目录...${NC}"
mkdir -p "$LOG_DIR"
mkdir -p "$WORKSPACE/reports/comments"
mkdir -p "$WORKSPACE/reports/summary"
mkdir -p "$WORKSPACE/learning/competitor-analysis"
echo -e "${GREEN}✅ 目录创建完成${NC}"
echo ""

# 查看现有 cron 任务
echo -e "${YELLOW}📋 检查现有 Cron 任务...${NC}"
openclaw cron list
echo ""

# 添加新任务
echo -e "${BLUE}📝 开始添加自主任务...${NC}"
echo ""

# 任务 1: P0 - 每小时检查公众号评论
echo -e "${GREEN}[1/3] 添加 P0 任务：检查公众号评论 (每小时)${NC}"
openclaw cron add \
    --name "公众号评论检查" \
    --cron "0 * * * *" \
    --system-event "检查公众号最新评论，分析情感，生成回复建议草稿。输出到 reports/comments/ 目录" \
    --description "P0 优先级 - 每小时检查公众号用户评论"
echo -e "${GREEN}✅ P0 任务已添加${NC}"
echo ""

# 任务 2: P1 - 每 2 小时学习分析竞品
echo -e "${GREEN}[2/3] 添加 P1 任务：学习分析竞品 (每 2 小时)${NC}"
openclaw cron add \
    --name "竞品分析学习" \
    --cron "0 */2 * * *" \
    --system-event "分析竞品公众号文章，研究优秀博主，提取爆款特征，更新选题库和创作策略。输出到 learning/competitor-analysis/ 目录" \
    --description "P1 优先级 - 每 2 小时学习分析竞品"
echo -e "${GREEN}✅ P1 任务已添加${NC}"
echo ""

# 任务 3: P2 - 每 4 小时自动总结
echo -e "${GREEN}[3/3] 添加 P2 任务：自动总结报告 (每 4 小时)${NC}"
openclaw cron add \
    --name "自动工作总结" \
    --cron "0 */4 * * *" \
    --system-event "总结过去 4 小时的工作进展，包括任务完成情况、文章产出、学习收获。生成报告到 reports/summary/ 目录，并更新工作日志" \
    --description "P2 优先级 - 每 4 小时自动生成工作总结"
echo -e "${GREEN}✅ P2 任务已添加${NC}"
echo ""

# 验证安装
echo -e "${BLUE}🔍 验证任务安装...${NC}"
echo ""
openclaw cron list
echo ""

# 显示调度器状态
echo -e "${BLUE}📊 Cron 调度器状态:${NC}"
openclaw cron status
echo ""

# 完成提示
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ 自主任务配置完成！                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📋 任务清单:${NC}"
echo "  • P0 - 公众号评论检查    → 每小时执行 (0 * * * *)"
echo "  • P1 - 竞品分析学习      → 每 2 小时执行 (0 */2 * * *)"
echo "  • P2 - 自动工作总结      → 每 4 小时执行 (0 */4 * * *)"
echo ""
echo -e "${YELLOW}📝 管理命令:${NC}"
echo "  • 查看任务列表：openclaw cron list"
echo "  • 查看运行历史：openclaw cron runs"
echo "  • 手动触发任务：openclaw cron run <job-id>"
echo "  • 禁用任务：openclaw cron disable <job-id>"
echo "  • 启用任务：openclaw cron enable <job-id>"
echo ""
echo -e "${BLUE}🐱 小咪的自主任务系统已启动！${NC}"
echo ""
