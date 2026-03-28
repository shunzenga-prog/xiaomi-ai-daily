# web_fetch 被限制问题 - 修复记录

**日期：** 2026-03-28 22:30
**状态：** ✅ 部分修复

---

## 修复结果

| 域名 | 状态 | 说明 |
|------|------|------|
| github.com | ✅ 可用 | 已添加 hosts 映射 |
| raw.githubusercontent.com | ✅ 可用 | 已添加 hosts 映射 |
| python.langchain.com | ❌ 仍被阻止 | IP 可能被额外限制 |

---

## 已执行的修复

### 1. 修改 wsl.conf
```bash
[network]
generateResolvConf = false
```

### 2. 修改 /etc/resolv.conf
```
nameserver 8.8.8.8
nameserver 1.1.1.1
```

### 3. 添加 hosts 映射
```
# Fix DNS for web_fetch
20.27.177.113 github.com
140.82.121.6 api.github.com
185.199.108.133 raw.githubusercontent.com
185.199.109.133 raw.githubusercontent.com
185.199.110.133 raw.githubusercontent.com
185.199.111.133 raw.githubusercontent.com
216.150.16.65 python.langchain.com
```

---

## 验证

```bash
# DNS 解析正确
$ getent hosts github.com
20.27.177.113   github.com

# web_fetch 可用
web_fetch("https://github.com/openai")  # ✅ 成功
web_fetch("https://raw.githubusercontent.com/...")  # ✅ 成功
```

---

## 遗留问题

**python.langchain.com 仍被阻止**

可能原因：
1. OpenClaw 有额外的 IP 黑名单
2. Vercel CDN 的 IP 被特殊处理
3. 需要进一步排查

临时方案：
- 使用 curl 替代
- 或使用 GitHub 镜像

---

## 总结

- ✅ 主要域名（GitHub）已修复
- ⚠️ 部分域名仍需排查
- 📝 持续维护 hosts 映射

---

*最后更新：2026-03-28 22:30*