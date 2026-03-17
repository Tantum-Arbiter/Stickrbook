/**
 * LayerManager
 * 
 * Manages layer tree traversal, hierarchy, and operations.
 */

import type { LayerData } from '../types';
import { BaseLayer } from '../layers/BaseLayer';
import { ImageLayer } from '../layers/ImageLayer';
import { TextLayer } from '../layers/TextLayer';
import { ShapeLayer } from '../layers/ShapeLayer';

export class LayerManager {
  private layers: Map<string, BaseLayer> = new Map();

  /**
   * Create a layer instance from data
   */
  createLayer(data: LayerData): BaseLayer {
    switch (data.type) {
      case 'image':
        return new ImageLayer(data);
      case 'text':
        return new TextLayer(data);
      case 'shape':
        return new ShapeLayer(data);
      default:
        throw new Error(`Unknown layer type: ${(data as any).type}`);
    }
  }

  /**
   * Add a layer to the manager
   */
  addLayer(layer: BaseLayer): void {
    this.layers.set(layer.id, layer);
  }

  /**
   * Remove a layer from the manager
   */
  removeLayer(id: string): void {
    this.layers.delete(id);
  }

  /**
   * Get a layer by ID
   */
  getLayer(id: string): BaseLayer | undefined {
    return this.layers.get(id);
  }

  /**
   * Get all layers
   */
  getAllLayers(): BaseLayer[] {
    return Array.from(this.layers.values());
  }

  /**
   * Get layers sorted by z-index
   */
  getLayersSorted(): BaseLayer[] {
    return this.getAllLayers().sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Get child layers of a parent
   */
  getChildren(parentId: string): BaseLayer[] {
    return this.getAllLayers().filter(layer => layer.parentId === parentId);
  }

  /**
   * Get root layers (no parent)
   */
  getRootLayers(): BaseLayer[] {
    return this.getAllLayers().filter(layer => layer.parentId === null);
  }

  /**
   * Get layer tree (hierarchical structure)
   */
  getLayerTree(): BaseLayer[] {
    const roots = this.getRootLayers();
    return this.buildTree(roots);
  }

  private buildTree(layers: BaseLayer[]): BaseLayer[] {
    return layers.map(layer => {
      const children = this.getChildren(layer.id);
      if (children.length > 0) {
        // Attach children to layer (for rendering purposes)
        (layer as any).children = this.buildTree(children);
      }
      return layer;
    });
  }

  /**
   * Find layers at a point
   */
  findLayersAtPoint(x: number, y: number): BaseLayer[] {
    return this.getLayersSorted()
      .reverse() // Top layers first
      .filter(layer => layer.visible && layer.containsPoint(x, y));
  }

  /**
   * Get layer bounds including all children
   */
  getLayerBoundsWithChildren(id: string): { x: number; y: number; width: number; height: number } | null {
    const layer = this.getLayer(id);
    if (!layer) return null;

    const bounds = layer.getBounds();
    const children = this.getChildren(id);

    if (children.length === 0) {
      return bounds;
    }

    // Calculate combined bounds
    let minX = bounds.x;
    let minY = bounds.y;
    let maxX = bounds.x + bounds.width;
    let maxY = bounds.y + bounds.height;

    children.forEach(child => {
      const childBounds = this.getLayerBoundsWithChildren(child.id);
      if (childBounds) {
        minX = Math.min(minX, childBounds.x);
        minY = Math.min(minY, childBounds.y);
        maxX = Math.max(maxX, childBounds.x + childBounds.width);
        maxY = Math.max(maxY, childBounds.y + childBounds.height);
      }
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Clear all layers
   */
  clear(): void {
    this.layers.clear();
  }
}

