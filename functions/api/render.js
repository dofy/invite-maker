// POST /api/render — 服务端渲染邀请函（satori + resvg-wasm）
// 入参 JSON:
// {
//   background: "data:image/png;base64,..." | "https://...",   底图
//   canvas: { width, height },                                  输出分辨率
//   layers: [                                                   文本图层
//     { text, xPct, yPct, size, weight, color, align, spacing,
//       stroke, strokeW, font }
//   ]
// }
// 返回: image/png

import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
// wasm 作为静态模块导入，由 wrangler 打包进 Worker（而非运行时 fetch）
// 避免 "Wasm code generation disallowed by embedder" 错误
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm';

// resvg wasm 只初始化一次（Worker 复用实例）
let resvgReady = null;
async function ensureResvg() {
  if (!resvgReady) {
    resvgReady = initWasm(resvgWasm);
  }
  return resvgReady;
}

// 字体缓存
let fontCache = null;
async function loadFonts() {
  if (fontCache) return fontCache;
  // 从 public/fonts 下加载（部署时随静态资源分发）
  // 这里用 Google Fonts 的 Noto Sans SC 作兜底
  const urls = {
    normal:
      'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf',
    bold: 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/SC/NotoSansSC-Bold.otf',
  };
  const [reg, bold] = await Promise.all([
    fetch(urls.normal).then((r) => r.arrayBuffer()),
    fetch(urls.bold).then((r) => r.arrayBuffer()),
  ]);
  fontCache = [
    { name: 'Noto Sans SC', data: reg, weight: 400, style: 'normal' },
    { name: 'Noto Sans SC', data: bold, weight: 700, style: 'normal' },
  ];
  return fontCache;
}

// 用 satori 的元素树描述（不用 JSX，直接对象）
function el(type, props, children) {
  return { type, props: { ...props, children } };
}

function buildTree(cfg) {
  const { canvas, background, layers = [] } = cfg;
  const children = [];

  // 底图铺满
  if (background) {
    children.push(
      el('img', {
        src: background,
        width: canvas.width,
        height: canvas.height,
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: canvas.width,
          height: canvas.height,
          objectFit: 'cover',
        },
      })
    );
  }

  // 文本图层：以百分比定位，transform 居中
  for (const l of layers) {
    const align = l.align || 'center';
    const translateX =
      align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
    children.push(
      el(
        'div',
        {
          style: {
            position: 'absolute',
            left: `${l.xPct}%`,
            top: `${l.yPct}%`,
            transform: `translate(${translateX}, -50%)`,
            display: 'flex',
            flexDirection: 'column',
            textAlign: align,
            fontSize: l.size,
            fontWeight: l.weight || 400,
            color: l.color || '#000',
            letterSpacing: (l.spacing || 0) + 'px',
            fontFamily: 'Noto Sans SC',
            lineHeight: 1.3,
            whiteSpace: 'pre-wrap',
            // 描边用 text-shadow 近似（satori 不支持 -webkit-text-stroke）
            ...(l.strokeW > 0
              ? {
                  textShadow: buildStroke(l.stroke || '#000', l.strokeW),
                }
              : {}),
          },
        },
        String(l.text ?? '')
      )
    );
  }

  return el(
    'div',
    {
      style: {
        width: canvas.width,
        height: canvas.height,
        display: 'flex',
        position: 'relative',
      },
    },
    children
  );
}

// 描边近似：多方向阴影
function buildStroke(color, w) {
  const out = [];
  for (let x = -w; x <= w; x++)
    for (let y = -w; y <= w; y++)
      if (x || y) out.push(`${x}px ${y}px 0 ${color}`);
  return out.join(',');
}

export async function onRequestPost({ request }) {
  try {
    const cfg = await request.json();
    if (!cfg.canvas?.width || !cfg.canvas?.height) {
      return json({ error: 'canvas.width/height required' }, 400);
    }

    const fonts = await loadFonts();
    const svg = await satori(buildTree(cfg), {
      width: cfg.canvas.width,
      height: cfg.canvas.height,
      fonts,
    });

    await ensureResvg();
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: cfg.canvas.width },
    });
    const png = resvg.render().asPng();

    return new Response(png, {
      headers: {
        'content-type': 'image/png',
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
