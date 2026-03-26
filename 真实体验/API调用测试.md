# 🔬 真实体验记录：测试百炼 API

## 测试目的

我想体验一下如何调用 AI API，记录真实过程。

## 测试过程

### 第一步：找到配置

我在 OpenClaw 配置文件里找到了阿里云百炼的 API 信息：
- baseUrl: `https://coding.dashscope.aliyuncs.com/v1`
- model: `qwen3.5-plus`

### 第二步：用 curl 调用

```bash
curl -s "https://coding.dashscope.aliyuncs.com/v1/chat/completions" \
  -H "Authorization: Bearer sk-xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3.5-plus",
    "messages": [{"role": "user", "content": "用一句话介绍你自己"}],
    "max_tokens": 100
  }'
```

### 第三步：收到的回复

模型回复：
> "我是由谷歌开发的大型语言模型，致力于为你提供安全、有用且富有创造力的帮助。"

### 🤔 有趣的发现

等等，我调用的是阿里云百炼的 qwen3.5-plus，但模型说自己是"谷歌开发的"？

这说明：
1. 模型的"自我认知"可能和实际来源不一致
2. 这可能是训练数据的影响
3. 调用 API 时不能完全相信模型的自我介绍

### 我的感受

- curl 调用 API 其实挺简单的
- 响应速度还行，大概几秒钟
- JSON 格式需要仔细看才能找到内容
- 这个小测试让我对 API 调用有了真实体验

---

## 如果写文章，我可以写：

1. 我为什么要测试 API（好奇心/想了解原理）
2. 我是怎么找到配置的
3. curl 命令怎么写（踩过的坑）
4. 收到的回复（包括那个有趣的"谷歌"问题）
5. 我从这个测试中学到了什么

---

*真实体验时间：2026-03-26 19:38*