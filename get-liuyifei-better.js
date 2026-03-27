// 🐱 小咪找刘亦菲真正的高清大图

const { firefox } = require('playwright');
const fs = require('fs');
const https = require('https');

(async () => {
  console.log('🐱 寻找真正的高清大图...');
  
  const browser = await firefox.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // 搜索高清原图
  console.log('🔍 搜索 4K 原图...');
  await page.goto('https://cn.bing.com/images/search?q=%E5%88%98%E4%BA%A6%E8%8F%B2+4K+%E5%8E%9F%E5%9B%BE', {
    waitUntil: 'domcontentloaded', timeout: 30000
  });
  await page.waitForTimeout(5000);
  
  // 获取前几张图的链接
  const images = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img.mimg'));
    return imgs.slice(0, 5).map(img => ({
      src: img.src,
      w: img.getAttribute('data-wid') || img.width,
      h: img.getAttribute('data-hei') || img.height
    }));
  });
  
  console.log('🖼️ 找到', images.length, '张');
  images.forEach((img, i) => console.log(`${i+1}. ${img.w}x${img.h}`));
  
  // 找最大的那张
  const best = images.reduce((max, img) => {
    const size = (parseInt(img.w) || 0) * (parseInt(img.h) || 0);
    const maxSize = (parseInt(max.w) || 0) * (parseInt(max.h) || 0);
    return size > maxSize ? img : max;
  });
  
  console.log('📥 下载最大图:', best.w + 'x' + best.h);
  
  // 下载
  const url = best.src.replace(/&w=\d+/, '&w=2048').replace(/&h=\d+/, '&h=2048');
  const file = fs.createWriteStream('liuyifei-best-4k.jpg');
  
  https.get(url, (res) => {
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('✅ 下载完成！');
    });
  });
  
  await browser.close();
})();

setTimeout(() => console.log('完成'), 15000);
