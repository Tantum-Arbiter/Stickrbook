/**
 * AssetBridge
 * 
 * Bridge between Stickrbook assets and PhotoEditor layers.
 * Enables importing generated assets directly into the editor.
 */

import { useDocumentStore } from '../store/documentStore';
import { AddLayerCommand } from '../commands/layer/AddLayerCommand';
import { ImageLayer } from '../layers/ImageLayer';
import type { Asset } from '../../store/types';

export class AssetBridge {
  /**
   * Import an asset from Stickrbook into the photo editor as a new layer
   */
  static async importAsset(asset: Asset, position?: { x: number; y: number }): Promise<string> {
    try {
      // Load asset image
      const imageUrl = `/api/books/${asset.bookId}/assets/${asset.id}/image`;
      const imageData = await this.loadImage(imageUrl);
      
      // Create image layer
      const layer = new ImageLayer({
        name: asset.name || 'Imported Asset',
        x: position?.x ?? 100,
        y: position?.y ?? 100,
        width: imageData.width,
        height: imageData.height,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        imageData: imageData.dataUrl,
        originalWidth: imageData.width,
        originalHeight: imageData.height,
      });
      
      // Add layer via command (for undo/redo support)
      const commandManager = useDocumentStore.getState().commandManager;
      const addCommand = new AddLayerCommand(layer);
      commandManager.execute(addCommand);
      
      return layer.id;
    } catch (error) {
      console.error('Failed to import asset:', error);
      throw new Error(`Failed to import asset: ${error}`);
    }
  }
  
  /**
   * Import multiple assets at once
   */
  static async importAssets(
    assets: Asset[],
    layout: 'stack' | 'grid' = 'stack'
  ): Promise<string[]> {
    const layerIds: string[] = [];
    
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      let position: { x: number; y: number };
      
      if (layout === 'stack') {
        // Stack with slight offset
        position = { x: 100 + i * 20, y: 100 + i * 20 };
      } else {
        // Grid layout (2 columns)
        const col = i % 2;
        const row = Math.floor(i / 2);
        position = { x: 100 + col * 300, y: 100 + row * 300 };
      }
      
      const layerId = await this.importAsset(asset, position);
      layerIds.push(layerId);
    }
    
    return layerIds;
  }
  
  /**
   * Export current document as an asset
   */
  static async exportAsAsset(
    bookId: string,
    name: string,
    type: 'character' | 'background' | 'object' = 'object'
  ): Promise<Asset> {
    try {
      // Get current document
      const document = useDocumentStore.getState().document;
      
      // Render document to image
      const imageData = await this.renderDocument();
      
      // Upload to backend
      const response = await fetch(`/api/books/${bookId}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          type,
          image: imageData,
          metadata: {
            source: 'photo-editor',
            documentId: document.id,
            layerCount: document.layers.length,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save asset');
      }
      
      const data = await response.json();
      return data.asset;
    } catch (error) {
      console.error('Failed to export asset:', error);
      throw new Error(`Failed to export asset: ${error}`);
    }
  }
  
  /**
   * Load image from URL and return data URL + dimensions
   */
  private static async loadImage(url: string): Promise<{
    dataUrl: string;
    width: number;
    height: number;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Convert to data URL
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        
        resolve({
          dataUrl,
          width: img.width,
          height: img.height,
        });
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      img.src = url;
    });
  }
  
  /**
   * Render current document to data URL
   */
  private static async renderDocument(): Promise<string> {
    // This would use the CanvasRenderer to export the current document
    // For now, return placeholder
    // TODO: Implement using ExportService
    throw new Error('Document export not yet implemented');
  }
}

