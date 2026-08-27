import { describe, expect, it } from 'vitest';
import { createPersistedSnapshot, parsePersistedSnapshot, restoreEditorState } from '../src/lib/editor-persistence';
import { createTextLayer, type BackgroundModel } from '../src/model';
import { useEditorStore } from '../src/store/editor';

const fallback: BackgroundModel = {
  url: '/placeholders/portrait-01.webp',
  name: '',
  naturalWidth: 900,
  naturalHeight: 1200,
  isPlaceholder: true,
};

describe('editor persistence', () => {
  it('stores editor data without transient URLs or batch progress', () => {
    const state = useEditorStore.getState();
    const snapshot = createPersistedSnapshot({
      ...state,
      background: { url: 'blob:temporary', name: 'invite.png', naturalWidth: 1600, naturalHeight: 900, isPlaceholder: false },
      layers: [createTextLayer(1, { id: 'layer-1', text: '{{txt}}' })],
      records: [{ txt: 'Alice' }],
      headers: ['txt'],
      importedSignature: 'txt',
      previewIndex: 0,
      batchProgress: 0.5,
    });

    expect(snapshot.background.url).toBe('');
    expect(snapshot.records).toEqual([{ txt: 'Alice' }]);
    expect(snapshot).not.toHaveProperty('batchProgress');
  });

  it('restores the image, selected layer, imported rows and bounded preview index', () => {
    const layer = createTextLayer(1, { id: 'layer-1', text: '{{txt}}' });
    const snapshot = parsePersistedSnapshot({
      version: 1,
      canvas: { width: 1600, height: 900, padding: 42 },
      background: { url: '', name: 'invite.png', naturalWidth: 1600, naturalHeight: 900, isPlaceholder: false },
      layers: [layer],
      selectedId: layer.id,
      records: [{ txt: 'Alice' }, { txt: 'Bob' }],
      headers: ['txt'],
      importedSignature: 'txt',
      previewIndex: 99,
    });
    expect(snapshot).not.toBeNull();

    const restored = restoreEditorState(
      snapshot!,
      new Blob(['image'], { type: 'image/png' }),
      fallback,
      () => 'blob:restored',
    );

    expect(restored.background).toMatchObject({ url: 'blob:restored', name: 'invite.png', isPlaceholder: false });
    expect(restored.canvas).toEqual({ width: 1600, height: 900, padding: 42 });
    expect(restored.selectedId).toBe(layer.id);
    expect(restored.records).toHaveLength(2);
    expect(restored.previewIndex).toBe(1);
    expect(restored.batchProgress).toBeNull();
  });

  it('drops stale imported rows and safely falls back when the saved image is unavailable', () => {
    const snapshot = parsePersistedSnapshot({
      version: 1,
      canvas: { width: 3000, height: 2000, padding: 700 },
      background: { url: '', name: 'missing.png', naturalWidth: 3000, naturalHeight: 2000, isPlaceholder: false },
      layers: [createTextLayer(1, { id: 'layer-1', text: 'Fixed text' })],
      selectedId: 'missing-layer',
      records: [{ txt: 'Alice' }],
      headers: ['txt'],
      importedSignature: 'txt',
      previewIndex: 0,
    });

    const restored = restoreEditorState(snapshot!, null, fallback, () => 'unused');

    expect(restored.background).toBe(fallback);
    expect(restored.canvas).toEqual({ width: 900, height: 1200, padding: 450 });
    expect(restored.selectedId).toBeNull();
    expect(restored.records).toEqual([]);
    expect(restored.importedSignature).toBe('');
  });

  it('ignores malformed or future snapshots', () => {
    expect(parsePersistedSnapshot({ version: 2 })).toBeNull();
    expect(parsePersistedSnapshot({ version: 1, layers: 'invalid' })).toBeNull();
  });

  it('resets every workspace field while keeping editor actions available', () => {
    useEditorStore.setState({
      background: { url: 'blob:temporary', name: 'invite.png', naturalWidth: 1600, naturalHeight: 900, isPlaceholder: false },
      canvas: { width: 1600, height: 900, padding: 88 },
      layers: [createTextLayer(1, { id: 'layer-1', text: '{{txt}}' })],
      selectedId: 'layer-1',
      records: [{ txt: 'Alice' }],
      headers: ['txt'],
      importedSignature: 'txt',
      previewIndex: 0,
      batchProgress: 0.5,
    });

    useEditorStore.getState().resetWorkspace();
    const reset = useEditorStore.getState();

    expect(reset.background.isPlaceholder).toBe(true);
    expect(reset.canvas).toMatchObject({
      width: reset.background.naturalWidth,
      height: reset.background.naturalHeight,
      padding: 32,
    });
    expect(reset.layers).toEqual([]);
    expect(reset.selectedId).toBeNull();
    expect(reset.records).toEqual([]);
    expect(reset.headers).toEqual([]);
    expect(reset.importedSignature).toBe('');
    expect(reset.previewIndex).toBe(0);
    expect(reset.batchProgress).toBeNull();
    expect(reset.addLayer).toBeTypeOf('function');
  });
});
