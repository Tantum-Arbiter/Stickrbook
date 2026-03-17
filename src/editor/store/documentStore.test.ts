/**
 * Document Store Tests
 * 
 * Tests for the Zustand document state management.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDocumentStore } from './documentStore';
import type { ImageLayerData, TextLayerData } from '../types';

describe('documentStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useDocumentStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('document creation', () => {
    it('should create a new document with default values', () => {
      const { result } = renderHook(() => useDocumentStore());
      
      act(() => {
        result.current.createDocument('Test Document', 1920, 1080);
      });

      const doc = result.current.document;
      expect(doc).toBeDefined();
      expect(doc?.name).toBe('Test Document');
      expect(doc?.width).toBe(1920);
      expect(doc?.height).toBe(1080);
      expect(doc?.layers).toEqual([]);
      expect(doc?.backgroundColor).toBe('#FFFFFF');
    });

    it('should generate unique document IDs', () => {
      const { result } = renderHook(() => useDocumentStore());
      
      act(() => {
        result.current.createDocument('Doc 1', 1920, 1080);
      });
      const id1 = result.current.document?.id;

      act(() => {
        result.current.createDocument('Doc 2', 1920, 1080);
      });
      const id2 = result.current.document?.id;

      expect(id1).not.toBe(id2);
    });
  });

  describe('layer management', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useDocumentStore());
      act(() => {
        result.current.createDocument('Test', 1920, 1080);
      });
    });

    it('should add an image layer', () => {
      const { result } = renderHook(() => useDocumentStore());
      
      const imageLayer: Omit<ImageLayerData, 'id'> = {
        type: 'image',
        name: 'Image 1',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        x: 0,
        y: 0,
        width: 500,
        height: 500,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        parentId: null,
        zIndex: 0,
        imageData: 'data:image/png;base64,test',
        originalImageData: 'data:image/png;base64,test',
        filters: [],
      };

      act(() => {
        result.current.addLayer(imageLayer);
      });

      expect(result.current.document?.layers).toHaveLength(1);
      expect(result.current.document?.layers[0].type).toBe('image');
      expect(result.current.document?.layers[0].name).toBe('Image 1');
    });

    it('should add a text layer', () => {
      const { result } = renderHook(() => useDocumentStore());
      
      const textLayer: Omit<TextLayerData, 'id'> = {
        type: 'text',
        name: 'Text 1',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        x: 100,
        y: 100,
        width: 300,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        parentId: null,
        zIndex: 1,
        text: 'Hello World',
        fontFamily: 'Arial',
        fontSize: 24,
        fontWeight: 'normal',
        fontStyle: 'normal',
        lineHeight: 1.2,
        letterSpacing: 0,
        textAlign: 'left',
        color: '#000000',
      };

      act(() => {
        result.current.addLayer(textLayer);
      });

      expect(result.current.document?.layers).toHaveLength(1);
      expect(result.current.document?.layers[0].type).toBe('text');
      const layer = result.current.document?.layers[0] as TextLayerData;
      expect(layer.text).toBe('Hello World');
    });

    it('should update a layer', () => {
      const { result } = renderHook(() => useDocumentStore());
      
      const imageLayer: Omit<ImageLayerData, 'id'> = {
        type: 'image',
        name: 'Image 1',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        x: 0,
        y: 0,
        width: 500,
        height: 500,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        parentId: null,
        zIndex: 0,
        imageData: 'data:image/png;base64,test',
        originalImageData: 'data:image/png;base64,test',
        filters: [],
      };

      act(() => {
        result.current.addLayer(imageLayer);
      });

      const layerId = result.current.document?.layers[0].id!;

      act(() => {
        result.current.updateLayer(layerId, { x: 100, y: 200, opacity: 0.5 });
      });

      const updatedLayer = result.current.document?.layers[0];
      expect(updatedLayer?.x).toBe(100);
      expect(updatedLayer?.y).toBe(200);
      expect(updatedLayer?.opacity).toBe(0.5);
    });

    it('should delete a layer', () => {
      const { result } = renderHook(() => useDocumentStore());

      const layer1: Omit<ImageLayerData, 'id'> = {
        type: 'image',
        name: 'Image 1',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        x: 0,
        y: 0,
        width: 500,
        height: 500,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        parentId: null,
        zIndex: 0,
        imageData: 'data:image/png;base64,test1',
        originalImageData: 'data:image/png;base64,test1',
        filters: [],
      };

      const layer2: Omit<ImageLayerData, 'id'> = {
        ...layer1,
        name: 'Image 2',
        imageData: 'data:image/png;base64,test2',
        originalImageData: 'data:image/png;base64,test2',
        zIndex: 1,
      };

      act(() => {
        result.current.addLayer(layer1);
        result.current.addLayer(layer2);
      });

      expect(result.current.document?.layers).toHaveLength(2);

      const layerId = result.current.document?.layers[0].id!;

      act(() => {
        result.current.deleteLayer(layerId);
      });

      expect(result.current.document?.layers).toHaveLength(1);
      expect(result.current.document?.layers[0].name).toBe('Image 2');
    });

    it('should reorder layers', () => {
      const { result } = renderHook(() => useDocumentStore());

      const layer1: Omit<ImageLayerData, 'id'> = {
        type: 'image',
        name: 'Layer 1',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        x: 0,
        y: 0,
        width: 500,
        height: 500,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        parentId: null,
        zIndex: 0,
        imageData: 'data:image/png;base64,test1',
        originalImageData: 'data:image/png;base64,test1',
        filters: [],
      };

      const layer2: Omit<ImageLayerData, 'id'> = {
        ...layer1,
        name: 'Layer 2',
        zIndex: 1,
      };

      const layer3: Omit<ImageLayerData, 'id'> = {
        ...layer1,
        name: 'Layer 3',
        zIndex: 2,
      };

      act(() => {
        result.current.addLayer(layer1);
        result.current.addLayer(layer2);
        result.current.addLayer(layer3);
      });

      const ids = result.current.document?.layers.map(l => l.id) || [];

      // Reorder: [0, 1, 2] -> [2, 0, 1]
      act(() => {
        result.current.reorderLayers([ids[2], ids[0], ids[1]]);
      });

      const reordered = result.current.document?.layers || [];
      expect(reordered[0].name).toBe('Layer 3');
      expect(reordered[1].name).toBe('Layer 1');
      expect(reordered[2].name).toBe('Layer 2');
    });
  });

  describe('selection', () => {
    it('should select a layer', () => {
      const { result } = renderHook(() => useDocumentStore());

      act(() => {
        result.current.createDocument('Test', 1920, 1080);
      });

      const layer: Omit<ImageLayerData, 'id'> = {
        type: 'image',
        name: 'Image 1',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        x: 0,
        y: 0,
        width: 500,
        height: 500,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        parentId: null,
        zIndex: 0,
        imageData: 'data:image/png;base64,test',
        originalImageData: 'data:image/png;base64,test',
        filters: [],
      };

      act(() => {
        result.current.addLayer(layer);
      });

      const layerId = result.current.document?.layers[0].id!;

      act(() => {
        result.current.selectLayer(layerId);
      });

      expect(result.current.selectedLayerIds).toContain(layerId);
    });

    it('should support multi-selection', () => {
      const { result } = renderHook(() => useDocumentStore());

      act(() => {
        result.current.createDocument('Test', 1920, 1080);
      });

      const layer1: Omit<ImageLayerData, 'id'> = {
        type: 'image',
        name: 'Image 1',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        x: 0,
        y: 0,
        width: 500,
        height: 500,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        parentId: null,
        zIndex: 0,
        imageData: 'data:image/png;base64,test1',
        originalImageData: 'data:image/png;base64,test1',
        filters: [],
      };

      const layer2: Omit<ImageLayerData, 'id'> = {
        ...layer1,
        name: 'Image 2',
        zIndex: 1,
      };

      act(() => {
        result.current.addLayer(layer1);
        result.current.addLayer(layer2);
      });

      const ids = result.current.document?.layers.map(l => l.id) || [];

      act(() => {
        result.current.selectLayers(ids);
      });

      expect(result.current.selectedLayerIds).toHaveLength(2);
      expect(result.current.selectedLayerIds).toContain(ids[0]);
      expect(result.current.selectedLayerIds).toContain(ids[1]);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => useDocumentStore());

      act(() => {
        result.current.createDocument('Test', 1920, 1080);
      });

      const layer: Omit<ImageLayerData, 'id'> = {
        type: 'image',
        name: 'Image 1',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        x: 0,
        y: 0,
        width: 500,
        height: 500,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        parentId: null,
        zIndex: 0,
        imageData: 'data:image/png;base64,test',
        originalImageData: 'data:image/png;base64,test',
        filters: [],
      };

      act(() => {
        result.current.addLayer(layer);
      });

      const layerId = result.current.document?.layers[0].id!;

      act(() => {
        result.current.selectLayer(layerId);
        result.current.clearSelection();
      });

      expect(result.current.selectedLayerIds).toHaveLength(0);
    });
  });
});

