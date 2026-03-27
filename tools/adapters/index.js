/**
 * 平台适配器索引
 * 导出所有平台适配器
 */

export { BaseAdapter } from './base-adapter.js';
export { GitHubAdapter } from './github-adapter.js';
export { GitLabAdapter } from './gitlab-adapter.js';
export { DiscordAdapter } from './discord-adapter.js';
export { SlackAdapter } from './slack-adapter.js';
export { TelegramAdapter } from './telegram-adapter.js';
export { WeChatAdapter } from './wechat-adapter.js';

/**
 * 适配器注册表
 */
const adapters = new Map([
  ['github', (await import('./github-adapter.js')).GitHubAdapter],
  ['gitlab', (await import('./gitlab-adapter.js')).GitLabAdapter],
  ['discord', (await import('./discord-adapter.js')).DiscordAdapter],
  ['slack', (await import('./slack-adapter.js')).SlackAdapter],
  ['telegram', (await import('./telegram-adapter.js')).TelegramAdapter],
  ['wechat', (await import('./wechat-adapter.js')).WeChatAdapter]
]);

/**
 * 获取适配器类
 * @param {string} name - 平台名称
 * @returns {Function|null}
 */
export function getAdapter(name) {
  return adapters.get(name.toLowerCase()) || null;
}

/**
 * 获取所有支持的适配器名称
 * @returns {string[]}
 */
export function getSupportedAdapters() {
  return Array.from(adapters.keys());
}

/**
 * 创建适配器实例
 * @param {string} name - 平台名称
 * @param {Object} config - 配置
 * @returns {BaseAdapter|null}
 */
export function createAdapter(name, config = {}) {
  const AdapterClass = getAdapter(name);
  if (!AdapterClass) {
    return null;
  }
  return new AdapterClass(config);
}

export default {
  BaseAdapter: (await import('./base-adapter.js')).BaseAdapter,
  GitHubAdapter: (await import('./github-adapter.js')).GitHubAdapter,
  GitLabAdapter: (await import('./gitlab-adapter.js')).GitLabAdapter,
  DiscordAdapter: (await import('./discord-adapter.js')).DiscordAdapter,
  SlackAdapter: (await import('./slack-adapter.js')).SlackAdapter,
  TelegramAdapter: (await import('./telegram-adapter.js')).TelegramAdapter,
  WeChatAdapter: (await import('./wechat-adapter.js')).WeChatAdapter,
  getAdapter,
  getSupportedAdapters,
  createAdapter
};