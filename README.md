# 邀请函生成器 (invite-maker)

上传底图 → 可视化叠加文字（拖拽定位、调字体/字号/颜色/描边）→ 实时预览 → 导出 PNG。

架构：**Cloudflare Pages（前端）+ Pages Functions（Worker 后端）**。

- **本地渲染**：浏览器 Canvas 导出，零后端、零成本、隐私好（图片不出设备）
- **服务端渲染**：Worker + `satori` + `resvg-wasm`，跨端字体一致（内嵌思源黑体）、超高清输出

两种导出并存，用户按需选。后期要加 R2 存档 / 分享链接 / 批量生成，直接在 `functions/` 下扩展即可。

## 功能

- 上传/拖拽底图，自动适配画布尺寸
- 添加多个文本图层，逐个编辑：
  - 内容（支持多行）、字体、字号、字重、颜色、对齐、字距、描边
- 拖动定位（百分比坐标，导出时按原图分辨率还原）
- 右下角圆点拖拽微调字号
- 图层列表：切换/删除
- 导出：普通 PNG（预览尺寸）/ 高清 PNG（原图分辨率）

## 本地预览

```bash
cd ~/Works/product/apps/invite-maker
pnpm install
pnpm dev          # wrangler pages dev（含 Functions），http://localhost:8788
```

## 部署到 Cloudflare Pages

```bash
pnpm deploy       # wrangler pages deploy public
# 首次会提示登录 + 创建项目；Functions 会随之部署
```

或在 Cloudflare Dashboard → Pages → 连接 Git 仓库，构建输出目录设为 `public/`。

## 目录结构

```
invite-maker/
├── public/
│   ├── index.html          # 编辑器 UI
│   └── app.js              # 编辑器逻辑（Canvas 预览/导出 + 模板 JSON + 调后端）
├── functions/
│   └── api/
│       └── render.js       # POST /api/render — satori+resvg 服务端渲染 PNG
├── wrangler.toml           # Cloudflare Pages + Functions 配置
├── package.json
└── README.md
```

## 服务端渲染 API

`POST /api/render`，Body 为模板 JSON（前端「导出模板 JSON」按钮的格式）：

```jsonc
{
  "canvas": { "width": 1200, "height": 1600 },
  "background": "data:image/png;base64,...",   // 或 https URL
  "layers": [
    { "text": "诚邀您", "xPct": 50, "yPct": 45, "size": 64,
      "weight": 700, "color": "#8B5A2B", "align": "center",
      "spacing": 2, "stroke": "#000", "strokeW": 0 }
  ]
}
```

返回 `image/png`。前后端共用同一份坐标/样式，保证预览 ≈ 成品。

## 后续增强方向（可选）

1. **服务端高清渲染**：加 Cloudflare Worker + `satori` + `resvg-wasm`，把文字参数发到边缘渲染，保证跨端字体一致、超高清输出。
2. **R2 存档**：生成成品存 R2，返回可分享的下载链接。
3. **模板系统**：预置几套邀请函模板（婚礼/生日/年会），用户只填字段。
4. **中文字体内嵌**：Canvas 依赖用户系统字体；如需保证一致，可 `@font-face` 加载 woff2 子集。
