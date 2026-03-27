// 🐱 小咪继续找更多高清图

const { firefox } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('🐱 继续找图...');
  
  const browser = await firefox.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // 去堆糖
  await page.goto('https://www.duitang.com/search/?kw=%E5%88%98%E4%BA%A6%E8%8F%B2+%E9%AB%98%E6%B8%85', {
    waitUntil: 'networkidle', timeout: 30000
  });
  await page.waitForTimeout(5000);
  
  // 获取所有大图链接
  const imageUrls = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs
      .map(img => img.src || img.dataset?.original)
      .filter(src => src && (src.includes('.jpg') || src.includes('.png')))
      .map(src => src.replace('.thumb.400_0', '').replace('.thumb.220_0', ''))
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 10);
  });
  
  console.log('🖼️ 找到', imageUrls.length, '张原图链接');
  
  // 保存链接到文件
  fs.writeFileSync('liuyifei-urls.txt', imageUrls.join('\n'));
  console.log('✅ 链接已保存到 liuyifei-urls.txt');
  
  // 下载前 3 张
  for (let i = 0; i < Math.min(3, imageUrls.length); i++) {
    console.log(`📥 下载第${i+1}张...`);
    const url = imageUrls[i];
    const filename = `liuyifei-hd-${i+1}.jpg`;
    
    const https = require('https');
    const file = fs.createWriteStream(filename);
    
    await new Promise((resolve) => {
      https.get(url, (res) => {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ ${filename} 下载完成`);
          resolve();
        });
      }).on('error', () => resolve());
    });
  }
  
  await browser.close();
  console.log('🎉 完成！');
})();
