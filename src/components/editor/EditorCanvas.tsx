/**
 * EditorCanvas Component
 *
 * Main canvas with zoom/pan, layer rendering, and coordinate transformation.
 * Uses extracted CSS from legacy storyboard (editor-canvas.css).
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { useEditorStore, useProjectsStore } from '../../store';
import type { LayerOverlay } from '../../store/types';

export interface EditorCanvasProps {
  className?: string;
  onLayerClick?: (layer: LayerOverlay) => void;
}

export function EditorCanvas({ className = '', onLayerClick }: EditorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingLayer, setDraggingLayer] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, layerX: 0, layerY: 0 });
  const [resizingLayer, setResizingLayer] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, layerX: 0, layerY: 0 });

  const {
    zoom,
    panX,
    panY,
    canvasWidth,
    canvasHeight,
    layers,
    baseImagePath,
    selectedLayerId,
    selectedLayerIds,
    activeTool,
    setZoom,
    setPan,
    selectLayer,
    addLayer,
    setBaseImage,
    updateLayer,
  } = useEditorStore();

  const currentBook = useProjectsStore((s) => s.currentBook());

  // Handle mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(zoom + delta);
      }
    },
    [zoom, setZoom]
  );

  // Handle pan start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Don't pan if we're dragging a layer
      if (draggingLayer) return;

      if (activeTool === 'pan' || e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
        e.preventDefault();
      }
    },
    [activeTool, panX, panY, draggingLayer]
  );

  // Handle pan move, layer drag, and resize
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (resizingLayer && resizeHandle) {
        // Resize the layer
        const dx = (e.clientX - resizeStart.x) / zoom;
        const dy = (e.clientY - resizeStart.y) / zoom;

        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.layerX;
        let newY = resizeStart.layerY;

        if (resizeHandle.includes('r')) {
          newWidth = Math.max(20, resizeStart.width + dx);
        }
        if (resizeHandle.includes('l')) {
          newWidth = Math.max(20, resizeStart.width - dx);
          newX = resizeStart.layerX + dx;
        }
        if (resizeHandle.includes('b')) {
          newHeight = Math.max(20, resizeStart.height + dy);
        }
        if (resizeHandle.includes('t')) {
          newHeight = Math.max(20, resizeStart.height - dy);
          newY = resizeStart.layerY + dy;
        }

        updateLayer(resizingLayer, {
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY,
        });
      } else if (draggingLayer) {
        // Move the layer
        const dx = (e.clientX - dragStart.x) / zoom;
        const dy = (e.clientY - dragStart.y) / zoom;
        updateLayer(draggingLayer, {
          x: dragStart.layerX + dx,
          y: dragStart.layerY + dy,
        });
      } else if (isPanning) {
        setPan(e.clientX - panStart.x, e.clientY - panStart.y);
      }
    },
    [isPanning, panStart, setPan, draggingLayer, dragStart, resizingLayer, resizeHandle, resizeStart, zoom, updateLayer]
  );

  // Handle pan end, layer drag end, and resize end
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingLayer(null);
    setResizingLayer(null);
    setResizeHandle(null);
  }, []);

  // Handle layer selection
  const handleLayerClick = useCallback(
    (layer: LayerOverlay, e: React.MouseEvent) => {
      e.stopPropagation();
      const multiSelect = e.shiftKey;
      selectLayer(layer.id, multiSelect);
      onLayerClick?.(layer);
    },
    [selectLayer, onLayerClick]
  );

  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback(() => {
    if (activeTool === 'select') {
      selectLayer(null);
    }
  }, [activeTool, selectLayer]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));

        if (data.type === 'asset') {
          // Get drop position relative to canvas
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;

          const x = (e.clientX - rect.left - panX) / zoom;
          const y = (e.clientY - rect.top - panY) / zoom;

          // If no base image, set as base
          if (!baseImagePath) {
            // For now, we need the full asset object to get imagePath
            // This is a limitation - we'll just add as layer
            addLayer({
              assetId: data.assetId,
              x: Math.max(0, x - 100),
              y: Math.max(0, y - 100),
              width: 200,
              height: 200,
              scale: 1,
              rotation: 0,
              zIndex: layers.length,
              opacity: 1,
              visible: true,
              locked: false,
            });
          } else {
            // Add as layer at drop position
            addLayer({
              assetId: data.assetId,
              x: Math.max(0, x - 100),
              y: Math.max(0, y - 100),
              width: 200,
              height: 200,
              scale: 1,
              rotation: 0,
              zIndex: layers.length,
              opacity: 1,
              visible: true,
              locked: false,
            });
          }
        }
      } catch (error) {
        console.error('Failed to handle drop:', error);
      }
    },
    [canvasRef, panX, panY, zoom, baseImagePath, addLayer, layers.length]
  );

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom(zoom + 0.1);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setZoom(zoom - 0.1);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setZoom(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom, setZoom]);

  const wrapperStyle = {
    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
    width: canvasWidth,
    height: canvasHeight,
  };

  return (
    <div
      ref={canvasRef}
      className={`editor-canvas-container ${className}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <div
        ref={wrapperRef}
        className={`editor-canvas-wrapper ${isPanning ? 'panning' : ''} ${zoom >= 4 ? 'pixelated' : ''}`}
        style={{ ...wrapperStyle, userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        {/* Base image layer */}
        {baseImagePath && (
          <img
            src={baseImagePath}
            alt="Base"
            draggable={false}
            onError={() => {
              console.error('❌ [EditorCanvas] Failed to load base image:', baseImagePath);
            }}
            onLoad={() => {
              console.log('✅ [EditorCanvas] Base image loaded successfully:', baseImagePath);
            }}
            style={{ width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none' }}
          />
        )}

        {/* Overlay layers */}
        {layers
          .filter((l) => l.visible)
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((layer) => (
            <CanvasLayer
              key={layer.id}
              layer={layer}
              isSelected={selectedLayerIds.includes(layer.id)}
              onClick={(e) => handleLayerClick(layer, e)}
              onDragStart={(e) => {
                const rect = wrapperRef.current?.getBoundingClientRect();
                if (!rect) return;
                setDraggingLayer(layer.id);
                setDragStart({
                  x: e.clientX,
                  y: e.clientY,
                  layerX: layer.x,
                  layerY: layer.y,
                });
              }}
              onResizeStart={(e, handle) => {
                setResizingLayer(layer.id);
                setResizeHandle(handle);
                setResizeStart({
                  x: e.clientX,
                  y: e.clientY,
                  width: layer.width,
                  height: layer.height,
                  layerX: layer.x,
                  layerY: layer.y,
                });
              }}
            />
          ))}
      </div>
    </div>
  );
}

