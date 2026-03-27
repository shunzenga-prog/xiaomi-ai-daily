#!/bin/bash
#
# OpenClaw Webhook 测试脚本
#
# 功能:
#   1. 测试 Webhook 端点连通性
#   2. 测试各种事件类型
#   3. 验证签名
#   4. 检查响应
#
# 使用:
#   ./test-webhook.sh
#

set -e

# ==================== 配置 ====================
OPENCLAW_URL="${OPENCLAW_URL:-http://127.0.0.1:18789}"
OPENCLAW_TOKEN="${OPENCLAW_TOKEN:-your-openclaw-token}"
WEBHOOK_URL="${WEBHOOK_URL:-http://127.0.0.1:3000}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-your-webhook-secret}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================== 工具函数 ====================

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

print_test() {
    echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装"
        exit 1
    fi
}

# ==================== 检查依赖 ====================

print_header "检查依赖"

check_command curl
check_command jq

print_success "依赖检查通过"

# ==================== 测试函数 ====================

test_health() {
    print_test "测试健康检查端点"
    
    response=$(curl -s -w "\n%{http_code}" "$WEBHOOK_URL/health")
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ]; then
        print_success "健康检查通过 (HTTP $status)"
        echo "$body" | jq .
    else
        print_error "健康检查失败 (HTTP $status)"
        echo "$body"
        return 1
    fi
}

test_openclaw_wake() {
    print_test "测试 OpenClaw /hooks/wake"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$OPENCLAW_URL/hooks/wake" \
        -H "Authorization: Bearer $OPENCLAW_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"text":"测试唤醒事件","mode":"now"}')
    
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ]; then
        print_success "Wake Hook 测试通过 (HTTP $status)"
    else
        print_error "Wake Hook 测试失败 (HTTP $status)"
        echo "$body" | jq . 2>/dev/null || echo "$body"
        return 1
    fi
}

test_openclaw_agent() {
    print_test "测试 OpenClaw /hooks/agent"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$OPENCLAW_URL/hooks/agent" \
        -H "x-openclaw-token: $OPENCLAW_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "message": "这是一条测试消息，请确认收到",
            "name": "测试",
            "deliver": false,
            "wakeMode": "now"
        }')
    
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ]; then
        print_success "Agent Hook 测试通过 (HTTP $status)"
    else
        print_error "Agent Hook 测试失败 (HTTP $status)"
        echo "$body" | jq . 2>/dev/null || echo "$body"
        return 1
    fi
}

test_github_webhook() {
    print_test "测试 GitHub Webhook 转发"
    
    # 模拟 GitHub Issue 事件
    response=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL/github" \
        -H "Content-Type: application/json" \
        -H "x-github-event: issues" \
        -H "x-hub-signature-256: sha256=$(echo -n '{"action":"opened","repository":{"full_name":"test/repo"},"sender":{"login":"tester"},"issue":{"number":1,"title":"测试 Issue"}}' | openssl dgst -sha256 -hmac 'your-github-secret' | awk '{print $2}')" \
        -d '{
            "action": "opened",
            "repository": {
                "full_name": "test/repo",
                "html_url": "https://github.com/test/repo"
            },
            "sender": {
                "login": "tester",
                "avatar_url": "https://github.com/avatars/tester.png"
            },
            "issue": {
                "number": 1,
                "title": "测试 Issue",
                "body": "这是一个测试 Issue",
                "state": "open",
                "html_url": "https://github.com/test/repo/issues/1"
            }
        }')
    
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ]; then
        print_success "GitHub Webhook 测试通过 (HTTP $status)"
        echo "$body" | jq .
    else
        print_error "GitHub Webhook 测试失败 (HTTP $status)"
        echo "$body" | jq . 2>/dev/null || echo "$body"
        return 1
    fi
}

test_generic_webhook() {
    print_test "测试通用 Webhook 端点"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL/webhook/custom" \
        -H "Content-Type: application/json" \
        -H "x-webhook-event: custom_event" \
        -H "x-webhook-action: test" \
        -d '{
            "source": "custom",
            "message": "自定义事件测试",
            "data": {
                "key": "value",
                "timestamp": '"$(date +%s)"'
            }
        }')
    
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ]; then
        print_success "通用 Webhook 测试通过 (HTTP $status)"
        echo "$body" | jq .
    else
        print_error "通用 Webhook 测试失败 (HTTP $status)"
        echo "$body" | jq . 2>/dev/null || echo "$body"
        return 1
    fi
}

