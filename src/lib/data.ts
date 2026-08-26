import Papa from 'papaparse';
import { MAX_BATCH_ROWS, type BatchRecord, type BindingAnalysis } from '../model';
import { AppError } from './app-error';

export interface ImportedData {
  records: BatchRecord[];
  headers: string[];
}

function ensureRowLimit(records: BatchRecord[]) {
  if (records.length > MAX_BATCH_ROWS) {
    throw new AppError('errors.rowLimit', { max: MAX_BATCH_ROWS, count: records.length });
  }
  if (!records.length) throw new AppError('errors.noData');
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
    throw new AppError('errors.csvParse', { row: (first?.row ?? 0) + 2 });
  }
  const headers = result.meta.fields?.filter(Boolean) ?? [];
  const missing = requiredFields.filter((field) => !headers.includes(field));
  if (missing.length) throw new AppError('errors.csvMissingHeaders', { fields: missing.join(', ') });
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
  if (binding.mode === 'none') throw new AppError('errors.bindingMissing');
  if (binding.mode === 'conflict') throw new AppError('errors.bindingConflict', { txt: '{{txt}}', csv: '{{csv.*}}' });
  if (binding.mode === 'txt' && extension !== 'txt') throw new AppError('errors.needTxt', { txt: '{{txt}}' });
  if (binding.mode === 'csv' && extension !== 'csv') throw new AppError('errors.needCsv');
  const content = await file.text();
  return binding.mode === 'txt' ? parseTxt(content) : parseCsv(content, binding.fields);
}
