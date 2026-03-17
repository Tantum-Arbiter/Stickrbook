/**
 * AddLayerCommand Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AddLayerCommand } from './AddLayerCommand';
import { useDocumentStore } from '../../store/documentStore';
import type { ImageLayerData } from '../../types';

describe('AddLayerCommand', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useDocumentStore());
    act(() => {
      result.current.reset();
      result.current.createDocument('Test', 1920, 1080);
    });
  });

  it('should add a layer when executed', () => {
    const { result } = renderHook(() => useDocumentStore());
    
    const layerData: Omit<ImageLayerData, 'id'> = {
      type: 'image',
      name: 'Test Layer',
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

    const command = new AddLayerCommand(
      layerData,
      result.current.addLayer,
      result.current.deleteLayer,
      result.current.getLayer
    );

    act(() => {
      command.execute();
    });

    expect(result.current.document?.layers).toHaveLength(1);
    expect(result.current.document?.layers[0].name).toBe('Test Layer');
  });

  it('should remove the layer when undone', () => {
    const { result } = renderHook(() => useDocumentStore());
    
    const layerData: Omit<ImageLayerData, 'id'> = {
      type: 'image',
      name: 'Test Layer',
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

    const command = new AddLayerCommand(
      layerData,
      result.current.addLayer,
      result.current.deleteLayer
    );

    act(() => {
      command.execute();
    });

    expect(result.current.document?.layers).toHaveLength(1);

    act(() => {
      command.undo();
    });

    expect(result.current.document?.layers).toHaveLength(0);
  });

  it('should re-add the layer when redone', () => {
    const { result } = renderHook(() => useDocumentStore());
    
    const layerData: Omit<ImageLayerData, 'id'> = {
      type: 'image',
      name: 'Test Layer',
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

    const command = new AddLayerCommand(
      layerData,
      result.current.addLayer,
      result.current.deleteLayer,
      result.current.getLayer
    );

    act(() => {
      command.execute();
      command.undo();
      command.execute(); // Redo
    });

    expect(result.current.document?.layers).toHaveLength(1);
    expect(result.current.document?.layers[0].name).toBe('Test Layer');
  });

  it('should serialize correctly', () => {
    const { result } = renderHook(() => useDocumentStore());
    
    const layerData: Omit<ImageLayerData, 'id'> = {
      type: 'image',
      name: 'Test Layer',
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

    const command = new AddLayerCommand(
      layerData,
      result.current.addLayer,
      result.current.deleteLayer,
      result.current.getLayer
    );
    const serialized = command.serialize();

    expect(serialized.type).toBe('add-layer');
    expect(serialized.layerData).toEqual(layerData);
  });
});

