import { z } from 'zod';
import {
  DEFAULT_CANVAS_PADDING,
  MAX_TEMPLATE_BYTES,
  MAX_TEMPLATE_LAYERS,
  type CanvasModel,
  type TemplateFile,
  type TextLayer,
} from '../model';

const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const layerSchema = z.object({
  text: z.string().max(20_000),
  xPct: z.number().min(0).max(100),
  yPct: z.number().min(0).max(100),
  size: z.number().min(1).max(2_000),
  width: z.number().min(40).max(20_000).nullable().optional().default(null),
  weight: z.union([z.string(), z.number()]).transform(String),
  color,
  align: z.enum(['left', 'center', 'right']),
  anchorX: z.enum(['left', 'center', 'right']).optional(),
  anchorY: z.enum(['top', 'center', 'bottom']).optional().default('center'),
  spacing: z.number().min(-100).max(1_000).default(0),
  stroke: color.default('#000000'),
  strokeW: z.number().min(0).max(100).default(0),
  font: z.string().min(1).max(1_000),
}).transform((layer) => ({
  ...layer,
  anchorX: layer.anchorX ?? layer.align,
}));

const templateSchema = z.object({
  version: z.number().optional(),
  canvas: z.object({
    width: z.number().positive().max(50_000),
    height: z.number().positive().max(50_000),
    padding: z.number().min(0).max(20_000).optional().default(DEFAULT_CANVAS_PADDING),
  }),
  background: z.unknown().optional(),
  layers: z.array(layerSchema).max(MAX_TEMPLATE_LAYERS),
});

export function parseTemplateFile(content: string): { canvas: CanvasModel; layers: Omit<TextLayer, 'id'>[] } {
  if (new Blob([content]).size > MAX_TEMPLATE_BYTES) throw new Error('模板文件不能超过 1 MB');
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new Error('模板不是有效的 JSON 文件');
  }
  const parsed = templateSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`模板字段 ${issue?.path.join('.') || 'root'} 无效：${issue?.message ?? '格式错误'}`);
  }
  return { canvas: parsed.data.canvas, layers: parsed.data.layers };
}

export function buildTemplate(canvas: CanvasModel, layers: TextLayer[]): TemplateFile {
  return {
    version: 2,
    canvas,
    background: null,
    layers: layers.map(({ id: _id, ...layer }) => layer),
  };
}
