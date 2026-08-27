import { create } from 'zustand';
import {
  DEFAULT_CANVAS_PADDING,
  createTextLayer,
  type BackgroundModel,
  type BatchRecord,
  type CanvasModel,
  type TextLayer,
} from '../model';
import { analyzeBindings } from '../lib/template';
import { selectRandomPlaceholder } from '../lib/placeholders';

export interface EditorState {
  canvas: CanvasModel;
  background: BackgroundModel;
  layers: TextLayer[];
  selectedId: string | null;
  records: BatchRecord[];
  headers: string[];
  importedSignature: string;
  previewIndex: number;
  batchProgress: number | null;
  addLayer: (text?: string) => void;
  removeLayer: (id: string) => void;
  selectLayer: (id: string | null) => void;
  updateLayer: (id: string, patch: Partial<TextLayer>) => void;
  replaceTemplate: (canvas: CanvasModel, layers: Omit<TextLayer, 'id'>[]) => void;
  setBackground: (background: BackgroundModel) => void;
  setPadding: (padding: number) => void;
  setImportedData: (records: BatchRecord[], headers: string[], signature: string) => void;
  clearImportedData: () => void;
  setPreviewIndex: (index: number) => void;
  setBatchProgress: (progress: number | null) => void;
  resetWorkspace: () => void;
}

const placeholder: BackgroundModel = selectRandomPlaceholder();

function invalidateDataWhenBindingsChange(
  previousLayers: TextLayer[],
  nextLayers: TextLayer[],
  state: EditorState,
) {
  const before = analyzeBindings(previousLayers);
  const after = analyzeBindings(nextLayers);
  if (before.signature === after.signature) return {};

  const importedCsvStillMatches = state.records.length > 0
    && state.importedSignature === before.signature
    && after.mode === 'csv'
    && after.fields.every((field) => state.headers.includes(field));
  if (importedCsvStillMatches) return { importedSignature: after.signature };

  return { records: [], headers: [], importedSignature: '', previewIndex: 0 };
}

export const useEditorStore = create<EditorState>((set) => ({
  canvas: {
    width: placeholder.naturalWidth,
    height: placeholder.naturalHeight,
    padding: DEFAULT_CANVAS_PADDING,
  },
  background: placeholder,
  layers: [],
  selectedId: null,
  records: [],
  headers: [],
  importedSignature: '',
  previewIndex: 0,
  batchProgress: null,

  addLayer: (text) => set((state) => {
    const layer = createTextLayer(state.layers.length + 1, text ? { text } : {});
    return { layers: [...state.layers, layer], selectedId: layer.id };
  }),
  removeLayer: (id) => set((state) => {
    const layers = state.layers.filter((layer) => layer.id !== id);
    return {
      layers,
      selectedId: state.selectedId === id ? layers.at(-1)?.id ?? null : state.selectedId,
      ...invalidateDataWhenBindingsChange(state.layers, layers, state),
    };
  }),
  selectLayer: (selectedId) => set({ selectedId }),
  updateLayer: (id, patch) => set((state) => {
    const layers = state.layers.map((layer) => layer.id === id ? { ...layer, ...patch } : layer);
    return { layers, ...invalidateDataWhenBindingsChange(state.layers, layers, state) };
  }),
  replaceTemplate: (canvas, rawLayers) => set((state) => {
    const layers = rawLayers.map((layer, index) => createTextLayer(index + 1, layer));
    const padding = Math.max(0, Math.min(canvas.padding, Math.floor(Math.min(state.canvas.width, state.canvas.height) / 2)));
    return {
      canvas: { ...canvas, width: state.canvas.width, height: state.canvas.height, padding },
      layers,
      selectedId: layers[0]?.id ?? null,
      records: [],
      headers: [],
      importedSignature: '',
      previewIndex: 0,
    };
  }),
  setBackground: (background) => set((state) => ({
    background,
    canvas: {
      ...state.canvas,
      width: background.naturalWidth,
      height: background.naturalHeight,
      padding: Math.min(state.canvas.padding, Math.floor(Math.min(background.naturalWidth, background.naturalHeight) / 2)),
    },
  })),
  setPadding: (padding) => set((state) => ({
    canvas: {
      ...state.canvas,
      padding: Math.max(0, Math.min(padding, Math.floor(Math.min(state.canvas.width, state.canvas.height) / 2))),
    },
  })),
  setImportedData: (records, headers, importedSignature) => set({
    records, headers, importedSignature, previewIndex: 0,
  }),
  clearImportedData: () => set({ records: [], headers: [], importedSignature: '', previewIndex: 0 }),
  setPreviewIndex: (previewIndex) => set({ previewIndex }),
  setBatchProgress: (batchProgress) => set({ batchProgress }),
  resetWorkspace: () => set(() => {
    const background = selectRandomPlaceholder();
    return {
      canvas: {
        width: background.naturalWidth,
        height: background.naturalHeight,
        padding: DEFAULT_CANVAS_PADDING,
      },
      background,
      layers: [],
      selectedId: null,
      records: [],
      headers: [],
      importedSignature: '',
      previewIndex: 0,
      batchProgress: null,
    };
  }),
}));

export function getSelectedLayer(state: EditorState) {
  return state.layers.find((layer) => layer.id === state.selectedId) ?? null;
}
