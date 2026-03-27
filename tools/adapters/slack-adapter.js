/**
 * Slack 平台适配器
 */

import { BaseAdapter } from './base-adapter.js';
import { verifySlackSignature } from '../lib/utils.js';

export class SlackAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'slack';
    this.description = 'Slack Webhook 适配器';
    this.signingSecret = config.signingSecret || process.env.SLACK_SIGNING_SECRET || '';
    this.botToken = config.botToken || process.env.SLACK_BOT_TOKEN || '';
  }

  async verifySignature(req, rawBody) {
    const signature = req.headers['x-slack-signature'];
    const timestamp = req.headers['x-slack-request-timestamp'];

    if (!signature || !timestamp || !this.signingSecret) {
      return false;
    }

    return verifySlackSignature(rawBody, timestamp, signature, this.signingSecret);
  }

  async parseEvent(req) {
    const body = req.body;

    // URL 验证请求
    if (body.type === 'url_verification') {
      return {
        platform: 'slack',
        event: 'url_verification',
        challenge: body.challenge,
        timestamp: Date.now()
      };
    }

    // 命令请求
    if (body.command) {
      return this._parseSlashCommand(body);
    }

    // 交互请求
    if (body.payload) {
      return this._parseInteraction(body);
    }

    // 事件 API
    if (body.event) {
      return this._parseEvent(body);
    }

    return {
      platform: 'slack',
      event: 'unknown',
      timestamp: Date.now(),
      raw: body
    };
  }

  _parseSlashCommand(body) {
    return {
      platform: 'slack',
      event: 'slash_command',
      timestamp: Date.now(),
      data: {
        token: body.token,
        teamId: body.team_id,
        teamDomain: body.team_domain,
        channelId: body.channel_id,
        channelName: body.channel_name,
        userId: body.user_id,
        userName: body.user_name,
        command: body.command,
        text: body.text,
        responseUrl: body.response_url,
        triggerId: body.trigger_id
      }
    };
  }

  _parseInteraction(body) {
    try {
      const payload = typeof body.payload === 'string'
        ? JSON.parse(body.payload)
        : body.payload;

      const type = payload.type;

      const result = {
        platform: 'slack',
        event: this._getInteractionEventName(type),
        timestamp: Date.now(),
        raw: payload
      };

      switch (type) {
        case 'block_actions':
          result.data = this._parseBlockActions(payload);
          break;
        case 'view_submission':
          result.data = this._parseViewSubmission(payload);
          break;
        case 'view_closed':
          result.data = this._parseViewClosed(payload);
          break;
        case 'shortcut':
          result.data = this._parseShortcut(payload);
          break;
        case 'message_action':
          result.data = this._parseMessageAction(payload);
          break;
        default:
          result.data = payload;
      }

      return result;
    } catch (error) {
      return {
        platform: 'slack',
        event: 'parse_error',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  _getInteractionEventName(type) {
    const types = {
      'block_actions': 'block_action',
      'view_submission': 'modal_submit',
      'view_closed': 'modal_close',
      'shortcut': 'shortcut',
      'message_action': 'message_action'
    };
    return types[type] || type;
  }

  _parseBlockActions(payload) {
    return {
      type: 'block_actions',
      triggerId: payload.trigger_id,
      responseUrl: payload.response_url,
      user: {
        id: payload.user?.id,
        username: payload.user?.username,
        name: payload.user?.name,
        teamId: payload.user?.team_id
      },
      channel: {
        id: payload.channel?.id,
        name: payload.channel?.name
      },
      team: {
        id: payload.team?.id,
        domain: payload.team?.domain
      },
      actions: (payload.actions || []).map(action => ({
        actionId: action.action_id,
        blockId: action.block_id,
        type: action.type,
        value: action.value || action.selected_option?.value,
        text: action.text?.text
      })),
      message: payload.message
    };
  }

  _parseViewSubmission(payload) {
    return {
      type: 'view_submission',
      triggerId: payload.trigger_id,
      user: {
        id: payload.user?.id,
        username: payload.user?.username
      },
      team: {
        id: payload.team?.id,
        domain: payload.team?.domain
      },
      view: {
        id: payload.view?.id,
        type: payload.view?.type,
        callbackId: payload.view?.callback_id,
        state: payload.view?.state
      }
    };
  }

  _parseViewClosed(payload) {
    return {
      type: 'view_closed',
      user: {
        id: payload.user?.id,
        username: payload.user?.username
      },
      view: {
        id: payload.view?.id,
        callbackId: payload.view?.callback_id
      }
    };
  }

  _parseShortcut(payload) {
    return {
      type: 'shortcut',
      callbackId: payload.callback_id,
      triggerId: payload.trigger_id,
      user: {
        id: payload.user?.id,
        username: payload.user?.username
      },
      team: {
        id: payload.team?.id,
        domain: payload.team?.domain
      },
      channel: payload.channel ? {
        id: payload.channel?.id,
        name: payload.channel?.name
      } : null
    };
  }

  _parseMessageAction(payload) {
    return {
      type: 'message_action',
      callbackId: payload.callback_id,
      triggerId: payload.trigger_id,
      user: {
        id: payload.user?.id,
        username: payload.user?.username
      },
      channel: {
        id: payload.channel?.id,
        name: payload.channel?.name
      },
      message: {
        ts: payload.message?.ts,
        text: payload.message?.text,
        user: payload.message?.user
      }
    };
  }

  _parseEvent(body) {
    const event = body.event;

    const result = {
      platform: 'slack',
      event: event.type,
      timestamp: Date.now(),
      raw: body
    };

    // 通用事件字段
    result.teamId = body.team_id;
    result.apiAppId = body.api_app_id;

    // 事件数据
    result.data = {
      type: event.type,
      user: event.user ? { id: event.user } : null,
      channel: event.channel ? { id: event.channel } : null,
      ts: event.ts,
      eventTs: event.event_ts
    };

    // 特定事件处理
    if (event.type === 'message') {
      result.data = {
        ...result.data,
        text: event.text,
        user: {
          id: event.user,
          botId: event.bot_id
        },
        channel: {
          id: event.channel
        },
        threadTs: event.thread_ts,
        subtype: event.subtype
      };
    }

    return result;
  }

  formatResponse(data) {
    // URL 验证响应
    if (data.challenge) {
      return { challenge: data.challenge };
    }

    // Slash 命令响应
    if (data.responseType) {
      return {
        response_type: data.responseType, // 'in_channel' or 'ephemeral'
        text: data.text,
        attachments: data.attachments || [],
        blocks: data.blocks || []
      };
    }

    return data;
  }
}

export default SlackAdapter;