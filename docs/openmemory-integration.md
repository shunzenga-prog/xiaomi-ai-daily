# 🐱 小咪的 OpenMemory 集成

用于 OpenClaw 的长时记忆功能

## 安装

```bash
npm install openmemory-js
```

## 使用方法

```javascript
const { XiaomiMemory } = require('./scripts/xiaomi_memory');

// 初始化
const mem = new XiaomiMemory('xiaomi');

// 添加记忆
await mem.add("今天完成了公众号 API 测试");
await mem.add("boss 喜欢被打招呼", "preference");

// 搜索记忆
const results = await mem.search("当前任务");

// 获取完整上下文
const context = await mem.getContext("当前任务");
```

## 记忆分类

- `task` - 任务
- `preference` - 偏好
- `learning` - 学习
- `goal` - 目标
- `conversation` - 对话
- `general` - 通用（默认）

## 环境配置

```bash
# 数据库路径
export OM_DB_PATH=./memory/xiaomi-memory.sqlite

# 服务端口（避免冲突）
export OM_PORT=8099

# 性能模式：fast | smart | deep
export OM_TIER=fast
```

## 测试结果

✅ 2026-03-27 07:30 - 集成测试通过
- 记忆添加：正常
- 记忆搜索：正常
- SQLite 存储：正常
- 记忆衰减：正常

## 下一步

- [ ] 将 memory_search 切换到 OpenMemory 后端
- [ ] 迁移现有 MEMORY.md 内容到 OpenMemory
- [ ] 优化查询性能
- [ ] 添加批量导入功能
