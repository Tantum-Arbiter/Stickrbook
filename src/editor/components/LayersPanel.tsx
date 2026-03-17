/**
 * LayersPanel
 * 
 * Panel for managing layers hierarchy.
 */

import React from 'react';
import { useDocumentStore } from '../store/documentStore';
import type { LayerData } from '../types';

export const LayersPanel: React.FC = () => {
  const {
    document,
    selectedLayerIds,
    selectLayer,
    updateLayer,
    deleteLayer,
    reorderLayers,
    duplicateLayer,
  } = useDocumentStore();

  if (!document) {
    return <div className="layers-panel">No document loaded</div>;
  }

  const handleLayerClick = (layerId: string, event: React.MouseEvent) => {
    const multiSelect = event.ctrlKey || event.metaKey;
    selectLayer(layerId, multiSelect);
  };

  const handleVisibilityToggle = (layerId: string) => {
    const layer = document.layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { visible: !layer.visible });
    }
  };

  const handleLockToggle = (layerId: string) => {
    const layer = document.layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { locked: !layer.locked });
    }
  };

  const handleDelete = (layerId: string) => {
    deleteLayer(layerId);
  };

  const handleDuplicate = (layerId: string) => {
    duplicateLayer(layerId);
  };

  const renderLayer = (layer: LayerData) => {
    const isSelected = selectedLayerIds.includes(layer.id);

    return (
      <div
        key={layer.id}
        className={`layer-item ${isSelected ? 'selected' : ''}`}
        onClick={(e) => handleLayerClick(layer.id, e)}
      >
        <div className="layer-visibility">
          <button onClick={() => handleVisibilityToggle(layer.id)}>
            {layer.visible ? '👁️' : '🚫'}
          </button>
        </div>
        
        <div className="layer-thumbnail">
          {layer.type === 'image' && <img src={layer.imageData} alt={layer.name} />}
          {layer.type === 'text' && <span>T</span>}
          {layer.type === 'shape' && <span>◼</span>}
        </div>
        
        <div className="layer-name">{layer.name}</div>
        
        <div className="layer-lock">
          <button onClick={() => handleLockToggle(layer.id)}>
            {layer.locked ? '🔒' : '🔓'}
          </button>
        </div>
        
        <div className="layer-actions">
          <button onClick={() => handleDuplicate(layer.id)} title="Duplicate">
            📋
          </button>
          <button onClick={() => handleDelete(layer.id)} title="Delete">
            🗑️
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="layers-panel">
      <div className="layers-header">
        <h3>Layers</h3>
        <button onClick={() => {/* Add new layer */}}>+</button>
      </div>
      
      <div className="layers-list">
        {[...document.layers].reverse().map(renderLayer)}
      </div>
      
      <style jsx>{`
        .layers-panel {
          width: 300px;
          background: #2a2a2a;
          color: #fff;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .layers-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid #444;
        }
        
        .layers-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }
        
        .layers-header button {
          background: #0066ff;
          color: #fff;
          border: none;
          border-radius: 4px;
          width: 28px;
          height: 28px;
          cursor: pointer;
          font-size: 18px;
        }
        
        .layers-list {
          flex: 1;
          overflow-y: auto;
        }
        
        .layer-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #333;
          gap: 8px;
        }
        
        .layer-item:hover {
          background: #333;
        }
        
        .layer-item.selected {
          background: #0066ff;
        }
        
        .layer-visibility button,
        .layer-lock button,
        .layer-actions button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
        }
        
        .layer-thumbnail {
          width: 32px;
          height: 32px;
          background: #444;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .layer-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .layer-name {
          flex: 1;
          font-size: 13px;
        }
        
        .layer-actions {
          display: flex;
          gap: 4px;
        }
      `}</style>
    </div>
  );
};

