/**
 * MoveCommand
 * 
 * Command to move a layer to a new position.
 */

import type { Command, LayerData } from '../../types';

export class MoveCommand implements Command {
  id: string;
  type = 'move-layer';
  timestamp: number;

  constructor(
    private layerId: string,
    private oldX: number,
    private oldY: number,
    private newX: number,
    private newY: number,
    private updateLayer: (id: string, updates: Partial<LayerData>) => void
  ) {
    this.id = `move-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = Date.now();
  }

  execute(): void {
    this.updateLayer(this.layerId, { x: this.newX, y: this.newY });
  }

  undo(): void {
    this.updateLayer(this.layerId, { x: this.oldX, y: this.oldY });
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      timestamp: this.timestamp,
      layerId: this.layerId,
      oldX: this.oldX,
      oldY: this.oldY,
      newX: this.newX,
      newY: this.newY,
    };
  }
}

