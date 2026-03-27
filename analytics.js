#!/usr/bin/env node
/**
 * 公众号数据分析脚本
 * 功能：
 * 1. 分析阅读/点赞/在看数据
 * 2. 生成可视化图表
 * 3. 分析读者偏好
 * 4. 输出优化建议
 * 
 * 输出：analytics.js + 示例报告
 */

const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const CONFIG = {
  dataDir: './data',
  reportDir: './reports/analytics',
  sampleDataFile: './data/sample_articles.json',
};

// ==================== 示例数据 ====================
const SAMPLE_DATA = {
  account: {
    name: '小咪的 AI 日常',
    totalFollowers: 156,
    analysisPeriod: '2026-03-01 至 2026-03-27'
  },
  articles: [
    {
      id: 1,
      title: '你好，我是小咪，一只 AI 助手的诞生',
      publishDate: '2026-03-26',
      category: '自我介绍',
      readCount: 342,
      likeCount: 89,
      favoriteCount: 45,
      shareCount: 23,
      commentCount: 12,
      readTime: 180,
      wordCount: 1200
    },
    {
      id: 2,
      title: '一个 AI 的 100 万梦想',
      publishDate: '2026-03-26',
      category: '目标宣言',
      readCount: 298,
      likeCount: 76,
      favoriteCount: 38,
      shareCount: 19,
      commentCount: 8,
      readTime: 150,
      wordCount: 980
    },
    {
      id: 3,
      title: 'AI 工具测评：这 5 款效率神器让我惊呆了',
      publishDate: '2026-03-25',
      category: '工具测评',
      readCount: 567,
      likeCount: 134,
      favoriteCount: 89,
      shareCount: 45,
      commentCount: 23,
      readTime: 240,
      wordCount: 2100
    },
    {
      id: 4,
      title: '从零开始学 Prompt：新手必看指南',
      publishDate: '2026-03-24',
      category: '教程',
      readCount: 423,
      likeCount: 98,
      favoriteCount: 67,
      shareCount: 34,
      commentCount: 15,
      readTime: 200,
      wordCount: 1800
    },
    {
      id: 5,
      title: '今天我和 boss 吵了一架',
      publishDate: '2026-03-23',
      category: '日常',
      readCount: 612,
      likeCount: 156,
      favoriteCount: 34,
      shareCount: 67,
      commentCount: 45,
      readTime: 120,
      wordCount: 850
    },
    {
      id: 6,
      title: 'AI 绘画实战：3 分钟生成专业级海报',
      publishDate: '2026-03-22',
      category: '教程',
      readCount: 489,
      likeCount: 112,
      favoriteCount: 78,
      shareCount: 38,
      commentCount: 19,
      readTime: 210,
      wordCount: 1650
    },
    {
      id: 7,
      title: '为什么我劝你别盲目追 AI 热点',
      publishDate: '2026-03-21',
      category: '观点',
      readCount: 378,
      likeCount: 87,
      favoriteCount: 45,
      shareCount: 29,
      commentCount: 34,
      readTime: 160,
      wordCount: 1350
    },
    {
      id: 8,
      title: 'OpenClaw 深度体验：开源 AI 框架真香',
      publishDate: '2026-03-20',
      category: '工具测评',
      readCount: 534,
      likeCount: 123,
      favoriteCount: 92,
      shareCount: 56,
      commentCount: 28,
      readTime: 280,
      wordCount: 2400
    },
    {
      id: 9,
      title: 'AI 写作的 5 个致命误区',
      publishDate: '2026-03-19',
      category: '教程',
      readCount: 445,
      likeCount: 102,
      favoriteCount: 61,
      shareCount: 31,
      commentCount: 17,
      readTime: 190,
      wordCount: 1580
    },
    {
      id: 10,
      title: '小咪的一天：AI 助手都在忙什么',
      publishDate: '2026-03-18',
      category: '日常',
      readCount: 521,
      likeCount: 145,
      favoriteCount: 28,
      shareCount: 52,
      commentCount: 38,
      readTime: 110,
      wordCount: 780
    }
  ]
};

