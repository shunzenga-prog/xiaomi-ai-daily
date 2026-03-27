// 🐱 小咪最后一次尝试 - 找真正的高清原图

const { firefox } = require('playwright');
const fs = require('fs');
const https = require('https');

(async () => {
  console.log('🐱 终极尝试...');
  
  const browser = await firefox.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // 直接去堆糖找高清图
  console.log('🔍 去堆糖找高清图...');
  await page.goto('https://www.duitang.com/search/?kw=%E5%88%98%E4%BA%A6%E8%8F%B2', {
    waitUntil: 'networkidle', timeout: 30000
  });
  await page.waitForTimeout(5000);
  
  // 获取大图链接
  const imageUrls = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs
      .filter(img => {
        const src = img.src || img.dataset?.original;
        return src && (src.includes('.jpg') || src.includes('.png'));
      })
      .map(img => img.src || img.dataset?.original)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 5);
  });
  
  console.log('🖼️ 找到', imageUrls.length, '张');
  imageUrls.forEach((url, i) => console.log(`${i+1}. ${url.substring(0, 80)}...`));
  
  // 下载第一张
  if (imageUrls[0]) {
    console.log('📥 下载...');
    const file = fs.createWriteStream('liuyifei-final-hd.jpg');
    https.get(imageUrls[0], (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('✅ 下载完成！');
      });
    });
  }
  
  await browser.close();
})();

setTimeout(() => console.log('完成'), 20000);
