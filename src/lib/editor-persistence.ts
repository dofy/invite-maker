import { z } from 'zod';
import { MAX_BATCH_ROWS, MAX_TEMPLATE_LAYERS, type BackgroundModel, type BatchRecord, type CanvasModel, type TextLayer } from '../model';
import { useEditorStore, type EditorState } from '../store/editor';
import { analyzeBindings } from './template';
import { PLACEHOLDER_ASSETS } from './placeholders';

const DATABASE_NAME = 'tsudoi-editor';
const DATABASE_VERSION = 1;
const STORE_NAME = 'workspace';
const SNAPSHOT_KEY = 'snapshot';
const BACKGROUND_KEY = 'background';
const SAVE_DELAY_MS = 180;

const layerSchema = z.object({
  id: z.string().min(1).max(100),
  text: z.string().max(20_000),
  xPct: z.number(),
  yPct: z.number(),
  size: z.number().min(1).max(2_000),
  width: z.number().min(40).max(20_000).nullable(),
  weight: z.string().max(100),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  align: z.enum(['left', 'center', 'right']),
  anchorX: z.enum(['left', 'center', 'right']),
  anchorY: z.enum(['top', 'center', 'bottom']),
  spacing: z.number().min(-100).max(1_000),
  stroke: z.string().regex(/^#[0-9a-f]{6}$/i),
  strokeW: z.number().min(0).max(100),
  font: z.string().min(1).max(1_000),
});

const snapshotSchema = z.object({
  version: z.literal(1),
  canvas: z.object({
    width: z.number().positive().max(50_000),
    height: z.number().positive().max(50_000),
    padding: z.number().min(0).max(20_000),
  }),
  background: z.object({
    url: z.string().max(2_000),
    name: z.string().max(1_000),
    naturalWidth: z.number().positive().max(50_000),
    naturalHeight: z.number().positive().max(50_000),
    isPlaceholder: z.boolean(),
  }),
  layers: z.array(layerSchema).max(MAX_TEMPLATE_LAYERS),
  selectedId: z.string().max(100).nullable(),
  records: z.array(z.record(z.string(), z.string())).max(MAX_BATCH_ROWS),
  headers: z.array(z.string()).max(2_000),
  importedSignature: z.string().max(100_000),
  previewIndex: z.number().int().min(0),
});

export type PersistedEditorSnapshot = z.infer<typeof snapshotSchema>;
type RestoredEditorState = Pick<
  EditorState,
  'canvas' | 'background' | 'layers' | 'selectedId' | 'records' | 'headers' |
  'importedSignature' | 'previewIndex' | 'batchProgress'
>;

let databasePromise: Promise<IDBDatabase> | null = null;
let initializationPromise: Promise<void> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: EditorState | null = null;
let writeQueue = Promise.resolve();

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
  });
}

function openDatabase() {
  if (!('indexedDB' in globalThis)) return Promise.reject(new Error('IndexedDB unavailable'));
  if (databasePromise) return databasePromise;
  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
  return databasePromise;
}

async function readWorkspace() {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const snapshotRequest = store.get(SNAPSHOT_KEY);
  const backgroundRequest = store.get(BACKGROUND_KEY);
  const [snapshot, background] = await Promise.all([
    requestResult<unknown>(snapshotRequest),
    requestResult<unknown>(backgroundRequest),
    transactionDone(transaction),
  ]);
  return { snapshot, background };
}

async function writeSnapshot(snapshot: PersistedEditorSnapshot) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  transaction.objectStore(STORE_NAME).put(snapshot, SNAPSHOT_KEY);
  await transactionDone(transaction);
}

async function writeWorkspace(snapshot: PersistedEditorSnapshot, background: Blob | null) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  store.put(snapshot, SNAPSHOT_KEY);
  if (background) store.put(background, BACKGROUND_KEY);
  else store.delete(BACKGROUND_KEY);
  await transactionDone(transaction);
}

async function clearWorkspace() {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  transaction.objectStore(STORE_NAME).clear();
  await transactionDone(transaction);
}

function reportPersistenceFailure(error: unknown) {
  console.warn('[Tsudoi] Local workspace persistence failed.', error instanceof Error ? error.message : 'Unknown error');
}

function enqueueWrite(operation: () => Promise<void>) {
  const result = writeQueue.catch(() => undefined).then(operation);
  writeQueue = result.catch(reportPersistenceFailure);
  return result;
}

export function createPersistedSnapshot(state: EditorState): PersistedEditorSnapshot {
  return {
    version: 1,
    canvas: state.canvas,
    background: {
      ...state.background,
      url: state.background.isPlaceholder ? state.background.url : '',
    },
    layers: state.layers,
    selectedId: state.selectedId,
    records: state.records,
    headers: state.headers,
    importedSignature: state.importedSignature,
    previewIndex: state.previewIndex,
  };
}