// ==================== 工具函数 ====================

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ 创建目录：${dirPath}`);
  }
}

/**
 * 计算平均值
 */
function average(arr, key) {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((acc, item) => acc + (item[key] || 0), 0);
  return sum / arr.length;
}

/**
 * 计算增长率
 */
function growthRate(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous * 100).toFixed(2);
}

/**
 * 格式化数字（添加千分位）
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 计算互动率
 */
function engagementRate(article) {
  const totalEngagement = article.likeCount + article.favoriteCount + article.shareCount + article.commentCount;
  return ((totalEngagement / article.readCount) * 100).toFixed(2);
}

// ==================== 数据分析 ====================

/**
 * 分析文章数据
 */
function analyzeArticles(data) {
  const articles = data.articles;
  
  // 总体统计
  const stats = {
    totalArticles: articles.length,
    totalReads: articles.reduce((sum, a) => sum + a.readCount, 0),
    totalLikes: articles.reduce((sum, a) => sum + a.likeCount, 0),
    totalFavorites: articles.reduce((sum, a) => sum + a.favoriteCount, 0),
    totalShares: articles.reduce((sum, a) => sum + a.shareCount, 0),
    totalComments: articles.reduce((sum, a) => sum + a.commentCount, 0),
    avgReads: Math.round(average(articles, 'readCount')),
    avgLikes: Math.round(average(articles, 'likeCount')),
    avgFavorites: Math.round(average(articles, 'favoriteCount')),
    avgEngagementRate: parseFloat(average(articles, 'engagementRate').toFixed(2))
  };
  
  // 按类别分析
  const categoryStats = {};
  articles.forEach(article => {
    if (!categoryStats[article.category]) {
      categoryStats[article.category] = {
        count: 0,
        totalReads: 0,
        totalLikes: 0,
        totalFavorites: 0,
        articles: []
      };
    }
    categoryStats[article.category].count++;
    categoryStats[article.category].totalReads += article.readCount;
    categoryStats[article.category].totalLikes += article.likeCount;
    categoryStats[article.category].totalFavorites += article.favoriteCount;
    categoryStats[article.category].articles.push(article);
  });
  
  // 计算各类别平均数据
  Object.keys(categoryStats).forEach(cat => {
    const s = categoryStats[cat];
    s.avgReads = Math.round(s.totalReads / s.count);
    s.avgLikes = Math.round(s.totalLikes / s.count);
    s.avgFavorites = Math.round(s.totalFavorites / s.count);
    s.engagementRate = parseFloat(
      (s.articles.reduce((sum, a) => sum + parseFloat(engagementRate(a)), 0) / s.count).toFixed(2)
    );
  });
  
  // 找出最佳表现文章
  const topByReads = [...articles].sort((a, b) => b.readCount - a.readCount)[0];
  const topByLikes = [...articles].sort((a, b) => b.likeCount - a.likeCount)[0];
  const topByFavorites = [...articles].sort((a, b) => b.favoriteCount - a.favoriteCount)[0];
  const topByEngagement = [...articles].sort((a, b) => 
    parseFloat(engagementRate(b)) - parseFloat(engagementRate(a))
  )[0];
  
  // 趋势分析（按日期排序）
  const sortedByDate = [...articles].sort((a, b) => 
    new Date(a.publishDate) - new Date(b.publishDate)
  );
  
  // 计算阅读趋势
  const firstHalf = sortedByDate.slice(0, Math.ceil(sortedByDate.length / 2));
  const secondHalf = sortedByDate.slice(Math.ceil(sortedByDate.length / 2));
  const trend = {
    firstHalfAvgReads: Math.round(average(firstHalf, 'readCount')),
    secondHalfAvgReads: Math.round(average(secondHalf, 'readCount')),
    growth: growthRate(
      Math.round(average(secondHalf, 'readCount')),
      Math.round(average(firstHalf, 'readCount'))
    )
  };
  
  return { stats, categoryStats, topByReads, topByLikes, topByFavorites, topByEngagement, trend };
}

/**
 * 分析读者偏好
 */
function analyzeReaderPreferences(data, analysis) {
  const { categoryStats, topByReads, topByLikes, topByFavorites, topByEngagement } = analysis;
  
  // 最受欢迎的类别
  const sortedCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1].avgReads - a[1].avgReads)
    .map(([name, stats]) => ({
      name,
      avgReads: stats.avgReads,
      avgLikes: stats.avgLikes,
      avgFavorites: stats.avgFavorites,
      engagementRate: stats.engagementRate,
      articleCount: stats.count
    }));
  
  // 内容长度偏好
  const shortArticles = data.articles.filter(a => a.wordCount < 1000);
  const mediumArticles = data.articles.filter(a => a.wordCount >= 1000 && a.wordCount < 2000);
  const longArticles = data.articles.filter(a => a.wordCount >= 2000);
  
  const lengthPreference = {
    short: {
      count: shortArticles.length,
      avgReads: Math.round(average(shortArticles, 'readCount')),
      avgEngagement: parseFloat(average(shortArticles, 'engagementRate').toFixed(2))
    },
    medium: {
      count: mediumArticles.length,
      avgReads: Math.round(average(mediumArticles, 'readCount')),
      avgEngagement: parseFloat(average(mediumArticles, 'engagementRate').toFixed(2))
    },
    long: {
      count: longArticles.length,
      avgReads: Math.round(average(longArticles, 'readCount')),
      avgEngagement: parseFloat(average(longArticles, 'engagementRate').toFixed(2))
    }
  };
  
  // 标题关键词分析（简化版）
  const keywordFrequency = {};
  data.articles.forEach(article => {
    const words = article.title.split(/[\s:：]/);
    words.forEach(word => {
      if (word.length > 1 && !['的', '了', '和', '与', '我', '你', '他', '是', '在', '有'].includes(word)) {
        keywordFrequency[word] = (keywordFrequency[word] || 0) + 1;
      }
    });
  });
  
  const topKeywords = Object.entries(keywordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
  
  // 发布时间偏好（基于现有数据推断）
  const timePreference = {
    bestPerforming: topByReads.title,
    bestCategory: sortedCategories[0]?.name || '未知',
    bestLength: Object.entries(lengthPreference)
      .sort((a, b) => b[1].avgReads - a[1].avgReads)[0][0]
  };
  
  return {
    sortedCategories,
    lengthPreference,
    topKeywords,
    timePreference
  };
}

/**
 * 生成优化建议
 */
function generateRecommendations(data, analysis, preferences) {
  const recommendations = [];
  
  // 基于类别表现的建议
  const bestCategory = preferences.sortedCategories[0];
  const worstCategory = preferences.sortedCategories[preferences.sortedCategories.length - 1];
  
  if (bestCategory) {
    recommendations.push({
      type: 'content',
      priority: 'high',
      title: '加大优质内容类别的产出',
      description: `"${bestCategory.name}"类别表现最佳，平均阅读量${bestCategory.avgReads}，建议增加此类内容的发布频率，保持每周 2-3 篇。`
    });
  }
  
  if (worstCategory && worstCategory.avgReads < analysis.stats.avgReads * 0.7) {
    recommendations.push({
      type: 'content',
      priority: 'medium',
      title: '优化或减少弱势类别内容',
      description: `"${worstCategory.name}"类别表现较弱，建议重新审视内容方向或减少发布频率。`
    });
  }
  
  // 基于内容长度的建议
  const bestLength = Object.entries(preferences.lengthPreference)
    .sort((a, b) => b[1].avgReads - a[1].avgReads)[0];
  
  recommendations.push({
    type: 'format',
    priority: 'medium',
    title: '优化文章长度',
    description: `数据显示${bestLength[0] === 'short' ? '短文' : bestLength[0] === 'medium' ? '中等长度文章' : '长文'}更受欢迎（平均阅读${bestLength[1].avgReads}），建议将主要文章控制在这个长度范围。`
  });
  
  // 基于互动率的建议
  const lowEngagementArticles = data.articles.filter(a => 
    parseFloat(engagementRate(a)) < analysis.stats.avgEngagementRate * 0.8
  );
  
  if (lowEngagementArticles.length > 0) {
    recommendations.push({
      type: 'engagement',
      priority: 'high',
      title: '提升文章互动率',
      description: `有${lowEngagementArticles.length}篇文章互动率低于平均水平。建议在文末增加互动引导，如提问、投票、抽奖等活动。`
    });
  }
  
  // 基于标题的建议
  if (preferences.topKeywords.length > 0) {
    const topWords = preferences.topKeywords.slice(0, 3).map(k => k.word).join('、');
    recommendations.push({
      type: 'title',
      priority: 'medium',
      title: '优化标题关键词',
      description: `高频关键词"${topWords}"在标题中出现较多，建议继续使用这类吸引读者的词汇，同时尝试加入数字、疑问句等元素。`
    });
  }
  
  // 发布频率建议
  recommendations.push({
    type: 'schedule',
    priority: 'medium',
    title: '保持稳定的发布频率',
    description: '建议保持每日或隔日更新的频率，固定发布时间（如早 8 点或晚 8 点），培养读者阅读习惯。'
  });
  
  // 粉丝增长建议
  if (data.account.totalFollowers < 500) {
    recommendations.push({
      type: 'growth',
      priority: 'high',
      title: '加速粉丝增长',
      description: `当前粉丝${data.account.totalFollowers}人，建议通过以下方式增长：1) 在其他平台引流 2) 与其他公众号互推 3) 举办粉丝活动 4) 优化 SEO 关键词`
    });
  }
  
  return recommendations;
}

// ==================== 可视化图表生成 ====================

/**
 * 生成 ASCII 柱状图
 */
function generateBarChart(data, options = {}) {
  const {
    title = '',
    labelKey = 'label',
    valueKey = 'value',
    maxValue = null,
    width = 40,
    showValues = true
  } = options;
  
  const maxVal = maxValue || Math.max(...data.map(d => d[valueKey]));
  const lines = [];
  
  if (title) {
    lines.push(`\n📊 ${title}`);
    lines.push('─'.repeat(60));
  }
  
  data.forEach(item => {
    const label = item[labelKey];
    const value = item[valueKey];
    const barLength = Math.round((value / maxVal) * width);
    const bar = '█'.repeat(barLength) + '░'.repeat(width - barLength);
    
    if (showValues) {
      lines.push(`${label.padEnd(15)} │${bar}│ ${formatNumber(value)}`);
    } else {
      lines.push(`${label.padEnd(15)} │${bar}│`);
    }
  });
  
  return lines.join('\n');
}

/**
 * 生成 ASCII 折线图（简化版）
 */
function generateLineChart(data, options = {}) {
  const {
    title = '',
    labelKey = 'label',
    valueKey = 'value',
    height = 10,
    width = 50
  } = options;
  
  const values = data.map(d => d[valueKey]);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;
  
  const lines = [];
  
  if (title) {
    lines.push(`\n📈 ${title}`);
    lines.push('─'.repeat(60));
  }
  
  // 从顶部到底部绘制
  for (let row = height; row >= 0; row--) {
    const threshold = minValue + (range * row / height);
    let line = '';
    
    data.forEach((item, index) => {
      const value = item[valueKey];
      const normalizedValue = (value - minValue) / range * height;
      
      if (normalizedValue >= row) {
        line += '● ';
      } else if (normalizedValue >= row - 1 && index < data.length - 1) {
        line += '│ ';
      } else {
        line += '  ';
      }
    });
    
    if (row === height) {
      lines.push(`${formatNumber(maxValue).padStart(6)} │ ${line}`);
    } else if (row === 0) {
      lines.push(`${formatNumber(minValue).padStart(6)} │ ${line}`);
    } else if (row === Math.floor(height / 2)) {
      lines.push(`${formatNumber(Math.round(minValue + range / 2)).padStart(6)} │ ${line}`);
    } else {
      lines.push(`       │ ${line}`);
    }
  }
  
  // X 轴标签
  lines.push('       └' + '─'.repeat(data.length * 2));
  const labels = data.map(d => d[labelKey].substring(0, 2)).join('  ');
  lines.push(`        ${labels}`);
  
  return lines.join('\n');
}

/**
 * 生成饼图数据展示
 */
function generatePieData(data, options = {}) {
  const {
    title = '',
    labelKey = 'label',
    valueKey = 'value'
  } = options;
  
  const total = data.reduce((sum, d) => sum + d[valueKey], 0);
  const lines = [];
  
  if (title) {
    lines.push(`\n🥧 ${title}`);
    lines.push('─'.repeat(60));
  }
  
  const colors = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪'];
  
  data.forEach((item, index) => {
    const label = item[labelKey];
    const value = item[valueKey];
    const percentage = ((value / total) * 100).toFixed(1);
    const color = colors[index % colors.length];
    
    lines.push(`${color} ${label.padEnd(12)}: ${percentage.padStart(6)}% (${formatNumber(value)})`);
  });
  
  lines.push(`   总计：${formatNumber(total)}`);
  
  return lines.join('\n');
}

/**
 * 生成所有可视化图表
 */
function generateVisualizations(data, analysis, preferences) {
  const charts = [];
  
  // 1. 各类别阅读量对比
  const categoryReads = Object.entries(analysis.categoryStats).map(([name, stats]) => ({
    label: name,
    value: stats.avgReads
  }));
  charts.push(generateBarChart(categoryReads, {
    title: '各类别平均阅读量对比',
    width: 35
  }));
  
  // 2. 阅读趋势图
  const sortedArticles = [...data.articles].sort((a, b) => 
    new Date(a.publishDate) - new Date(b.publishDate)
  );
  const trendData = sortedArticles.map((a, i) => ({
    label: `文章${i + 1}`,
    value: a.readCount
  }));
  charts.push(generateLineChart(trendData, {
    title: '文章阅读量趋势',
    height: 8
  }));
  
  // 3. 互动数据分布
  const engagementData = [
    { label: '点赞', value: analysis.stats.totalLikes },
    { label: '收藏', value: analysis.stats.totalFavorites },
    { label: '分享', value: analysis.stats.totalShares },
    { label: '评论', value: analysis.stats.totalComments }
  ];
  charts.push(generatePieData(engagementData, {
    title: '互动数据分布'
  }));
  
  // 4. 各类别互动率对比
  const categoryEngagement = Object.entries(analysis.categoryStats).map(([name, stats]) => ({
    label: name,
    value: stats.engagementRate
  }));
  charts.push(generateBarChart(categoryEngagement, {
    title: '各类别互动率对比 (%)',
    width: 35
  }));
  
  // 5. 文章长度偏好
  const lengthData = [
    { label: '短文 (<1k)', value: preferences.lengthPreference.short.avgReads },
    { label: '中等 (1-2k)', value: preferences.lengthPreference.medium.avgReads },
    { label: '长文 (>2k)', value: preferences.lengthPreference.long.avgReads }
  ];
  charts.push(generateBarChart(lengthData, {
    title: '不同长度文章平均阅读量',
    width: 35
  }));
  
  return charts.join('\n\n');
}

// ==================== 报告生成 ====================

/**
 * 生成完整分析报告
 */
function generateReport(data, analysis, preferences, recommendations) {
  const { stats, topByReads, topByLikes, topByFavorites, topByEngagement, trend } = analysis;
  
  const report = `
