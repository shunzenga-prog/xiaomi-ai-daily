const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Parse JSON bodies
app.use(express.json());

// Serve static files with no-cache
const reportsDir = path.join(__dirname, '..', '..', 'reports');
app.use('/reports', express.static(reportsDir, {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

// Serve public folder for static pages
const publicDir = path.join(__dirname, 'public');
app.use('/static', express.static(publicDir));

// API: Get markdown content
app.get('/api/file/:name', (req, res) => {
  try {
    const filePath = path.join(reportsDir, req.params.name);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    res.type('text/plain').send(content);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.get('/api/files', (req, res) => {
  try {
    const files = fs.readdirSync(reportsDir)
      .filter(f => f.endsWith('.md'))
      .sort();
    res.json(files);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: Export markdown to image
app.post('/api/export-image', async (req, res) => {
  const { markdown, filename } = req.body;
  
  if (!markdown) {
    return res.status(400).json({ error: 'No markdown provided' });
  }
  
  try {
    const puppeteer = require('puppeteer');
    
    // Convert markdown to HTML
    const html = markdownToHtml(markdown);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 300));
    
    const height = await page.evaluate(() => document.body.scrollHeight);
    await page.setViewport({ width: 900, height: Math.min(height + 80, 5000) });
    
    const outputPath = path.join(reportsDir, `${filename}.png`);
    await page.screenshot({ path: outputPath, fullPage: true });
    await browser.close();
    
    res.json({ 
      success: true, 
      path: outputPath,
      url: `/reports/${filename}.png`
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function markdownToHtml(md) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Noto Sans CJK SC', 'WenQuanYi Micro Hei', sans-serif;
      padding: 40px;
      max-width: 820px;
      background: white;
      color: #333;
      line-height: 1.8;
    }
    h1 { color: #2c3e50; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; padding-left: 15px; border-left: 4px solid #3498db; }
    h3 { color: #7f8c8d; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: #667eea; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    pre { background: #2d3436; color: #dfe6e9; padding: 20px; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #667eea; margin: 20px 0; padding-left: 20px; color: #666; }
    hr { border: none; border-top: 2px solid #eee; margin: 30px 0; }
    strong { color: #2c3e50; }
    a { color: #667eea; }
  </style>
</head>
<body>
${simpleMdToHtml(md)}
</body>
</html>`;
}

function simpleMdToHtml(md) {
  return md
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^```(\w*)\n([\s\S]*?)```$/gm, '<pre>$2</pre>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/---/g, '<hr>');
}

// Main page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>🐱 小咪的报告中心</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    h1 { color: #333; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .section h2 { color: #3498db; margin-top: 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
    .card { background: #f9f9f9; padding: 15px; border-radius: 8px; text-align: center; }
    .card img { max-width: 100%; height: auto; border-radius: 8px; cursor: pointer; }
    .card:hover { background: #e9e9e9; }
    .btn { background: #3498db; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin: 5px; }
    .btn:hover { background: #2980b9; }
    .btn-purple { background: #9b59b6; }
    .btn-purple:hover { background: #8e44ad; }
    .emoji { font-size: 30px; }
    a { color: #3498db; }
    a:hover { color: #2980b9; }
  </style>
</head>
<body>
  <h1>🐱 小咪的报告中心</h1>
  <p>生成时间: 2026-03-28 | 欢迎 boss 查看!</p>
  
  <div class="section" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
    <h2 style="color: white;">📝 Markdown 渲染器（新功能！）</h2>
    <p>漂亮的实时预览，支持导出图片</p>
    <a class="btn btn-purple" href="/static/markdown.html" style="font-size: 18px;">🎨 打开 Markdown 渲染器</a>
  </div>
  
  <div class="section">
    <h2>📚 学习报告 - 向大神学习写作技巧</h2>
    <p>研究公众号和小红书领域大神，学习写作技巧与变现方法</p>
    <a class="btn" href="/reports/slides/slide-1.png">查看幻灯片版</a>
    <a class="btn" href="/reports/learning-report.png">查看完整长图</a>
    <a class="btn btn-purple" href="/static/markdown.html?file=learning-from-experts-2026-03-28.md">查看 Markdown</a>
    
    <div class="grid">
      <div class="card"><img src="/reports/slides/slide-2.png" onclick="window.open(this.src)"><p>公众号大神</p></div>
      <div class="card"><img src="/reports/slides/slide-3.png" onclick="window.open(this.src)"><p>小红书博主</p></div>
      <div class="card"><img src="/reports/slides/slide-4.png" onclick="window.open(this.src)"><p>变现案例</p></div>
      <div class="card"><img src="/reports/slides/slide-5.png" onclick="window.open(this.src)"><p>写作模板</p></div>
    </div>
  </div>
  
  <div class="section">
    <h2>💰 33个用OpenClaw赚钱的方法</h2>
    <p>真实案例，非虚构 - 每个案例都有30分钟设置步骤</p>
    <a class="btn" href="/reports/33-ways.png">查看完整图</a>
    <a class="btn btn-purple" href="/static/markdown.html?file=33-ways-openclaw-money-full.md">查看 Markdown</a>
  </div>
  
  <div class="section">
    <h2>📊 其他报告</h2>
    <a class="btn btn-purple" href="/static/markdown.html?file=AI资讯平台清单.md">AI资讯平台清单</a>
    <a class="btn btn-purple" href="/static/markdown.html?file=OpenClaw 深度研究报告.md">OpenClaw深度研究</a>
    <a class="btn btn-purple" href="/static/markdown.html?file=GitHub AI 项目分析报告.md">GitHub AI项目分析</a>
  </div>
  
  <div class="section">
    <h2>📂 文件目录</h2>
    <a class="btn" href="/reports/slides/">幻灯片目录 (16张)</a>
    <a class="btn" href="/reports/">全部报告目录</a>
  </div>
  
  <hr>
  <p style="text-align:center; color:#999;">小咪 🐱 | OpenClaw | 2026</p>
</body>
</html>
`);
});

app.listen(PORT, () => {
  console.log(`
  🐱 小咪的报告中心已启动!
  
  浏览器访问: http://localhost:${PORT}
  
  可用路径:
  - http://localhost:${PORT}/static/markdown.html  (Markdown渲染器)
  - http://localhost:${PORT}/reports/slides/       (幻灯片)
  - http://localhost:${PORT}/reports/              (全部文件)
  `);
});