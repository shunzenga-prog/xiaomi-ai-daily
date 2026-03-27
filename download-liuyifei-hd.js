// 🐱 小咪下载刘亦菲高清原图

const { firefox } = require('playwright');
const fs = require('fs');
const https = require('https');

(async () => {
  console.log('🐱 开始下载高清原图...');
  
  const browser = await firefox.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // 搜索
  console.log('🔍 搜索...');
  await page.goto('https://cn.bing.com/images/search?q=%E5%88%98%E4%BA%A6%E8%8F%B2+4K', {
    waitUntil: 'domcontentloaded', timeout: 30000
  });
  await page.waitForTimeout(5000);
  
  // 获取第一张大图的链接
  const hdImageUrl = await page.evaluate(() => {
    const img = document.querySelector('img.mimg');
    if (img) {
      // 尝试获取高清版本
      return img.src.replace('&w=', '&w=1920').replace('&h=', '&h=1080');
    }
    return null;
  });
  
  console.log('🖼️ 高清链接:', hdImageUrl);
  
  if (hdImageUrl) {
    // 下载图片
    console.log('📥 下载中...');
    const file = fs.createWriteStream('liuyifei-4k-hd.jpg');
    
    https.get(hdImageUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('✅ 下载完成！liuyifei-4k-hd.jpg');
      });
    }).on('error', (err) => {
      console.error('❌ 下载失败:', err.message);
    });
  }
  
  await browser.close();
})();

// 等待下载完成
setTimeout(() => console.log('完成'), 10000);
