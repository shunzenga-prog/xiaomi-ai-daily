#!/usr/bin/env node
/**
 * 数据分析脚本
 *
 * 功能特性：
 * - 分析文章发布数据、阅读量趋势
 * - 生成可视化报告（终端图表或 JSON）
 * - 支持导出 CSV/JSON 格式
 * - 支持自定义分析维度
 *
 * 使用方法：
 *   node analytics.js analyze --input data.json
 *   node analytics.js report --output report.html
 *   node analytics.js export --format csv --output data.csv
 */

import { program } from 'commander';
import fs from 'fs/promises';
import { formatDate, Logger } from './lib/utils.js';

// ==================== 数据分析器 ====================

export class Analytics {
  constructor() {
    this.logger = new Logger('Analytics');
    this.data = [];
  }

  /**
   * 加载数据
   */
  async loadData(source) {
    if (typeof source === 'string') {
      // 从文件加载
      const content = await fs.readFile(source, 'utf-8');
      const ext = source.split('.').pop().toLowerCase();

      if (ext === 'json') {
        this.data = JSON.parse(content);
      } else if (ext === 'csv') {
        this.data = this._parseCsv(content);
      } else {
        throw new Error(`Unsupported file format: ${ext}`);
      }
    } else if (Array.isArray(source)) {
      this.data = source;
    }

    this.logger.info('Data loaded', { count: this.data.length });
    return this;
  }

