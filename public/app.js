// 邀请函编辑器 — 纯前端 Canvas 所见即所得
(() => {
  const stage = document.getElementById('stage');
  const bg = document.getElementById('bg');
  const layersEl = document.getElementById('layers');
  const editor = document.getElementById('editor');
  const fileInput = document.getElementById('file');

  let layers = [];      // { id, el, content, font, size, weight, color, align, spacing, stroke, strokeW, xPct, yPct }
  let selected = null;  // layer id
  let seq = 0;
  let natW = 0, natH = 0; // 原图分辨率

  // ---- 上传底图 ----
  function loadImage(file) {
    const url = URL.createObjectURL(file);
    bg.onload = () => {
      natW = bg.naturalWidth; natH = bg.naturalHeight;
      // 限制画布显示尺寸，最大 720 宽/高，保持比例
      const maxDim = 720;
      let dw = natW, dh = natH;
      if (dw > maxDim || dh > maxDim) {
        const r = Math.min(maxDim / dw, maxDim / dh);
        dw = Math.round(dw * r); dh = Math.round(dh * r);
      }
      stage.style.width = dw + 'px';
      stage.style.height = dh + 'px';
      bg.style.width = dw + 'px';
      bg.style.height = dh + 'px';
    };
    bg.src = url;
  }
  fileInput.addEventListener('change', e => { if (e.target.files[0]) loadImage(e.target.files[0]); });
  // 拖拽上传
  ['dragover','drop'].forEach(ev => document.getElementById('stage-wrap').addEventListener(ev, e => {
    e.preventDefault();
    if (ev === 'drop' && e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
  }));

  // ---- 添加文本图层 ----
  function addLayer(preset = {}) {
    const id = ++seq;
    const el = document.createElement('div');
    el.className = 'tbox';
    el.innerHTML = '<span class="txt"></span><span class="handle"></span>';
    stage.appendChild(el);

    const layer = {
      id, el,
      content: preset.content || '双击编辑文字',
      font: preset.font || '"PingFang SC","Microsoft YaHei",sans-serif',
      size: preset.size || 40,
      weight: preset.weight || '400',
      color: preset.color || '#ffffff',
      align: preset.align || 'center',
      spacing: preset.spacing || 0,
      stroke: preset.stroke || '#000000',
      strokeW: preset.strokeW || 0,
      xPct: preset.xPct ?? 50,
      yPct: preset.yPct ?? 50,
    };
    layers.push(layer);
    bindDrag(layer);
    render(layer);
    selectLayer(id);
    renderLayerList();
    return layer;
  }

  // ---- 渲染单个图层样式 ----
  function render(layer) {
    const t = layer.el.querySelector('.txt');
    t.textContent = layer.content;
    Object.assign(layer.el.style, {
      left: layer.xPct + '%',
      top: layer.yPct + '%',
      fontFamily: layer.font,
      fontSize: layer.size + 'px',
      fontWeight: layer.weight,
      color: layer.color,
      textAlign: layer.align,
      letterSpacing: layer.spacing + 'px',
    });
    if (layer.strokeW > 0) {
      layer.el.style.webkitTextStroke = layer.strokeW + 'px ' + layer.stroke;
    } else {
      layer.el.style.webkitTextStroke = '';
    }
  }

  // ---- 拖拽定位 + 缩放 ----
  function bindDrag(layer) {
    const el = layer.el;
    let mode = null, sx, sy, ox, oy, ssize;

    el.addEventListener('mousedown', e => {
      selectLayer(layer.id);
      if (e.target.classList.contains('handle')) {
        mode = 'resize'; ssize = layer.size; sy = e.clientY;
      } else {
        mode = 'move';
        const r = stage.getBoundingClientRect();
        ox = layer.xPct; oy = layer.yPct; sx = e.clientX; sy = e.clientY;
        el._rw = r.width; el._rh = r.height;
      }
      e.preventDefault();
    });
    el.addEventListener('dblclick', e => {
      const cur = prompt('编辑文字（\\n 换行请直接回车）', layer.content);
      if (cur !== null) { layer.content = cur; render(layer); syncEditor(); }
    });

    window.addEventListener('mousemove', e => {
      if (mode === 'move') {
        layer.xPct = Math.max(0, Math.min(100, ox + (e.clientX - sx) / el._rw * 100));
        layer.yPct = Math.max(0, Math.min(100, oy + (e.clientY - sy) / el._rh * 100));
        render(layer);
      } else if (mode === 'resize') {
        layer.size = Math.max(10, Math.min(200, ssize + (e.clientY - sy) * 0.5));
        render(layer); syncEditor();
      }
    });
    window.addEventListener('mouseup', () => { mode = null; });
  }

  // ---- 选中 / 图层列表 ----
  function selectLayer(id) {
    selected = id;
    layers.forEach(l => l.el.classList.toggle('selected', l.id === id));
    renderLayerList();
    syncEditor();
    editor.style.display = id ? 'flex' : 'none';
  }
  function renderLayerList() {
    layersEl.innerHTML = '';
    layers.forEach(l => {
      const item = document.createElement('div');
      item.className = 'layer-item' + (l.id === selected ? ' active' : '');
      item.innerHTML = `<span>${(l.content || '空').slice(0, 12)}</span><span class="del">✕</span>`;
      item.onclick = e => { if (!e.target.classList.contains('del')) selectLayer(l.id); };
      item.querySelector('.del').onclick = () => {
        l.el.remove(); layers = layers.filter(x => x.id !== l.id);
        if (selected === l.id) { selected = null; editor.style.display = 'none'; }
        renderLayerList();
      };
      layersEl.appendChild(item);
    });
  }

  // ---- 编辑器面板双向绑定 ----
  const ctrl = {
    txtContent: 'content', txtFont: 'font', txtSize: 'size', txtWeight: 'weight',
    txtColor: 'color', txtAlign: 'align', txtSpacing: 'spacing',
    txtStroke: 'stroke', txtStrokeW: 'strokeW',
  };
  function cur() { return layers.find(l => l.id === selected); }
  function syncEditor() {
    const l = cur(); if (!l) return;
    for (const [elId, key] of Object.entries(ctrl)) {
      const el = document.getElementById(elId);
      if (el) el.value = l[key];
    }
    document.getElementById('txtSizeVal').textContent = Math.round(l.size);
    document.getElementById('txtSpacingVal').textContent = l.spacing;
    document.getElementById('txtStrokeVal').textContent = l.strokeW;
  }
  for (const [elId, key] of Object.entries(ctrl)) {
    document.getElementById(elId).addEventListener('input', e => {
      const l = cur(); if (!l) return;
      l[key] = (key === 'size' || key === 'spacing' || key === 'strokeW') ? +e.target.value : e.target.value;
      if (key === 'size') document.getElementById('txtSizeVal').textContent = Math.round(l.size);
      if (key === 'spacing') document.getElementById('txtSpacingVal').textContent = l.spacing;
      if (key === 'strokeW') document.getElementById('txtStrokeVal').textContent = l.strokeW;
      render(l); renderLayerList();
    });
  }

  document.getElementById('addText').onclick = () => addLayer();

  // ---- 导出 PNG（Canvas 合成）----
  function exportPNG(hires) {
    if (!bg.src || !natW) { alert('请先上传底图'); return; }
    const scale = hires ? (natW / stage.offsetWidth) : 1;
    const cw = hires ? natW : stage.offsetWidth;
    const ch = hires ? natH : stage.offsetHeight;
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bg, 0, 0, cw, ch);

    layers.forEach(l => {
      const fs = l.size * scale;
      ctx.font = `${l.weight} ${fs}px ${l.font}`;
      ctx.fillStyle = l.color;
      ctx.textAlign = l.align === 'left' ? 'left' : l.align === 'right' ? 'right' : 'center';
      ctx.textBaseline = 'middle';
      const x = l.xPct / 100 * cw;
      const y = l.yPct / 100 * ch;
      const lines = String(l.content).split('\n');
      const lh = fs * 1.3;
      const startY = y - (lines.length - 1) * lh / 2;
      lines.forEach((line, i) => {
        // 字距：letterSpacing 需手动逐字（简化：canvas 无原生 letterSpacing，忽略微调）
        const ly = startY + i * lh;
        if (l.strokeW > 0) {
          ctx.lineWidth = l.strokeW * scale * 2;
          ctx.strokeStyle = l.stroke;
          ctx.lineJoin = 'round';
          ctx.strokeText(line, x, ly);
        }
        ctx.fillText(line, x, ly);
      });
    });

    canvas.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `invite_${Date.now()}.png`;
      a.click();
    }, 'image/png');
  }
  document.getElementById('exportBtn').onclick = () => exportPNG(false);
  document.getElementById('exportHiBtn').onclick = () => exportPNG(true);

  // ---- 导出模板配置 JSON（前后端共用同一份坐标/样式）----
  function buildTemplate(withBg) {
    return {
      canvas: { width: natW, height: natH },
      background: withBg ? bg.src : null,
      layers: layers.map(l => ({
        text: l.content,
        xPct: +l.xPct.toFixed(2),
        yPct: +l.yPct.toFixed(2),
        size: Math.round(l.size * (natW / stage.offsetWidth)),
        weight: l.weight,
        color: l.color,
        align: l.align,
        spacing: l.spacing,
        stroke: l.stroke,
        strokeW: l.strokeW,
        font: l.font,
      })),
    };
  }
  const exportTplBtn = document.getElementById('exportTplBtn');
  if (exportTplBtn) exportTplBtn.onclick = () => {
    const blob = new Blob([JSON.stringify(buildTemplate(false), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `invite-template_${Date.now()}.json`;
    a.click();
  };

  // ---- 服务端渲染（Worker satori+resvg，跨端字体一致 + 高清）----
  const serverBtn = document.getElementById('serverBtn');
  if (serverBtn) serverBtn.onclick = async () => {
    if (!bg.src || !natW) { alert('请先上传底图'); return; }
    serverBtn.disabled = true; serverBtn.textContent = '渲染中…';
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(buildTemplate(true)),
      });
      if (!res.ok) throw new Error((await res.json()).error || res.status);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `invite_server_${Date.now()}.png`;
      a.click();
    } catch (e) {
      alert('服务端渲染失败：' + e.message);
    } finally {
      serverBtn.disabled = false; serverBtn.textContent = '服务端渲染';
    }
  };

  // 点击空白取消选中
  stage.addEventListener('mousedown', e => { if (e.target === stage || e.target === bg) selectLayer(null); });

  // 默认给一个示例文本
  window.addEventListener('load', () => {
    // 等有底图再加，先放个提示
  });
})();
