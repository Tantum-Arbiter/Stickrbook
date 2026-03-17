/**
 * Document Store
 * 
 * Zustand store for managing the photo editor document state.
 * Handles document creation, layer management, and selection.
 */

import { create } from 'zustand';
import type { DocumentData, LayerData } from '../types';

// Helper to generate unique IDs
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

interface DocumentState {
  // Document
  document: DocumentData | null;
  
  // Selection
  selectedLayerIds: string[];
  
  // Viewport
  zoom: number;
  panX: number;
  panY: number;
  
  // Actions - Document
  createDocument: (name: string, width: number, height: number) => void;
  loadDocument: (document: DocumentData) => void;
  updateDocument: (updates: Partial<DocumentData>) => void;
  reset: () => void;
  
  // Actions - Layers
  addLayer: (layer: Omit<LayerData, 'id'>) => string;
  updateLayer: (id: string, updates: Partial<LayerData>) => void;
  deleteLayer: (id: string) => void;
  reorderLayers: (layerIds: string[]) => void;
  duplicateLayer: (id: string) => string | null;
  getLayer: (id: string) => LayerData | undefined;
  
  // Actions - Selection
  selectLayer: (id: string) => void;
  selectLayers: (ids: string[]) => void;
  clearSelection: () => void;
  toggleLayerSelection: (id: string) => void;
  
  // Actions - Viewport
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  fitToScreen: () => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  // Initial state
  document: null,
  selectedLayerIds: [],
  zoom: 1,
  panX: 0,
  panY: 0,
  
  // Document actions
  createDocument: (name: string, width: number, height: number) => {
    const now = new Date().toISOString();
    const document: DocumentData = {
      id: generateId(),
      name,
      width,
      height,
      layers: [],
      backgroundColor: '#FFFFFF',
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
    };
    
    set({
      document,
      selectedLayerIds: [],
      zoom: 1,
      panX: 0,
      panY: 0,
    });
  },
  
  loadDocument: (document: DocumentData) => {
    set({
      document,
      selectedLayerIds: [],
      zoom: 1,
      panX: 0,
      panY: 0,
    });
  },
  
  updateDocument: (updates: Partial<DocumentData>) => {
    const { document } = get();
    if (!document) return;
    
    set({
      document: {
        ...document,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    });
  },
  
  reset: () => {
    set({
      document: null,
      selectedLayerIds: [],
      zoom: 1,
      panX: 0,
      panY: 0,
    });
  },
  
  // Layer actions
  addLayer: (layer: Omit<LayerData, 'id'>) => {
    const { document } = get();
    if (!document) throw new Error('No document loaded');
    
    const id = generateId();
    const newLayer: LayerData = {
      ...layer,
      id,
    } as LayerData;
    
    set({
      document: {
        ...document,
        layers: [...document.layers, newLayer],
        updatedAt: new Date().toISOString(),
      },
    });
    
    return id;
  },
  
  updateLayer: (id: string, updates: Partial<LayerData>) => {
    const { document } = get();
    if (!document) return;
    
    set({
      document: {
        ...document,
        layers: document.layers.map(layer =>
          layer.id === id ? { ...layer, ...updates } : layer
        ),
        updatedAt: new Date().toISOString(),
      },
    });
  },
  
  deleteLayer: (id: string) => {
    const { document, selectedLayerIds } = get();
    if (!document) return;

    set({
      document: {
        ...document,
        layers: document.layers.filter(layer => layer.id !== id),
        updatedAt: new Date().toISOString(),
      },
      selectedLayerIds: selectedLayerIds.filter(selectedId => selectedId !== id),
    });
  },

  reorderLayers: (layerIds: string[]) => {
    const { document } = get();
    if (!document) return;

    // Create a map for quick lookup
    const layerMap = new Map(document.layers.map(layer => [layer.id, layer]));

    // Reorder layers based on the provided IDs
    const reorderedLayers = layerIds
      .map(id => layerMap.get(id))
      .filter((layer): layer is LayerData => layer !== undefined)
      .map((layer, index) => ({
        ...layer,
        zIndex: index,
      }));

    set({
      document: {
        ...document,
        layers: reorderedLayers,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  duplicateLayer: (id: string) => {
    const { document } = get();
    if (!document) return null;

    const layer = document.layers.find(l => l.id === id);
    if (!layer) return null;

    const newId = generateId();
    const duplicatedLayer: LayerData = {
      ...layer,
      id: newId,
      name: `${layer.name} Copy`,
      x: layer.x + 20,
      y: layer.y + 20,
      zIndex: document.layers.length,
    } as LayerData;

    set({
      document: {
        ...document,
        layers: [...document.layers, duplicatedLayer],
        updatedAt: new Date().toISOString(),
      },
    });

    return newId;
  },

  getLayer: (id: string) => {
    const { document } = get();
    if (!document) return undefined;
    return document.layers.find(layer => layer.id === id);
  },

  // Selection actions
  selectLayer: (id: string) => {
    set({ selectedLayerIds: [id] });
  },

  selectLayers: (ids: string[]) => {
    set({ selectedLayerIds: ids });
  },

  clearSelection: () => {
    set({ selectedLayerIds: [] });
  },

  toggleLayerSelection: (id: string) => {
    const { selectedLayerIds } = get();

    if (selectedLayerIds.includes(id)) {
      set({ selectedLayerIds: selectedLayerIds.filter(selectedId => selectedId !== id) });
    } else {
      set({ selectedLayerIds: [...selectedLayerIds, id] });
    }
  },

  // Viewport actions
  setZoom: (zoom: number) => {
    set({ zoom: Math.max(0.1, Math.min(16, zoom)) });
  },

  setPan: (x: number, y: number) => {
    set({ panX: x, panY: y });
  },

  resetView: () => {
    set({ zoom: 1, panX: 0, panY: 0 });
  },

  fitToScreen: () => {
    // This would need viewport dimensions in practice
    // For now, just reset to default view
    set({ zoom: 1, panX: 0, panY: 0 });
  },
}));