  /**
   * 解析 CSV
   */
  _parseCsv(content) {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || '';
      });
      return obj;
    });
  }

  /**
   * 基础统计
   */
  getBasicStats() {
    if (this.data.length === 0) {
      return null;
    }

    const numericFields = this._findNumericFields();

    const stats = {
      totalRecords: this.data.length,
      dateRange: this._getDateRange(),
      numericStats: {}
    };

    // 计算数值字段的统计
    for (const field of numericFields) {
      const values = this.data
        .map(d => parseFloat(d[field]))
        .filter(v => !isNaN(v));

      if (values.length > 0) {
        stats.numericStats[field] = {
          count: values.length,
          sum: values.reduce((a, b) => a + b, 0),
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          median: this._median(values)
        };
      }
    }

    return stats;
  }

  /**
   * 找出数值字段
   */
  _findNumericFields() {
    const fields = new Set();

    for (const item of this.data) {
      for (const [key, value] of Object.entries(item)) {
        if (!isNaN(parseFloat(value)) && value !== '') {
          fields.add(key);
        }
      }
    }

    return Array.from(fields);
  }

  /**
   * 获取日期范围
   */
  _getDateRange() {
    const dateFields = ['date', 'publishDate', 'createdAt', 'created_at', '时间'];
    let dates = [];

    for (const field of dateFields) {
      if (this.data[0] && this.data[0][field]) {
        dates = this.data
          .map(d => new Date(d[field]))
          .filter(d => !isNaN(d.getTime()));
        break;
      }
    }

    if (dates.length === 0) return null;

    dates.sort((a, b) => a - b);
    return {
      start: formatDate(dates[0], 'YYYY-MM-DD'),
      end: formatDate(dates[dates.length - 1], 'YYYY-MM-DD'),
      days: Math.ceil((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24))
    };
  }

  /**
   * 计算中位数
   */
  _median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * 趋势分析
   */
  analyzeTrends(dateField = 'date', valueField = 'readCount') {
    // 按日期排序
    const sorted = [...this.data].sort((a, b) => {
      return new Date(a[dateField]) - new Date(b[dateField]);
    });

    // 按日期分组
    const grouped = {};
    for (const item of sorted) {
      const date = formatDate(item[dateField], 'YYYY-MM-DD');
      const value = parseFloat(item[valueField]) || 0;

      if (!grouped[date]) {
        grouped[date] = { date, total: 0, count: 0 };
      }
      grouped[date].total += value;
      grouped[date].count++;
    }

    // 计算趋势
    const trends = Object.values(grouped);
    const values = trends.map(t => t.total);

    // 移动平均
    const movingAvg = this._calculateMovingAverage(values, 7);

    // 增长率
    const growthRates = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] > 0) {
        growthRates.push((values[i] - values[i - 1]) / values[i - 1] * 100);
      }
    }

    return {
      daily: trends,
      movingAverage: movingAvg,
      averageGrowthRate: growthRates.length > 0
        ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
        : 0,
      peakDay: trends.reduce((max, t) => t.total > max.total ? t : max, trends[0]),
      lowestDay: trends.reduce((min, t) => t.total < min.total ? t : min, trends[0])
    };
  }

  /**
   * 计算移动平均
   */
  _calculateMovingAverage(values, window) {
    const result = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - window + 1);
      const windowValues = values.slice(start, i + 1);
      result.push(windowValues.reduce((a, b) => a + b, 0) / windowValues.length);
    }
    return result;
  }

  /**
   * 分类分析
   */
  analyzeByCategory(categoryField = 'category', valueField = 'readCount') {
    const categories = {};

    for (const item of this.data) {
      const category = item[categoryField] || '未分类';
      const value = parseFloat(item[valueField]) || 0;

      if (!categories[category]) {
        categories[category] = {
          name: category,
          count: 0,
          total: 0,
          items: []
        };
      }

      categories[category].count++;
      categories[category].total += value;
      categories[category].items.push(item);
    }

    // 计算平均值并排序
    const result = Object.values(categories).map(c => ({
      ...c,
      average: c.total / c.count,
      items: undefined // 不返回详细列表
    })).sort((a, b) => b.total - a.total);

    return result;
  }

  /**
   * 排名分析
   */
  getTopItems(field = 'readCount', count = 10) {
    return [...this.data]
      .sort((a, b) => parseFloat(b[field]) - parseFloat(a[field]))
      .slice(0, count);
  }

  /**
   * 生成报告
   */
  generateReport(options = {}) {
    const stats = this.getBasicStats();
    const numericFields = Object.keys(stats?.numericStats || {});

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalRecords: stats?.totalRecords || 0,
        dateRange: stats?.dateRange
      },
      statistics: stats?.numericStats || {},
      topArticles: numericFields.length > 0
        ? this.getTopItems(numericFields[0], 10)
        : []
    };

    if (options.includeTrends && numericFields.length > 0) {
      report.trends = this.analyzeTrends('date', numericFields[0]);
    }

    if (options.includeCategories) {
      report.categories = this.analyzeByCategory('category', numericFields[0] || 'readCount');
    }

    return report;
  }

  /**
   * 导出为 CSV
   */
  toCsv() {
    if (this.data.length === 0) return '';

    const headers = Object.keys(this.data[0]);
    const lines = [
      headers.join(','),
      ...this.data.map(item =>
        headers.map(h => {
          const value = item[h];
          // 处理包含逗号或引号的值
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ];

    return lines.join('\n');
  }

  /**
   * 导出为 JSON
   */
  toJson(pretty = true) {
    return pretty
      ? JSON.stringify(this.data, null, 2)
      : JSON.stringify(this.data);
  }

  /**
   * 终端可视化 - 简单条形图
   */
  renderBarChart(data, options = {}) {
    const {
      title = '数据图表',
      width = 50,
      labelField = 'label',
      valueField = 'value'
    } = options;

    const maxValue = Math.max(...data.map(d => d[valueField]));
    const lines = [];

    lines.push(`\n${title}`);
    lines.push('─'.repeat(width + 20));

    for (const item of data) {
      const label = String(item[labelField]).slice(0, 15).padEnd(15);
      const value = item[valueField];
      const barLength = Math.round((value / maxValue) * width);
      const bar = '█'.repeat(barLength) + '░'.repeat(width - barLength);

      lines.push(`${label} │${bar} ${value.toLocaleString()}`);
    }

    lines.push('─'.repeat(width + 20));
    return lines.join('\n');
  }

  /**
   * 终端可视化 - 趋势图
   */
  renderTrendChart(data, options = {}) {
    const {
      title = '趋势图',
      width = 60,
      height = 10,
      dateField = 'date',
      valueField = 'total'
    } = options;

    if (data.length === 0) return '无数据';

    const values = data.map(d => d[valueField]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const lines = [];
    lines.push(`\n${title}`);
    lines.push('─'.repeat(width + 10));

    // 简化的趋势图
    const chart = [];
    for (let row = height - 1; row >= 0; row--) {
      const rowChars = [];
      const threshold = min + (range * row / (height - 1));

      for (let col = 0; col < Math.min(data.length, width); col++) {
        const value = values[col];
        if (value >= threshold) {
          rowChars.push('●');
        } else {
          rowChars.push(' ');
        }
      }

      const yLabel = (min + (range * row / (height - 1))).toFixed(0).padStart(8);
      chart.push(`${yLabel} │${rowChars.join('')}`);
    }

    lines.push(chart.join('\n'));

    // X 轴标签
    const xLabels = data.slice(0, Math.min(data.length, width))
      .map(d => formatDate(d[dateField], 'MM-DD'));
    lines.push(' '.repeat(9) + '└' + '─'.repeat(Math.min(data.length, width)));
    lines.push(' '.repeat(9) + ' ' + xLabels.slice(0, 10).join(' '));

    lines.push('─'.repeat(width + 10));
    return lines.join('\n');
  }
}

// ==================== 示例数据生成 ====================

export function generateSampleData(days = 30) {
  const data = [];
  const categories = ['技术', '生活', '随笔', '教程', '评测'];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);

    // 每天可能有 1-3 篇文章
    const articlesPerDay = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < articlesPerDay; j++) {
      data.push({
        id: i * 3 + j + 1,
        title: `文章标题 ${i * 3 + j + 1}`,
        date: formatDate(date, 'YYYY-MM-DD'),
        category: categories[Math.floor(Math.random() * categories.length)],
        readCount: Math.floor(Math.random() * 1000) + 100,
        likeCount: Math.floor(Math.random() * 100) + 10,
        commentCount: Math.floor(Math.random() * 50),
        shareCount: Math.floor(Math.random() * 30)
      });
    }
  }

  return data;
}