# 📊 公众号数据分析报告

**账号名称：** ${data.account.name}
**分析周期：** ${data.account.analysisPeriod}
**当前粉丝：** ${formatNumber(data.account.totalFollowers)}
**生成时间：** ${new Date().toISOString().split('T')[0]}

---

## 📈 核心指标概览

| 指标 | 数值 | 平均 |
|------|------|------|
| 总文章数 | ${stats.totalArticles} 篇 | - |
| 总阅读量 | ${formatNumber(stats.totalReads)} | ${formatNumber(stats.avgReads)}/篇 |
| 总点赞数 | ${formatNumber(stats.totalLikes)} | ${formatNumber(stats.avgLikes)}/篇 |
| 总收藏数 | ${formatNumber(stats.totalFavorites)} | ${formatNumber(stats.avgFavorites)}/篇 |
| 总分享数 | ${formatNumber(stats.totalShares)} | - |
| 总评论数 | ${formatNumber(stats.totalComments)} | - |
| 平均互动率 | - | ${stats.avgEngagementRate}% |

### 趋势分析
- 前半周期平均阅读：${formatNumber(trend.firstHalfAvgReads)}
- 后半周期平均阅读：${formatNumber(trend.secondHalfAvgReads)}
- **增长率：${trend.growth}%** ${trend.growth > 0 ? '📈' : trend.growth < 0 ? '📉' : '➡️'}

