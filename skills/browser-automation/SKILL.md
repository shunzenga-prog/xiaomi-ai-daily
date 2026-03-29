---
name: browser-automation
description: 浏览器自动化操作。支持打开网页、点击、输入、截图、提取内容。触发：浏览器自动化、打开网页、截图、网页操作。
---

# 浏览器自动化

使用 Playwright 进行浏览器自动化操作。

## 触发场景

- "打开某个网页截图"
- "自动填写表单"
- "浏览器自动化"
- "网页截图"

## 安装状态

| 组件 | 版本 | 状态 |
|------|------|------|
| Playwright | 1.58.0 | ✅ |
| Chromium | 145.0.7632.6 | ✅ |

## 能力

- ✅ 打开网页
- ✅ 点击、输入、滚动
- ✅ 截图、提取内容
- ✅ 填写表单、登录
- ✅ 执行 JavaScript
- ✅ 等待元素加载

## 示例用法

### 截图

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("https://example.com")
    page.screenshot(path="screenshot.png")
    browser.close()
```

### 提取内容

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("https://example.com")
    text = page.inner_text("body")
    print(text)
    browser.close()
```

### 点击和输入

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("https://google.com")
    page.fill('textarea[name="q"]', "Playwright")
    page.press('textarea[name="q"]', "Enter")
    page.wait_for_load_state("networkidle")
    browser.close()
```

## 执行方式

```bash
python3 -c "
from playwright.sync_api import sync_playwright
# 代码...
"
```

---

*状态：✅ 可用*