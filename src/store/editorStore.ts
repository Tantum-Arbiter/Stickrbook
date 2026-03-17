/**
 * Editor Store - Zustand store for canvas, layers, selection, and history
 */

import { create } from 'zustand';
import type {
  EditorState,
  LayerOverlay,
  Selection,
  HistoryEntry,
  Page,
} from './types';

// Helper to generate short IDs
const generateId = () => Math.random().toString(36).substring(2, 10);

// Default canvas dimensions (from pinned info: 1080x704)
const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 704;

export const useEditorStore = create<EditorState>((set, get) => ({
  // Canvas state
  zoom: 1,
  panX: 0,
  panY: 0,
  canvasWidth: DEFAULT_WIDTH,
  canvasHeight: DEFAULT_HEIGHT,

  // Layer state
  layers: [],
  selectedLayerId: null,
  baseImagePath: null,

  // Selection state
  selection: null,
  isSelecting: false,

  // History
  history: [],
  historyIndex: -1,
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  // Tool state
  activeTool: 'select',

  // Zoom/pan actions
  setZoom: (zoom: number) => {
    set({ zoom: Math.max(0.1, Math.min(5, zoom)) });
  },

  setPan: (x: number, y: number) => {
    set({ panX: x, panY: y });
  },

  resetView: () => {
    set({ zoom: 1, panX: 0, panY: 0 });
  },

  fitToCanvas: () => {
    // Calculate zoom to fit canvas in viewport
    // This would need viewport dimensions in practice
    set({ zoom: 1, panX: 0, panY: 0 });
  },

  // Layer actions
  addLayer: (layer: Omit<LayerOverlay, 'id'>) => {
    const newLayer: LayerOverlay = {
      ...layer,
      id: generateId(),
    };
    get().pushHistory('Add layer');
    set((state) => ({
      layers: [...state.layers, newLayer],
      selectedLayerId: newLayer.id,
    }));
  },

  updateLayer: (id: string, data: Partial<LayerOverlay>) => {
    get().pushHistory('Update layer');
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, ...data } : l
      ),
    }));
  },

  deleteLayer: (id: string) => {
    get().pushHistory('Delete layer');
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== id),
      selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
    }));
  },

  selectLayer: (id: string | null) => {
    set({ selectedLayerId: id });
  },

  reorderLayers: (layerIds: string[]) => {
    get().pushHistory('Reorder layers');
    set((state) => {
      const orderedLayers = layerIds
        .map((id) => state.layers.find((l) => l.id === id))
        .filter((l): l is LayerOverlay => l !== undefined)
        .map((l, idx) => ({ ...l, zIndex: idx }));
      return { layers: orderedLayers };
    });
  },

  duplicateLayer: (id: string) => {
    const layer = get().layers.find((l) => l.id === id);
    if (!layer) return;
    get().pushHistory('Duplicate layer');
    const newLayer: LayerOverlay = {
      ...layer,
      id: generateId(),
      x: layer.x + 20,
      y: layer.y + 20,
      zIndex: get().layers.length,
    };
    set((state) => ({
      layers: [...state.layers, newLayer],
      selectedLayerId: newLayer.id,
    }));
  },

  // Selection actions
  setSelection: (selection: Selection | null) => {
    set({ selection, isSelecting: selection !== null });
  },

  clearSelection: () => {
    set({ selection: null, isSelecting: false });
  },

  // History actions
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const prevEntry = history[historyIndex - 1];
    set({
      layers: prevEntry.state.layers,
      baseImagePath: prevEntry.state.baseImage || null,
      historyIndex: historyIndex - 1,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const nextEntry = history[historyIndex + 1];
    set({
      layers: nextEntry.state.layers,
      baseImagePath: nextEntry.state.baseImage || null,
      historyIndex: historyIndex + 1,
    });
  },

  pushHistory: (action: string) => {
    const { layers, baseImagePath, history, historyIndex } = get();
    const entry: HistoryEntry = {
      id: generateId(),
      action,
      timestamp: Date.now(),
      state: {
        layers: JSON.parse(JSON.stringify(layers)),
        baseImage: baseImagePath || undefined,
      },
    };
    // Truncate any redo history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(entry);
    // Keep history limited to 50 entries
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  clearHistory: () => {
    set({ history: [], historyIndex: -1 });
  },

  // Tool actions
  setActiveTool: (tool: EditorState['activeTool']) => {
    set({ activeTool: tool });
  },

  // Load/save
  loadPage: (page: Page) => {
    get().clearHistory();
    set({
      baseImagePath: page.imagePath || null,
      layers: page.overlays || [],
      canvasWidth: page.width,
      canvasHeight: page.height,
      selectedLayerId: null,
      selection: null,
      zoom: 1,
      panX: 0,
      panY: 0,
    });
    get().pushHistory('Load page');
  },

  savePage: () => {
    const { layers, baseImagePath, canvasWidth, canvasHeight } = get();
    // Return a partial Page object with the editor state
    return {
      id: '',
      bookId: '',
      name: '',
      pageNumber: 0,
      width: canvasWidth,
      height: canvasHeight,
      imagePath: baseImagePath || undefined,
      overlays: layers,
      status: 'pending' as const,
      textLayout: 'text-below' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  setBaseImage: (path: string | null) => {
    get().pushHistory('Set base image');
    set({ baseImagePath: path });
  },
}));

