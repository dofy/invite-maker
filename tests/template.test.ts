import { describe, expect, it } from 'vitest';
import { analyzeBindings, resolveTemplateText } from '../src/lib/template';

describe('template variables', () => {
  it('detects CSV fields independent of order', () => {
    expect(analyzeBindings([
      { text: '{{ csv.name }} / {{csv.城市}}' },
      { text: '{{csv.name}}' },
    ])).toEqual({ mode: 'csv', fields: ['name', '城市'], signature: 'csv:name\u0000城市' });
  });

  it('rejects mixed TXT and CSV bindings through conflict mode', () => {
    expect(analyzeBindings([{ text: '{{txt}} {{csv.name}}' }])).toMatchObject({ mode: 'conflict' });
  });

  it('resolves imported and dynamic values with padded index', () => {
    const result = resolveTemplateText(
      '{{csv.name}} {{date}} {{time}} #{{index:4}} {{uuid}}/{{uuid}}',
      {
        record: { name: '小林' },
        index: 12,
        now: new Date(2026, 7, 27, 9, 5, 3),
        uuidByLayer: new Map([['layer-1', 'fixed-uuid']]),
      },
      'layer-1',
    );
    expect(result).toBe('小林 2026-08-27 09:05:03 #0012 fixed-uuid/fixed-uuid');
  });

  it('does not truncate indexes wider than the requested padding', () => {
    expect(resolveTemplateText('{{index:2}}', { index: 123 }, 'layer-1')).toBe('123');
  });
});
