/**
 * Telegram 平台适配器
 */

import { BaseAdapter } from './base-adapter.js';
import crypto from 'crypto';

export class TelegramAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'telegram';
    this.description = 'Telegram Bot Webhook 适配器';
    this.botToken = config.botToken || process.env.TELEGRAM_BOT_TOKEN || '';
    this.secretToken = config.secretToken || process.env.TELEGRAM_SECRET_TOKEN || '';
  }

  async verifySignature(req, rawBody) {
    // Telegram 使用 X-Telegram-Bot-Api-Secret-Token 头验证
    const secretToken = req.headers['x-telegram-bot-api-secret-token'];

    if (!this.secretToken) {
      return true; // 如果没有配置密钥，跳过验证
    }

    return secretToken === this.secretToken;
  }

  async parseEvent(req) {
    const body = req.body;

    const result = {
      platform: 'telegram',
      event: 'unknown',
      timestamp: Date.now(),
      raw: body
    };

    // 解析更新类型
    if (body.message) {
      result.event = 'message';
      result.data = this._parseMessage(body.message);
    } else if (body.edited_message) {
      result.event = 'edited_message';
      result.data = this._parseMessage(body.edited_message);
    } else if (body.channel_post) {
      result.event = 'channel_post';
      result.data = this._parseMessage(body.channel_post);
    } else if (body.edited_channel_post) {
      result.event = 'edited_channel_post';
      result.data = this._parseMessage(body.edited_channel_post);
    } else if (body.inline_query) {
      result.event = 'inline_query';
      result.data = this._parseInlineQuery(body.inline_query);
    } else if (body.chosen_inline_result) {
      result.event = 'chosen_inline_result';
      result.data = this._parseChosenInlineResult(body.chosen_inline_result);
    } else if (body.callback_query) {
      result.event = 'callback_query';
      result.data = this._parseCallbackQuery(body.callback_query);
    } else if (body.shipping_query) {
      result.event = 'shipping_query';
      result.data = this._parseShippingQuery(body.shipping_query);
    } else if (body.pre_checkout_query) {
      result.event = 'pre_checkout_query';
      result.data = this._parsePreCheckoutQuery(body.pre_checkout_query);
    } else if (body.poll) {
      result.event = 'poll';
      result.data = this._parsePoll(body.poll);
    } else if (body.poll_answer) {
      result.event = 'poll_answer';
      result.data = this._parsePollAnswer(body.poll_answer);
    } else if (body.my_chat_member) {
      result.event = 'my_chat_member';
      result.data = this._parseChatMember(body.my_chat_member);
    } else if (body.chat_member) {
      result.event = 'chat_member';
      result.data = this._parseChatMember(body.chat_member);
    } else if (body.chat_join_request) {
      result.event = 'chat_join_request';
      result.data = this._parseChatJoinRequest(body.chat_join_request);
    }

    return result;
  }

  _parseMessage(message) {
    return {
      messageId: message.message_id,
      from: message.from ? {
        id: message.from.id,
        isBot: message.from.is_bot,
        firstName: message.from.first_name,
        lastName: message.from.last_name,
        username: message.from.username,
        languageCode: message.from.language_code
      } : null,
      senderChat: message.sender_chat ? {
        id: message.sender_chat.id,
        type: message.sender_chat.type,
        title: message.sender_chat.title,
        username: message.sender_chat.username
      } : null,
      date: message.date,
      chat: {
        id: message.chat.id,
        type: message.chat.type,
        title: message.chat.title,
        username: message.chat.username,
        firstName: message.chat.first_name,
        lastName: message.chat.last_name
      },
      forwardFrom: message.forward_from ? {
        id: message.forward_from.id,
        firstName: message.forward_from.first_name,
        username: message.forward_from.username
      } : null,
      replyToMessage: message.reply_to_message ? {
        messageId: message.reply_to_message.message_id
      } : null,
      text: message.text,
      entities: message.entities || [],
      caption: message.caption,
      captionEntities: message.caption_entities || [],
      // 媒体内容
      audio: message.audio,
      document: message.document,
      animation: message.animation,
      game: message.game,
      photo: (message.photo || []).map(p => ({
        fileId: p.file_id,
        fileUniqueId: p.file_unique_id,
        width: p.width,
        height: p.height,
        fileSize: p.file_size
      })),
      sticker: message.sticker,
      video: message.video,
      videoNote: message.video_note,
      voice: message.voice,
      contact: message.contact,
      dice: message.dice,
      poll: message.poll,
      venue: message.venue,
      location: message.location,
      newChatMembers: (message.new_chat_members || []).map(m => ({
        id: m.id,
        firstName: m.first_name,
        username: m.username
      })),
      leftChatMember: message.left_chat_member ? {
        id: message.left_chat_member.id,
        firstName: message.left_chat_member.first_name
      } : null,
      newChatTitle: message.new_chat_title,
      newChatPhoto: message.new_chat_photo,
      deleteChatPhoto: message.delete_chat_photo,
      groupChatCreated: message.group_chat_created,
      supergroupChatCreated: message.supergroup_chat_created,
      channelChatCreated: message.channel_chat_created
    };
  }

  _parseInlineQuery(query) {
    return {
      id: query.id,
      from: {
        id: query.from.id,
        firstName: query.from.first_name,
        username: query.from.username
      },
      query: query.query,
      offset: query.offset,
      chatType: query.chat_type,
      location: query.location ? {
        longitude: query.location.longitude,
        latitude: query.location.latitude
      } : null
    };
  }

  _parseChosenInlineResult(result) {
    return {
      resultId: result.result_id,
      from: {
        id: result.from.id,
        firstName: result.from.first_name
      },
      query: result.query,
      location: result.location
    };
  }

  _parseCallbackQuery(query) {
    return {
      id: query.id,
      from: {
        id: query.from.id,
        firstName: query.from.first_name,
        username: query.from.username
      },
      message: query.message ? {
        messageId: query.message.message_id,
        chat: {
          id: query.message.chat.id
        }
      } : null,
      inlineMessageId: query.inline_message_id,
      chatInstance: query.chat_instance,
      data: query.data,
      gameShortName: query.game_short_name
    };
  }

  _parseShippingQuery(query) {
    return {
      id: query.id,
      from: {
        id: query.from.id
      },
      invoicePayload: query.invoice_payload,
      shippingAddress: query.shipping_address
    };
  }

  _parsePreCheckoutQuery(query) {
    return {
      id: query.id,
      from: {
        id: query.from.id
      },
      currency: query.currency,
      totalAmount: query.total_amount,
      invoicePayload: query.invoice_payload,
      shippingOptionId: query.shipping_option_id
    };
  }

  _parsePoll(poll) {
    return {
      id: poll.id,
      question: poll.question,
      options: poll.options.map(o => ({
        text: o.text,
        voterCount: o.voter_count
      })),
      totalVoterCount: poll.total_voter_count,
      isClosed: poll.is_closed,
      isAnonymous: poll.is_anonymous,
      type: poll.type,
      allowsMultipleAnswers: poll.allows_multiple_answers
    };
  }

  _parsePollAnswer(answer) {
    return {
      pollId: answer.poll_id,
      user: {
        id: answer.user.id
      },
      optionIds: answer.option_ids
    };
  }

  _parseChatMember(member) {
    return {
      chat: {
        id: member.chat.id
      },
      from: {
        id: member.from.id
      },
      date: member.date,
      oldChatMember: member.old_chat_member,
      newChatMember: member.new_chat_member
    };
  }

  _parseChatJoinRequest(request) {
    return {
      chat: {
        id: request.chat.id
      },
      from: {
        id: request.from.id
      },
      date: request.date,
      bio: request.bio,
      inviteLink: request.invite_link
    };
  }

  formatResponse(data) {
    // Telegram 的响应格式
    if (data.method) {
      return {
        method: data.method,
        ...data.params
      };
    }

    return data;
  }
}

export default TelegramAdapter;