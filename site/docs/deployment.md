# GitHub 发布验证

验证日期：2026-11-11，北京时间 19:58。

## 公开入口

- 个人简介：https://github.com/aEboli
- 完整 3D 页面：https://aeboli.github.io/aEboli/
- 发布源：`aEboli/aEboli` 仓库的 `main:/docs`，已启用 HTTPS。
- 首次页面部署提交：`31ae54255ebc70941fb4b6acac977fcf487d483f`。
- GitHub Pages 构建和部署均成功：https://github.com/aEboli/aEboli/actions/runs/43016191289

## 线上核验

- 在 Microsoft Edge 打开公开个人简介，最终横幅成功加载为 1100 × 650 动图，图片及“进入 3D 主页”均指向完整页面。
- 完整页面 HTTP 200，入口没有 `hour` 或 `capture` 参数；页面模式为 `live`，时区为 `Asia/Shanghai`。
- 浏览器设备时区设置为洛杉矶，页面仍显示真实北京时间 `19:58`，与验证机器的同一 UTC 时刻一致；夜景、星空和车灯处于开启状态。
- 暂停骑行后，动画进度保持固定，真实时钟仍继续推进。
- 线上 HTML、场景脚本、昼夜脚本和模型与发布提交逐字节一致；控制台错误和失败请求均为空。详细状态及 SHA-256 见 `deployment-check.json`。
- 将 `PREVIEW_URL` 指向公开页面执行 `tests/browser-check.py`：日光、黄昏、夜晚与午夜自动切换、暂停、拖动与复位、手机布局、时区一致性及减少动态效果均通过。
- 上线前 `npm test` 的 4 项时间测试、`npm run build:pages` 和 OpenSpec 严格校验均通过；场景与最终本地预览一致，包含已验证的双脚踏、包握手部和身体联动。

## 真实时间的范围

真实昼夜在完整 3D 页面中自动运行，按设备时钟换算为北京时间，每秒更新。GitHub 简介里的 GIF 是固定光照的循环预览，不读取时间。点击横幅即可进入实时场景。

今后在 `site/` 运行 `npm ci`、`npm test`、`npm run build:pages`，同时提交源码和 `docs/`，推送后由 GitHub Pages 更新。
