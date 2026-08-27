import { beforeEach, describe, expect, it } from 'vitest';
import { createTextLayer } from '../src/model';
import { useEditorStore } from '../src/store/editor';

describe('editor imported data invalidation', () => {
  beforeEach(() => {
    useEditorStore.getState().resetWorkspace();
  });

  it('keeps imported CSV rows when a newly inserted field already exists in the headers', () => {
    const layer = createTextLayer(1, { id: 'layer-1', text: '{{csv.name}}' });
    useEditorStore.setState({ layers: [layer], selectedId: layer.id });
    useEditorStore.getState().setImportedData(
      [{ name: 'Alice', city: 'Paris' }],
      ['name', 'city'],
      'csv:name',
    );

    useEditorStore.getState().updateLayer(layer.id, { text: '{{csv.name}} · {{csv.city}}' });

    expect(useEditorStore.getState()).toMatchObject({
      records: [{ name: 'Alice', city: 'Paris' }],
      headers: ['name', 'city'],
      importedSignature: 'csv:city\u0000name',
      previewIndex: 0,
    });
  });

  it('keeps imported CSV rows when an existing field is removed', () => {
    const layer = createTextLayer(1, { id: 'layer-1', text: '{{csv.name}} · {{csv.city}}' });
    useEditorStore.setState({ layers: [layer], selectedId: layer.id });
    useEditorStore.getState().setImportedData(
      [{ name: 'Alice', city: 'Paris' }],
      ['name', 'city'],
      'csv:city\u0000name',
    );

    useEditorStore.getState().updateLayer(layer.id, { text: '{{csv.name}}' });

    expect(useEditorStore.getState()).toMatchObject({
      records: [{ name: 'Alice', city: 'Paris' }],
      headers: ['name', 'city'],
      importedSignature: 'csv:name',
    });
  });

  it('clears imported rows when a new field is absent from the CSV headers', () => {
    const layer = createTextLayer(1, { id: 'layer-1', text: '{{csv.name}}' });
    useEditorStore.setState({ layers: [layer], selectedId: layer.id });
    useEditorStore.getState().setImportedData([{ name: 'Alice' }], ['name'], 'csv:name');

    useEditorStore.getState().updateLayer(layer.id, { text: '{{csv.name}} · {{csv.missing}}' });

    expect(useEditorStore.getState()).toMatchObject({
      records: [],
      headers: [],
      importedSignature: '',
      previewIndex: 0,
    });
  });
});