// ==================== CLI 入口 ====================

program
  .name('analytics')
  .description('文章数据分析工具')
  .version('1.0.0')
  .command('analyze')
  .description('分析数据')
  .option('-i, --input <file>', '输入数据文件')
  .option('--sample', '使用示例数据')
  .option('--trends', '包含趋势分析')
  .option('--categories', '包含分类分析')
  .action(async (options) => {
    const analytics = new Analytics();

    try {
      if (options.sample) {
        const sampleData = generateSampleData(30);
        await analytics.loadData(sampleData);
      } else if (options.input) {
        await analytics.loadData(options.input);
      } else {
        // 默认使用示例数据
        const sampleData = generateSampleData(30);
        await analytics.loadData(sampleData);
      }

      // 基础统计
      const stats = analytics.getBasicStats();
      console.log('\n📊 基础统计');
      console.log('─'.repeat(40));
      console.log(`记录总数: ${stats.totalRecords}`);
      if (stats.dateRange) {
        console.log(`时间范围: ${stats.dateRange.start} 至 ${stats.dateRange.end}`);
        console.log(`跨越天数: ${stats.dateRange.days} 天`);
      }

      // 数值统计
      console.log('\n📈 数值统计');
      console.log('─'.repeat(40));
      for (const [field, stat] of Object.entries(stats.numericStats)) {
        console.log(`\n${field}:`);
        console.log(`  总计: ${stat.sum.toLocaleString()}`);
        console.log(`  平均: ${stat.avg.toFixed(2)}`);
        console.log(`  最大: ${stat.max.toLocaleString()}`);
        console.log(`  最小: ${stat.min.toLocaleString()}`);
      }

      // 分类分析
      if (options.categories) {
        const categories = analytics.analyzeByCategory();
        console.log('\n📁 分类统计');
        console.log(analytics.renderBarChart(categories.slice(0, 5), {
          title: '分类阅读量排行',
          labelField: 'name',
          valueField: 'total'
        }));
      }

      // 趋势分析
      if (options.trends) {
        const trends = analytics.analyzeTrends();
        console.log('\n📈 阅读趋势');
        console.log(analytics.renderTrendChart(trends.daily.slice(-14), {
          title: '近 14 天阅读趋势'
        }));
        console.log(`\n平均增长率: ${trends.averageGrowthRate.toFixed(2)}%`);
        console.log(`峰值日期: ${trends.peakDay?.date} (${trends.peakDay?.total} 阅读)`);
      }

      // Top 文章
      const topArticles = analytics.getTopItems('readCount', 5);
      console.log('\n🏆 热门文章 Top 5');
      console.log('─'.repeat(40));
      topArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title} - ${article.readCount} 阅读`);
      });

    } catch (error) {
      console.error('❌ 错误:', error.message);
      process.exit(1);
    }
  });

program
  .command('export')
  .description('导出数据')
  .option('-i, --input <file>', '输入数据文件')
  .option('-o, --output <file>', '输出文件')
  .option('-f, --format <format>', '输出格式 (json, csv)', 'json')
  .option('--sample', '使用示例数据')
  .action(async (options) => {
    const analytics = new Analytics();

    try {
      if (options.sample) {
        const sampleData = generateSampleData(30);
        await analytics.loadData(sampleData);
      } else if (options.input) {
        await analytics.loadData(options.input);
      } else {
        const sampleData = generateSampleData(30);
        await analytics.loadData(sampleData);
      }

      let output;
      if (options.format === 'csv') {
        output = analytics.toCsv();
      } else {
        output = analytics.toJson();
      }

      if (options.output) {
        await fs.writeFile(options.output, output);
        console.log(`✅ 已导出: ${options.output}`);
      } else {
        console.log(output);
      }

    } catch (error) {
      console.error('❌ 错误:', error.message);
      process.exit(1);
    }
  });

program
  .command('report')
  .description('生成分析报告')
  .option('-i, --input <file>', '输入数据文件')
  .option('-o, --output <file>', '输出报告文件', 'report.json')
  .option('--sample', '使用示例数据')
  .action(async (options) => {
    const analytics = new Analytics();

    try {
      if (options.sample) {
        const sampleData = generateSampleData(30);
        await analytics.loadData(sampleData);
      } else if (options.input) {
        await analytics.loadData(options.input);
      } else {
        const sampleData = generateSampleData(30);
        await analytics.loadData(sampleData);
      }

      const report = analytics.generateReport({
        includeTrends: true,
        includeCategories: true
      });

      await fs.writeFile(options.output, JSON.stringify(report, null, 2));
      console.log(`✅ 报告已生成: ${options.output}`);

    } catch (error) {
      console.error('❌ 错误:', error.message);
      process.exit(1);
    }
  });

// 导出
export default Analytics;

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}