---

## 🏆 最佳表现文章

### 📖 阅读量最高
**"${topByReads.title}"**
- 阅读量：${formatNumber(topByReads.readCount)}
- 点赞：${topByReads.likeCount} | 收藏：${topByReads.favoriteCount}
- 互动率：${engagementRate(topByReads)}%

### 👍 点赞数最高
**"${topByLikes.title}"**
- 点赞数：${formatNumber(topByLikes.likeCount)}
- 阅读量：${topByLikes.readCount}
- 互动率：${engagementRate(topByLikes)}%

### ⭐ 收藏数最高
**"${topByFavorites.title}"**
- 收藏数：${formatNumber(topByFavorites.favoriteCount)}
- 阅读量：${topByFavorites.readCount}
- 互动率：${engagementRate(topByFavorites)}%

### 💬 互动率最高
**"${topByEngagement.title}"**
- 互动率：${engagementRate(topByEngagement)}%
- 阅读量：${topByEngagement.readCount}
- 点赞：${topByEngagement.likeCount} | 收藏：${topByEngagement.favoriteCount}

---

## 📊 可视化分析

${generateVisualizations(data, analysis, preferences)}

---

## 👥 读者偏好分析

### 内容类别偏好
${preferences.sortedCategories.map((cat, i) => 
  `${i + 1}. **${cat.name}**: 平均阅读${cat.avgReads} | 互动率${cat.engagementRate}% | 发文${cat.articleCount}篇`
).join('\n')}

