# AGENTS.md — invite-maker

> 给 AI 编码助手（Codex / Cursor / Claude 等）的项目上下文。人类也可当作项目说明读。

## 项目目的

**邀请函生成器**：用户上传一张底图 → 在图上可视化叠加文字（拖拽定位占位符、调字体/字号/字重/颜色/对齐/字距/描边）→ 实时预览 → 导出高清 PNG。

典型场景：婚礼 / 生日 / 年会 / 活动邀请函，用户各自填字段并下载。

核心理念：**「所见即所得」编辑 + 「预览≈成品」渲染**。前端预览用的坐标/样式导出成一份模板 JSON，后端按同一份 JSON 渲染，保证预览和成品一致。

## 架构

**Cloudflare Pages（前端）+ Pages Functions（Worker 后端）**，同一项目、同一次部署。

```
浏览器编辑器（预览定位）            后端渲染（最终出图，可选）
─────────────────────            ─────────────────────
上传底图 → Canvas 预览            读取同一份模板 JSON
拖拽文本框、调样式        ──JSON──► satori 排版 → SVG
                                  resvg-wasm → PNG
导出：本地 Canvas PNG              返回 image/png
```

两种出图并存，用户按需选：

| 方式 | 实现 | 优点 | 取舍 |
|------|------|------|------|
| **本地渲染** | 浏览器 Canvas | 零后端、零成本、隐私好（图不出设备） | 依赖用户系统字体，跨端不保证一致 |
| **服务端渲染** | Worker + satori + resvg-wasm | 跨端字体一致（内嵌思源黑体）、超高清 | 走后端，受 Worker CPU 限制 |

## 目录结构

```
invite-maker/
├── public/                    # 静态前端（Pages 直接托管）
│   ├── index.html             # 编辑器 UI + 控制面板
│   └── app.js                 # 编辑器逻辑：上传/拖拽/预览/导出/调后端
├── functions/                 # Pages Functions（自动编译成 Worker）
│   └── api/
│       └── render.js          # POST /api/render — satori+resvg 服务端渲染
├── wrangler.toml              # Pages + Functions 配置
├── package.json
└── README.md
```

## 关键实现约定

- **坐标系**：文本图层用**百分比定位**（`xPct`/`yPct`，相对画布），导出时按原图分辨率还原。前后端共用这套坐标，保证一致。
- **字号缩放**：预览画布可能被缩小（最大 720px），导出/发后端时字号按 `natW / stage.offsetWidth` 比例放大回原图分辨率。
- **模板 JSON 格式**（前后端契约，见 README「服务端渲染 API」）：
  ```jsonc
  { "canvas": {"width","height"},
    "background": "data:image/... | https://...",
    "layers": [{ "text","xPct","yPct","size","weight","color","align","spacing","stroke","strokeW","font" }] }
  ```
- **描边**：Canvas 用 `strokeText`；satori 不支持 `-webkit-text-stroke`，用多方向 `text-shadow` 近似（见 `render.js` 的 `buildStroke`）。
- **WASM 加载**：resvg 的 wasm **必须静态 import**（`import wasm from '@resvg/resvg-wasm/index_bg.wasm'`）让 wrangler 打包进 Worker；**不能运行时 fetch 再 initWasm**，否则报 `Wasm code generation disallowed by embedder`。
- **wrangler 版本**：用 **4.x**（新 workerd 才支持打包的 wasm 模块）。

## 开发命令

```bash
pnpm install
pnpm dev          # wrangler pages dev（含 Functions），http://localhost:8788
pnpm deploy       # wrangler pages deploy public（首次需 wrangler login）
```

## 技术栈

- 前端：原生 HTML + JS + Canvas（无框架，保持轻量；后续可按需迁 React+Vite）
- 后端：Cloudflare Pages Functions（Worker），`satori` + `@resvg/resvg-wasm`
- 字体：服务端内嵌思源黑体 Noto Sans SC（400/700）
- 包管理：pnpm；Node 22+
- 部署：Cloudflare Pages（免费额度内）

## 免费额度说明

- Pages：无限静态请求 → 前端永久免费
- 本地 Canvas 渲染：零后端，永久 0 成本
- Worker（服务端渲染）：免费 10 万请求/天，⚠️ 每请求 10ms CPU 硬限，satori+resvg 可能超 → 高频/批量场景需升 $5/月 付费 Worker
- 不使用 Cloudflare Images（付费产品），叠字全靠 Canvas / satori

## 下一步计划

按优先级（✅ 已完成 / ⬜ 待做）：

- [x] 前端所见即所得编辑器（上传、拖拽定位、调样式、实时预览）
- [x] 本地 Canvas 导出 PNG（普通 + 高清）
- [x] 服务端渲染 API（satori + resvg-wasm，中文字体）
- [x] 导出模板 JSON（前后端共用坐标/样式）
- [ ] **部署上线**：`wrangler pages deploy` 到 Cloudflare Pages
- [ ] **模板系统**：预置几套邀请函模板（婚礼/生日/年会），用户只填字段
- [ ] **R2 存档 + 分享链接**：生成成品存 R2，返回可分享/下载的短链
- [ ] **批量生成**：一份模板 + 多组字段（如宾客名单）→ 批量出图 + zip 打包下载（参考老项目 `dofy/invitation-card-creator` 的能力）
- [ ] **字体子集化**：思源黑体全量较大，按需子集化减小 Worker 冷启动与流量
- [ ] **字距导出**：本地 Canvas 导出目前忽略 letterSpacing 微调，需逐字绘制补齐
- [ ] **多行富文本编辑**：当前双击用 `prompt` 编辑，可升级为行内编辑器
- [ ] **移动端适配**：面板/画布在小屏下的布局优化
- [ ] **撤销/重做 + 图层顺序拖拽**

## 相关项目

- 老项目 `dofy/invitation-card-creator`（2023，Next.js 13 + node-canvas）：重型服务端架构，需 Node 服务器，上不了 Pages 静态托管。本项目是全新的轻量 Cloudflare 版本，**不续做老仓库**，但批量生成 + zip 打包功能可参考搬运。
