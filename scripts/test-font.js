const puppeteer = require('puppeteer');

async function testFont() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 检查可用字体
  const fonts = await page.evaluate(() => {
    return document.fonts.check('16px Noto Sans CJK SC') + ' ' +
           document.fonts.check('16px WenQuanYi Micro Hei') + ' ' +
           document.fonts.check('16px sans-serif');
  });

  console.log('Font check:', fonts);

  // 测试截图
  await page.setContent(`
    <html>
    <head>
      <style>
        body {
          font-family: 'Noto Sans CJK SC', 'WenQuanYi Micro Hei', sans-serif;
          padding: 20px;
        }
        h1 { color: blue; }
      </style>
    </head>
    <body>
      <h1>测试中文显示</h1>
      <p>这是中文字体测试：你好世界！</p>
      <p>公众号大神：量子位、机器之心</p>
    </body>
    </html>
  `);

  await page.setViewport({ width: 400, height: 200 });
  await page.screenshot({ path: 'reports/test-font.png' });

  await browser.close();
  console.log('Test image saved: reports/test-font.png');
}

testFont();