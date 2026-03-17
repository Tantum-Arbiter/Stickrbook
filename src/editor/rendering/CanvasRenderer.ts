/**
 * CanvasRenderer
 * 
 * Renders layers to canvas with blend modes and transformations.
 */

import type { BlendMode, DocumentData } from '../types';
import { LayerManager } from '../core/LayerManager';
import { BaseLayer } from '../layers/BaseLayer';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private layerManager: LayerManager;
  private pixelRatio: number;

  constructor(canvas: HTMLCanvasElement, layerManager: LayerManager) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
    this.layerManager = layerManager;
    this.pixelRatio = window.devicePixelRatio || 1;
  }

  /**
   * Set canvas size
   */
  setSize(width: number, height: number): void {
    this.canvas.width = width * this.pixelRatio;
    this.canvas.height = height * this.pixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Render a document
   */
  renderDocument(document: DocumentData, viewport?: { zoom: number; panX: number; panY: number }): void {
    this.clear();

    // Apply viewport transformations
    this.ctx.save();
    if (viewport) {
      this.ctx.translate(viewport.panX, viewport.panY);
      this.ctx.scale(viewport.zoom, viewport.zoom);
    }

    // Draw background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, document.width, document.height);

    // Render layers in z-index order
    const layers = this.layerManager.getLayersSorted();
    layers.forEach(layer => {
      this.renderLayer(layer);
    });

    this.ctx.restore();
  }

  /**
   * Render a single layer
   */
  renderLayer(layer: BaseLayer): void {
    if (!layer.visible) return;

    this.ctx.save();

    // Apply blend mode
    this.ctx.globalCompositeOperation = this.getCompositeOperation(layer.blendMode);

    // Render the layer
    layer.render(this.ctx);

    this.ctx.restore();
  }

  /**
   * Get canvas composite operation for blend mode
   */
  private getCompositeOperation(blendMode: BlendMode): GlobalCompositeOperation {
    const blendModeMap: Record<BlendMode, GlobalCompositeOperation> = {
      normal: 'source-over',
      multiply: 'multiply',
      screen: 'screen',
      overlay: 'overlay',
      darken: 'darken',
      lighten: 'lighten',
      'color-dodge': 'color-dodge',
      'color-burn': 'color-burn',
      'hard-light': 'hard-light',
      'soft-light': 'soft-light',
      difference: 'difference',
      exclusion: 'exclusion',
    };

    return blendModeMap[blendMode] || 'source-over';
  }

  /**
   * Render pixel grid overlay
   */
  renderPixelGrid(zoom: number, gridSize: number = 1): void {
    if (zoom < 8) return; // Only show grid at high zoom levels

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.lineWidth = 1 / zoom;

    const width = this.canvas.width / this.pixelRatio;
    const height = this.canvas.height / this.pixelRatio;

    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Export canvas as data URL
   */
  toDataURL(type: string = 'image/png', quality: number = 1): string {
    return this.canvas.toDataURL(type, quality);
  }

  /**
   * Export canvas as blob
   */
  async toBlob(type: string = 'image/png', quality: number = 1): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.canvas.toBlob(resolve, type, quality);
    });
  }
}

