# 📦 ClawHub 技能发布指南

## 发布前提

1. GitHub 账号（至少一周老）
2. 安装 ClawHub CLI
3. 登录认证

## 发布步骤

### 1. 安装 CLI

```bash
npm i -g clawhub
```

### 2. 登录

```bash
clawhub login
```
会打开浏览器，用 GitHub 账号授权。

### 3. 发布技能

```bash
clawhub publish ./skills/article-writer \
  --slug article-writer \
  --name "文章写作助手" \
  --version 1.0.0 \
  --tags latest \
  --changelog "首个版本"
```

### 4. 更新技能

```bash
clawhub publish ./skills/article-writer \
  --slug article-writer \
  --version 1.0.1 \
  --changelog "修复xxx问题"
```

## 批量同步

```bash
clawhub sync --all
```

自动扫描 skills 目录，发布所有新/更新的技能。

## 当前可发布技能

| 技能 | 状态 | 拟定版本 |
|------|------|----------|
| article-writer | ✅ 可发布 | 1.0.0 |
| content-planner | ✅ 可发布 | 1.0.0 |

## 变现思路

1. 免费发布基础版，积累用户
2. 后续开发付费版（更高级功能）
3. 或提供定制服务

## 需要boss协助

- [ ] 提供 GitHub 账号登录
- [ ] 执行发布命令

---

*创建时间：2026-03-26*