// Sub-component for individual layers
interface CanvasLayerProps {
  layer: LayerOverlay;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, handle: string) => void;
}

function CanvasLayer({ layer, isSelected, onClick, onDragStart, onResizeStart }: CanvasLayerProps) {
  const { deleteLayer } = useEditorStore();
  const currentBook = useProjectsStore((s) => s.currentBook());

  // Find the asset to get the correct image path
  const asset = currentBook?.assets.find((a) => a.id === layer.assetId);
  const imagePath = asset?.imagePath || '';

  // Debug logging
  useEffect(() => {
    if (asset) {
      console.log('🖼️ [CanvasLayer] Asset found:', {
        id: asset.id,
        name: asset.name,
        imagePath: asset.imagePath,
        thumbnailPath: asset.thumbnailPath
      });
    } else {
      console.warn('⚠️ [CanvasLayer] Asset not found for layer:', layer.assetId);
    }
  }, [asset, layer.assetId]);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: layer.x,
    top: layer.y,
    width: layer.width,
    height: layer.height,
    transform: `rotate(${layer.rotation}deg)`,
    opacity: layer.opacity,
    zIndex: layer.zIndex,
    pointerEvents: layer.locked ? 'none' : 'auto',
    cursor: layer.locked ? 'default' : (isSelected ? 'move' : 'pointer'),
    userSelect: 'none',
    WebkitUserSelect: 'none',
    filter: layer.effects
      ? `hue-rotate(${layer.effects.hue}deg) saturate(${layer.effects.saturation}%) brightness(${layer.effects.brightness}%) contrast(${layer.effects.contrast}%) blur(${layer.effects.blur}px)`
      : undefined,
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (layer.locked) return;
    e.stopPropagation(); // Prevent canvas pan
    onClick(e);
    if (isSelected) {
      onDragStart(e);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    if (layer.locked) return;
    e.stopPropagation();
    e.preventDefault();
    onResizeStart(e, handle);
  };

  return (
    <div
      className={`canvas-element ${isSelected ? 'selected' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
    >
      {imagePath ? (
        <img
          src={imagePath}
          alt="Layer"
          draggable={false}
          onError={(e) => {
            console.error('❌ [CanvasLayer] Failed to load image:', imagePath);
            console.error('Asset data:', asset);
          }}
          onLoad={() => {
            console.log('✅ [CanvasLayer] Image loaded successfully:', imagePath);
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            pointerEvents: 'none'
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          background: '#ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          pointerEvents: 'none',
          fontSize: '12px',
          color: '#666'
        }}>
          {asset ? asset.name : 'Layer'}
        </div>
      )}

      {/* Resize handles (visible when selected) */}
      {isSelected && !layer.locked && (
        <>
          <div
            className="resize-handle tl"
            data-handle="tl"
            onMouseDown={(e) => handleResizeMouseDown(e, 'tl')}
          />
          <div
            className="resize-handle tr"
            data-handle="tr"
            onMouseDown={(e) => handleResizeMouseDown(e, 'tr')}
          />
          <div
            className="resize-handle bl"
            data-handle="bl"
            onMouseDown={(e) => handleResizeMouseDown(e, 'bl')}
          />
          <div
            className="resize-handle br"
            data-handle="br"
            onMouseDown={(e) => handleResizeMouseDown(e, 'br')}
          />
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              deleteLayer(layer.id);
            }}
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
}

