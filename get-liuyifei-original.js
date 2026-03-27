// 🐱 小咪找刘亦菲真正的原图

const { firefox } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('🐱 寻找真正的原图...');
  
  const browser = await firefox.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // 打开图片详情页
  console.log('🔍 打开图片详情...');
  await page.goto('https://cn.bing.com/images/search?q=%E5%88%98%E4%BA%A6%E8%8F%B2&id=1234567890&FORM=IQFRBA', {
    waitUntil: 'networkidle', timeout: 30000
  });
  await page.waitForTimeout(5000);
  
  // 找"查看原图"按钮
  const originalUrl = await page.evaluate(() => {
    // 尝试找原图链接
    const links = Array.from(document.querySelectorAll('a')).filter(a => 
      a.textContent.includes('原图') || a.textContent.includes('查看')
    );
    if (links[0]) return links[0].href;
    
    // 或者找 img 的 data-src
    const img = document.querySelector('img[data-src]');
    if (img) return img.getAttribute('data-src');
    
    return null;
  });
  
  console.log('🖼️ 原图链接:', originalUrl);
  
  if (originalUrl) {
    // 截图保存当前页面（包含大图）
    await page.screenshot({ path: 'liuyifei-original-page.png', fullPage: true });
    console.log('✅ 页面截图已保存');
  }
  
  await browser.close();
})();
