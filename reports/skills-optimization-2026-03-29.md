# Skills 优化报告 - 2026-03-29

**优化时间**: 2026-03-29 09:40
**优化依据**: ClawHub技能搜索报告、论述技巧研究报告、文章改进计划、向大神学习写作技巧报告
**优化者**: 小咪 🐱

---

## 一、优化总览

| Skill | 优化前 | 优化后 | 改动内容 |
|-------|--------|--------|----------|
| wechat-writer | 4962 bytes | +论述技巧 | 加入三层论述法、5W1H检查、对比强化模板 |
| hotspot-tracker | 2646 bytes | 907 bytes | 简化 + 加入实际脚本 scripts/check-hotspots.sh |
| lobster-dispatcher | 3676 bytes | 969 bytes | 简化 + 详细内容移到 references/ |
| article-pipeline | 无变化 | +质量检查 | 审阅官加入论述质量检查 |
| article-writer | 2048 bytes | +论述技巧 | 加入论述质量必查引用 |

---

## 二、新增文件

### wechat-writer/references/writing-techniques.md
**内容**: 论述技巧速查手册
- 三层论述法（观点→支撑→解释）
- 5W1H 检查清单
- 对比强化模板
- 来源标注规范
- 深度追问法
- 发布前自检清单

### hotspot-tracker/scripts/check-hotspots.sh
**内容**: AI热点追踪脚本
- 使用 DuckDuckGo HTML 搜索
- 搜索今日AI热点、AI新闻、大模型动态

### lobster-dispatcher/references/lobster-capability-matrix.md
**内容**: 龙虾能力矩阵与任务模板
- 6个龙虾能力矩阵
- 研究龙虾/代码龙虾/冲浪龙虾任务模板

---

## 三、核心改进点

### 论述质量检查（最重要）

**问题**: 文章改进计划指出"论述不足、内容标题关联欠缺"

**解决方案**: 加入论述技巧速查手册

**核心方法**:
1. **三层论述法**: 观点 → 支撑 → 解释
2. **5W1H 检查**: ≥ 10分才能发布
3. **对比强化**: 关键观点必须有前后对比
4. **来源标注**: 数据必须有机构+时间
5. **深度追问**: 每个陈述追问3层

**影响范围**:
- wechat-writer（公众号创作）
- article-writer（通用写作）
- article-pipeline（创作链审阅）

---

### Skills 规范化

**问题**: ClawHub 报告指出 SKILL.md 太冗长、缺少脚本

**解决方案**:
1. 简化 SKILL.md（<1000 bytes 为佳）
2. 详细内容移到 references/
3. 可执行脚本移到 scripts/

**已优化**:
- hotspot-tracker: 2646 → 907 bytes
- lobster-dispatcher: 3676 → 969 bytes

---

## 四、未优化 Skills（原因）

| Skill | 未优化原因 |
|-------|------------|
| content-brainstorm | ClawHub 安装版，结构良好 |
| xiaohongshu-writer | 已有完整 references/爆款特征库 |
| telegram-send | 工具类，简洁实用 |
| wechat-image | 工具类，简洁实用 |
| content-planner | 已简洁（2192 bytes），暂不优化 |

---

## 五、后续建议

### 可安装现成技能（ClawHub）

根据 ClawHub 报告，以下现成技能可考虑安装：
- hotspot-aggregator（热点聚合）
- ai-news-researcher（AI新闻研究）

### 待创建/优化

1. **爆款案例库** - 定期收集更新爆款案例
2. **反馈迭代机制** - 文章发布后自动记录数据
3. **论述质量自动评分** - 创作链中加入自动评分

---

## 六、自检清单

发布文章前对照检查：

- [ ] 每个观点有数据/案例支撑？
- [ ] 有至少 1 个对比分析？
- [ ] 数据来源标注完整？（机构 + 时间 + 链接）
- [ ] 有"这意味着什么"的深度分析？
- [ ] 有"具体怎么做"的可操作建议？

**3 个以上 ❌ = 补充后再发布**

---

*优化完成时间：2026-03-29 09:45*
*下次优化时间：一周后复盘效果*