/**
 * 平台适配器基类
 * 所有平台适配器必须继承此类并实现相应方法
 */

export class BaseAdapter {
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
    this.description = '基础适配器';
  }

  /**
   * 验证 Webhook 签名
   * @param {Object} req - Express 请求对象
   * @param {string} rawBody - 原始请求体
   * @returns {boolean}
   */
  async verifySignature(req, rawBody) {
    throw new Error('verifySignature must be implemented');
  }

  /**
   * 解析 Webhook 事件
   * @param {Object} req - Express 请求对象
   * @returns {Object} 标准化的事件对象
   */
  async parseEvent(req) {
    throw new Error('parseEvent must be implemented');
  }

  /**
   * 处理验证请求（如微信公众号服务器验证）
   * @param {Object} req - Express 请求对象
   * @param {Object} res - Express 响应对象
   * @returns {boolean} 是否处理了验证请求
   */
  async handleVerification(req, res) {
    return false;
  }

  /**
   * 获取事件类型
   * @param {Object} event - 解析后的事件
   * @returns {string}
   */
  getEventType(event) {
    return event.type || 'unknown';
  }

  /**
   * 格式化响应
   * @param {Object} data - 响应数据
   * @returns {Object|string}
   */
  formatResponse(data) {
    return data;
  }

  /**
   * 获取适配器信息
   * @returns {Object}
   */
  getInfo() {
    return {
      name: this.name,
      description: this.description,
      config: Object.keys(this.config)
    };
  }
}

export default BaseAdapter;