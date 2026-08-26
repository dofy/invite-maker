export const MAX_BATCH_ROWS = 200;
export const MAX_TEMPLATE_BYTES = 1024 * 1024;
export const MAX_TEMPLATE_LAYERS = 200;
export const PLACEHOLDER_WIDTH = 900;
export const PLACEHOLDER_HEIGHT = 1200;
export const DEFAULT_CANVAS_PADDING = 32;

export type HorizontalAlign = 'left' | 'center' | 'right';
export type AnchorX = HorizontalAlign;
export type AnchorY = 'top' | 'center' | 'bottom';
export type BindingMode = 'none' | 'txt' | 'csv' | 'conflict';
export type BatchRecord = Record<string, string>;

export interface TextLayer {
  id: string;
  text: string;
  xPct: number;
  yPct: number;
  size: number;
  width: number | null;
  weight: string;
  color: string;
  align: HorizontalAlign;
  anchorX: AnchorX;
  anchorY: AnchorY;
  spacing: number;
  stroke: string;
  strokeW: number;
  font: string;
}

export interface CanvasModel {
  width: number;
  height: number;
  padding: number;
}

export interface BackgroundModel {
  url: string;
  name: string;
  naturalWidth: number;
  naturalHeight: number;
  isPlaceholder: boolean;
}

export interface BindingAnalysis {
  mode: BindingMode;
  fields: string[];
  signature: string;
}

export interface TemplateFile {
  version: 2;
  canvas: CanvasModel;
  background: null;
  layers: Array<Omit<TextLayer, 'id'>>;
}

export const DEFAULT_FONT = '"PingFang SC","Microsoft YaHei",sans-serif';

export function createTextLayer(index: number, preset: Partial<TextLayer> = {}): TextLayer {
  return {
    id: preset.id ?? crypto.randomUUID(),
    text: preset.text ?? `#${index}`,
    xPct: preset.xPct ?? 50,
    yPct: preset.yPct ?? 50,
    size: preset.size ?? 40,
    width: preset.width ?? null,
    weight: preset.weight ?? '400',
    color: preset.color ?? '#ffffff',
    align: preset.align ?? 'center',
    anchorX: preset.anchorX ?? 'center',
    anchorY: preset.anchorY ?? 'center',
    spacing: preset.spacing ?? 0,
    stroke: preset.stroke ?? '#000000',
    strokeW: preset.strokeW ?? 0,
    font: preset.font ?? DEFAULT_FONT,
  };
}