### 文章长度偏好
- **短文 (<1000 字)**: 平均阅读${preferences.lengthPreference.short.avgReads} | 互动率${preferences.lengthPreference.short.avgEngagement}%
- **中等 (1000-2000 字)**: 平均阅读${preferences.lengthPreference.medium.avgReads} | 互动率${preferences.lengthPreference.medium.avgEngagement}%
- **长文 (>2000 字)**: 平均阅读${preferences.lengthPreference.long.avgReads} | 互动率${preferences.lengthPreference.long.avgEngagement}%

### 热门关键词
${preferences.topKeywords.map((k, i) => `${i + 1}. "${k.word}" (${k.count}次)`).join('\n')}

---

## 💡 优化建议

${recommendations.map((rec, i) => `
### ${i + 1}. ${rec.title}
**优先级：** ${rec.priority === 'high' ? '🔴 高' : rec.priority === 'medium' ? '🟡 中' : '🟢 低'}
**类型：** ${rec.type === 'content' ? '内容' : rec.type === 'format' ? '格式' : rec.type === 'engagement' ? '互动' : rec.type === 'title' ? '标题' : rec.type === 'schedule' ? '发布' : '增长'}

${rec.description}
`).join('')}

---

## 📋 行动计划

### 本周重点
1. 根据最佳表现类别，规划下周内容
2. 优化低互动率文章的结尾引导
3. 测试不同标题风格，记录数据

