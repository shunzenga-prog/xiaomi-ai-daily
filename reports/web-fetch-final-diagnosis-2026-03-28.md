# web_fetch 问题最终诊断

**日期：** 2026-03-28 22:35
**状态：** ✅ 根本原因已确认

---

## 根本原因

**Windows 代理软件 DNS 劫持**

```
WSL → 请求 DNS → Windows 代理软件（Clash/V2Ray等）
    → 劫持解析 → 返回虚拟 IP (198.18.x.x)
    → OpenClaw 阻止 → web_fetch 失败
```

### 证据

| 域名 | 解析结果 | 数据来源 |
|------|----------|----------|
| python.langchain.com | 216.150.16.65 ✅ | DNS (本地) |
| duckduckgo.com | 198.18.1.77 ❌ | network (代理) |
| github.com | 20.27.177.113 ✅ | hosts (绕过) |

`198.18.x.x` 是代理软件常用的虚拟 IP 段。

---

## 已完成的修复

### 1. DNS 配置 ✅
```
/etc/systemd/resolved.conf:
[Resolve]
DNS=114.114.114.114 8.8.8.8 1.1.1.1 114.114.115.115
FallbackDNS=223.5.5.5 119.29.29.29
```

### 2. hosts 映射 ✅
```
# GitHub 相关
20.27.177.113 github.com
185.199.108-111.133 raw.githubusercontent.com
```

### 3. wsl.conf 配置 ✅
```
[network]
generateResolvConf = false
```

---

## 完整解决方案

### 方案 A：配置代理软件（推荐）

在 Windows 代理软件中添加规则：
1. 直连 `raw.githubusercontent.com`
2. 直连 `github.com`
3. 直连 `githubusercontent.com`

### 方案 B：继续添加 hosts

每遇到新域名，用以下命令添加：
```bash
# 获取真实 IP
curl -s "https://dns.google/resolve?name=域名&type=A"

# 添加到 hosts
echo 'IP 域名' | sudo tee -a /etc/hosts
```

### 方案 C：关闭代理

临时关闭 Windows 代理软件，使用直接网络。

---

## 当前可用域名

| 域名 | 状态 | 方式 |
|------|------|------|
| github.com | ✅ | hosts |
| raw.githubusercontent.com | ✅ | hosts |
| api.github.com | ✅ | hosts |
| 其他域名 | ❌ | 需要添加 hosts |

---

## 建议

**最简单的解决方案：**
在 Windows 代理软件中配置 `raw.githubusercontent.com` 和 `github.com` 直连。

这样就能解决 web_fetch 的所有问题。

---

*问题诊断完成，方案已提供*