/**
 * ViewportManager
 * 
 * Manages viewport state (zoom, pan) and coordinate transformations.
 */

export class ViewportManager {
  private zoom: number = 1;
  private panX: number = 0;
  private panY: number = 0;
  private minZoom: number = 0.1;
  private maxZoom: number = 16;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  /**
   * Set zoom level
   */
  setZoom(zoom: number): void {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
  }

  /**
   * Get current zoom level
   */
  getZoom(): number {
    return this.zoom;
  }

  /**
   * Zoom in
   */
  zoomIn(factor: number = 1.2): void {
    this.setZoom(this.zoom * factor);
  }

  /**
   * Zoom out
   */
  zoomOut(factor: number = 1.2): void {
    this.setZoom(this.zoom / factor);
  }

  /**
   * Zoom to fit content
   */
  zoomToFit(contentWidth: number, contentHeight: number, padding: number = 50): void {
    const zoomX = (this.canvasWidth - padding * 2) / contentWidth;
    const zoomY = (this.canvasHeight - padding * 2) / contentHeight;
    this.setZoom(Math.min(zoomX, zoomY));
    this.centerContent(contentWidth, contentHeight);
  }

  /**
   * Zoom to actual size (100%)
   */
  zoomToActualSize(): void {
    this.setZoom(1);
  }

  /**
   * Set pan position
   */
  setPan(x: number, y: number): void {
    this.panX = x;
    this.panY = y;
  }

  /**
   * Get pan position
   */
  getPan(): { x: number; y: number } {
    return { x: this.panX, y: this.panY };
  }

  /**
   * Pan by delta
   */
  panBy(dx: number, dy: number): void {
    this.panX += dx;
    this.panY += dy;
  }

  /**
   * Center content in viewport
   */
  centerContent(contentWidth: number, contentHeight: number): void {
    this.panX = (this.canvasWidth - contentWidth * this.zoom) / 2;
    this.panY = (this.canvasHeight - contentHeight * this.zoom) / 2;
  }

  /**
   * Reset viewport to default
   */
  reset(): void {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
  }

  /**
   * Convert screen coordinates to canvas coordinates
   */
  screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.panX) / this.zoom,
      y: (screenY - this.panY) / this.zoom,
    };
  }

  /**
   * Convert canvas coordinates to screen coordinates
   */
  canvasToScreen(canvasX: number, canvasY: number): { x: number; y: number } {
    return {
      x: canvasX * this.zoom + this.panX,
      y: canvasY * this.zoom + this.panY,
    };
  }

  /**
   * Get viewport state
   */
  getState(): { zoom: number; panX: number; panY: number } {
    return {
      zoom: this.zoom,
      panX: this.panX,
      panY: this.panY,
    };
  }

  /**
   * Set viewport state
   */
  setState(state: { zoom?: number; panX?: number; panY?: number }): void {
    if (state.zoom !== undefined) this.setZoom(state.zoom);
    if (state.panX !== undefined) this.panX = state.panX;
    if (state.panY !== undefined) this.panY = state.panY;
  }

  /**
   * Update canvas size
   */
  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
}

