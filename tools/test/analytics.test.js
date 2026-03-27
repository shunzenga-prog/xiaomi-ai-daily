/**
 * 数据分析脚本测试
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { Analytics, generateSampleData } from '../analytics.js';

describe('数据分析工具测试', () => {
  describe('示例数据生成', () => {
    it('生成示例数据', () => {
      const data = generateSampleData(30);
      assert.ok(Array.isArray(data));
      assert.ok(data.length > 0);
    });

    it('数据包含必要字段', () => {
      const data = generateSampleData(10);
      const item = data[0];

      assert.ok(item.id);
      assert.ok(item.title);
      assert.ok(item.date);
      assert.ok(item.category);
      assert.ok(typeof item.readCount === 'number');
      assert.ok(typeof item.likeCount === 'number');
    });

    it('生成指定天数的数据', () => {
      const data = generateSampleData(15);
      // 每天可能有 1-3 篇，所以数量大于等于 15
      assert.ok(data.length >= 15);
    });
  });

  describe('Analytics 实例', () => {
    let analytics;

    before(() => {
      analytics = new Analytics();
    });

    it('创建实例', () => {
      assert.ok(analytics);
      assert.ok(Array.isArray(analytics.data));
    });

    it('加载数组数据', async () => {
      const sampleData = generateSampleData(10);
      await analytics.loadData(sampleData);
      assert.strictEqual(analytics.data.length, sampleData.length);
    });
  });

  describe('基础统计', () => {
    let analytics;

    before(async () => {
      analytics = new Analytics();
      const sampleData = generateSampleData(30);
      await analytics.loadData(sampleData);
    });

    it('获取基础统计', () => {
      const stats = analytics.getBasicStats();
      assert.ok(stats);
      assert.ok(stats.totalRecords > 0);
    });

    it('获取日期范围', () => {
      const stats = analytics.getBasicStats();
      assert.ok(stats.dateRange);
      assert.ok(stats.dateRange.start);
      assert.ok(stats.dateRange.end);
    });

    it('计算数值统计', () => {
      const stats = analytics.getBasicStats();
      assert.ok(stats.numericStats);
      assert.ok(stats.numericStats.readCount);
      assert.ok(typeof stats.numericStats.readCount.avg === 'number');
      assert.ok(typeof stats.numericStats.readCount.sum === 'number');
      assert.ok(typeof stats.numericStats.readCount.min === 'number');
      assert.ok(typeof stats.numericStats.readCount.max === 'number');
    });
  });

  describe('趋势分析', () => {
    let analytics;

    before(async () => {
      analytics = new Analytics();
      const sampleData = generateSampleData(30);
      await analytics.loadData(sampleData);
    });

    it('分析趋势', () => {
      const trends = analytics.analyzeTrends('date', 'readCount');
      assert.ok(trends);
      assert.ok(Array.isArray(trends.daily));
      assert.ok(Array.isArray(trends.movingAverage));
      assert.ok(typeof trends.averageGrowthRate === 'number');
    });

    it('找到峰值日期', () => {
      const trends = analytics.analyzeTrends('date', 'readCount');
      assert.ok(trends.peakDay);
      assert.ok(trends.peakDay.date);
      assert.ok(trends.peakDay.total >= 0);
    });

    it('找到最低日期', () => {
      const trends = analytics.analyzeTrends('date', 'readCount');
      assert.ok(trends.lowestDay);
    });
  });

  describe('分类分析', () => {
    let analytics;

    before(async () => {
      analytics = new Analytics();
      const sampleData = generateSampleData(30);
      await analytics.loadData(sampleData);
    });

    it('按分类分析', () => {
      const categories = analytics.analyzeByCategory('category', 'readCount');
      assert.ok(Array.isArray(categories));
      assert.ok(categories.length > 0);
    });

    it('分类统计包含必要字段', () => {
      const categories = analytics.analyzeByCategory('category', 'readCount');
      const cat = categories[0];

      assert.ok(cat.name);
      assert.ok(typeof cat.count === 'number');
      assert.ok(typeof cat.total === 'number');
      assert.ok(typeof cat.average === 'number');
    });

    it('按总数降序排列', () => {
      const categories = analytics.analyzeByCategory('category', 'readCount');
      for (let i = 1; i < categories.length; i++) {
        assert.ok(categories[i - 1].total >= categories[i].total);
      }
    });
  });

  describe('排名分析', () => {
    let analytics;

    before(async () => {
      analytics = new Analytics();
      const sampleData = generateSampleData(30);
      await analytics.loadData(sampleData);
    });

    it('获取 Top 文章', () => {
      const top = analytics.getTopItems('readCount', 5);
      assert.strictEqual(top.length, 5);
    });

    it('按阅读量降序排列', () => {
      const top = analytics.getTopItems('readCount', 5);
      for (let i = 1; i < top.length; i++) {
        assert.ok(top[i - 1].readCount >= top[i].readCount);
      }
    });
  });

  describe('报告生成', () => {
    let analytics;

    before(async () => {
      analytics = new Analytics();
      const sampleData = generateSampleData(30);
      await analytics.loadData(sampleData);
    });

    it('生成报告', () => {
      const report = analytics.generateReport();
      assert.ok(report);
      assert.ok(report.generatedAt);
      assert.ok(report.summary);
      assert.ok(report.statistics);
    });

    it('报告包含趋势', () => {
      const report = analytics.generateReport({ includeTrends: true });
      assert.ok(report.trends);
    });

    it('报告包含分类', () => {
      const report = analytics.generateReport({ includeCategories: true });
      assert.ok(report.categories);
    });
  });

  describe('导出功能', () => {
    let analytics;

    before(async () => {
      analytics = new Analytics();
      const sampleData = generateSampleData(10);
      await analytics.loadData(sampleData);
    });

    it('导出为 JSON', () => {
      const json = analytics.toJson();
      assert.ok(typeof json === 'string');
      assert.ok(json.startsWith('['));
    });

    it('导出为 CSV', () => {
      const csv = analytics.toCsv();
      assert.ok(typeof csv === 'string');
      assert.ok(csv.includes(','));
    });
  });

  describe('可视化', () => {
    let analytics;

    before(async () => {
      analytics = new Analytics();
      const sampleData = generateSampleData(14);
      await analytics.loadData(sampleData);
    });

    it('渲染条形图', () => {
      const categories = analytics.analyzeByCategory();
      const chart = analytics.renderBarChart(categories, {
        title: '测试图表',
        labelField: 'name',
        valueField: 'total'
      });

      assert.ok(typeof chart === 'string');
      assert.ok(chart.includes('测试图表'));
      assert.ok(chart.includes('█'));
    });

    it('渲染趋势图', () => {
      const trends = analytics.analyzeTrends();
      const chart = analytics.renderTrendChart(trends.daily, {
        title: '趋势测试'
      });

      assert.ok(typeof chart === 'string');
      assert.ok(chart.includes('趋势测试'));
    });
  });
});

console.log('✅ 数据分析工具测试完成');