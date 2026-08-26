# 邀请函生成器 (invite-maker)

上传底图 → 可视化叠加文字（拖拽定位、调字体/字号/颜色/描边）→ 实时预览 → 导出 PNG。

部署在 **Cloudflare Pages**（纯静态，无服务器成本）。

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
npx wrangler pages dev public
# 或不装 wrangler，直接起个静态服务器：
npx serve public
```

## 部署到 Cloudflare Pages

```bash
npx wrangler pages deploy public
# 首次会提示登录 + 创建项目
```

或在 Cloudflare Dashboard → Pages → 连接 Git 仓库，构建输出目录设为 `public/`。

## 目录结构

```
invite-maker/
├── public/
│   ├── index.html   # 编辑器 UI
│   └── app.js       # 编辑器逻辑（Canvas 合成 + 导出）
├── wrangler.toml    # Cloudflare Pages 配置
└── README.md
```

## 后续增强方向（可选）

1. **服务端高清渲染**：加 Cloudflare Worker + `satori` + `resvg-wasm`，把文字参数发到边缘渲染，保证跨端字体一致、超高清输出。
2. **R2 存档**：生成成品存 R2，返回可分享的下载链接。
3. **模板系统**：预置几套邀请函模板（婚礼/生日/年会），用户只填字段。
4. **中文字体内嵌**：Canvas 依赖用户系统字体；如需保证一致，可 `@font-face` 加载 woff2 子集。