test_wechat_comment() {
    print_test "测试公众号评论 Webhook"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL/wechat-comment" \
        -H "Content-Type: application/json" \
        -d '{
            "article": {
                "title": "测试文章",
                "url": "https://mp.weixin.qq.com/s/test"
            },
            "comment": {
                "content": "这是一条测试评论",
                "created_at": "'"$(date -Iseconds)"'"
            },
            "user": {
                "nickname": "测试用户",
                "avatar": "https://example.com/avatar.png"
            }
        }')
    
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ]; then
        print_success "公众号评论 Webhook 测试通过 (HTTP $status)"
        echo "$body" | jq .
    else
        print_error "公众号评论 Webhook 测试失败 (HTTP $status)"
        echo "$body" | jq . 2>/dev/null || echo "$body"
        return 1
    fi
}

test_invalid_token() {
    print_test "测试无效令牌（应返回 401）"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$OPENCLAW_URL/hooks/wake" \
        -H "Authorization: Bearer invalid-token" \
        -H "Content-Type: application/json" \
        -d '{"text":"测试"}')
    
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "401" ]; then
        print_success "无效令牌正确拒绝 (HTTP $status)"
    else
        print_error "无效令牌未正确拒绝 (HTTP $status)"
        return 1
    fi
}

test_query_string_token() {
    print_test "测试查询参数令牌（应返回 400）"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$OPENCLAW_URL/hooks/wake?token=$OPENCLAW_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"text":"测试"}')
    
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "400" ]; then
        print_success "查询参数令牌正确拒绝 (HTTP $status)"
    else
        print_error "查询参数令牌未正确拒绝 (HTTP $status)"
        return 1
    fi
}

# ==================== 主测试流程 ====================

main() {
    print_header "OpenClaw Webhook 测试套件"
    
    echo "配置信息:"
    echo "  OpenClaw URL: $OPENCLAW_URL"
    echo "  Webhook URL:  $WEBHOOK_URL"
    echo "  测试时间：$(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # 计数器
    total=0
    passed=0
    failed=0
    
    # 测试 1: 健康检查
    print_header "测试 1: 健康检查"
    ((total++))
    if test_health; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # 测试 2: OpenClaw Wake Hook
    print_header "测试 2: OpenClaw Wake Hook"
    ((total++))
    if test_openclaw_wake; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # 测试 3: OpenClaw Agent Hook
    print_header "测试 3: OpenClaw Agent Hook"
    ((total++))
    if test_openclaw_agent; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # 测试 4: GitHub Webhook
    print_header "测试 4: GitHub Webhook"
    ((total++))
    if test_github_webhook; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # 测试 5: 通用 Webhook
    print_header "测试 5: 通用 Webhook"
    ((total++))
    if test_generic_webhook; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # 测试 6: 公众号评论
    print_header "测试 6: 公众号评论"
    ((total++))
    if test_wechat_comment; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # 测试 7: 无效令牌
    print_header "测试 7: 安全测试 - 无效令牌"
    ((total++))
    if test_invalid_token; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # 测试 8: 查询参数令牌
    print_header "测试 8: 安全测试 - 查询参数令牌"
    ((total++))
    if test_query_string_token; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # 总结
    print_header "测试总结"
    
    echo "总测试数：$total"
    echo -e "通过：${GREEN}$passed${NC}"
    echo -e "失败：${RED}$failed${NC}"
    echo ""
    
    if [ $failed -eq 0 ]; then
        print_success "所有测试通过！🎉"
        exit 0
    else
        print_error "有 $failed 个测试失败"
        exit 1
    fi
}

# 显示帮助
show_help() {
    cat << EOF
OpenClaw Webhook 测试脚本

使用:
  $0 [选项]

选项:
  -h, --help      显示帮助信息
  -a, --all       运行所有测试（默认）
  -w, --wake      只测试 Wake Hook
  -g, --github    只测试 GitHub Webhook
  -s, --security  只测试安全相关

环境变量:
  OPENCLAW_URL     OpenClaw Gateway 地址 (默认：http://127.0.0.1:18789)
  OPENCLAW_TOKEN   OpenClaw 认证令牌
  WEBHOOK_URL      Webhook 处理器地址 (默认：http://127.0.0.1:3000)
  WEBHOOK_SECRET   Webhook 签名密钥

示例:
  ./test-webhook.sh                    # 运行所有测试
  OPENCLAW_TOKEN=xxx ./test-webhook.sh # 使用指定令牌
  ./test-webhook.sh --github           # 只测试 GitHub

EOF
}

# 解析参数
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -w|--wake)
        print_header "OpenClaw Wake Hook 测试"
        test_openclaw_wake
        ;;
    -g|--github)
        print_header "GitHub Webhook 测试"
        test_github_webhook
        ;;
    -s|--security)
        print_header "安全测试"
        test_invalid_token
        test_query_string_token
        ;;
    *)
        main
        ;;
esac
