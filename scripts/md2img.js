const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function mdToImage(mdPath, outputPath) {
  const mdContent = fs.readFileSync(mdPath, 'utf-8');
  
  // Convert markdown to simple HTML
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Noto Sans CJK SC', 'WenQuanYi Micro Hei', 'Microsoft YaHei', sans-serif;
      padding: 40px;
      max-width: 800px;
      background: white;
      color: #333;
      line-height: 1.6;
    }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    h3 { color: #7f8c8d; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: #3498db; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    pre { background: #2d3436; color: #dfe6e9; padding: 20px; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #3498db; margin: 20px 0; padding-left: 20px; color: #7f8c8d; }
    hr { border: none; border-top: 2px solid #ecf0f1; margin: 30px 0; }
    strong { color: #2c3e50; }
    .emoji { font-size: 1.2em; }
  </style>
</head>
<body>
${markdownToHtml(mdContent)}
</body>
</html>
`;

  // Simple markdown to HTML conversion
  function markdownToHtml(md) {
    return md
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*)$/gm, '<li>$1</li>')
      .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^```(\w*)\n([\s\S]*?)```$/gm, '<pre>$2</pre>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\|([^|]+)\|/g, (match) => {
        const cells = match.split('|').filter(c => c.trim());
        if (cells.length > 1) {
          return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
        }
        return match;
      })
      .replace(/---/g, '<hr>');
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'load' });
  
  // Get content height
  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewportWidth = 900;
  
  await page.setViewport({ width: viewportWidth, height: Math.min(bodyHeight + 80, 3000) });
  
  await page.screenshot({
    path: outputPath,
    fullPage: true,
    type: 'png'
  });
  
  await browser.close();
  
  console.log(`Image saved to: ${outputPath}`);
}

const mdPath = process.argv[2];
const outputPath = process.argv[3] || mdPath.replace('.md', '.png');

mdToImage(mdPath, outputPath).catch(console.error);