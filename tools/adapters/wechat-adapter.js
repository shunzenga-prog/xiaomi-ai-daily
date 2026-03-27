/**
 * 微信公众号平台适配器
 */

import { BaseAdapter } from './base-adapter.js';
import { verifyWechatSignature } from '../lib/utils.js';

export class WeChatAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'wechat';
    this.description = '微信公众号 Webhook 适配器';
    this.token = config.token || process.env.WECHAT_TOKEN || '';
    this.encodingAESKey = config.encodingAESKey || process.env.WECHAT_ENCODING_AES_KEY || '';
    this.appId = config.appId || process.env.WECHAT_APP_ID || '';
  }

  async verifySignature(req, rawBody) {
    const { signature, timestamp, nonce } = req.query;

    if (!signature || !timestamp || !nonce) {
      return false;
    }

    return verifyWechatSignature(this.token, timestamp, nonce, signature);
  }

  async handleVerification(req, res) {
    const { signature, timestamp, nonce, echostr } = req.query;

    if (echostr && signature) {
      const isValid = verifyWechatSignature(this.token, timestamp, nonce, signature);
      if (isValid) {
        res.send(echostr);
        return true;
      }
      res.status(403).send('Invalid signature');
      return true;
    }
    return false;
  }

  async parseEvent(req) {
    const body = req.body;

    // XML 解析后的消息
    const message = body.xml || body;

    const result = {
      platform: 'wechat',
      event: message.MsgType?.[0] || message.MsgType || 'unknown',
      timestamp: Date.now(),
      raw: body
    };

    // 通用字段
    result.toUserName = message.ToUserName?.[0] || message.ToUserName;
    result.fromUserName = message.FromUserName?.[0] || message.FromUserName;
    result.createTime = parseInt(message.CreateTime?.[0] || message.CreateTime || 0) * 1000;
    result.msgType = message.MsgType?.[0] || message.MsgType;

    // 根据消息类型解析
    switch (result.msgType) {
      case 'text':
        result.event = 'text_message';
        result.data = this._parseTextMessage(message);
        break;
      case 'image':
        result.event = 'image_message';
        result.data = this._parseImageMessage(message);
        break;
      case 'voice':
        result.event = 'voice_message';
        result.data = this._parseVoiceMessage(message);
        break;
      case 'video':
        result.event = 'video_message';
        result.data = this._parseVideoMessage(message);
        break;
      case 'shortvideo':
        result.event = 'shortvideo_message';
        result.data = this._parseVideoMessage(message);
        break;
      case 'location':
        result.event = 'location_message';
        result.data = this._parseLocationMessage(message);
        break;
      case 'link':
        result.event = 'link_message';
        result.data = this._parseLinkMessage(message);
        break;
      case 'event':
        result.event = this._getEventName(message);
        result.data = this._parseEvent(message);
        break;
      default:
        result.data = message;
    }

    return result;
  }

  _parseTextMessage(message) {
    return {
      content: message.Content?.[0] || message.Content,
      msgId: message.MsgId?.[0] || message.MsgId
    };
  }

  _parseImageMessage(message) {
    return {
      picUrl: message.PicUrl?.[0] || message.PicUrl,
      mediaId: message.MediaId?.[0] || message.MediaId,
      msgId: message.MsgId?.[0] || message.MsgId
    };
  }

  _parseVoiceMessage(message) {
    return {
      mediaId: message.MediaId?.[0] || message.MediaId,
      format: message.Format?.[0] || message.Format,
      recognition: message.Recognition?.[0] || message.Recognition,
      msgId: message.MsgId?.[0] || message.MsgId
    };
  }

  _parseVideoMessage(message) {
    return {
      mediaId: message.MediaId?.[0] || message.MediaId,
      thumbMediaId: message.ThumbMediaId?.[0] || message.ThumbMediaId,
      msgId: message.MsgId?.[0] || message.MsgId
    };
  }

  _parseLocationMessage(message) {
    return {
      locationX: parseFloat(message.Location_X?.[0] || message.Location_X),
      locationY: parseFloat(message.Location_Y?.[0] || message.Location_Y),
      scale: parseInt(message.Scale?.[0] || message.Scale),
      label: message.Label?.[0] || message.Label,
      msgId: message.MsgId?.[0] || message.MsgId
    };
  }

  _parseLinkMessage(message) {
    return {
      title: message.Title?.[0] || message.Title,
      description: message.Description?.[0] || message.Description,
      url: message.Url?.[0] || message.Url,
      msgId: message.MsgId?.[0] || message.MsgId
    };
  }

  _getEventName(message) {
    const event = message.Event?.[0] || message.Event;
    const eventKey = message.EventKey?.[0] || message.EventKey;

    switch (event) {
      case 'subscribe':
        return eventKey ? 'scan_subscribe' : 'subscribe';
      case 'unsubscribe':
        return 'unsubscribe';
      case 'SCAN':
        return 'scan';
      case 'LOCATION':
        return 'location_report';
      case 'CLICK':
        return 'menu_click';
      case 'VIEW':
        return 'menu_view';
      case 'scancode_push':
        return 'scancode_push';
      case 'scancode_waitmsg':
        return 'scancode_waitmsg';
      case 'pic_sysphoto':
        return 'pic_sysphoto';
      case 'pic_photo_or_album':
        return 'pic_photo_or_album';
      case 'pic_weixin':
        return 'pic_weixin';
      case 'location_select':
        return 'location_select';
      case 'templatesendjobfinish':
        return 'template_send_finish';
      case 'MASSSENDJOBFINISH':
        return 'mass_send_finish';
      default:
        return event?.toLowerCase() || 'unknown_event';
    }
  }

  _parseEvent(message) {
    const event = message.Event?.[0] || message.Event;
    const eventKey = message.EventKey?.[0] || message.EventKey;

    const result = {
      event,
      eventKey
    };

    // 特定事件解析
    switch (event) {
      case 'subscribe':
        if (eventKey && eventKey.startsWith('qrscene_')) {
          result.sceneId = eventKey.replace('qrscene_', '');
        }
        break;
      case 'SCAN':
        result.sceneId = eventKey;
        result.ticket = message.Ticket?.[0] || message.Ticket;
        break;
      case 'LOCATION':
        result.latitude = parseFloat(message.Latitude?.[0] || message.Latitude);
        result.longitude = parseFloat(message.Longitude?.[0] || message.Longitude);
        result.precision = parseFloat(message.Precision?.[0] || message.Precision);
        break;
      case 'templatesendjobfinish':
        result.msgId = message.MsgID?.[0] || message.MsgID;
        result.status = message.Status?.[0] || message.Status;
        break;
      case 'MASSSENDJOBFINISH':
        result.msgId = message.MsgID?.[0] || message.MsgID;
        result.status = message.Status?.[0] || message.Status;
        result.totalCount = parseInt(message.TotalCount?.[0] || message.TotalCount || 0);
        result.filterCount = parseInt(message.FilterCount?.[0] || message.FilterCount || 0);
        result.sentCount = parseInt(message.SentCount?.[0] || message.SentCount || 0);
        result.errorCount = parseInt(message.ErrorCount?.[0] || message.ErrorCount || 0);
        break;
    }

    return result;
  }

  formatResponse(data) {
    // 自动回复消息格式
    if (data.reply) {
      const { toUser, fromUser, msgType, content } = data.reply;
      return `<xml>
<ToUserName><![CDATA[${toUser}]]></ToUserName>
<FromUserName><![CDATA[${fromUser}]]></FromUserName>
<CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
<MsgType><![CDATA[${msgType}]]></MsgType>
${this._formatContent(msgType, content)}
</xml>`;
    }

    return data;
  }

  _formatContent(msgType, content) {
    switch (msgType) {
      case 'text':
        return `<Content><![CDATA[${content}]]></Content>`;
      case 'image':
        return `<Image><MediaId><![CDATA[${content.mediaId}]]></MediaId></Image>`;
      case 'voice':
        return `<Voice><MediaId><![CDATA[${content.mediaId}]]></MediaId></Voice>`;
      case 'video':
        return `<Video>
<MediaId><![CDATA[${content.mediaId}]]></MediaId>
<Title><![CDATA[${content.title || ''}]]></Title>
<Description><![CDATA[${content.description || ''}]]></Description>
</Video>`;
      case 'music':
        return `<Music>
<Title><![CDATA[${content.title || ''}]]></Title>
<Description><![CDATA[${content.description || ''}]]></Description>
<MusicUrl><![CDATA[${content.musicUrl || ''}]]></MusicUrl>
<HQMusicUrl><![CDATA[${content.hqMusicUrl || ''}]]></HQMusicUrl>
<ThumbMediaId><![CDATA[${content.thumbMediaId || ''}]]></ThumbMediaId>
</Music>`;
      case 'news':
        const articles = (content.articles || []).map(article =>
`<item>
<Title><![CDATA[${article.title}]]></Title>
<Description><![CDATA[${article.description}]]></Description>
<PicUrl><![CDATA[${article.picUrl}]]></PicUrl>
<Url><![CDATA[${article.url}]]></Url>
</item>`
        ).join('\n');
        return `<ArticleCount>${content.articles.length}</ArticleCount>
<Articles>${articles}</Articles>`;
      default:
        return '';
    }
  }
}

export default WeChatAdapter;