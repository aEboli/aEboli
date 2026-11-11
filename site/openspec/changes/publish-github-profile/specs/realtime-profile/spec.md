## ADDED Requirements

### Requirement: GitHub 主页发布
GitHub 个人简介 MUST 展示最终的鲸鱼娘骑行动图，并链接到公开可访问的完整 3D 页面。公开入口 MUST 使用真实北京时间，不携带固定时刻或截图参数。

#### Scenario: 从简介访问实时场景
- **WHEN** 访问者点击简介横幅或“进入 3D 主页”
- **THEN** 打开同一 GitHub Pages 地址，页面的时区为 `Asia/Shanghai`，模式为 `live`
- **AND** 页面自动随时钟更新昼夜，暂停骑行不暂停真实时钟

#### Scenario: 发布与维护
- **WHEN** 维护者在 `site/` 执行 `npm ci`、`npm test`、`npm run build:pages` 并推送
- **THEN** `main` 的 `docs/` 目录包含完整静态页面、模型和依赖许可证，可由 GitHub Pages 发布
- **AND** 简介中的 GIF 仅作为动画预览，不声称其本身能读取真实时间
