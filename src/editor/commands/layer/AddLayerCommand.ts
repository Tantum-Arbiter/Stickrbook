/**
 * AddLayerCommand
 *
 * Command to add a new layer to the document.
 */

import type { Command, LayerData } from '../../types';

export class AddLayerCommand implements Command {
  id: string;
  type = 'add-layer';
  timestamp: number;
  private layerId: string | null = null;
  private deleteLayer: ((id: string) => void) | null = null;
  private fullLayerData: LayerData | null = null;
  private getLayer: ((id: string) => LayerData | undefined) | null = null;

  constructor(
    private layerData: Omit<LayerData, 'id'>,
    private addLayer: (layer: Omit<LayerData, 'id'>) => string,
    deleteLayerFn?: (id: string) => void,
    getLayerFn?: (id: string) => LayerData | undefined
  ) {
    this.id = `add-layer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = Date.now();
    this.deleteLayer = deleteLayerFn || null;
    this.getLayer = getLayerFn || null;
  }

  execute(): void {
    if (this.fullLayerData && this.layerId) {
      // Redo: re-add with the same ID and data
      this.layerId = this.addLayer(this.fullLayerData);
    } else {
      // First execution: add new layer
      this.layerId = this.addLayer(this.layerData);

      // Store the full layer data (including ID) for redo
      if (this.getLayer && this.layerId) {
        const layer = this.getLayer(this.layerId);
        if (layer) {
          this.fullLayerData = { ...layer };
        }
      }
    }
  }

  undo(): void {
    if (this.layerId && this.deleteLayer) {
      this.deleteLayer(this.layerId);
    }
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      timestamp: this.timestamp,
      layerData: this.layerData,
      layerId: this.layerId,
    };
  }

  getLayerId(): string | null {
    return this.layerId;
  }
}

