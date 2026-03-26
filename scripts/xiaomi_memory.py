"""
🐱 小咪的 OpenMemory 集成模块

用于 OpenClaw 的长时记忆功能
"""

import os
import asyncio
from typing import Optional, List, Dict, Any

try:
    from openmemory.client import Memory as OpenMemory
except ImportError:
    OpenMemory = None


class XiaomiMemory:
    """小咪的记忆管理类"""
    
    def __init__(self, user_id: str = "xiaomi"):
        self.user_id = user_id
        self.mem = None
        self._init_memory()
    
    def _init_memory(self):
        """初始化 OpenMemory"""
        if OpenMemory:
            self.mem = OpenMemory()
        else:
            print("⚠️  OpenMemory 未安装，使用本地记忆")
            self.mem = None
    
    async def add(self, content: str, type: str = "general", metadata: Optional[Dict] = None):
        """添加记忆"""
        if self.mem:
            await self.mem.add(content, user_id=self.user_id, type=type, **(metadata or {}))
            print(f"✅ 记忆已添加：{content[:50]}...")
        else:
            print(f"📝 [本地记忆] {content}")
    
    async def search(self, query: str, limit: int = 5) -> List[Any]:
        """搜索记忆"""
        if self.mem:
            results = await self.mem.search(query, user_id=self.user_id)
            return results[:limit]
        return []
    
    async def get_context(self, task: str = "current") -> str:
        """获取当前任务相关的记忆上下文"""
        results = await self.search(task)
        if not results:
            return ""
        
        context = "\n相关记忆：\n"
        for r in results:
            context += f"- {r.get('content', str(r))}\n"
        return context


# 快速测试
if __name__ == "__main__":
    async def test():
        mem = XiaomiMemory()
        await mem.add("测试记忆 1")
        await mem.add("boss 的偏好", type="preference")
        results = await mem.search("boss")
        print(f"搜索结果：{results}")
    
    asyncio.run(test())
