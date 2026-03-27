// 🐱 Playwright 版

const { firefox } = require('playwright');

(async () => {
  console.log('🐱 开始...');
  
  const browser = await firefox.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  console.log('🔍 搜索...');
  await page.goto('https://cn.bing.com/images/search?q=%E5%88%98%E4%BA%A6%E8%8F%B2', {
    waitUntil: 'domcontentloaded', timeout: 30000
  });
  
  await page.waitForTimeout(5000);
  
  console.log('📸 截图...');
  await page.screenshot({ path: 'liuyifei-playwright-results.png' });
  
  const imageUrls = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img.mimg'));
    return imgs.slice(0, 3).map(img => img.src);
  });
  
  console.log('🖼️ 找到', imageUrls.length, '张');
  
  if (imageUrls[0]) {
    await page.goto(imageUrls[0], { waitUntil: 'commit', timeout: 30000 });
    await page.screenshot({ path: 'liuyifei-playwright-hd.png' });
    console.log('✅ 完成！');
  }
  
  await browser.close();
})();
