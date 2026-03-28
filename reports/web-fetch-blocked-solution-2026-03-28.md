# web_fetch 被限制问题 - 根本原因与解决方案

**日期：** 2026-03-28 22:25
**问题：** web_fetch 报错 "Blocked: resolves to private/internal/special-use IP address"

---

## 根本原因

### DNS 解析问题

```
WSL DNS (10.255.255.254) → 把 github.com 解析到 → 198.18.0.248（私有 IP）
Google DNS (8.8.8.8) → 把 github.com 解析到 → 20.27.177.113（真实 IP）
```

**问题链：**
1. WSL 使用内网 DNS 服务器 `10.255.255.254`
2. 这个 DNS 把某些域名解析到私有 IP（可能是代理/VPN 行为）
3. OpenClaw 的 web_fetch 有安全机制，阻止访问私有 IP
4. 导致 web_fetch 完全不可用

---

## 验证

```bash
# 当前 DNS 解析（错误）
$ getent hosts github.com
198.18.0.248    github.com  # 私有 IP ❌

# Google DNS 解析（正确）
$ curl -s "https://dns.google/resolve?name=github.com&type=A"
{"Answer":[{"data":"20.27.177.113"}]}  # 真实 IP ✅
```

---

## 解决方案

### 方案 1：修改 DNS 配置（推荐）

**需要 sudo 权限**

```bash
# 1. 备份原配置
sudo cp /etc/resolv.conf /etc/resolv.conf.backup

# 2. 修改 DNS 为公共 DNS
sudo bash -c 'cat > /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 1.1.1.1
nameserver 2001:4860:4860::8888
EOF'

# 3. 防止 WSL 自动覆盖
sudo bash -c 'cat > /etc/wsl.conf << EOF
[network]
generateResolvConf = false

[boot]
systemd=true

[user]
default=zengshun
EOF'

# 4. 验证
getent hosts github.com
# 应该显示真实 IP，如 20.27.177.113
```

### 方案 2：添加 hosts 映射

**临时方案，仅对特定域名有效**

```bash
# 添加常用域名映射
sudo bash -c 'cat >> /etc/hosts << EOF
# 修复 web_fetch DNS 解析
20.27.177.113 github.com
140.82.121.6 api.github.com
185.199.108.133 raw.githubusercontent.com
185.199.109.133 raw.githubusercontent.com
185.199.110.133 raw.githubusercontent.com
185.199.111.133 raw.githubusercontent.com
EOF'
```

### 方案 3：检查是否有代理/VPN

如果使用了代理或 VPN：
1. 检查代理配置
2. 尝试关闭代理/VPN
3. 或配置代理绕过列表

---

## 验证修复

修复后运行：

```bash
# 验证 DNS 解析
getent hosts github.com
# 应该显示：20.27.177.113（或类似真实 IP）

# 测试 web_fetch
# 在 OpenClaw 中测试 web_fetch 工具
```

---

## 为什么 curl 可以用？

curl 直接使用系统 DNS，不检查 IP 是否为私有地址。
web_fetch 有安全检查，阻止私有 IP 访问（防止 SSRF 攻击）。

---

## 总结

| 工具 | 状态 | 原因 |
|------|------|------|
| curl | ✅ 可用 | 不检查私有 IP |
| web_fetch | ❌ 被阻止 | DNS 解析到私有 IP + 安全检查 |
| web_search | ⚠️ 不稳定 | DuckDuckGo 限制 |

**根本原因：** WSL DNS 配置问题
**解决方案：** 修改 DNS 为公共 DNS（需 sudo）

---

*请执行方案 1 修复 DNS 配置*