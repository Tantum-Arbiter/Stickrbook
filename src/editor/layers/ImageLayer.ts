/**
 * ImageLayer
 * 
 * Layer type for raster images with filters and adjustments.
 */

import { BaseLayer } from './BaseLayer';
import type { ImageLayerData, FilterData } from '../types';

export class ImageLayer extends BaseLayer {
  imageData: string;
  originalImageData: string;
  filters: FilterData[];
  mask?: {
    data: string;
    enabled: boolean;
  };

  constructor(data: ImageLayerData) {
    super(data);
    this.imageData = data.imageData;
    this.originalImageData = data.originalImageData;
    this.filters = data.filters || [];
    this.mask = data.mask;
  }

  /**
   * Add a filter to the layer
   */
  addFilter(filter: FilterData): void {
    this.filters.push(filter);
  }

  /**
   * Remove a filter by ID
   */
  removeFilter(filterId: string): void {
    this.filters = this.filters.filter(f => f.id !== filterId);
  }

  /**
   * Update a filter
   */
  updateFilter(filterId: string, updates: Partial<FilterData>): void {
    const filter = this.filters.find(f => f.id === filterId);
    if (filter) {
      Object.assign(filter, updates);
    }
  }

  /**
   * Reset to original image (remove all filters)
   */
  resetToOriginal(): void {
    this.imageData = this.originalImageData;
    this.filters = [];
  }

  /**
   * Serialize to data object
   */
  toData(): ImageLayerData {
    return {
      id: this.id,
      type: 'image',
      name: this.name,
      visible: this.visible,
      locked: this.locked,
      opacity: this.opacity,
      blendMode: this.blendMode,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      parentId: this.parentId,
      zIndex: this.zIndex,
      imageData: this.imageData,
      originalImageData: this.originalImageData,
      filters: this.filters,
      mask: this.mask,
    };
  }

  /**
   * Clone the layer
   */
  clone(): ImageLayer {
    return new ImageLayer(this.toData());
  }

  /**
   * Render the layer
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    ctx.save();
    
    // Apply transformations
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.scale(this.scaleX, this.scaleY);
    
    // Draw image
    const img = new Image();
    img.src = this.imageData;
    ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
    
    ctx.restore();
  }
}

