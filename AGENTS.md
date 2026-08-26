# AGENTS.md — invite-maker

> 给 AI 编码助手（Codex / Cursor / Claude 等）的项目上下文。

## 项目目的

**邀请函生成器**：用户上传底图，在图上拖拽模板文本并调整样式，然后下载单张高清 PNG，或导入 CSV/TXT 批量生成 PNG ZIP。

核心原则：

- 所见即所得，预览与导出共用同一套 Konva 场景与百分比坐标
- 纯前端处理，底图和名单不离开用户设备
- 使用 React + Vite + TypeScript 组织编辑器状态，不引入后端

## 架构

项目是纯静态 Cloudflare Pages：

```text
上传底图 → Konva 预览 → 拖拽模板文本/调整样式
                         ├─ 下载当前图片：原图尺寸 PNG
导入 CSV/TXT ────────────└─ 批量生成 PNG → JSZip 打包 → 直接下载
```

不使用 Pages Functions、Worker 图片渲染、R2 或远程下载链接。

## 目录结构

```text
invite-maker/
├── index.html              # Vite 入口
├── src/
│   ├── components/         # React 控制面板与 Konva 编辑画布
│   ├── lib/                # 数据解析、模板校验、渲染与导出
│   ├── store/              # Zustand 编辑器状态
│   └── model.ts            # TypeScript 领域模型
├── tests/                  # Vitest 核心逻辑测试
├── public/                 # 占位底图与 favicon
├── wrangler.toml
├── vite.config.ts
└── package.json
```

## 关键约定

- **统一文本模型**：所有图层都是模板文本，只有内部 `id`；不区分 `data` / `fixed`，也不要求用户定义 key。
- **数据变量**：`{{txt}}` 读取 TXT 当前行；`{{csv.表头}}` 按 CSV 表头读取当前行字段。
- **导入推断**：扫描全部图层自动切换 TXT/CSV；两种数据变量不能混用；无数据变量时禁用批量导入。
- **导入失效**：仅在 TXT/CSV 数据变量集合变化时清空已有导入；固定文字、动态变量或样式变化不清空。
- **动态变量**：支持 `{{date}}`、`{{time}}`、`{{datetime}}`、`{{index}}`、`{{index:N}}`、`{{uuid}}`，变量名和冒号两侧允许空格。
- **序号补零**：`index:N` 的 N 限制为 1–12；不足位数左侧补零，数值超过位数时不截断。
- **动态值作用域**：批量序号从 1 开始；一次批处理共用基准时间；UUID 每张图片、每个图层独立生成，同层重复引用复用。
- **预览规则**：导入前数据变量保留原样；导入后默认选第一条，点击或键盘激活数据行可切换预览；画布和单张下载使用当前记录，批量生成处理全部记录。
- **空画布占位**：未上传时显示 `public/placeholder.svg` 并建立编辑画布，但禁止将占位图作为正式底图导出。
- **坐标系**：图层使用 `xPct` / `yPct`；Konva Stage 内部始终使用底图原始像素，只缩放预览 Stage。
- **九宫格锚点**：`align` 只控制框内文字对齐；`anchorX` 与 `anchorY` 独立决定坐标锚定的文本框边界。
- **文本框宽度**：`width` 为原图像素，`null` 表示随内容伸缩；固定宽度自动换行，可通过数值或 Transformer 手柄调整。
- **安全内边距与吸附**：`canvas.padding` 默认为 32 原图像素；拖动吸附画布边缘、中心、安全区和其他图层的左/中/右与上/中/下边界；Alt 临时关闭。
- **统一渲染**：预览、单张 PNG 和批量 PNG 必须复用 `src/lib/render.ts` 中的文本节点配置，禁止再维护独立 DOM 文本布局。
- **移动端布局**：竖屏上方画布固定可见、下方面板独立滚动；横屏小高度使用左右布局；交互兼容鼠标、手指和触控笔。
- **字体来源**：保留系统字体，通过 Google Fonts CSS API 提供中英日韩字体；每种网络字体必须带同语言系统回退。
- **UI 组件**：使用 Mantine 与 Tabler Icons；成功、失败与警告使用 Notifications，删除和覆盖使用 Modal；不得引入原生 `alert` / `confirm` / `prompt`。
- **Canvas 字体一致性**：生成 PNG 前调用 `document.fonts.load` 等待当前图层字体与字符子集。
- **批量导出**：浏览器逐张生成 PNG，按需加载 JSZip 后以 STORE 模式打包；PNG 不二次压缩。
- **批次上限**：单次最多 200 条，避免浏览器峰值内存失控。
- **模板 JSON**：包含 `canvas` 与 `layers`；不保存图层类型/key，也不内嵌底图。导入只替换图层与安全内边距，限制 1 MB / 200 图层并由 Zod 校验。
- **隐私边界**：不得为图片、模板或名单增加上传行为，除非用户明确改变产品方向。

## 开发命令

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm check        # TypeScript + Vitest + Vite build
pnpm deploy       # 构建并部署 dist
```

## 技术栈

- React + Vite + TypeScript
- Zustand、Konva / react-konva
- Mantine、Papa Parse、Zod、JSZip
- Vitest、pnpm、Node 22+
- Cloudflare Pages 静态托管

## 当前状态

- [x] 所见即所得编辑器
- [x] 无 key 的统一模板文本图层
- [x] TXT/CSV/日期时间/补零序号/UUID 变量
- [x] 中英日韩 Google Fonts 与导出前字体加载
- [x] 自动推断并校验 CSV/TXT 数据源
- [x] 原图分辨率单张 PNG 下载
- [x] 批量生成 PNG 并直接下载 ZIP
- [x] 导入与导出模板 JSON
- [x] Canvas 字距导出
- [x] 移动端自适应布局与触控拖拽
- [ ] 部署上线
- [ ] 预置模板系统
- [ ] 超大批次分段生成 / Web Worker
- [ ] 撤销/重做与图层顺序调整

## 相关项目

老项目 `dofy/invitation-card-creator` 使用 Next.js + node-canvas。本项目不延续其服务端架构，仅在需要时参考产品交互。
