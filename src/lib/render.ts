import Konva from 'konva';
import type { BatchRecord, CanvasModel, TextLayer } from '../model';
import { resolveTemplateText, type ResolveContext } from './template';
import { AppError } from './app-error';

export function anchorOffsetX(anchor: TextLayer['anchorX'], width: number) {
  if (anchor === 'left') return 0;
  if (anchor === 'right') return width;
  return width / 2;
}

export function anchorOffsetY(anchor: TextLayer['anchorY'], height: number) {
  if (anchor === 'top') return 0;
  if (anchor === 'bottom') return height;
  return height / 2;
}

export function textNodeConfig(layer: TextLayer, text: string, canvas: CanvasModel): Konva.TextConfig {
  return {
    id: layer.id,
    name: 'invitation-text',
    text,
    x: canvas.width * layer.xPct / 100,
    y: canvas.height * layer.yPct / 100,
    width: layer.width ?? undefined,
    fontFamily: layer.font,
    fontSize: layer.size,
    fontStyle: layer.weight,
    fill: layer.color,
    align: layer.align,
    verticalAlign: 'top',
    lineHeight: 1.3,
    letterSpacing: layer.spacing,
    stroke: layer.strokeW > 0 ? layer.stroke : undefined,
    strokeWidth: layer.strokeW,
    wrap: 'word',
    draggable: true,
    perfectDrawEnabled: false,
  };
}

export function applyAnchorOffset(node: Konva.Text, layer: TextLayer) {
  node.offsetX(anchorOffsetX(layer.anchorX, node.width()));
  node.offsetY(anchorOffsetY(layer.anchorY, node.height()));
}

export function createTextNode(layer: TextLayer, text: string, canvas: CanvasModel) {
  const node = new Konva.Text(textNodeConfig(layer, text, canvas));
  applyAnchorOffset(node, layer);
  return node;
}

export async function loadHtmlImage(url: string) {
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  await image.decode();
  return image;
}

export async function ensureFontsLoaded(layers: TextLayer[], texts: string[]) {
  if (!document.fonts) return;
  await Promise.all(layers.map((layer, index) => (
    document.fonts.load(`${layer.weight} ${layer.size}px ${layer.font}`, texts[index] ?? layer.text)
  )));
}

export async function renderInvitationBlob(
  backgroundUrl: string,
  canvas: CanvasModel,
  layers: TextLayer[],
  context: ResolveContext,
  cachedImage?: HTMLImageElement,
) {
  const texts = layers.map((layer) => resolveTemplateText(layer.text, context, layer.id));
  await ensureFontsLoaded(layers, texts);
  const image = cachedImage ?? await loadHtmlImage(backgroundUrl);
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-100000px';
  document.body.append(container);

  const stage = new Konva.Stage({ container, width: canvas.width, height: canvas.height });
  const scene = new Konva.Layer({ listening: false });
  scene.add(new Konva.Image({ image, width: canvas.width, height: canvas.height, listening: false }));
  for (let index = 0; index < layers.length; index += 1) {
    const layer = layers[index];
    if (layer) scene.add(createTextNode(layer, texts[index] ?? '', canvas).draggable(false));
  }
  stage.add(scene);
  scene.draw();

  try {
    const blob = await stage.toBlob({ mimeType: 'image/png', pixelRatio: 1 }) as Blob | null;
    if (!blob) throw new AppError('errors.renderPng');
    return blob;
  } finally {
    stage.destroy();
    container.remove();
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function safeFilePart(value: string) {
  return value.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim().slice(0, 80) || 'invitation';
}

export async function renderBatchZip(
  backgroundUrl: string,
  canvas: CanvasModel,
  layers: TextLayer[],
  records: BatchRecord[],
  onProgress: (progress: number) => void,
) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const now = new Date();
  const image = await loadHtmlImage(backgroundUrl);
  const firstField = Object.keys(records[0] ?? {})[0];

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (!record) continue;
    const blob = await renderInvitationBlob(backgroundUrl, canvas, layers, {
      record,
      index: index + 1,
      now,
      uuidByLayer: new Map(),
    }, image);
    const label = firstField ? record[firstField] : '';
    zip.file(`${String(index + 1).padStart(3, '0')}-${safeFilePart(label ?? '')}.png`, blob);
    onProgress((index + 1) / records.length * 0.85);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  return zip.generateAsync(
    { type: 'blob', compression: 'STORE', streamFiles: true },
    (metadata) => onProgress(0.85 + metadata.percent / 100 * 0.15),
  );
}
