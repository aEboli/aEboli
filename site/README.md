# 鲸鱼娘的海边骑行

可拖动查看的 3D 个人主页。保留 aEboli 的自我介绍、鲸鱼外套和向前骑行，加入透视、布料质感、车架反射、真实阴影、海面、月亮与夜间车灯。双手包握把套，肩、肘、腕随身体重心联动，脚底始终贴合踏板。

## 打开交付网页

构建后的交付目录已经包含全部依赖。Windows 安装了 Python 3 时，双击 `start-preview.cmd`；也可以运行 `python preview.py`。浏览器会自动打开。关闭终端即可停止本地预览。

不要直接双击 `index.html` 使用 `file://` 打开：模型和 JavaScript 模块需要 HTTP 服务。部署到静态网站后不需要 Python。

## 使用

- 拖动场景旋转视角，“复位”回到正面。
- “暂停”停止骑行和漂浮动作；北京时间继续更新。
- 默认读取真实时钟，显式使用 `Asia/Shanghai`，不受设备时区设置影响。
- 05:00–07:00 从夜色过渡到白天，16:00–19:30 从日光过渡到黄昏和夜晚；时间表用于美术表现，不计算季节性天文日出。
- 光照每秒更新，重新切回标签页时立即同步。夜间月亮、星空、车灯及路灯亮起。
- 系统开启“减少动态效果”时默认暂停，仍可手动播放。

## 源码与验证

源码需要 Node.js；构建网页不依赖 CDN，也不需要 API 密钥。

```powershell
npm ci
npm test
npm run build
python -m http.server 4177 --bind 127.0.0.1
```

打开 `http://127.0.0.1:4177/dist/` 查看构建网页。安装 Python Playwright 并具备 Microsoft Edge 后，可执行 `python tests/browser-check.py` 验证真实时钟、时区、暂停、旋转、手机布局和骑行方向；`python tests/pedal-check.py` 检查踏板接触，`python tests/riding-pose-check.py` 检查握把、身体动作和循环衔接。

- `scene.js`：人物、自行车、海边场景、材质和交互。
- `daylight.js`：北京时间及连续光照插值。
- `index.html` / `style.css`：自我介绍和响应式排版。
- `scripts/build.mjs`：复制必要依赖，生成独立静态网页。
- `tests/` / `docs/`：测试和验证记录。
- `openspec/`：需求规范与归档。

验收截图可用 `?capture=1&hour=12`、`?capture=1&hour=18` 或 `?capture=1&hour=22` 固定预览时间，调用 `window.renderAt(毫秒)` 固定动画帧。移除参数即回到真实时钟。骑行动作完整循环 5400 毫秒，昼夜不跟随动画循环。

## GitHub 首页集成

完整页面地址：[鲸鱼娘的海边骑行](https://aeboli.github.io/aEboli/)。GitHub 个人简介中的骑行动图和“进入 3D 主页”均链接到这里；默认入口读取真实北京时间，不携带固定预览时间。

GitHub 个人简介 README 不运行 JavaScript，GIF 仅是动画预览，不会读取真实时间。真实昼夜、拖动视角和暂停在完整 3D 页面运行。

仓库以 `site/` 保存源码，以根目录 `docs/` 保存可直接发布的静态文件。更新时在 `site/` 执行：

```powershell
npm ci
npm test
npm run build:pages
```

检查构建结果后，将源码和 `docs/` 一起提交、推送。GitHub Pages 使用 `main` 分支的 `/docs` 目录；无需在访问者设备上安装 Node.js 或 Python。`npm run build` 仍生成 `site/dist/`，用于本地预览和独立交付。

## 模型来源与授权

面部、头发和手部来自 pixiv Inc. 的 `VRM1_Constraint_Twist_Sample` v1.0.1，版权为 `(c) 2022 pixiv Inc.`，已调整配色、比例和手指姿态；服装、自行车、环境和动画由代码构造。

来源：https://github.com/pixiv/three-vrm/tree/dev/packages/three-vrm/examples/models

授权：https://vrm.dev/licenses/1.0/

模型内嵌元数据允许使用、商业用途、修改和再分发，不强制署名；完整授权仍适用。`MODEL-LICENSE.json` 保留原始元数据。Three.js 版本固定为 `0.187.0`，浏览器依赖目录保留其 MIT 许可证。
