/**
 * BrushTool
 * 
 * Tool for painting on layers with customizable brush settings.
 */

import { BaseTool } from './BaseTool';

export class BrushTool extends BaseTool {
  type = 'brush' as const;
  name = 'Brush';
  cursor = 'crosshair';

  private isDrawing: boolean = false;
  private lastPoint: { x: number; y: number } | null = null;
  private currentStroke: { x: number; y: number }[] = [];

  constructor() {
    super();
    this.options = {
      size: 10,
      color: '#000000',
      opacity: 1,
      hardness: 0.8,
    };
  }

  onMouseDown(x: number, y: number, event: MouseEvent): void {
    this.isDrawing = true;
    this.lastPoint = { x, y };
    this.currentStroke = [{ x, y }];
  }

  onMouseMove(x: number, y: number, event: MouseEvent): void {
    if (!this.isDrawing || !this.lastPoint) return;

    // Add point to stroke
    this.currentStroke.push({ x, y });

    // Draw line segment
    this.drawLine(this.lastPoint.x, this.lastPoint.y, x, y);

    this.lastPoint = { x, y };
  }

  onMouseUp(x: number, y: number, event: MouseEvent): void {
    if (this.isDrawing) {
      // Finalize stroke
      this.finalizeStroke();
    }

    this.isDrawing = false;
    this.lastPoint = null;
    this.currentStroke = [];
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Draw brush cursor
    if (this.lastPoint) {
      ctx.save();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(this.lastPoint.x, this.lastPoint.y, this.options.size! / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawLine(x1: number, y1: number, x2: number, y2: number): void {
    // This would draw on the active layer's canvas
    // For now, this is a placeholder
  }

  private finalizeStroke(): void {
    // Create a command for the stroke and execute it
    // This ensures the stroke can be undone
  }

  /**
   * Get brush pressure (for pressure-sensitive devices)
   */
  private getPressure(event: MouseEvent): number {
    // Check if event has pressure information (from stylus)
    const pointerEvent = event as any;
    return pointerEvent.pressure || 1;
  }

  /**
   * Interpolate points for smooth curves
   */
  private interpolatePoints(p1: { x: number; y: number }, p2: { x: number; y: number }): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const steps = Math.ceil(distance / 2);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
      });
    }

    return points;
  }
}

