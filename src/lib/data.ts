import Papa from 'papaparse';
import { MAX_BATCH_ROWS, type BatchRecord, type BindingAnalysis } from '../model';

export interface ImportedData {
  records: BatchRecord[];
  headers: string[];
}

function ensureRowLimit(records: BatchRecord[]) {
  if (records.length > MAX_BATCH_ROWS) {
    throw new Error(`单次最多导入 ${MAX_BATCH_ROWS} 条数据，当前文件有 ${records.length} 条`);
  }
  if (!records.length) throw new Error('文件中没有可用数据');
}

export function parseTxt(content: string): ImportedData {
  const records = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((txt) => ({ txt }));
  ensureRowLimit(records);
  return { records, headers: ['txt'] };
}

export function parseCsv(content: string, requiredFields: string[]): ImportedData {
  const result = Papa.parse<BatchRecord>(content.replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  });
  const fatalErrors = result.errors.filter((error) => error.code !== 'UndetectableDelimiter');
  if (fatalErrors.length) {
    const first = fatalErrors[0];
    throw new Error(`CSV 第 ${(first?.row ?? 0) + 2} 行解析失败：${first?.message ?? '格式错误'}`);
  }
  const headers = result.meta.fields?.filter(Boolean) ?? [];
  const missing = requiredFields.filter((field) => !headers.includes(field));
  if (missing.length) throw new Error(`CSV 缺少表头：${missing.join('、')}`);
  const records = result.data.map((row) => {
    const normalized: BatchRecord = {};
    for (const header of headers) normalized[header] = String(row[header] ?? '').trim();
    return normalized;
  });
  ensureRowLimit(records);
  return { records, headers };
}

export async function importDataFile(file: File, binding: BindingAnalysis) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (binding.mode === 'none') throw new Error('请先在文本中插入 TXT 或 CSV 数据变量');
  if (binding.mode === 'conflict') throw new Error('{{txt}} 与 {{csv.*}} 不能在同一模板中混用');
  if (binding.mode === 'txt' && extension !== 'txt') throw new Error('当前模板使用 {{txt}}，请导入 TXT 文件');
  if (binding.mode === 'csv' && extension !== 'csv') throw new Error('当前模板使用 CSV 字段，请导入 CSV 文件');
  const content = await file.text();
  return binding.mode === 'txt' ? parseTxt(content) : parseCsv(content, binding.fields);
}
