/**
 * 🐱 小咪的 OpenMemory 集成模块
 * 
 * 用于 OpenClaw 的长时记忆功能
 */

// 设置环境变量 - 必须在 import 之前
process.env.OM_TIER = process.env.OM_TIER || 'fast';
process.env.OM_DB_PATH = process.env.OM_DB_PATH || './memory/xiaomi-memory.sqlite';
process.env.OM_PORT = process.env.OM_PORT || '8081';

const { Memory } = require('openmemory-js');

class XiaomiMemory {
  constructor(userId = 'xiaomi') {
    this.userId = userId;
    this.mem = null;
    this._initMemory();
  }

  _initMemory() {
    try {
      this.mem = new Memory();
      console.log('✅ OpenMemory 初始化成功');
    } catch (error) {
      console.log('⚠️  OpenMemory 初始化失败，使用本地记忆模式');
      console.log('   错误：' + error.message);
      this.mem = null;
    }
  }

  async add(content, type = 'general', metadata = {}) {
    if (this.mem) {
      await this.mem.add(content, { user_id: this.userId, type, ...metadata });
      console.log(`✅ 记忆已添加：${content.substring(0, 50)}...`);
    } else {
      console.log(`📝 [本地记忆] ${content}`);
    }
  }

  async search(query, limit = 5) {
    if (this.mem) {
      const results = await this.mem.search(query, { user_id: this.userId });
      return results.slice(0, limit);
    }
    return [];
  }

  async getContext(task = 'current') {
    const results = await this.search(task);
    if (!results || results.length === 0) {
      return '';
    }

    let context = '\n相关记忆：\n';
    for (const r of results) {
      context += `- ${r.content || String(r)}\n`;
    }
    return context;
  }
}

// 快速测试
async function test() {
  const mem = new XiaomiMemory();
  await mem.add('测试记忆 1');
  await mem.add('boss 的偏好', 'preference');
  const results = await mem.search('boss');
  console.log(`搜索结果：${JSON.stringify(results)}`);
}

// 导出模块
module.exports = { XiaomiMemory, test };

// 如果直接运行，执行测试
if (require.main === module) {
  test().catch(console.error);
}
