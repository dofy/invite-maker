import { describe, expect, it } from 'vitest';
import { parseCsv, parseTxt } from '../src/lib/data';

describe('batch import', () => {
  it('uses each non-empty TXT line as one record', () => {
    expect(parseTxt('\uFEFFAlice\n\n Bob \r\n').records).toEqual([{ txt: 'Alice' }, { txt: 'Bob' }]);
  });

  it('maps CSV rows by trimmed headers', () => {
    const result = parseCsv(' name,城市\nAlice,上海\nBob,东京', ['name', '城市']);
    expect(result.headers).toEqual(['name', '城市']);
    expect(result.records[1]).toEqual({ name: 'Bob', 城市: '东京' });
  });

  it('reports missing required headers', () => {
    expect(() => parseCsv('name\nAlice', ['name', 'date'])).toThrow('errors.csvMissingHeaders');
  });
});
