/**
 * BaseLayer
 * 
 * Abstract base class for all layer types.
 * Provides common functionality for layer management.
 */

import type { LayerData, BlendMode } from '../types';

export abstract class BaseLayer {
  id: string;
  type: LayerData['type'];
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  parentId: string | null;
  zIndex: number;

  constructor(data: LayerData) {
    this.id = data.id;
    this.type = data.type;
    this.name = data.name;
    this.visible = data.visible;
    this.locked = data.locked;
    this.opacity = data.opacity;
    this.blendMode = data.blendMode;
    this.x = data.x;
    this.y = data.y;
    this.width = data.width;
    this.height = data.height;
    this.rotation = data.rotation;
    this.scaleX = data.scaleX;
    this.scaleY = data.scaleY;
    this.parentId = data.parentId;
    this.zIndex = data.zIndex;
  }

  /**
   * Update layer properties
   */
  update(updates: Partial<LayerData>): void {
    Object.assign(this, updates);
  }

  /**
   * Get bounding box in world coordinates
   */
  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x,
      y: this.y,
      width: this.width * this.scaleX,
      height: this.height * this.scaleY,
    };
  }

  /**
   * Check if a point is inside the layer
   */
  containsPoint(x: number, y: number): boolean {
    const bounds = this.getBounds();
    return (
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height
    );
  }

  /**
   * Serialize layer to data object
   */
  abstract toData(): LayerData;

  /**
   * Clone the layer
   */
  abstract clone(): BaseLayer;

  /**
   * Render the layer (to be implemented by concrete classes)
   */
  abstract render(ctx: CanvasRenderingContext2D): void;
}

