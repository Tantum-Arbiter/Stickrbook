/**
 * ScaleCommand
 * 
 * Command to scale a layer.
 */

import type { Command, LayerData } from '../../types';

export class ScaleCommand implements Command {
  id: string;
  type = 'scale-layer';
  timestamp: number;

  constructor(
    private layerId: string,
    private oldScaleX: number,
    private oldScaleY: number,
    private newScaleX: number,
    private newScaleY: number,
    private updateLayer: (id: string, updates: Partial<LayerData>) => void
  ) {
    this.id = `scale-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = Date.now();
  }

  execute(): void {
    this.updateLayer(this.layerId, { scaleX: this.newScaleX, scaleY: this.newScaleY });
  }

  undo(): void {
    this.updateLayer(this.layerId, { scaleX: this.oldScaleX, scaleY: this.oldScaleY });
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      timestamp: this.timestamp,
      layerId: this.layerId,
      oldScaleX: this.oldScaleX,
      oldScaleY: this.oldScaleY,
      newScaleX: this.newScaleX,
      newScaleY: this.newScaleY,
    };
  }
}

