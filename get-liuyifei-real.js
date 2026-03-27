// 🐱 小咪找真正的原图 - 模拟右键另存为

const { firefox } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('🐱 模拟右键另存为...');
  
  const browser = await firefox.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // 搜索
  console.log('🔍 搜索...');
  await page.goto('https://cn.bing.com/images/search?q=%E5%88%98%E4%BA%A6%E8%8F%B2', {
    waitUntil: 'domcontentloaded', timeout: 30000
  });
  await page.waitForTimeout(3000);
  
  // 点击第一张图（模拟点击）
  console.log('🖱️ 点击第一张图...');
  await page.click('img.mimg');
  await page.waitForTimeout(5000);
  
  // 获取实际显示的大图 URL
  const realImageUrl = await page.evaluate(() => {
    // 找预览区的大图
    const previewImg = document.querySelector('img.rfimg');
    if (previewImg) return previewImg.src;
    
    // 或者找任何显示的大图
    const allImgs = Array.from(document.querySelectorAll('img'));
    const bigImg = allImgs.find(img => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      return w > 500 && h > 500;
    });
    if (bigImg) return bigImg.src;
    
    return null;
  });
  
  console.log('🖼️ 找到大图:', realImageUrl);
  
  if (realImageUrl) {
    // 打开大图并截图
    console.log('📥 打开大图...');
    await page.goto(realImageUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: 'liuyifei-real-hd.png' });
    console.log('✅ 已保存：liuyifei-real-hd.png');
  }
  
  await browser.close();
})();
