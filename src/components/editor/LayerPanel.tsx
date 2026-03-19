/**
 * LayerPanel Component
 *
 * Layer list matching vanilla storyboard.html .layers-panel structure:
 * - Header with layer count and collapse button
 * - Help box with instructions
 * - Layer list with thumbnails and controls
 * - Layer actions (Merge, Flatten, Clear)
 */

import { useCallback, useState, useRef } from 'react';
import { useEditorStore, useProjectsStore } from '../../store';
import type { LayerOverlay } from '../../store/types';
import { API_BASE_URL } from '../../config';
import {
  Layers,
  PanelRightClose,
  PanelRightOpen,
  MousePointer2,
  Move,
  Maximize2,
  Sparkles,
  Combine,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  GripVertical,
} from 'lucide-react';

export interface LayerPanelProps {
  className?: string;
}

export function LayerPanel({ className = '' }: LayerPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(220);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [isFlattening, setIsFlattening] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const {
    layers,
    selectedLayerId,
    selectedLayerIds,
    baseImagePath,
    canvasWidth,
    canvasHeight,
    selectLayer,
    updateLayer,
    deleteLayer,
    reorderLayers,
    addLayer,
    setBaseImage,
  } = useEditorStore();

  const currentBook = useProjectsStore((s) => s.currentBook());
  const addAsset = useProjectsStore((s) => s.addAsset);

  // Sort layers by z-index descending (top layer first in list)
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const handleToggleVisibility = useCallback(
    (layer: LayerOverlay) => {
      updateLayer(layer.id, { visible: !layer.visible });
    },
    [updateLayer]
  );

  const handleToggleLock = useCallback(
    (layer: LayerOverlay) => {
      updateLayer(layer.id, { locked: !layer.locked });
    },
    [updateLayer]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      setDragOverIndex(null);

      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.type === 'layer') {
          // Reorder layers
          const newOrder = [...sortedLayers];
          const draggedIndex = newOrder.findIndex((l) => l.id === data.layerId);

          if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
            const [draggedLayer] = newOrder.splice(draggedIndex, 1);
            newOrder.splice(targetIndex, 0, draggedLayer);

            // Convert back to layer IDs (reverse order since sortedLayers is descending)
            const layerIds = newOrder.reverse().map((l) => l.id);
            reorderLayers(layerIds);
          }
        }
      } catch (error) {
        console.error('Failed to handle layer drop:', error);
      }
    },
    [sortedLayers, reorderLayers]
  );

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  // Helper: Convert image URL to base64
  const imageToBase64 = useCallback(async (imagePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
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
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imagePath;
    });
  }, []);

  // Helper: Render layer to canvas at specific position
  const renderLayerToCanvas = useCallback((
    ctx: CanvasRenderingContext2D,
    layer: LayerOverlay,
    imagePath: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.save();
        ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(img, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
        ctx.restore();
        resolve();
      };
      img.onerror = () => reject(new Error('Failed to load layer image'));
      img.src = imagePath;
    });
  }, []);

  // Magic Merge: Blend selected layers into background
  const handleMagicMerge = useCallback(async () => {
    if (!baseImagePath || selectedLayerIds.length === 0) {
      alert('Please select at least one layer to merge');
      return;
    }

    setIsMerging(true);
    try {
      // Get the selected layers
      const selectedLayers = layers.filter((l) => selectedLayerIds.includes(l.id));

      // Convert background to base64
      const backgroundBase64 = await imageToBase64(baseImagePath);

      // Process each selected layer with Magic Merge
      for (const layer of selectedLayers) {
        const asset = currentBook?.assets.find((a) => a.id === layer.assetId);
        if (!asset?.imagePath) continue;

        // Load the asset image to get its actual dimensions
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = asset.imagePath;
        });

        // Calculate the correct scale factor
        // The layer.width/height represent the displayed size on canvas
        // The img.width/height represent the actual asset image size
        // We need to scale the asset to match the layer's displayed size
        const scaleX = layer.width / img.width;
        const scaleY = layer.height / img.height;
        const finalScale = Math.min(scaleX, scaleY); // Use uniform scaling

        // Convert layer image to base64
        const assetBase64 = await imageToBase64(asset.imagePath);

        // Call Magic Merge API with enhanced parameters for photorealistic compositing
        const response = await fetch(`${API_BASE_URL}/magic-merge/magic-merge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asset: assetBase64,
            background: backgroundBase64,
            position: { x: Math.round(layer.x), y: Math.round(layer.y) },
            scale: finalScale,
            harmonize: true,
            harmonizeStrength: 0.85, // Strong color matching for natural integration
            advancedHarmonization: true, // Use multi-zone color grading + environmental lighting
            edgeBlending: true, // Enable environmental color spill
            edgeBlendingStrength: 0.7, // Strong bounce light from surroundings
            seamBlending: false, // Disable Poisson to avoid ghosting
            blendMode: 'normal', // Best for preserving character details
            shadow: {
              x: 10,
              y: 10,
              blur: 25, // Softer shadow for outdoor scenes
              opacity: 0.6, // Stronger contact shadow
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Magic Merge failed: ${response.statusText}`);
        }

        const result = await response.json();

        // Update the base image with the merged result
        setBaseImage(result.result);

        // Remove the merged layer
        deleteLayer(layer.id);
      }

      alert('Magic Merge complete! Layers blended into background.');
    } catch (error) {
      console.error('Magic Merge failed:', error);
      alert(`Magic Merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsMerging(false);
    }
  }, [baseImagePath, selectedLayerIds, layers, currentBook, imageToBase64, setBaseImage, deleteLayer]);

  // Flatten: Combine all layers into a single image
  const handleFlatten = useCallback(async () => {
    if (!baseImagePath || layers.length === 0) {
      alert('Nothing to flatten');
      return;
    }

    setIsFlattening(true);
    try {
      // Create a canvas with the editor dimensions
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Draw base image
      const baseImg = new Image();
      baseImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        baseImg.onload = () => {
          ctx.drawImage(baseImg, 0, 0, canvasWidth, canvasHeight);
          resolve();
        };
        baseImg.onerror = () => reject(new Error('Failed to load base image'));
        baseImg.src = baseImagePath;
      });

      // Draw all visible layers in order (sorted by zIndex)
      const visibleLayers = layers
        .filter((l) => l.visible)
        .sort((a, b) => a.zIndex - b.zIndex);

      for (const layer of visibleLayers) {
        const asset = currentBook?.assets.find((a) => a.id === layer.assetId);
        if (!asset?.imagePath) continue;

        await renderLayerToCanvas(ctx, layer, asset.imagePath);
      }

      // Convert canvas to base64
      const flattenedImage = canvas.toDataURL('image/png');

      // Save as new asset
      if (currentBook && addAsset) {
        const newAsset = await addAsset(currentBook.id, {
          name: `Flattened_${Date.now()}`,
          type: 'image',
          imagePath: flattenedImage,
        });

        // Set as new base image
        setBaseImage(flattenedImage);

        // Clear all layers
        layers.forEach((layer) => deleteLayer(layer.id));

        alert('Layers flattened successfully!');
      }
    } catch (error) {
      console.error('Flatten failed:', error);
      alert(`Flatten failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsFlattening(false);
    }
  }, [baseImagePath, layers, canvasWidth, canvasHeight, currentBook, addAsset, setBaseImage, deleteLayer, renderLayerToCanvas]);

  const handleClearAll = useCallback(() => {
    sortedLayers.forEach((layer) => deleteLayer(layer.id));
  }, [sortedLayers, deleteLayer]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      // Resize from left edge (subtract delta since panel is on right side)
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(350, Math.max(150, startWidth + delta));
      setWidth(newWidth);
      // If collapsed and dragging to expand, uncollapse
      if (collapsed && newWidth > 60) {
        setCollapsed(false);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width, collapsed]);

  return (
    <aside
      ref={panelRef}
      className={`layers-panel ${collapsed ? 'collapsed' : ''} ${className}`}
      style={collapsed ? undefined : { width }}
    >
      <div className="layers-panel-header">
        <h4>
          <Layers size={14} /> <span>Layers</span>
          <span className="layer-count">{sortedLayers.length}</span>
        </h4>
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <PanelRightOpen size={14} /> : <PanelRightClose size={14} />}
        </button>
      </div>

      {!collapsed && (
        <div className="layers-panel-content">
          {/* Help Box */}
          <div className="layers-help-box">
            <p><MousePointer2 size={12} /> Drag assets onto canvas</p>
            <p><Move size={12} /> Drag to reposition</p>
            <p><Maximize2 size={12} /> Corners to resize</p>
          </div>

          {/* Layer List */}
          <div className="layer-list">
            {sortedLayers.length === 0 && !baseImagePath ? (
              <div className="layer-empty-state">
                <Layers size={24} />
                <p>No layers yet</p>
              </div>
            ) : (
              <>
                {/* Background layer (always at bottom) */}
                {baseImagePath && (
                  <div className="layer-item layer-background">
                    <div className="layer-thumb">
                      <img src={baseImagePath} alt="Background" />
                    </div>
                    <div className="layer-info">
                      <span className="layer-name">Background</span>
                      <span className="layer-type">Base Image</span>
                    </div>
                  </div>
                )}

                {/* Overlay layers */}
                {sortedLayers.map((layer, index) => (
                  <div
                    key={layer.id}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    style={{
                      borderTop: dragOverIndex === index ? '2px solid #0066ff' : undefined,
                    }}
                  >
                    <LayerItem
                      layer={layer}
                      isSelected={selectedLayerIds.includes(layer.id)}
                      onSelect={(e) => {
                        const multiSelect = e?.shiftKey || false;
                        selectLayer(layer.id, multiSelect);
                      }}
                      onToggleVisibility={() => handleToggleVisibility(layer)}
                      onToggleLock={() => handleToggleLock(layer)}
                      onDelete={() => deleteLayer(layer.id)}
                    />
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Layer Actions */}
          {sortedLayers.length > 0 && (
            <div className="layer-actions">
              <button
                className="layer-action-btn"
                onClick={handleMagicMerge}
                disabled={isMerging || selectedLayerIds.length === 0}
                title={selectedLayerIds.length === 0 ? "Select layers to merge" : "Magic Merge - Blend selected layers into background with AI"}
              >
                <Sparkles size={12} /> {isMerging ? 'Merging...' : 'Merge'}
              </button>
              <button
                className="layer-action-btn"
                onClick={handleFlatten}
                disabled={isFlattening}
                title="Flatten all layers into a single image"
              >
                <Combine size={12} /> {isFlattening ? 'Flattening...' : 'Flatten'}
              </button>
              <button className="layer-action-btn" onClick={handleClearAll} title="Remove all">
                <Trash2 size={12} /> Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Resize Handle */}
      <div
        className="resize-handle resize-handle-left"
        onMouseDown={handleResizeStart}
      />
    </aside>
  );
}

// Individual layer item
interface LayerItemProps {
  layer: LayerOverlay;
  isSelected: boolean;
  onSelect: (e?: React.MouseEvent) => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
}

function LayerItem({
  layer,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
}: LayerItemProps) {
  const currentBook = useProjectsStore((s) => s.currentBook());
  const [isDragging, setIsDragging] = useState(false);

  // Find the asset to get the correct image path
  const asset = currentBook?.assets.find((a) => a.id === layer.assetId);
  const imagePath = asset?.imagePath || '';

  const classNames = [
    'layer-item',
    isSelected && 'selected',
    !layer.visible && 'hidden',
    layer.locked && 'locked',
    isDragging && 'dragging',
  ]
    .filter(Boolean)
    .join(' ');

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'layer',
      layerId: layer.id,
      zIndex: layer.zIndex,
    }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={classNames}
      onClick={onSelect}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="layer-drag-handle" title="Drag to reorder">
        <GripVertical size={14} />
      </div>
      <div className="layer-thumb">
        {imagePath ? (
          <img src={imagePath} alt={`Layer ${layer.id}`} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
            ?
          </div>
        )}
      </div>
      <div className="layer-info">
        <span className="layer-name">Layer {layer.zIndex + 1}</span>
        <span className="layer-type">Overlay</span>
      </div>
      <div className="layer-controls">
        <button
          className={`layer-btn ${layer.visible ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          title={layer.visible ? 'Hide' : 'Show'}
        >
          {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
        <button
          className={`layer-btn ${layer.locked ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
          title={layer.locked ? 'Unlock' : 'Lock'}
        >
          {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>
        <button
          className="layer-btn delete"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

