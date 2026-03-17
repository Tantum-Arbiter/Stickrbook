/**
 * BaseTool
 * 
 * Abstract base class for all editing tools.
 */

export type ToolType = 'select' | 'move' | 'brush' | 'eraser' | 'text' | 'shape' | 'crop' | 'eyedropper';

export interface ToolOptions {
  size?: number;
  color?: string;
  opacity?: number;
  hardness?: number;
}

export abstract class BaseTool {
  abstract type: ToolType;
  abstract name: string;
  abstract cursor: string;
  
  protected options: ToolOptions = {};
  protected isActive: boolean = false;

  /**
   * Activate the tool
   */
  activate(): void {
    this.isActive = true;
    this.onActivate();
  }

  /**
   * Deactivate the tool
   */
  deactivate(): void {
    this.isActive = false;
    this.onDeactivate();
  }

  /**
   * Set tool options
   */
  setOptions(options: Partial<ToolOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get tool options
   */
  getOptions(): ToolOptions {
    return { ...this.options };
  }

  /**
   * Handle mouse down event
   */
  abstract onMouseDown(x: number, y: number, event: MouseEvent): void;

  /**
   * Handle mouse move event
   */
  abstract onMouseMove(x: number, y: number, event: MouseEvent): void;

  /**
   * Handle mouse up event
   */
  abstract onMouseUp(x: number, y: number, event: MouseEvent): void;

  /**
   * Handle key down event
   */
  onKeyDown(event: KeyboardEvent): void {
    // Override in subclasses if needed
  }

  /**
   * Handle key up event
   */
  onKeyUp(event: KeyboardEvent): void {
    // Override in subclasses if needed
  }

  /**
   * Called when tool is activated
   */
  protected onActivate(): void {
    // Override in subclasses if needed
  }

  /**
   * Called when tool is deactivated
   */
  protected onDeactivate(): void {
    // Override in subclasses if needed
  }

  /**
   * Render tool overlay (e.g., brush cursor, selection box)
   */
  abstract render(ctx: CanvasRenderingContext2D): void;
}

