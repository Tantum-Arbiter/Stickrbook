/**
 * ZoomControls Component
 *
 * Zoom slider, zoom level display, fit/reset buttons.
 * Uses Lucide icons for modern look.
 */

import { useEditorStore } from '../../store';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

// Common zoom presets
const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

export interface ZoomControlsProps {
  className?: string;
  compact?: boolean;
}

export function ZoomControls({ className = '', compact = false }: ZoomControlsProps) {
  const { zoom, setZoom, resetView, fitToCanvas } = useEditorStore();

  const zoomPercent = Math.round(zoom * 100);

  const handleZoomIn = () => {
    const nextPreset = ZOOM_PRESETS.find((p) => p > zoom) || zoom * 1.25;
    setZoom(nextPreset);
  };

  const handleZoomOut = () => {
    const prevPreset = [...ZOOM_PRESETS].reverse().find((p) => p < zoom) || zoom * 0.75;
    setZoom(prevPreset);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(parseFloat(e.target.value));
  };

  const handlePresetClick = (preset: number) => {
    setZoom(preset);
  };

  if (compact) {
    return (
      <div className={`zoom-controls compact ${className}`}>
        <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out (-)">
          <ZoomOut size={14} />
        </button>
        <span className="zoom-level">{zoomPercent}%</span>
        <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In (+)">
          <ZoomIn size={14} />
        </button>
        <button className="zoom-btn" onClick={resetView} title="Reset View (Ctrl+0)">
          <RotateCcw size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className={`zoom-controls ${className}`}>
      <div className="zoom-buttons">
        <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out (-)">
          <ZoomOut size={16} />
        </button>
        <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In (+)">
          <ZoomIn size={16} />
        </button>
      </div>

      <div className="zoom-slider-container">
        <input
          type="range"
          className="zoom-slider"
          min="0.1"
          max="5"
          step="0.05"
          value={zoom}
          onChange={handleSliderChange}
        />
        <span className="zoom-level">{zoomPercent}%</span>
      </div>

      <div className="zoom-presets">
        {ZOOM_PRESETS.filter((p) => [0.5, 1, 2, 4].includes(p)).map((preset) => (
          <button
            key={preset}
            className={`zoom-preset ${zoom === preset ? 'active' : ''}`}
            onClick={() => handlePresetClick(preset)}
          >
            {preset * 100}%
          </button>
        ))}
      </div>

      <div className="zoom-actions">
        <button className="zoom-btn" onClick={fitToCanvas} title="Fit to Window">
          <Maximize2 size={14} /> Fit
        </button>
        <button className="zoom-btn" onClick={resetView} title="Reset View (Ctrl+0)">
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}

/**
 * ZoomIndicator Component
 *
 * Simple zoom level indicator for status bar.
 */
export interface ZoomIndicatorProps {
  className?: string;
}

export function ZoomIndicator({ className = '' }: ZoomIndicatorProps) {
  const zoom = useEditorStore((s) => s.zoom);
  const zoomPercent = Math.round(zoom * 100);

  return (
    <span className={`zoom-indicator ${className}`}>
      {zoomPercent}%
    </span>
  );
}

