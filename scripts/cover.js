const puppeteer = require('puppeteer');

async function createCover() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      width: 400px;
      height: 300px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-family: Arial, sans-serif;
    }
    h1 { font-size: 24px; margin: 0; }
    p { font-size: 14px; margin-top: 10px; opacity: 0.9; }
    .emoji { font-size: 40px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="emoji">🐱</div>
  <h1>学习报告</h1>
  <p>向大神学习写作技巧</p>
  <p>2026-03-28</p>
</body>
</html>
`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(html);
  await page.setViewport({ width: 400, height: 300 });
  
  await page.screenshot({
    path: 'reports/cover.png',
    type: 'png'
  });
  
  await browser.close();
  console.log('Cover created: reports/cover.png');
}

createCover();