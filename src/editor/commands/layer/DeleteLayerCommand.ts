/**
 * DeleteLayerCommand
 * 
 * Command to delete a layer from the document.
 */

import type { Command, LayerData } from '../../types';

export class DeleteLayerCommand implements Command {
  id: string;
  type = 'delete-layer';
  timestamp: number;
  private layerData: LayerData | null = null;

  constructor(
    private layerId: string,
    private deleteLayer: (id: string) => void,
    private addLayer: (layer: Omit<LayerData, 'id'>) => string,
    private getLayer: (id: string) => LayerData | undefined
  ) {
    this.id = `delete-layer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = Date.now();
    
    // Store layer data for undo
    const layer = this.getLayer(this.layerId);
    if (layer) {
      this.layerData = { ...layer };
    }
  }

  execute(): void {
    this.deleteLayer(this.layerId);
  }

  undo(): void {
    if (this.layerData) {
      // Re-add the layer with the same ID
      const { id, ...layerWithoutId } = this.layerData;
      this.addLayer(layerWithoutId);
    }
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      timestamp: this.timestamp,
      layerId: this.layerId,
      layerData: this.layerData,
    };
  }
}

