/**
 * RotateCommand
 * 
 * Command to rotate a layer.
 */

import type { Command, LayerData } from '../../types';

export class RotateCommand implements Command {
  id: string;
  type = 'rotate-layer';
  timestamp: number;

  constructor(
    private layerId: string,
    private oldRotation: number,
    private newRotation: number,
    private updateLayer: (id: string, updates: Partial<LayerData>) => void
  ) {
    this.id = `rotate-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = Date.now();
  }

  execute(): void {
    this.updateLayer(this.layerId, { rotation: this.newRotation });
  }

  undo(): void {
    this.updateLayer(this.layerId, { rotation: this.oldRotation });
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      timestamp: this.timestamp,
      layerId: this.layerId,
      oldRotation: this.oldRotation,
      newRotation: this.newRotation,
    };
  }
}

