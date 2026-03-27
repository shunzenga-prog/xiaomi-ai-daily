#!/usr/bin/env node

/**
 * 文章模板生成器
 * 根据爆款分析生成写作模板，支持多种文章类型
 * 自动生成标题、开头、结构建议
 * 
 * 使用方法:
 *   node template-generator.js [类型] [主题]
 *   类型：tutorial | review | story | opinion | resource
 *   示例：node template-generator.js tutorial "AI 自动化工作流"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== 模板库 ====================

const TEMPLATE_LIBRARY = {
  // ========== 教程类模板 ==========
  tutorial: {
    name: '场景教程',
    description: '解决具体问题的实操指南',
    ratio: '40%',
    
    titles: [
      '{身份}必备！{数字}个{主题}，{结果}',
      '小白也能用！这个{主题}让我{结果}',
      '别再{痛点}了！用{主题}，{理想状态}',
      '{数字}天用{主题}{成果}',
      '{身份}如何用{主题}{目标}'
    ],
    
    hooks: [
      `你有没有经历过这样的时刻：
{痛点场景 1}；
{痛点场景 2}；
{痛点场景 3}。

别担心，今天小咪分享一个方法，
{解决方案预告}。`,
      
      `你是不是也遇到过这个问题：
{具体问题描述}？

试了很多方法都不管用？

今天这个{主题}，亲测有效，
{效果承诺}。`,
      
      `说实话，{主题}这件事，
{时间}前我也觉得很难。

直到我发现了这个方法，
{转变描述}。

今天手把手教你。`
    ],
    
    structure: [
      {
        section: '痛点场景',
        wordCount: 300,
        purpose: '让读者说「这就是我」',
        tips: [
          '用「你」直接对话读者',
          '描述 3 个具体场景',
          '加入情绪词（崩溃/发愁/头疼）'
        ]
      },
      {
        section: '解决方案预告',
        wordCount: 200,
        purpose: '核心方法预告，建立期待',
        tips: [
          '一句话总结核心价值',
          '预告能带来的改变',
          '降低心理门槛（「其实很简单」）'
        ]
      },
      {
        section: '详细步骤',
        wordCount: 800,
        purpose: '可复制的操作流程',
        tips: [
          '分步骤写（步骤 1/2/3）',
          '每步配截图/示例',
          '标注关键注意事项',
          '小标题用动词开头'
        ]
      },
      {
        section: '案例佐证',
        wordCount: 400,
        purpose: '真实使用效果',
        tips: [
          '用自己的真实体验',
          '展示前后对比',
          '加入具体数据（省 X 小时/提升 X%）'
        ]
      },
      {
        section: '行动号召',
        wordCount: 200,
        purpose: '下一步做什么 + 互动',
        tips: [
          '给出明确的行动指令',
          '提出互动问题',
          '提供资料/资源激励'
        ]
      }
    ],
    
    goldenSentences: [
      '不是{ A}难，而是你没找到对的方法。',
      '当大多数人还在{旧行为}时，聪明人已经{新行为}了。',
      '{时间}前，你说{怀疑}；{时间}后，你说{遗憾}。',
      '真正的{价值}，从来不是{困难方式}，而是{简单方式}。',
      '学会{技能}最好的时间，一个是{过去}，一个是现在。'
    ],
    
    interaction: [
      '你在{场景}中用过这个方法吗？效果怎么样？',
      '还有什么问题？评论区留言，小咪一一解答~',
      '关注 + 回复「{关键词}」领取完整模板/资源包'
    ]
  },
  
  // ========== 测评类模板 ==========
  review: {
    name: '工具测评',
    description: '对比分析 + 真实体验 + 购买建议',
    ratio: '25%',
    
    titles: [
      '{产品 A}vs{产品 B}，深度对比后我选了{答案}',
      '花了{金额}买的{产品}，{时间}后说句大实话',
      '{数字}款{品类}横评，{结论}',
      '别再乱花钱了！{品类}选购指南，看这篇就够了',
      '{产品}测评：{优点}，但{缺点}'
    ],
    
    hooks: [
      `为了找到最好用的{品类}，
小咪花了{时间}，试了{数量}款产品，
花了{金额}元。

今天把真实体验告诉你，
{核心结论}。`,
      
      `市面上{品类}这么多，
到底哪个值得买？

广告都说自己最好，
但真实体验呢？

今天小咪用{时间}的深度使用，
给你答案。`,
      
      `先说结论：
如果你{需求 A}，选{产品 A}；
如果你{需求 B}，选{产品 B}；
如果你{需求 C}，{建议}。

下面是详细分析。`
    ],
    
    structure: [
      {
        section: '测评背景',
        wordCount: 200,
        purpose: '说明测评动机和标准',
        tips: [
          '为什么做这个测评',
          '测评了哪些产品',
          '测评维度是什么'
        ]
      },
      {
        section: '产品概览',
        wordCount: 300,
        purpose: '快速了解参评产品',
        tips: [
          '用表格对比核心参数',
          '价格/定位/适用人群',
          '一眼看出差异'
        ]
      },
      {
        section: '深度体验',
        wordCount: 800,
        purpose: '真实使用感受',
        tips: [
          '每个产品单独分析',
          '优点 + 缺点都要说',
          '配实拍图/截图',
          '用具体场景说明'
        ]
      },
      {
        section: '对比总结',
        wordCount: 400,
        purpose: '横向对比，给出结论',
        tips: [
          '用对比表格总结',
          '各产品的最佳使用场景',
          '性价比分析'
        ]
      },
      {
        section: '购买建议',
        wordCount: 300,
        purpose: '帮读者做决策',
        tips: [
          '按需求推荐',
          '按预算推荐',
          '避坑提醒'
        ]
      }
    ],
    
    goldenSentences: [
      '贵不一定好，但{核心功能}一定不能省。',
      '买{产品}最大的浪费，不是买贵了，而是买错了。',
      '{价格}和{价格}的差距，不在{表面}，在{核心}。',
      '真正的好产品，不是{堆参数}，而是{解决痛点}。',
      '测评的意义，不是告诉你哪个最贵，而是哪个最适合你。'
    ],
    
    interaction: [
      '你在选{品类}时最看重什么？评论区聊聊~',
      '有用过文中提到的产品吗？来分享下体验！',
      '想看什么产品的测评？留言告诉小咪'
    ]
  },
  
  // ========== 故事类模板 ==========
  story: {
    name: '实战案例',
    description: '真实经历 + 情感共鸣 + 启发',
    ratio: '20%',
    
    titles: [
      '{时间}，我用{方法}做到了{成果}',
      '{身份}的{人物}，靠{方法}{改变}',
      '从{起点}到{终点}，我做了{数字}件事',
      '那个{标签}的人，后来怎么样了？',
      '{反常识结论}：一个{身份}的{主题}自白'
    ],
    
    hooks: [
      `{时间}前，我{起点状态}。
{具体困境描述}。

所有人都说{他人看法}，
但我决定{决定}。

{时间}后，{结果}。

这是我的故事。`,
      
      `第一次{事件}的时候，
我{反应}。

那时候还不知道，
这个{事件}会彻底改变{某方面}。

故事要从{时间}说起。`,
      
      `如果{时间}的你，
能穿越到现在，
看到{现在的成就}，
会是什么表情？

{时间}前，我也想不到。`
    ],
    
    structure: [
      {
        section: '故事背景',
        wordCount: 300,
        purpose: '交代时间、人物、处境',
        tips: [
          '用具体时间增加真实感',
          '描述当时的困境/状态',
          '让读者产生代入感'
        ]
      },
      {
        section: '转折点',
        wordCount: 400,
        purpose: '关键事件/决定',
        tips: [
          '是什么触发了改变',
          '内心的挣扎过程',
          '最终的决定'
        ]
      },
      {
        section: '行动过程',
        wordCount: 600,
        purpose: '具体做了什么',
        tips: [
          '分阶段描述',
          '遇到的困难和解决',
          '关键节点'
        ]
      },
      {
        section: '结果展示',
        wordCount: 300,
        purpose: '改变和收获',
        tips: [
          '用数据说话',
          '前后对比',
          '意外收获'
        ]
      },
      {
        section: '感悟启发',
        wordCount: 400,
        purpose: '提炼普适性道理',
        tips: [
          '从个人经历上升到普适道理',
          '给读者的建议',
          '金句收尾'
        ]
      }
    ],
    
    goldenSentences: [
      '真正改变{人生}的，不是{大事件}，而是{小决定}。',
      '{时间}后我才明白，{道理}。',
      '最难的从来不是{困难}，而是{心理障碍}。',
      '如果{条件}，{结果}；但{转折}。',
      '后来我才懂，{认知升级}比{努力}重要{倍数}倍。'
    ],
    
    interaction: [
      '你有过类似的经历吗？评论区分享你的故事~',
      '这个故事对你有什么启发？',
      '想听什么类型的故事？留言告诉小咪'
    ]
  },
  
  // ========== 观点类模板 ==========
  opinion: {
    name: '观点输出',
    description: '趋势分析 + 独特见解 + 认知升级',
    ratio: '10%',
    
    titles: [
      '{反常识观点}：{解释}',
      '{时间}后，{预测}',
      '关于{主题}，{数字}%的人都想错了',
      '{大佬名言}，但我不完全同意',
      '停止{错误行为}！{正确建议}'
    ],
    
    hooks: [
      `最近{事件}很火，
但小咪想说句泼冷水的话：
{反常识观点}。

为什么这么说？
看完你就懂了。`,
      
      `{大佬}说：「{名言}」。

这句话对，但也不对。

对的地方是{对的部分}，
不对的地方是{不对的部分}。

今天聊聊我的真实想法。`,
      
      `{时间}前，{现象}。
{时间}后，{变化}。

这背后有一个{数字}%的人都没意识到的趋势：
{核心观点}。`
    ],
    
    structure: [
      {
        section: '现象引入',
        wordCount: 250,
        purpose: '描述当前热点/现象',
        tips: [
          '用具体事件/数据引入',
          '说明为什么值得关注',
          '提出疑问'
        ]
      },
      {
        section: '主流观点',
        wordCount: 250,
        purpose: '陈述普遍看法',
        tips: [
          '客观描述主流观点',
          '说明为什么流行',
          '为反驳做铺垫'
        ]
      },
      {
        section: '深度分析',
        wordCount: 600,
        purpose: '提出独特见解',
        tips: [
          '用论据支撑观点',
          '举例说明',
          '逻辑清晰',
          '敢于说不同意见'
        ]
      },
      {
        section: '趋势预判',
        wordCount: 400,
        purpose: '预测未来走向',
        tips: [
          '基于分析给出预判',
          '说明依据',
          '给读者建议'
        ]
      },
      {
        section: '行动建议',
        wordCount: 300,
        purpose: '读者应该怎么做',
        tips: [
          '具体可执行的建议',
          '避免什么',
          '抓住什么'
        ]
      }
    ],
    
    goldenSentences: [
      '{时代}的时代结束了，{新时代}的时代开始了。',
      '真正的{价值}，从来不是{表面}，而是{本质}。',
      '当所有人都在{行为 A}时，聪明人在{行为 B}。',
      '{时间}后回看，{现在}可能是{评价}。',
      '认知差，才是最大的{差距}。'
    ],
    
    interaction: [
      '你同意这个观点吗？评论区聊聊~',
      '对{主题}你有什么看法？',
      '想看什么话题的深度分析？留言'
    ]
  },
  
  // ========== 资源类模板 ==========
  resource: {
    name: '资源分享',
    description: '工具/资料/模板整理',
    ratio: '5%',
    
    titles: [
      '收藏！{数字}个{主题}资源，{价值}',
      '{主题}资源包，限时免费领',
      '我整理了{时间}的{主题}资源，都在这了',
      '别再到处找了！{主题}资源看这篇',
      '{数字}G{主题}资料，{获取方式}'
    ],
    
    hooks: [
      `花了{时间}，
整理了这份{主题}资源包。

包含：
{内容 1}
{内容 2}
{内容 3}

全部免费分享。`,
      
      `经常有读者问：
{常见问题 1}？
{常见问题 2}？

今天一次性整理好，
{数量}个资源，{价值}。`,
      
      `这些都是小咪亲测好用的{主题}资源，
每一个都精心筛选过。

总价值{金额}元，
今天免费分享给大家。`
    ],
    
    structure: [
      {
        section: '资源说明',
        wordCount: 200,
        purpose: '介绍资源包内容',
        tips: [
          '整理这些资源的初衷',
          '包含哪些内容',
          '适合什么人'
        ]
      },
      {
        section: '资源清单',
        wordCount: 600,
        purpose: '详细列出资源',
        tips: [
          '分类展示',
          '每个资源简短介绍',
          '标注价值/特点',
          '用列表清晰呈现'
        ]
      },
      {
        section: '使用指南',
        wordCount: 300,
        purpose: '如何使用这些资源',
        tips: [
          '推荐学习顺序',
          '注意事项',
          '常见问题'
        ]
      },
      {
        section: '获取方式',
        wordCount: 200,
        purpose: '告诉读者如何获取',
        tips: [
          '清晰的获取步骤',
          '是否需要条件',
          '有效期说明'
        ]
      },
      {
        section: '互动引导',
        wordCount: 200,
        purpose: '增加互动和传播',
        tips: [
          '鼓励反馈',
          '请求分享',
          '预告下次资源'
        ]
      }
    ],
    
    goldenSentences: [
      '最好的投资，是投资自己的{能力}。',
      '资源本身不值钱，值钱的是你{如何使用}。',
      '收藏≠学会，{行动}才是关键。',
      '这些资源能帮你{省时间}，但{核心}还是要靠自己。',
      '分享这些资源，是希望{愿景}。'
    ],
    
    interaction: [
      '最想要哪类资源？留言告诉小咪~',
      '用了资源后，来反馈下效果！',
      '关注 + 回复「{关键词}」立即获取'
    ]
  }
};

// ==================== 标题生成器 ====================

function generateTitles(templateType, topic, options = {}) {
  const template = TEMPLATE_LIBRARY[templateType];
  if (!template) {
    console.error(`❌ 未知模板类型：${templateType}`);
    console.log('可用类型：tutorial | review | story | opinion | resource');
    return [];
  }
  
  const defaults = {
    identity: options.identity || '打工人',
    result: options.result || '效率提升 3 倍',
    painPoint: options.painPoint || '加班写报告',
    idealState: options.idealState || '准点下班不是梦',
    number: options.number || '5',
    days: options.days || '7',
    goal: options.goal || '月入过万',
    time: options.time || '3 年',
    before: options.before || '什么都不会',
    after: options.after || '行业专家',
    productA: options.productA || '产品 A',
    productB: options.productB || '产品 B',
    answer: options.answer || '它',
    amount: options.amount || '1000',
    category: options.category || 'AI 工具',
    conclusion: options.conclusion || '这 3 款最值得买',
    method: options.method || 'AI 辅助',
    achievement: options.achievement || '10 万粉',
    person: options.person || '95 后女生',
    change: options.change || '改变了人生',
    label: options.label || '不被看好',
    counterIntuitive: options.counterIntuitive || '真正厉害的人',
    trend: options.trend || 'AI 智能体',
    percentage: options.percentage || '90',
    boss: options.boss || '马斯克',
    quote: options.quote || 'AI 将改变一切'
  };
  
  const replacements = {
    '{身份}': defaults.identity,
    '{数字}': defaults.number,
    '{主题}': topic,
    '{结果}': defaults.result,
    '{痛点}': defaults.painPoint,
    '{理想状态}': defaults.idealState,
    '{时间}': defaults.time,
    '{成果}': defaults.achievement,
    '{目标}': defaults.goal,
    '{天数}': defaults.days,
    '{起点}': defaults.before,
    '{终点}': defaults.after,
    '{产品 A}': defaults.productA,
    '{产品 B}': defaults.productB,
    '{答案}': defaults.answer,
    '{金额}': defaults.amount,
    '{品类}': defaults.category,
    '{结论}': defaults.conclusion,
    '{方法}': defaults.method,
    '{人物}': defaults.person,
    '{改变}': defaults.change,
    '{标签}': defaults.label,
    '{反常识结论}': defaults.counterIntuitive,
    '{预测}': `${defaults.trend}将爆发`,
    '{百分比}': defaults.percentage,
    '{大佬}': defaults.boss,
    '{名言}': defaults.quote
  };
  
  return template.titles.map(title => {
    let generated = title;
    for (const [placeholder, value] of Object.entries(replacements)) {
      generated = generated.replace(new RegExp(placeholder.replace('{', '\\{').replace('}', '\\}'), 'g'), value);
    }
    return generated;
  });
}

// ==================== 开头生成器 ====================

function generateHooks(templateType, topic, options = {}) {
  const template = TEMPLATE_LIBRARY[templateType];
  if (!template) return [];
  
  const painScenes = options.painScenes || [
    '凌晨 3 点，还在为工作发愁',
    '明明很努力，却总是没结果',
    '看着别人成功，自己还在原地踏步'
  ];
  
  const solutionPreview = options.solutionPreview || `用${topic}，${options.result || '效率提升 3 倍'}`;
  
  return template.hooks.map(hook => {
    return hook
      .replace(/{痛点场景 1}/g, painScenes[0])
      .replace(/{痛点场景 2}/g, painScenes[1])
      .replace(/{痛点场景 3}/g, painScenes[2])
      .replace(/{解决方案预告}/g, solutionPreview)
      .replace(/{具体问题描述}/g, `如何在${topic}上取得突破`)
      .replace(/{效果承诺}/g, `亲测有效，${options.result || '一周见效'}`)
      .replace(/{主题}/g, topic)
      .replace(/{时间}/g, options.time || '3 个月')
      .replace(/{转变描述}/g, '原来方法对了，真的可以事半功倍');
  });
}

// ==================== 结构建议生成器 ====================

function generateStructure(templateType) {
  const template = TEMPLATE_LIBRARY[templateType];
  if (!template) return null;
  
  return template.structure.map((section, index) => ({
    order: index + 1,
    section: section.section,
    wordCount: section.wordCount,
    purpose: section.purpose,
    tips: section.tips
  }));
}

// ==================== 金句生成器 ====================

function generateGoldenSentences(templateType, options = {}) {
  const template = TEMPLATE_LIBRARY[templateType];
  if (!template) return [];
  
  const defaults = {
    A: options.A || '事情',
    B: options.B || '方法',
    oldBehavior: options.oldBehavior || '观望',
    newBehavior: options.newBehavior || '行动',
    time1: options.time1 || '3 年',
    time2: options.time2 || '3 年',
    doubt: options.doubt || 'AI 还早',
    regret: options.regret || '来不及了',
    value: options.value || '成功',
    hardWay: options.hardWay || '拼命努力',
    easyWay: options.easyWay || '找对方法',
    skill: options.skill || '这个技能',
    past: options.past || '10 年前'
  };
  
  return template.goldenSentences.map(sentence => {
    return sentence
      .replace(/{A}/g, defaults.A)
      .replace(/{B}/g, defaults.B)
      .replace(/{旧行为}/g, defaults.oldBehavior)
      .replace(/{新行为}/g, defaults.newBehavior)
      .replace(/{时间}/g, defaults.time1)
      .replace(/{怀疑}/g, defaults.doubt)
      .replace(/{遗憾}/g, defaults.regret)
      .replace(/{价值}/g, defaults.value)
      .replace(/{困难方式}/g, defaults.hardWay)
      .replace(/{简单方式}/g, defaults.easyWay)
      .replace(/{技能}/g, defaults.skill)
      .replace(/{过去}/g, defaults.past)
      .replace(/{时代}/g, '大模型')
      .replace(/{新时代}/g, '智能体')
      .replace(/{表面}/g, '参数')
      .replace(/{本质}/g, '场景')
      .replace(/{行为 A}/g, '追热点')
      .replace(/{行为 B}/g, '深耕内容')
      .replace(/{现在}/g, '现在')
      .replace(/{评价}/g, '最好的入场时机')
      .replace(/{差距}/g, '差距')
      .replace(/{能力}/g, '大脑')
      .replace(/{如何使用}/g, '如何运用')
      .replace(/{行动}/g, '实践')
      .replace(/{核心}/g, '思考')
      .replace(/{省时间}/g, '节省时间')
      .replace(/{愿景}/g, '更多人受益');
  });
}

// ==================== 互动问题生成器 ====================

function generateInteractions(templateType, topic) {
  const template = TEMPLATE_LIBRARY[templateType];
  if (!template) return [];
  
  return template.interaction.map(q => {
    return q
      .replace(/{场景}/g, topic)
      .replace(/{关键词}/g, topic.replace(/\s/g, ''))
      .replace(/{品类}/g, topic)
      .replace(/{主题}/g, topic);
  });
}

// ==================== 完整模板生成器 ====================

function generateFullTemplate(templateType, topic, options = {}) {
  const template = TEMPLATE_LIBRARY[templateType];
  if (!template) {
    return {
      error: `未知模板类型：${templateType}`,
      availableTypes: Object.keys(TEMPLATE_LIBRARY)
    };
  }
  
  return {
    meta: {
      type: templateType,
      typeName: template.name,
      description: template.description,
      contentRatio: template.ratio,
      topic: topic,
      generatedAt: new Date().toISOString()
    },
    titles: generateTitles(templateType, topic, options),
    hooks: generateHooks(templateType, topic, options),
    structure: generateStructure(templateType),
    goldenSentences: generateGoldenSentences(templateType, options),
    interactions: generateInteractions(templateType, topic),
    checklist: {
      title: [
        '包含具体数字',
        '有身份标签',
        '有量化结果',
        '有情绪词',
        '25 字以内'
      ],
      opening: [
        '前 3 句能抓住注意力',
        '用「你」直接对话读者',
        '有具体场景或数据',
        '有情绪递进'
      ],
      structure: [
        '5 个以上小标题',
        '小标题是问题/利益点',
        '每 500 字有 1 张图',
        '有实操指南'
      ],
      goldenSentences: [
        '至少 3 句可转发的金句',
        '金句不超过 30 字',
        '有对仗或反差'
      ],
      interaction: [
        '结尾有提问',
        '提问容易回答',
        '有激励（资料/抽奖）'
      ]
    }
  };
}

// ==================== 模板导出器 ====================

function exportTemplate(templateType, topic, outputPath, options = {}) {
  const template = generateFullTemplate(templateType, topic, options);
  
  if (template.error) {
    console.error(`❌ ${template.error}`);
    return false;
  }
  
  // 生成 Markdown 格式
  const markdown = `
# 📝 ${topic} - ${template.meta.typeName}模板

> 生成时间：${template.meta.generatedAt}
> 内容占比：${template.meta.contentRatio}

---

## 🎯 推荐标题（选 1 个）

${template.titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

---

## 🪝 开头钩子（选 1 个）

${template.hooks.map((h, i) => `### 选项${i + 1}\n\n${h}`).join('\n\n---\n\n')}

---

## 📐 文章结构

${template.structure.map((s, i) => `### ${s.order}. ${s.section}（${s.wordCount}字）

**目的：** ${s.purpose}

**写作要点：**
${s.tips.map(tip => `- ${tip}`).join('\n')}
`).join('\n\n---\n\n')}

---

## ✨ 金句建议

${template.goldenSentences.map((s, i) => `${i + 1}. ${s}`).join('\n')}

---

## 💬 互动问题

${template.interactions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

---

## ✅ 发布前检查

### 标题检查
${template.checklist.title.map(c => `- [ ] ${c}`).join('\n')}

### 开头检查
${template.checklist.opening.map(c => `- [ ] ${c}`).join('\n')}

### 结构检查
${template.checklist.structure.map(c => `- [ ] ${c}`).join('\n')}

### 金句检查
${template.checklist.goldenSentences.map(c => `- [ ] ${c}`).join('\n')}

### 互动检查
${template.checklist.interaction.map(c => `- [ ] ${c}`).join('\n')}

---

*模板由 template-generator.js 生成*
`.trim();
  
  fs.writeFileSync(outputPath, markdown, 'utf-8');
  console.log(`✅ 模板已导出：${outputPath}`);
  return true;
}

// ==================== 命令行接口 ====================

function printHelp() {
  console.log(`
📝 文章模板生成器

用法:
  node template-generator.js [命令] [参数]

命令:
  generate [类型] [主题]     生成模板并输出到控制台
  export [类型] [主题] [路径]  导出模板到文件
  list                       列出所有模板类型
  preview [类型]             预览某类模板的结构

类型:
  tutorial   场景教程（40%）- 解决具体问题的实操指南
  review     工具测评（25%）- 对比分析 + 真实体验
  story      实战案例（20%）- 真实经历 + 情感共鸣
  opinion    观点输出（10%）- 趋势分析 + 独特见解
  resource   资源分享（5%） - 工具/资料/模板整理

示例:
  node template-generator.js generate tutorial "AI 自动化工作流"
  node template-generator.js export review "Notion vs Obsidian" ./templates/review.md
  node template-generator.js list
  node template-generator.js preview story

选项:
  --identity "打工人"        设置身份标签
  --result "效率提升 3 倍"     设置量化结果
  --number 5                设置数字
  --help                    显示帮助
`.trim());
}

function listTemplates() {
  console.log('\n📚 模板库\n');
  for (const [key, template] of Object.entries(TEMPLATE_LIBRARY)) {
    console.log(`  ${key.padEnd(10)} ${template.name.padEnd(10)} ${template.ratio}`);
    console.log(`           ${template.description}\n`);
  }
}

function previewTemplate(templateType) {
  const template = TEMPLATE_LIBRARY[templateType];
  if (!template) {
    console.error(`❌ 未知模板类型：${templateType}`);
    return;
  }
  
  console.log(`\n📐 ${template.name} 模板结构\n`);
  console.log(`描述：${template.description}`);
  console.log(`内容占比：${template.ratio}\n`);
  console.log('结构:');
  template.structure.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.section}（${s.wordCount}字）- ${s.purpose}`);
  });
  console.log('\n标题公式:');
  template.titles.forEach(t => console.log(`  - ${t}`));
}

// ==================== 主程序 ====================

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'list':
      listTemplates();
      break;
      
    case 'preview':
      if (!args[1]) {
        console.error('❌ 请指定模板类型');
        printHelp();
        return;
      }
      previewTemplate(args[1]);
      break;
      
    case 'generate':
      if (!args[1] || !args[2]) {
        console.error('❌ 请指定模板类型和主题');
        printHelp();
        return;
      }
      const template = generateFullTemplate(args[1], args[2]);
      if (template.error) {
        console.error(`❌ ${template.error}`);
        return;
      }
      console.log('\n📝 生成的模板:\n');
      console.log(JSON.stringify(template, null, 2));
      break;
      
    case 'export':
      if (!args[1] || !args[2] || !args[3]) {
        console.error('❌ 请指定模板类型、主题和输出路径');
        printHelp();
        return;
      }
      exportTemplate(args[1], args[2], args[3]);
      break;
      
    default:
      console.error(`❌ 未知命令：${command}`);
      printHelp();
  }
}

// 导出函数供其他模块使用
export {
  TEMPLATE_LIBRARY,
  generateTitles,
  generateHooks,
  generateStructure,
  generateGoldenSentences,
  generateInteractions,
  generateFullTemplate,
  exportTemplate
};

// 如果是直接运行，执行主程序
import { argv } from 'process';

const isMainModule = argv[1] && (argv[1].endsWith('template-generator.js') || argv[1].includes('template-generator'));
if (isMainModule) {
  main();
}
