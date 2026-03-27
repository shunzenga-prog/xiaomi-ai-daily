/**
 * 文章模板生成器测试
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ArticleTemplateGenerator, templates } from '../article-template-generator.js';

describe('文章模板生成器测试', () => {
  describe('内置模板', () => {
    it('存在所有模板', () => {
      assert.ok(templates.tutorial, '缺少 tutorial 模板');
      assert.ok(templates.review, '缺少 review 模板');
      assert.ok(templates.experience, '缺少 experience 模板');
      assert.ok(templates.news, '缺少 news 模板');
      assert.ok(templates.booknote, '缺少 booknote 模板');
      assert.ok(templates.project, '缺少 project 模板');
    });

    it('模板包含必要字段', () => {
      for (const [key, template] of Object.entries(templates)) {
        assert.ok(template.name, `模板 ${key} 缺少 name`);
        assert.ok(template.description, `模板 ${key} 缺少 description`);
        assert.ok(Array.isArray(template.variables), `模板 ${key} 缺少 variables`);
        assert.ok(template.content, `模板 ${key} 缺少 content`);
      }
    });
  });

  describe('生成器实例', () => {
    let generator;

    beforeEach(() => {
      generator = new ArticleTemplateGenerator();
    });

    it('创建生成器实例', () => {
      assert.ok(generator);
      assert.ok(generator.templates);
    });

    it('列出模板', () => {
      const list = generator.listTemplates();
      assert.ok(Array.isArray(list));
      assert.ok(list.length > 0);
    });
  });

  describe('模板生成', () => {
    let generator;

    beforeEach(() => {
      generator = new ArticleTemplateGenerator();
    });

    it('生成技术教程模板', () => {
      const content = generator.generate('tutorial', {
        title: '测试教程',
        author: '测试作者',
        date: '2024-01-01'
      });

      assert.ok(content.includes('测试教程'));
      assert.ok(content.includes('测试作者'));
      assert.ok(content.includes('2024-01-01'));
    });

    it('生成产品评测模板', () => {
      const content = generator.generate('review', {
        title: '产品评测',
        productName: '测试产品',
        price: '999元'
      });

      assert.ok(content.includes('产品评测'));
      assert.ok(content.includes('测试产品'));
      assert.ok(content.includes('999元'));
    });

    it('生成心得体会模板', () => {
      const content = generator.generate('experience', {
        title: '我的感悟',
        author: '作者名'
      });

      assert.ok(content.includes('我的感悟'));
    });

    it('生成新闻资讯模板', () => {
      const content = generator.generate('news', {
        title: '新闻标题',
        source: '官方网站'
      });

      assert.ok(content.includes('新闻标题'));
      assert.ok(content.includes('官方网站'));
    });

    it('生成读书笔记模板', () => {
      const content = generator.generate('booknote', {
        title: '读书笔记',
        bookName: '书名',
        bookAuthor: '作者'
      });

      assert.ok(content.includes('读书笔记'));
      assert.ok(content.includes('书名'));
    });

    it('生成项目复盘模板', () => {
      const content = generator.generate('project', {
        title: '项目总结',
        projectName: '测试项目'
      });

      assert.ok(content.includes('项目总结'));
      assert.ok(content.includes('测试项目'));
    });

    it('处理不存在的模板', () => {
      assert.throws(() => {
        generator.generate('nonexistent', {});
      }, /Template not found/);
    });
  });

  describe('变量替换', () => {
    let generator;

    beforeEach(() => {
      generator = new ArticleTemplateGenerator();
    });

    it('替换所有变量', () => {
      const content = generator.generate('tutorial', {
        title: '标题',
        author: '作者',
        date: '日期',
        tags: '标签',
        difficulty: '中级',
        duration: '1小时'
      });

      // 确保没有未替换的变量
      assert.ok(!content.includes('{{'));
      assert.ok(!content.includes('}}'));
    });

    it('清理未提供的变量', () => {
      const content = generator.generate('tutorial', {
        title: '只有标题'
      });

      // 变量被清理掉
      assert.ok(!content.includes('{{'));
    });
  });

  describe('自定义模板', () => {
    let generator;

    beforeEach(() => {
      generator = new ArticleTemplateGenerator();
    });

    it('添加自定义模板', () => {
      generator.addTemplate('custom', {
        name: '自定义模板',
        description: '测试用自定义模板',
        variables: ['title'],
        content: '# {{title}}\n\n这是自定义模板内容。'
      });

      const content = generator.generate('custom', { title: '测试' });
      assert.ok(content.includes('测试'));
      assert.ok(content.includes('自定义模板内容'));
    });

    it('列出包含自定义模板的列表', () => {
      generator.addTemplate('custom2', {
        name: '另一个自定义',
        description: '测试',
        variables: [],
        content: '内容'
      });

      const list = generator.listTemplates();
      const found = list.find(t => t.key === 'custom2');
      assert.ok(found);
    });
  });
});

console.log('✅ 文章模板生成器测试完成');