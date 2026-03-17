/**
 * SelectTool
 * 
 * Tool for selecting and transforming layers.
 */

import { BaseTool } from './BaseTool';

export class SelectTool extends BaseTool {
  type = 'select' as const;
  name = 'Select';
  cursor = 'default';

  private selectedLayers: string[] = [];
  private isDragging: boolean = false;
  private dragStart: { x: number; y: number } | null = null;
  private transformHandle: string | null = null;

  onMouseDown(x: number, y: number, event: MouseEvent): void {
    // Check if clicking on transform handle
    this.transformHandle = this.getHandleAtPoint(x, y);
    
    if (this.transformHandle) {
      this.isDragging = true;
      this.dragStart = { x, y };
    } else {
      // Check if clicking on a layer
      // This would integrate with LayerManager to find layers at point
      this.isDragging = true;
      this.dragStart = { x, y };
    }
  }

  onMouseMove(x: number, y: number, event: MouseEvent): void {
    if (!this.isDragging || !this.dragStart) return;

    const dx = x - this.dragStart.x;
    const dy = y - this.dragStart.y;

    if (this.transformHandle) {
      // Handle transformation (scale, rotate)
      this.handleTransform(this.transformHandle, dx, dy);
    } else {
      // Handle move
      this.handleMove(dx, dy);
    }

    this.dragStart = { x, y };
  }

  onMouseUp(x: number, y: number, event: MouseEvent): void {
    this.isDragging = false;
    this.dragStart = null;
    this.transformHandle = null;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.selectedLayers.length === 0) return;

    // Draw selection bounds and transform handles
    ctx.save();
    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // Draw selection rectangle
    // This would use actual layer bounds
    const bounds = this.getSelectionBounds();
    if (bounds) {
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      
      // Draw transform handles
      this.drawTransformHandles(ctx, bounds);
    }

    ctx.restore();
  }

  private getHandleAtPoint(x: number, y: number): string | null {
    // Check if point is on a transform handle
    // Returns handle name: 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w', 'rotate'
    return null;
  }

  private handleTransform(handle: string, dx: number, dy: number): void {
    // Apply transformation based on handle
  }

  private handleMove(dx: number, dy: number): void {
    // Move selected layers
  }

  private getSelectionBounds(): { x: number; y: number; width: number; height: number } | null {
    // Calculate bounds of all selected layers
    return null;
  }

  private drawTransformHandles(ctx: CanvasRenderingContext2D, bounds: { x: number; y: number; width: number; height: number }): void {
    const handleSize = 8;
    const handles = [
      { x: bounds.x, y: bounds.y }, // nw
      { x: bounds.x + bounds.width, y: bounds.y }, // ne
      { x: bounds.x, y: bounds.y + bounds.height }, // sw
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // se
      { x: bounds.x + bounds.width / 2, y: bounds.y }, // n
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }, // s
      { x: bounds.x, y: bounds.y + bounds.height / 2 }, // w
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }, // e
    ];

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    handles.forEach(handle => {
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    });

    // Draw rotate handle
    const rotateY = bounds.y - 30;
    ctx.beginPath();
    ctx.arc(bounds.x + bounds.width / 2, rotateY, handleSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

