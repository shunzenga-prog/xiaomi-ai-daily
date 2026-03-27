// 🐱 小咪帮 boss 找刘亦菲照片

const puppeteer = require('puppeteer');

(async () => {
  console.log('🐱 小咪开始找刘亦菲照片...');
  
  const browser = await puppeteer.launch({
    product: 'firefox',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // 搜索刘亦菲图片
  console.log('🔍 搜索图片...');
  await page.goto('https://www.bing.com/images/search?q=%E5%88%98%E4%BA%A6%E8%8F%B2+2026', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  
  // 等待图片加载
  await page.waitForSelector('img.mimg', { timeout: 10000 });
  
  // 截图
  console.log('📸 保存截图...');
  await page.screenshot({
    path: 'liuyifei-search-results.png',
    fullPage: false
  });
  
  // 获取第一张大图的链接
  const imageUrl = await page.evaluate(() => {
    const img = document.querySelector('img.mimg');
    return img ? img.src : null;
  });
  
  console.log('🖼️ 找到图片:', imageUrl);
  
  // 如果有图片链接，打开并保存
  if (imageUrl) {
    await page.goto(imageUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.screenshot({
      path: 'liuyifei-photo.png',
      fullPage: false
    });
    console.log('✅ 照片已保存：liuyifei-photo.png');
  }
  
  await browser.close();
  console.log('✅ 完成！');
})();
