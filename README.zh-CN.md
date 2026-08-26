<div align="center">
  <img src="public/favicon.svg" width="88" height="88" alt="Tsudoi 标志" />
  <h1>Tsudoi</h1>
  <p><strong>设计一次，为每个人生成专属邀请函。</strong></p>
  <p>重视隐私的可视化邀请函编辑器，支持高清导出与 CSV/TXT 本地批量生成。</p>
  <p>
    <a href="https://tsudoi.yahaha.net"><strong>立即使用</strong></a>
    ·
    <a href="#本地开发">本地运行</a>
    ·
    <a href="https://github.com/dofy/invite-maker/issues">反馈建议</a>
  </p>
  <p>
    <img src="https://img.shields.io/github/package-json/v/dofy/invite-maker?style=flat-square&amp;color=b89a67" alt="当前版本" />
    <img src="https://img.shields.io/badge/PWA-offline_ready-456a64?style=flat-square" alt="支持离线的 PWA" />
    <img src="https://img.shields.io/badge/data-local_only-765a4a?style=flat-square" alt="数据仅在本地处理" />
    <img src="https://img.shields.io/badge/languages-8-4f647d?style=flat-square" alt="八种界面语言" />
  </p>
  <p><strong>简体中文</strong> · <a href="README.md">English</a> · <a href="README.ja.md">日本語</a></p>
</div>

![Tsudoi 可视化邀请函工作台](public/og-image.png)

Tsudoi 可以把一张设计底图，快速变成一张或一整批个性化邀请函。上传底图，在画布上添加并调整文字，即可下载原图分辨率 PNG；需要制作多个不同内容的版本时，还可以导入 CSV 或 TXT，在本地批量生成并打包下载。

> [!IMPORTANT]
> 底图、名单、模板和生成结果始终留在你的设备上。Tsudoi 没有素材上传或服务端图片渲染流程。

## 三步完成制作

| 1. 设计 | 2. 个性化 | 3. 导出 |
| --- | --- | --- |
| 上传竖版、横版或方形底图，添加文字并直接拖动排版，细调各项样式。 | 混合普通文字、CSV/TXT 与动态变量，导入数据后可逐条切换预览。 | 下载单张原图分辨率 PNG，或在本地生成最多 200 张图片并打包为 ZIP。 |

## 产品亮点

### 所见即所得的文字排版

- 文本框支持自由移动、固定宽度、自动换行与九宫格锚点
- 拖动位置或宽度时，可吸附画布边缘、中心、安全区及其他文本
- 预览和导出共用同一套坐标与渲染逻辑，成品保持原图尺寸
- 支持中、英、日、韩邀请函字体，并为网络字体准备系统回退
- 界面支持简体中文、繁体中文、英语、德语、日语、韩语、西班牙语和法语
- 支持跟随系统、浅色与深色主题，选择会保存在本地设备
- 支持安装为 PWA，首次打开后可离线使用编辑与导出功能
- 未上传底图时随机展示深色插画占位图，方便先熟悉编辑方式

### 一份模板，生成每个人的版本

普通文字与变量可以自由组合，例如：

```text
尊敬的 {{csv.姓名}}
诚邀您出席
席位编号：{{index:3}}
日期：{{date}}
```

导入名单后，点击任意数据行即可用对应内容预览。确认无误后，产品会逐张生成 PNG，并在本地打包为 ZIP。

### 数据只在本地设备处理

Tsudoi 不上传底图、模板或名单，也不依赖服务端图片合成。图片渲染、CSV/TXT 解析和 ZIP 打包全部在本地设备完成，不会在服务器留下素材副本。

## 可用变量

变量名称以及冒号两侧允许空格，例如 `{{ time }}`、`{{ index : 4 }}`。

| 变量 | 用途 |
| --- | --- |
| `{{txt}}` | 使用 TXT 当前行，每个非空行生成一张图片 |
| `{{csv.name}}` | 使用 CSV 当前行的 `name` 列，支持中文表头 |
| `{{date}}` | 当前本地日期，格式为 `YYYY-MM-DD` |
| `{{time}}` | 当前本地时间，格式为 `HH:mm:ss` |
| `{{datetime}}` | 当前本地日期与时间 |
| `{{index}}` | 从 1 开始的生成序号 |
| `{{index:3}}` | 补零到指定长度，例如 `001`，支持 1–12 位 |
| `{{uuid}}` | 为每张图片的每个文本图层生成独立 UUID |

## 导入数据

- 模板只使用 `{{txt}}` 时导入 TXT，每个非空行对应一张图片
- 模板使用 `{{csv.表头}}` 时导入带表头的 CSV，文件必须包含模板引用的列
- `{{txt}}` 和 `{{csv.*}}` 不能在同一模板中混用
- 单次最多处理 200 条记录，避免低内存设备失去响应
- CSV 与 TXT 建议使用 UTF-8 编码

## 模板可以重复使用

编辑器支持导入和导出模板 JSON。模板保存画布安全区、文字内容、变量、样式、宽度、坐标和锚点，不包含底图与名单，因此可以安全地交给其他人继续制作。

导入模板时，当前底图会保留，只替换文字图层和安全内边距。

## 产品边界

- 正式导出前必须上传真实底图，占位插画不会被当作成品底图
- 批量生成依赖设备性能，当前单次上限为 200 张
- Google Fonts 无法连接时会自动使用同语言系统字体，外观可能略有差异
- 模板不内嵌底图，迁移模板时需要另行提供图片文件

## 本地开发

需要 Node.js 22+ 与 pnpm：

```bash
pnpm install
pnpm dev
```

打开 `http://localhost:5173` 即可使用。

发布前可以执行完整检查：

```bash
pnpm check
```

项目为纯静态页面，可直接部署到 Cloudflare Pages。每次部署前会自动将第三段版本号提升到下一个偶数（例如 `2.3.6` 升级为 `2.3.8`）：

```bash
pnpm run deploy
```

生产构建默认使用 `https://tsudoi.yahaha.net` 作为 canonical 与 `og:url`。如需独立部署，可以通过环境变量覆盖：

```bash
VITE_SITE_URL=https://example.com pnpm build
```

## 产品技术

当前 Web 版本使用 React、TypeScript、Vite、Zustand 与 Konva 构建；Mantine 提供界面组件，Papa Parse 读取 CSV，Zod 校验模板，JSZip 生成压缩包。Cloudflare Pages 只负责分发静态页面，不接触用户素材。

## 后续方向

- 提供可直接使用的邀请函模板
- 增加撤销、重做和图层顺序调整
- 使用 Web Worker 改善大批次生成时的页面响应
- 增加更多语言字体与可复用排版预设

## GitHub

产品主站：[tsudoi.yahaha.net](https://tsudoi.yahaha.net)

项目地址：[github.com/dofy/invite-maker](https://github.com/dofy/invite-maker)

欢迎通过 Issues 提交产品建议、兼容性问题与使用反馈。
