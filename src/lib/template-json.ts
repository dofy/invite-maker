import { z } from 'zod';
import {
  DEFAULT_CANVAS_PADDING,
  MAX_TEMPLATE_BYTES,
  MAX_TEMPLATE_LAYERS,
  type CanvasModel,
  type TemplateFile,
  type TextLayer,
} from '../model';
import { AppError } from './app-error';

const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const layerSchema = z.object({
  text: z.string().max(20_000),
  // Re-anchoring an edge-positioned box can place its anchor outside the canvas
  // while the box itself remains in exactly the same place.
  xPct: z.number(),
  yPct: z.number(),
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
  if (new Blob([content]).size > MAX_TEMPLATE_BYTES) throw new AppError('errors.templateTooLarge');
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new AppError('errors.templateInvalidJson');
  }
  const parsed = templateSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new AppError('errors.templateFieldInvalid', { field: issue?.path.join('.') || 'root' });
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
