/**
 * 运行所有测试
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tests = [
  'webhook-handler.test.js',
  'wechat-formatter.test.js',
  'article-template-generator.test.js',
  'analytics.test.js'
];

async function runTest(testFile) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`运行测试: ${testFile}`);
    console.log('='.repeat(50));

    const child = spawn('node', ['--test', path.join(__dirname, testFile)], {
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      resolve({ test: testFile, success: code === 0 });
    });

    child.on('error', (err) => {
      console.error(`测试运行错误: ${err.message}`);
      resolve({ test: testFile, success: false });
    });
  });
}

async function main() {
  console.log('\n🧪 OpenClaw Tools 测试套件');
  console.log('='.repeat(50));

  const results = [];

  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
  }

  // 打印结果摘要
  console.log('\n\n📋 测试结果摘要');
  console.log('='.repeat(50));

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.success ? '✅ 通过' : '❌ 失败';
    console.log(`${result.test}: ${status}`);
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('='.repeat(50));
  console.log(`总计: ${results.length} 个测试文件`);
  console.log(`通过: ${passed}`);
  console.log(`失败: ${failed}`);

  if (failed === 0) {
    console.log('\n🎉 所有测试通过！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查错误信息。');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);