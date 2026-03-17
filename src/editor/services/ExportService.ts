/**
 * ExportService
 * 
 * Handles document export to various formats.
 */

import type { DocumentData } from '../types';
import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { LayerManager } from '../core/LayerManager';

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'webp' | 'pdf';
  quality?: number; // 0-1 for JPEG/WebP
  scale?: number; // Export scale multiplier
  includeBackground?: boolean;
  selectedLayersOnly?: boolean;
  flatten?: boolean;
}

export class ExportService {
  /**
   * Export document to image
   */
  static async exportToImage(
    document: DocumentData,
    options: ExportOptions
  ): Promise<Blob> {
    const {
      format = 'png',
      quality = 1,
      scale = 1,
      includeBackground = true,
      flatten = true,
    } = options;

    // Create offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = document.width * scale;
    canvas.height = document.height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Scale context
    ctx.scale(scale, scale);

    // Render document
    const layerManager = new LayerManager();
    document.layers.forEach(layerData => {
      const layer = layerManager.createLayer(layerData);
      layerManager.addLayer(layer);
    });

    const renderer = new CanvasRenderer(canvas, layerManager);
    renderer.renderDocument(document);

    // Convert to blob
    const mimeType = this.getMimeType(format);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mimeType, quality);
    });

    if (!blob) {
      throw new Error('Failed to create blob');
    }

    return blob;
  }

  /**
   * Export document to PDF
   */
  static async exportToPDF(document: DocumentData): Promise<Blob> {
    // This would use a PDF library like jsPDF
    throw new Error('PDF export not yet implemented');
  }

  /**
   * Export selected layers only
   */
  static async exportSelection(
    document: DocumentData,
    selectedLayerIds: string[],
    options: ExportOptions
  ): Promise<Blob> {
    // Create a temporary document with only selected layers
    const tempDocument: DocumentData = {
      ...document,
      layers: document.layers.filter(layer => selectedLayerIds.includes(layer.id)),
    };

    return this.exportToImage(tempDocument, options);
  }

  /**
   * Get MIME type for format
   */
  private static getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      webp: 'image/webp',
    };

    return mimeTypes[format] || 'image/png';
  }

  /**
   * Download blob as file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export document with all metadata
   */
  static async exportProject(document: DocumentData): Promise<Blob> {
    const projectData = {
      version: '1.0',
      document,
      timestamp: Date.now(),
    };

    const json = JSON.stringify(projectData, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * Import project from file
   */
  static async importProject(file: File): Promise<DocumentData> {
    const text = await file.text();
    const projectData = JSON.parse(text);

    if (!projectData.document) {
      throw new Error('Invalid project file');
    }

    return projectData.document;
  }
}