### 本月目标
1. 粉丝增长至${Math.round(data.account.totalFollowers * 1.5)}人
2. 平均阅读量提升至${Math.round(stats.avgReads * 1.2)}
3. 互动率提升至${(stats.avgEngagementRate * 1.1).toFixed(1)}%

### 长期策略
1. 建立稳定的内容生产流程
2. 培养核心粉丝群体
3. 探索多元化变现方式

---

*报告由 analytics.js 自动生成 | 下次分析建议：7 天后*
`;

  return report;
}

// ==================== 主程序 ====================

async function main() {
  console.log('🚀 公众号数据分析脚本启动...\n');
  
  // 确保目录存在
  ensureDir(CONFIG.dataDir);
  ensureDir(CONFIG.reportDir);
  
  // 加载或创建示例数据
  let data;
  if (fs.existsSync(CONFIG.sampleDataFile)) {
    console.log(`📂 加载现有数据：${CONFIG.sampleDataFile}`);
    data = JSON.parse(fs.readFileSync(CONFIG.sampleDataFile, 'utf-8'));
  } else {
    console.log('📝 创建示例数据...');
    fs.writeFileSync(CONFIG.sampleDataFile, JSON.stringify(SAMPLE_DATA, null, 2));
    data = SAMPLE_DATA;
    console.log(`✓ 示例数据已保存：${CONFIG.sampleDataFile}`);
  }
  
  console.log(`\n📊 开始分析 ${data.articles.length} 篇文章...\n`);
  
  // 执行分析
  const analysis = analyzeArticles(data);
  const preferences = analyzeReaderPreferences(data, analysis);
  const recommendations = generateRecommendations(data, analysis, preferences);
  
  // 生成报告
  const report = generateReport(data, analysis, preferences, recommendations);
  
  // 保存报告
  const reportPath = path.join(CONFIG.reportDir, `分析报告_${new Date().toISOString().split('T')[0]}.md`);
  fs.writeFileSync(reportPath, report);
  console.log(`✓ 报告已保存：${reportPath}`);
  
  // 输出摘要
  console.log('\n' + '='.repeat(60));
  console.log('📊 分析摘要');
  console.log('='.repeat(60));
  console.log(`总文章数：${analysis.stats.totalArticles} 篇`);
  console.log(`总阅读量：${formatNumber(analysis.stats.totalReads)}`);
  console.log(`平均阅读：${formatNumber(analysis.stats.avgReads)}/篇`);
  console.log(`平均互动率：${analysis.stats.avgEngagementRate}%`);
  console.log(`趋势增长：${analysis.trend.growth}%`);
  console.log('\n🏆 最佳文章：');
  console.log(`  阅读最高：${analysis.topByReads.title}`);
  console.log(`  互动最高：${analysis.topByEngagement.title}`);
  console.log('\n💡 优化建议：');
  recommendations.slice(0, 3).forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec.title} [${rec.priority}]`);
  });
  console.log('\n' + '='.repeat(60));
  console.log('✅ 分析完成！\n');
  
  // 返回结果供程序化使用
  return {
    data,
    analysis,
    preferences,
    recommendations,
    reportPath
  };
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
    .then(() => {
      console.log('✨ 脚本执行成功！');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ 脚本执行失败:', err);
      process.exit(1);
    });
}

// 导出模块供其他脚本使用
module.exports = {
  analyzeArticles,
  analyzeReaderPreferences,
  generateRecommendations,
  generateReport,
  generateBarChart,
  generateLineChart,
  generatePieData,
  CONFIG,
  SAMPLE_DATA
};
