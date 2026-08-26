# 邀请函生成器 (invite-maker)

上传底图 → 添加模板文本 → 可视化排版 → 下载单张 PNG，或导入 CSV/TXT 批量生成 PNG ZIP。

项目使用 React + Vite + TypeScript，部署为纯静态 Cloudflare Pages。图片合成、数据解析和 ZIP 打包全部在浏览器本地完成，底图与填充数据不会上传。

## 功能

- 上传或拖拽底图；未上传时显示内置邀请函占位图，正式导出仍要求真实底图
- 添加任意数量的模板文本，不需要定义类型或 key
- 模板文字可混合普通文字、导入数据和自动动态变量
- 中英日韩系统字体与 Google Fonts，生成图片前等待字体加载
- 编辑字体、字号、字重、颜色、对齐、锚点、固定宽度、字距和描边
- 九宫格锚点控制文本换行后的扩展方向；固定宽度支持数值或画布手柄调整
- 自定义安全内边距；拖动时吸附画布边缘、中心、安全区及其他文本框三轴边界
- Konva 百分比坐标定位，预览、单张与批量导出共用文本节点配置
- 移动端画布保持可见、控制面板独立滚动，支持鼠标、手指和触控笔
- 按底图原始分辨率生成单张 PNG
- 导入 CSV/TXT 后点击任意数据行切换预览，浏览器逐张生成并下载 ZIP
- 单次最多 200 条；CSV/TXT 使用 UTF-8 编码
- 导入或导出不含底图的模板 JSON

## 技术栈

- React + Vite + TypeScript：组件化界面、严格类型和静态构建
- Zustand：编辑器、图层、底图与批量数据状态
- Konva / react-konva：画布预览、拖拽、缩放、吸附与 PNG 合成
- Mantine + Tabler Icons：表单、通知、确认框与操作图标
- Papa Parse：CSV 解析；Zod：模板 JSON 校验；JSZip：浏览器端 ZIP 打包
- Vitest：模板变量、数据导入和模板兼容测试

## 字体

字体选择器按语言分组，并为网络字体配置同语言系统回退：

- 中文：Noto Sans SC、Noto Serif SC / TC、Ma Shan Zheng、ZCOOL XiaoWei
- English：Great Vibes、Playfair Display、Cormorant Garamond
- 日本語：Noto Serif JP、Shippori Mincho
- 한국어：Noto Serif KR、Gowun Batang

Google Fonts 通过官方 CSS API 加载；无法连接时编辑器和导出会使用系统字体。

## 模板变量

变量两侧允许空格，例如 `{{ time }}`、`{{ index : 4 }}`。

| 变量 | 生成内容 |
|---|---|
| `{{txt}}` | TXT 当前行；每个非空行生成一张图片 |
| `{{csv.name}}` | CSV 当前行的 `name` 列；表头也可使用中文 |
| `{{date}}` | 当前本地日期，格式 `YYYY-MM-DD` |
| `{{time}}` | 当前本地时间，格式 `HH:mm:ss` |
| `{{datetime}}` | 当前本地日期与时间 |
| `{{index}}` | 批量序号，从 1 开始；单张下载为 1 |
| `{{index:3}}` | 补零到 3 位，如 `001`；支持 1–12 位，超出不截断 |
| `{{uuid}}` | 每张图片、每个文本图层独立生成；同层重复引用复用 |

示例：`尊敬的 {{csv.姓名}}，日期 {{date}}，编号 {{index:4}}`。

## 数据导入规则

- 只使用 `{{txt}}`：只能导入 TXT
- 使用任意 `{{csv.表头}}`：只能导入带表头的 CSV，且必须覆盖模板引用字段
- `{{txt}}` 与 `{{csv.*}}` 不能混用
- 没有数据变量时无需导入，单张下载仍可使用动态变量
- 数据变量集合变化时已有导入失效；普通文字或样式变化不会清空
- 导入后默认预览第一条；单张下载使用当前选中记录，批量下载处理全部记录

## 本地开发

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm check        # TypeScript + Vitest + production build
pnpm preview      # 预览生产构建
```

## 部署到 Cloudflare Pages

```bash
pnpm deploy
```

Cloudflare Dashboard 连接 Git 仓库时，将构建命令设为 `pnpm build`，输出目录设为 `dist/`。

## 目录结构

```text
invite-maker/
├── index.html              # Vite 页面入口
├── src/
│   ├── components/         # 控制面板与 Konva 编辑画布
│   ├── lib/                # 数据、模板、图片与导出管线
│   ├── store/              # Zustand 编辑器状态
│   ├── model.ts            # TypeScript 领域模型
│   └── styles.css          # 响应式视觉样式
├── tests/                  # Vitest 核心逻辑测试
├── public/                 # favicon 与占位底图
├── wrangler.toml           # Cloudflare Pages 配置
├── vite.config.ts
├── package.json
└── README.md
```

## 模板 JSON

模板包含 `canvas` 与 `layers`，不内嵌底图和导入数据：

```jsonc
{
  "version": 2,
  "canvas": { "width": 1200, "height": 1600, "padding": 64 },
  "background": null,
  "layers": [
    {
      "text": "尊敬的 {{csv.姓名}}，编号 {{index:3}}",
      "xPct": 50,
      "yPct": 45,
      "size": 64,
      "width": 480,
      "weight": "700",
      "color": "#8B5A2B",
      "align": "center",
      "anchorX": "center",
      "anchorY": "bottom",
      "spacing": 2,
      "stroke": "#000000",
      "strokeW": 0,
      "font": "\"PingFang SC\",\"Microsoft YaHei\",sans-serif"
    }
  ]
}
```

`width` 为原图像素宽度，设为 `null` 或省略时随内容伸缩。旧模板省略锚点时，水平锚点沿用 `align`，垂直锚点默认为中心。

导入模板会校验内容，再替换图层与安全内边距；当前底图保持不变。文件最大 1 MB、最多 200 个图层，`background` 字段不会被读取。

## 后续增强方向

1. 预置婚礼、生日、年会等模板
2. 超大批次分段生成或迁入 Web Worker，降低主线程与峰值内存压力
3. 撤销/重做和图层顺序调整
