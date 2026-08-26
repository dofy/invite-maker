import type { BatchRecord, BindingAnalysis, TextLayer } from '../model';

const TXT_PATTERN = /{{\s*txt\s*}}/i;
const CSV_PATTERN = /{{\s*csv\.([^{}]+?)\s*}}/gi;
const INDEX_PATTERN = /{{\s*index(?:\s*:\s*(\d+))?\s*}}/gi;
const DYNAMIC_PATTERN = /{{\s*(datetime|date|time|uuid)\s*}}/gi;

export interface ResolveContext {
  record?: BatchRecord | null;
  index?: number;
  now?: Date;
  uuidByLayer?: Map<string, string>;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function formatDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatTime(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function analyzeBindings(layers: Pick<TextLayer, 'text'>[]): BindingAnalysis {
  let usesTxt = false;
  const fields = new Set<string>();

  for (const layer of layers) {
    if (TXT_PATTERN.test(layer.text)) usesTxt = true;
    TXT_PATTERN.lastIndex = 0;
    for (const match of layer.text.matchAll(CSV_PATTERN)) {
      const field = match[1]?.trim();
      if (field) fields.add(field);
    }
  }

  const sortedFields = [...fields].sort((a, b) => a.localeCompare(b));
  const mode = usesTxt && sortedFields.length ? 'conflict'
    : usesTxt ? 'txt'
      : sortedFields.length ? 'csv' : 'none';
  const signature = mode === 'csv' ? `csv:${sortedFields.join('\u0000')}` : mode;
  return { mode, fields: sortedFields, signature };
}

export function resolveTemplateText(
  template: string,
  context: ResolveContext,
  layerId: string,
) {
  const record = context.record ?? null;
  let output = template;

  output = output.replace(CSV_PATTERN, (raw, fieldText: string) => {
    const field = fieldText.trim();
    return record && Object.hasOwn(record, field) ? record[field] ?? '' : raw;
  });
  output = output.replace(TXT_PATTERN, (raw) => (
    record && Object.hasOwn(record, 'txt') ? record.txt ?? '' : raw
  ));
  output = output.replace(INDEX_PATTERN, (_raw, widthText?: string) => {
    const value = String(context.index ?? 1);
    if (!widthText) return value;
    const width = Math.max(1, Math.min(12, Number(widthText) || 1));
    return value.padStart(width, '0');
  });

  const now = context.now ?? new Date();
  output = output.replace(DYNAMIC_PATTERN, (_raw, rawToken: string) => {
    const token = rawToken.toLowerCase();
    if (token === 'date') return formatDate(now);
    if (token === 'time') return formatTime(now);
    if (token === 'datetime') return `${formatDate(now)} ${formatTime(now)}`;
    const uuids = context.uuidByLayer ?? new Map<string, string>();
    context.uuidByLayer = uuids;
    if (!uuids.has(layerId)) uuids.set(layerId, crypto.randomUUID());
    return uuids.get(layerId) ?? '';
  });
  return output;
}
