# 🐱 小咪的 OpenMemory 集成脚本

用于 OpenClaw 和 OpenMemory 的记忆集成

## 使用方法

```python
from xiaomi_memory import XiaomiMemory

# 初始化
mem = XiaomiMemory(user_id="xiaomi")

# 添加记忆
await mem.add("今天完成了公众号 API 测试")
await mem.add("boss 喜欢被打招呼", type="preference")

# 搜索记忆
context = await mem.search("当前任务")

# 获取完整上下文
full_context = await mem.get_context()
```

## 记忆分类

- `task` - 任务
- `preference` - 偏好
- `learning` - 学习
- `goal` - 目标
- `conversation` - 对话
