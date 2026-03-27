/**
 * Discord 平台适配器
 */

import { BaseAdapter } from './base-adapter.js';
import { verifyDiscordSignature } from '../lib/utils.js';
import crypto from 'crypto';

export class DiscordAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'discord';
    this.description = 'Discord Webhook 适配器';
    this.publicKey = config.publicKey || process.env.DISCORD_PUBLIC_KEY || '';
  }

  async verifySignature(req, rawBody) {
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];

    if (!signature || !timestamp || !this.publicKey) {
      return false;
    }

    return verifyDiscordSignature(rawBody, timestamp, signature, this.publicKey);
  }

  async parseEvent(req) {
    const body = req.body;
    const type = body.type;

    const result = {
      platform: 'discord',
      event: this._getEventName(type),
      timestamp: Date.now(),
      raw: body
    };

    switch (type) {
      case 1: // PING
        result.event = 'ping';
        result.data = { type: 'ping' };
        break;
      case 2: // APPLICATION_COMMAND
        result.event = 'interaction';
        result.data = this._parseInteraction(body);
        break;
      case 3: // MESSAGE_COMPONENT
        result.event = 'message_component';
        result.data = this._parseMessageComponent(body);
        break;
      case 4: // AUTOCOMPLETE
        result.event = 'autocomplete';
        result.data = this._parseAutocomplete(body);
        break;
      case 5: // MODAL_SUBMIT
        result.event = 'modal_submit';
        result.data = this._parseModalSubmit(body);
        break;
      default:
        result.data = body;
    }

    return result;
  }

  _getEventName(type) {
    const types = {
      1: 'ping',
      2: 'interaction',
      3: 'message_component',
      4: 'autocomplete',
      5: 'modal_submit'
    };
    return types[type] || 'unknown';
  }

  _parseInteraction(body) {
    const data = body.data;
    const member = body.member;

    return {
      id: body.id,
      token: body.token,
      guildId: body.guild_id,
      channelId: body.channel_id,
      command: {
        id: data.id,
        name: data.name,
        type: data.type,
        options: data.options || []
      },
      user: {
        id: member?.user?.id,
        username: member?.user?.username,
        discriminator: member?.user?.discriminator,
        avatar: member?.user?.avatar,
        nick: member?.nick
      },
      permissions: member?.permissions
    };
  }

  _parseMessageComponent(body) {
    const data = body.data;
    return {
      id: body.id,
      token: body.token,
      customId: data.custom_id,
      componentType: data.component_type,
      values: data.values || [],
      user: {
        id: body.member?.user?.id,
        username: body.member?.user?.username
      }
    };
  }

  _parseAutocomplete(body) {
    const data = body.data;
    return {
      id: body.id,
      token: body.token,
      command: data.name,
      options: data.options || [],
      focused: data.options?.find(o => o.focused)
    };
  }

  _parseModalSubmit(body) {
    const data = body.data;
    return {
      id: body.id,
      token: body.token,
      customId: data.custom_id,
      components: data.components || [],
      user: {
        id: body.member?.user?.id,
        username: body.member?.user?.username
      }
    };
  }

  formatResponse(data) {
    // Discord 需要 PONG 响应来处理 PING
    if (data.type === 'pong' || data.event === 'ping') {
      return { type: 1 };
    }

    // 默认的交互响应
    if (data.type === 'response') {
      return {
        type: data.responseType || 4, // CHANNEL_MESSAGE_WITH_SOURCE
        data: {
          content: data.content,
          embeds: data.embeds || [],
          components: data.components || [],
          flags: data.ephemeral ? 64 : 0
        }
      };
    }

    return data;
  }
}

export default DiscordAdapter;