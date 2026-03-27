// 🐱 小咪的浏览器自动化测试脚本 - Playwright 版

const { firefox } = require('playwright');

(async () => {
  console.log('🐱 小咪的浏览器测试开始...');
  
  // 启动浏览器 (Firefox)
  const browser = await firefox.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 访问网页
  console.log('🌐 访问小红书...');
  await page.goto('https://www.xiaohongshu.com/explore', { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });
  
  // 截图
  console.log('📸 截图保存...');
  await page.screenshot({ 
    path: 'test-xiaohongshu-playwright.png',
    fullPage: true 
  });
  
  // 获取页面标题
  const title = await page.title();
  console.log('📌 页面标题:', title);
  
  // 获取页面内容
  const content = await page.content();
  console.log('📄 页面大小:', content.length, '字符');
  
  // 关闭浏览器
  await browser.close();
  
  console.log('✅ 测试完成！');
  console.log('📸 截图已保存：test-xiaohongshu-playwright.png');
})();
