/**
 * OpenClaw 工具库 - 公共工具函数
 */

import crypto from 'crypto';

/**
 * 验证 HMAC-SHA256 签名
 * @param {string|Buffer} payload - 载荷
 * @param {string} signature - 签名
 * @param {string} secret - 密钥
 * @returns {boolean}
 */
export function verifyHmacSha256(payload, signature, secret) {
  if (!signature || !secret) return false;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

/**
 * 验证 SHA1 签名（微信风格）
 * @param {string} token - Token
 * @param {string} timestamp - 时间戳
 * @param {string} nonce - 随机数
 * @param {string} signature - 签名
 * @returns {boolean}
 */
export function verifyWechatSignature(token, timestamp, nonce, signature) {
  const arr = [token, timestamp, nonce].sort();
  const hash = crypto.createHash('sha1').update(arr.join('')).digest('hex');
  return hash === signature;
}

/**
 * 验证 Slack 签名
 * @param {string} body - 请求体
 * @param {string} timestamp - 时间戳
 * @param {string} signature - 签名
 * @param {string} secret - 密钥
 * @returns {boolean}
 */
export function verifySlackSignature(body, timestamp, signature, secret) {
  // 防止重放攻击（5分钟内有效）
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    return false;
  }

  const baseString = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'v0=' + hmac.update(baseString).digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

/**
 * 验证 Discord 签名
 * @param {string} body - 请求体
 * @param {string} timestamp - 时间戳
 * @param {string} signature - 签名
 * @param {string} publicKey - 公钥
 * @returns {boolean}
 */
export function verifyDiscordSignature(body, timestamp, signature, publicKey) {
  const message = Buffer.from(timestamp + body);
  const signatureBuffer = Buffer.from(signature, 'hex');

  try {
    return crypto.verify(
      'ed25519',
      message,
      publicKey,
      signatureBuffer
    );
  } catch {
    return false;
  }
}

/**
 * 格式化时间戳
 * @param {number} timestamp - 时间戳（毫秒）
 * @returns {string}
 */
export function formatTimestamp(timestamp) {
  return new Date(timestamp).toISOString();
}

/**
 * 格式化日期（本地时间）
 * @param {Date|string|number} date - 日期
 * @param {string} format - 格式
 * @returns {string}
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 日志记录器
 */
export class Logger {
  constructor(prefix = 'OpenClaw') {
    this.prefix = prefix;
  }

  _log(level, message, data = {}) {
    const timestamp = formatTimestamp(Date.now());
    const output = {
      timestamp,
      level: level.toUpperCase(),
      prefix: this.prefix,
      message,
      ...data
    };
    console.log(JSON.stringify(output));
  }

  info(message, data = {}) {
    this._log('info', message, data);
  }

  warn(message, data = {}) {
    this._log('warn', message, data);
  }

  error(message, data = {}) {
    this._log('error', message, data);
  }

  debug(message, data = {}) {
    if (process.env.DEBUG === 'true') {
      this._log('debug', message, data);
    }
  }
}

/**
 * 创建标准化的响应
 */
export class ResponseBuilder {
  static success(data = {}) {
    return {
      success: true,
      timestamp: Date.now(),
      ...data
    };
  }

  static error(message, code = 500, details = {}) {
    return {
      success: false,
      error: {
        code,
        message,
        ...details
      },
      timestamp: Date.now()
    };
  }
}

/**
 * 事件发射器（简单实现）
 */
export class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(listener);
    return this;
  }

  off(event, listener) {
    if (!this.events.has(event)) return this;
    const listeners = this.events.get(event);
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
    return this;
  }

  emit(event, ...args) {
    if (!this.events.has(event)) return false;
    const listeners = this.events.get(event);
    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
    return true;
  }

  once(event, listener) {
    const onceWrapper = (...args) => {
      this.off(event, onceWrapper);
      listener(...args);
    };
    return this.on(event, onceWrapper);
  }
}

/**
 * 重试函数
 * @param {Function} fn - 要执行的函数
 * @param {number} retries - 重试次数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Promise}
 */
export async function retry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

/**
 * 深度合并对象
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @returns {Object}
 */
export function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

export default {
  verifyHmacSha256,
  verifyWechatSignature,
  verifySlackSignature,
  verifyDiscordSignature,
  formatTimestamp,
  formatDate,
  Logger,
  ResponseBuilder,
  EventEmitter,
  retry,
  deepMerge
};