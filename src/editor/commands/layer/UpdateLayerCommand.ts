/**
 * UpdateLayerCommand
 * 
 * Command to update layer properties.
 */

import type { Command, LayerData } from '../../types';

export class UpdateLayerCommand implements Command {
  id: string;
  type = 'update-layer';
  timestamp: number;
  private previousData: Partial<LayerData>;

  constructor(
    private layerId: string,
    private updates: Partial<LayerData>,
    private updateLayer: (id: string, updates: Partial<LayerData>) => void,
    private getLayer: (id: string) => LayerData | undefined
  ) {
    this.id = `update-layer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = Date.now();
    
    // Store previous values for undo
    const layer = this.getLayer(this.layerId);
    this.previousData = {};
    if (layer) {
      Object.keys(updates).forEach(key => {
        this.previousData[key as keyof LayerData] = layer[key as keyof LayerData] as any;
      });
    }
  }

  execute(): void {
    this.updateLayer(this.layerId, this.updates);
  }

  undo(): void {
    this.updateLayer(this.layerId, this.previousData);
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      timestamp: this.timestamp,
      layerId: this.layerId,
      updates: this.updates,
      previousData: this.previousData,
    };
  }
}

