import { describe, expect, it } from 'vitest';
import { buildTemplate, parseTemplateFile } from '../src/lib/template-json';
import { createTextLayer } from '../src/model';

describe('template JSON', () => {
  it('uses a descriptive default for new text layers', () => {
    expect(createTextLayer(12).text).toBe('Text');
  });

  it('uses black text by default for light placeholder backgrounds', () => {
    expect(createTextLayer(1).color).toBe('#000000');
  });

  it('migrates old templates without explicit anchors', () => {
    const parsed = parseTemplateFile(JSON.stringify({
      canvas: { width: 1200, height: 1600 },
      layers: [{
        text: 'Hello', xPct: 50, yPct: 50, size: 48, weight: '400', color: '#ffffff',
        align: 'right', spacing: 0, stroke: '#000000', strokeW: 0,
        font: 'Georgia,serif',
      }],
    }));
    expect(parsed.layers[0]).toMatchObject({ anchorX: 'right', anchorY: 'center', width: null });
  });

  it('never exports runtime ids or background data', () => {
    const template = buildTemplate(
      { width: 900, height: 1200, padding: 32 },
      [createTextLayer(1, { id: 'runtime-only' })],
    );
    expect(template.background).toBeNull();
    expect(template.layers[0]).not.toHaveProperty('id');
    expect(template.version).toBe(2);
  });

  it('round-trips anchors outside the canvas after re-anchoring', () => {
    const template = buildTemplate(
      { width: 900, height: 1200, padding: 32 },
      [createTextLayer(1, { xPct: -5, yPct: 105, anchorX: 'right', anchorY: 'top' })],
    );
    const parsed = parseTemplateFile(JSON.stringify(template));
    expect(parsed.layers[0]).toMatchObject({ xPct: -5, yPct: 105, anchorX: 'right', anchorY: 'top' });
  });
});
