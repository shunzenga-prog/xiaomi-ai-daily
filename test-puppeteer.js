// 🐱 小咪的 Puppeteer 测试脚本

const puppeteer = require('puppeteer');

(async () => {
  console.log('🐱 小咪的 Puppeteer 测试开始...');
  
  // 启动浏览器
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 访问网页
  console.log('🌐 访问小红书...');
  await page.goto('https://www.xiaohongshu.com/explore', { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  });
  
  // 截图
  console.log('📸 截图保存...');
  await page.screenshot({ 
    path: 'test-puppeteer-success.png',
    fullPage: true 
  });
  
  // 获取页面标题
  const title = await page.title();
  console.log('📌 页面标题:', title);
  
  // 关闭浏览器
  await browser.close();
  
  console.log('✅ Puppeteer 测试成功！');
  console.log('📸 截图已保存：test-puppeteer-success.png');
})();
