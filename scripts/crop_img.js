const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function mdToSlides(mdPath, outputDir) {
  const mdContent = fs.readFileSync(mdPath, 'utf-8');
  
  // Split by sections (## headers)
  const sections = mdContent.split(/^## /gm).filter(s => s.trim());
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let slideNum = 1;
  
  for (const section of sections) {
    const title = section.split('\n')[0].trim();
    const content = section;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      padding: 30px 40px;
      max-width: 850px;
      background: white;
      color: #333;
      line-height: 1.5;
    }
    h2 { 
      color: #3498db; 
      font-size: 22px;
      margin-bottom: 20px;
      border-bottom: 2px solid #3498db;
      padding-bottom: 8px;
    }
    h3 { color: #7f8c8d; font-size: 16px; margin-top: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; font-size: 14px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #3498db; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    code { background: #f4f4f4; padding: 2px 4px; border-radius: 2px; font-size: 13px; }
    pre { background: #2d3436; color: #dfe6e9; padding: 15px; border-radius: 6px; font-size: 13px; }
    blockquote { border-left: 3px solid #3498db; margin: 15px 0; padding-left: 15px; color: #7f8c8d; font-size: 13px; }
    strong { color: #2c3e50; }
    li { margin: 5px 0; }
    ul { margin-left: 20px; }
  </style>
</head>
<body>
<h2>${title}</h2>
${contentToHtml(content.replace(title, '').trim())}
</body>
</html>
`;

    function contentToHtml(text) {
      return text
        .replace(/^### (.*)$/gm, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^- (.*)$/gm, '<li>$1</li>')
        .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/```(\w*)\n([\s\S]*?)```$/gm, '<pre>$2</pre>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
    }

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    const height = Math.min(Math.max(bodyHeight + 60, 400), 800);
    
    await page.setViewport({ width: 900, height });
    
    const outputPath = path.join(outputDir, `slide-${slideNum}.png`);
    await page.screenshot({ path: outputPath, type: 'png' });
    
    console.log(`Slide ${slideNum}: ${title} (${height}px)`);
    slideNum++;
    
    await page.close();
  }
  
  await browser.close();
  console.log(`\nTotal: ${slideNum - 1} slides saved to ${outputDir}`);
}

const mdPath = process.argv[2];
const outputDir = process.argv[3] || 'reports/slides';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

mdToSlides(mdPath, outputDir).catch(console.error);