export function parsePersistedSnapshot(value: unknown): PersistedEditorSnapshot | null {
  const result = snapshotSchema.safeParse(value);
  return result.success ? result.data : null;
}

function restoredBackground(
  snapshot: PersistedEditorSnapshot,
  storedBlob: unknown,
  fallback: BackgroundModel,
  createObjectUrl: (blob: Blob) => string,
) {
  if (snapshot.background.isPlaceholder) {
    const asset = PLACEHOLDER_ASSETS.find((item) => item.url === snapshot.background.url);
    if (!asset) return fallback;
    return {
      url: asset.url,
      name: '',
      naturalWidth: asset.width,
      naturalHeight: asset.height,
      isPlaceholder: true,
    } satisfies BackgroundModel;
  }
  if (!(storedBlob instanceof Blob) || !storedBlob.type.startsWith('image/')) return fallback;
  return {
    ...snapshot.background,
    url: createObjectUrl(storedBlob),
    isPlaceholder: false,
  } satisfies BackgroundModel;
}

export function restoreEditorState(
  snapshot: PersistedEditorSnapshot,
  storedBlob: unknown,
  fallbackBackground: BackgroundModel,
  createObjectUrl: (blob: Blob) => string = URL.createObjectURL,
): RestoredEditorState {
  const background = restoredBackground(snapshot, storedBlob, fallbackBackground, createObjectUrl);
  const backgroundWasRestored = background !== fallbackBackground;
  const width = backgroundWasRestored ? background.naturalWidth : fallbackBackground.naturalWidth;
  const height = backgroundWasRestored ? background.naturalHeight : fallbackBackground.naturalHeight;
  const maxPadding = Math.floor(Math.min(width, height) / 2);
  const selectedId = snapshot.layers.some((layer) => layer.id === snapshot.selectedId)
    ? snapshot.selectedId
    : null;
  const bindingsAreCurrent = snapshot.records.length > 0
    && snapshot.importedSignature === analyzeBindings(snapshot.layers).signature;
  const records: BatchRecord[] = bindingsAreCurrent ? snapshot.records : [];
  const headers = bindingsAreCurrent ? snapshot.headers : [];

  return {
    canvas: {
      width,
      height,
      padding: Math.min(snapshot.canvas.padding, maxPadding),
    } satisfies CanvasModel,
    background,
    layers: snapshot.layers,
    selectedId,
    records,
    headers,
    importedSignature: bindingsAreCurrent ? snapshot.importedSignature : '',
    previewIndex: records.length ? Math.min(snapshot.previewIndex, records.length - 1) : 0,
    batchProgress: null,
  };
}

function flushPendingState() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  const state = pendingState;
  pendingState = null;
  if (state) enqueueWrite(() => writeSnapshot(createPersistedSnapshot(state)));
}

function scheduleStateSave(state: EditorState) {
  pendingState = state;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushPendingState, SAVE_DELAY_MS);
}

function saveBackgroundChange(state: EditorState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  pendingState = null;
  const snapshot = createPersistedSnapshot(state);
  enqueueWrite(async () => {
    const blob = state.background.isPlaceholder
      ? null
      : await fetch(state.background.url).then((response) => {
        if (!response.ok) throw new Error('Background image could not be read');
        return response.blob();
      });
    await writeWorkspace(snapshot, blob);
  });
}

function persistedFieldsChanged(state: EditorState, previous: EditorState) {
  return state.canvas !== previous.canvas
    || state.background !== previous.background
    || state.layers !== previous.layers
    || state.selectedId !== previous.selectedId
    || state.records !== previous.records
    || state.headers !== previous.headers
    || state.importedSignature !== previous.importedSignature
    || state.previewIndex !== previous.previewIndex;
}

async function initialize() {
  try {
    const stored = await readWorkspace();
    const snapshot = parsePersistedSnapshot(stored.snapshot);
    if (snapshot) {
      const current = useEditorStore.getState();
      useEditorStore.setState(restoreEditorState(snapshot, stored.background, current.background));
    }
  } catch (error) {
    reportPersistenceFailure(error);
  }

  useEditorStore.subscribe((state, previous) => {
    if (!persistedFieldsChanged(state, previous)) return;
    if (state.background.url !== previous.background.url) saveBackgroundChange(state);
    else scheduleStateSave(state);
  });
  window.addEventListener('pagehide', flushPendingState);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPendingState();
  });
}

export function initializeEditorPersistence() {
  initializationPromise ??= initialize();
  return initializationPromise;
}

export function clearEditorPersistence() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  pendingState = null;
  return enqueueWrite(clearWorkspace);
}
