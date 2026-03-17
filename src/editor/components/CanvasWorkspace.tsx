/**
 * CanvasWorkspace
 * 
 * Main canvas component using Konva for rendering and interaction.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image, Text, Rect, Circle } from 'react-konva';
import { useDocumentStore } from '../store/documentStore';
import type { LayerData } from '../types';

interface CanvasWorkspaceProps {
  width: number;
  height: number;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({ width, height }) => {
  const { document, selectedLayerIds, selectLayer, viewport, setViewport } = useDocumentStore();
  const stageRef = useRef<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Handle wheel zoom
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = viewport.zoom;
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - viewport.panX) / oldScale,
      y: (pointer.y - viewport.panY) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * 1.1 : oldScale / 1.1;
    const clampedScale = Math.max(0.1, Math.min(16, newScale));

    setViewport({
      zoom: clampedScale,
      panX: pointer.x - mousePointTo.x * clampedScale,
      panY: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  // Handle pan
  const handleMouseDown = (e: any) => {
    if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.spaceKey)) {
      setIsDragging(true);
      setDragStart({ x: e.evt.clientX - viewport.panX, y: e.evt.clientY - viewport.panY });
    }
  };

  const handleMouseMove = (e: any) => {
    if (isDragging) {
      setViewport({
        panX: e.evt.clientX - dragStart.x,
        panY: e.evt.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Render layer based on type
  const renderLayer = (layer: LayerData) => {
    const isSelected = selectedLayerIds.includes(layer.id);
    const commonProps = {
      key: layer.id,
      id: layer.id,
      x: layer.x,
      y: layer.y,
      rotation: layer.rotation,
      scaleX: layer.scaleX,
      scaleY: layer.scaleY,
      opacity: layer.opacity,
      visible: layer.visible,
      draggable: !layer.locked,
      onClick: () => selectLayer(layer.id, false),
    };

    switch (layer.type) {
      case 'image':
        return <KonvaImage key={layer.id} layer={layer} {...commonProps} />;
      case 'text':
        return (
          <Text
            {...commonProps}
            text={layer.text}
            fontSize={layer.fontSize}
            fontFamily={layer.fontFamily}
            fill={layer.fill}
            width={layer.width}
            height={layer.height}
          />
        );
      case 'shape':
        if (layer.shapeType === 'rectangle') {
          return (
            <Rect
              {...commonProps}
              width={layer.width}
              height={layer.height}
              fill={layer.fill}
              stroke={layer.stroke?.color}
              strokeWidth={layer.stroke?.width}
              cornerRadius={layer.cornerRadius}
            />
          );
        } else if (layer.shapeType === 'ellipse') {
          return (
            <Circle
              {...commonProps}
              radius={layer.width / 2}
              fill={layer.fill}
              stroke={layer.stroke?.color}
              strokeWidth={layer.stroke?.width}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  if (!document) {
    return <div>No document loaded</div>;
  }

  return (
    <div style={{ width, height, overflow: 'hidden', background: '#2a2a2a' }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={viewport.zoom}
        scaleY={viewport.zoom}
        x={viewport.panX}
        y={viewport.panY}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {/* Document background */}
          <Rect
            x={0}
            y={0}
            width={document.width}
            height={document.height}
            fill="#ffffff"
          />
          
          {/* Render all layers */}
          {document.layers.map(renderLayer)}
        </Layer>
      </Stage>
    </div>
  );
};

// Helper component for image layers
const KonvaImage: React.FC<any> = ({ layer, ...props }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = layer.imageData;
    img.onload = () => setImage(img);
  }, [layer.imageData]);

  if (!image) return null;

  return <Image {...props} image={image} width={layer.width} height={layer.height} />;
};

