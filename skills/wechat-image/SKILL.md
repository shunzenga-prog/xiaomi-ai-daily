---
name: wechat-image
description: 公众号图片上传。上传图片到微信公众号素材库，获取 URL 用于文章插图。触发：上传公众号图片、公众号配图。
---

# 公众号图片上传

## 快速使用

```bash
python3 scripts/wechat-upload-image.py <图片路径>
```

**返回**: 图片 URL，可直接在文章 HTML 中使用

## 已配置凭据

- APPID: `wxd3ec98242122f8a2`
- SECRET: 已配置（来源：wechat_publish.py）

## 实现方式

```python
# 上传接口
POST https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=TOKEN

# 返回格式
{ "url": "http://mmbiz.qpic.cn/..." }
```

## 图片要求

- 格式: PNG、JPEG、GIF
- 大小: 不超过 2MB
- 数量: 每篇文章建议 3-5 张配图

## 与文章创作集成

在 `article-pipeline` 中使用：
1. 创作官写文章时，标记需要配图的位置
2. 设计官生成/选择图片
3. 调用本 skill 上传图片获取 URL
4. 润色官将图片 URL 插入文章

## 示例

```bash
# 单张上传
python3 scripts/wechat-upload-image.py cover.png

# 批量上传
python3 scripts/wechat-upload-image.py img1.png img2.png img3.png

# 在文章中使用
<img src="http://mmbiz.qpic.cn/...">
```

---

**状态**: ✅ 已实现可用