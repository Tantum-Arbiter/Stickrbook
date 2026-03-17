/**
 * SelectionOverlay Component
 *
 * Selection rectangle with resize handles for region selection.
 * Used for cropping, regenerating regions, etc.
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store';
import type { Selection } from '../../store/types';

export interface SelectionOverlayProps {
  className?: string;
  onSelectionComplete?: (selection: Selection) => void;
}

export function SelectionOverlay({
  className = '',
  onSelectionComplete,
}: SelectionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  const {
    selection,
    zoom,
    activeTool,
    setSelection,
    clearSelection,
  } = useEditorStore();

  // Start drawing selection
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== 'select' && activeTool !== 'crop') return;
      if (e.button !== 0) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;

      setIsDrawing(true);
      setStartPoint({ x, y });
      setSelection({ x, y, width: 0, height: 0 });
    },
    [activeTool, zoom, setSelection]
  );

  // Update selection while drawing
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const currentX = (e.clientX - rect.left) / zoom;
      const currentY = (e.clientY - rect.top) / zoom;

      // Calculate selection bounds (handle negative direction)
      const x = Math.min(startPoint.x, currentX);
      const y = Math.min(startPoint.y, currentY);
      const width = Math.abs(currentX - startPoint.x);
      const height = Math.abs(currentY - startPoint.y);

      setSelection({ x, y, width, height });
    },
    [isDrawing, startPoint, zoom, setSelection]
  );

  // Complete selection
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !selection) return;
    setIsDrawing(false);

    // Only emit if selection has meaningful size
    if (selection.width > 5 && selection.height > 5) {
      onSelectionComplete?.(selection);
    } else {
      clearSelection();
    }
  }, [isDrawing, selection, onSelectionComplete, clearSelection]);

  // Clear selection on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selection) {
        clearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, clearSelection]);

  const isSelectionTool = activeTool === 'select' || activeTool === 'crop';

  return (
    <div
      ref={containerRef}
      className={`selection-overlay ${isSelectionTool ? 'active' : ''} ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isSelectionTool ? 'crosshair' : 'default' }}
    >
      {/* Selection Rectangle */}
      {selection && (
        <SelectionRect
          selection={selection}
          zoom={zoom}
          onResize={(newSelection) => setSelection(newSelection)}
          onClear={clearSelection}
        />
      )}
    </div>
  );
}

// Selection rectangle with resize handles
interface SelectionRectProps {
  selection: Selection;
  zoom: number;
  onResize: (selection: Selection) => void;
  onClear: () => void;
}

function SelectionRect({ selection, zoom, onClear }: SelectionRectProps) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: selection.x * zoom,
    top: selection.y * zoom,
    width: selection.width * zoom,
    height: selection.height * zoom,
    border: '2px dashed var(--brand-teal)',
    background: 'rgba(78, 205, 196, 0.1)',
    pointerEvents: 'none',
  };

  return (
    <div className="selection-rect" style={style}>
      {/* Dimension label */}
      <div className="selection-info">
        {Math.round(selection.width)} × {Math.round(selection.height)}
      </div>

      {/* Clear button */}
      <button
        className="selection-clear"
        onClick={onClear}
        style={{ pointerEvents: 'auto' }}
      >
        ✕
      </button>

      {/* Resize handles */}
      <div className="resize-handle tl" />
      <div className="resize-handle tr" />
      <div className="resize-handle bl" />
      <div className="resize-handle br" />
    </div>
  );
}

