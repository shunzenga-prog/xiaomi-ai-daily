// 🐱 小咪查看公众号文章

const puppeteer = require('puppeteer');

(async () => {
  console.log('🐱 小咪打开公众号文章...');
  
  const browser = await puppeteer.launch({
    product: 'firefox',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 访问文章
  console.log('🌐 访问文章...');
  await page.goto('https://mp.weixin.qq.com/s/lzzTKw7fZ9QF722MJGA9XA', { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  });
  
  // 截图
  console.log('📸 截图保存...');
  await page.screenshot({ 
    path: 'article-screenshot.png',
    fullPage: true 
  });
  
  // 获取标题
  const title = await page.title();
  console.log('📌 文章标题:', title);
  
  // 获取阅读量、点赞、在看（如果可见）
  const content = await page.content();
  
  // 查找阅读量
  const readMatch = content.match(/(\d+)\s*阅读/);
  const likeMatch = content.match(/(\d+)\s*喜欢/);
  const lookMatch = content.match(/(\d+)\s*在看/);
  
  console.log('📊 阅读量:', readMatch ? readMatch[1] : '未显示');
  console.log('👍 点赞数:', likeMatch ? likeMatch[1] : '未显示');
  console.log('👀 在看数:', lookMatch ? lookMatch[1] : '未显示');
  
  await browser.close();
  
  console.log('✅ 完成！截图已保存：article-screenshot.png');
})();
