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
  const panelRef = useRef<HTMLElement>(null);
  const {
    layers,
    selectedLayerId,
    baseImagePath,
    selectLayer,
    updateLayer,
    deleteLayer,
    reorderLayers,
  } = useEditorStore();

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
                      isSelected={layer.id === selectedLayerId}
                      onSelect={() => selectLayer(layer.id)}
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
              <button className="layer-action-btn" title="Magic Merge - Blend selected layer into background">
                <Sparkles size={12} /> Merge
              </button>
              <button className="layer-action-btn" title="Merge all layers">
                <Combine size={12} /> Flatten
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
  onSelect: () => void;
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

