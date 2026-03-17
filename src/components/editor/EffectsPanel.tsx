/**
 * EffectsPanel Component
 *
 * HSB/Contrast sliders for selected layer with HSL color wheel.
 * Matches vanilla storyboard.html effects panel with collapsible panel.
 */

import { useCallback, useState, useRef } from 'react';
import { useEditorStore } from '../../store';
import type { LayerEffects } from '../../store/types';
import { ColorWheel, hslToHex } from './ColorWheel';
import { RotateCcw, ChevronDown, SlidersHorizontal, PanelRightClose, PanelRightOpen } from 'lucide-react';

// Default effects values
const DEFAULT_EFFECTS: LayerEffects = {
  hue: 0,
  saturation: 100,
  brightness: 100,
  contrast: 100,
  blur: 0,
};

export interface EffectsPanelProps {
  className?: string;
}

export function EffectsPanel({ className = '' }: EffectsPanelProps) {
  const { layers, selectedLayerId, updateLayer } = useEditorStore();
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(200);
  const panelRef = useRef<HTMLElement>(null);
  const [colorGroupOpen, setColorGroupOpen] = useState(true);
  const [effectsGroupOpen, setEffectsGroupOpen] = useState(true);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);
  const effects = selectedLayer?.effects || DEFAULT_EFFECTS;

  const updateEffects = useCallback(
    (updates: Partial<LayerEffects>) => {
      if (!selectedLayerId) return;
      updateLayer(selectedLayerId, {
        effects: { ...effects, ...updates },
      });
    },
    [selectedLayerId, effects, updateLayer]
  );

  const resetEffects = useCallback(() => {
    if (!selectedLayerId) return;
    updateLayer(selectedLayerId, { effects: DEFAULT_EFFECTS });
  }, [selectedLayerId, updateLayer]);

  const handleColorWheelChange = useCallback(
    (hue: number, saturation: number) => {
      updateEffects({ hue, saturation });
    },
    [updateEffects]
  );

  const hasSelection = !!selectedLayer;
  const hexColor = hslToHex(effects.hue, Math.min(effects.saturation, 100), 50);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      // Resize from left edge
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(300, Math.max(150, startWidth + delta));
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
      className={`effects-panel ${collapsed ? 'collapsed' : ''} ${className}`}
      style={collapsed ? undefined : { width }}
    >
      <div className="effects-panel-header">
        <h4>
          <SlidersHorizontal size={14} /> <span>Effects</span>
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
        <div className="effects-panel-content">
          {/* No Layer Selected Message */}
          {!hasSelection && (
            <div className="effects-no-selection">
              <p>Select a layer to edit</p>
            </div>
          )}

          {/* Always show controls (disabled when no selection) */}
          <div className={`effects-controls ${!hasSelection ? 'disabled' : ''}`}>
            <div className="effects-toolbar">
              <button
                className="reset-btn"
                onClick={resetEffects}
                title="Reset all effects"
                disabled={!hasSelection}
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            <div className="effects-groups">
              {/* COLOR GROUP */}
              <div className={`effects-group ${colorGroupOpen ? '' : 'collapsed'}`}>
                <div className="effects-group-header" onClick={() => setColorGroupOpen(!colorGroupOpen)}>
                  <span className="group-title">Color</span>
                  <ChevronDown size={12} className="group-chevron" />
                </div>
                {colorGroupOpen && (
                  <div className="effects-group-content">
                    {/* Color Wheel */}
                    <ColorWheel
                      hue={effects.hue}
                      saturation={effects.saturation}
                      disabled={!hasSelection}
                      onChange={handleColorWheelChange}
                    />

                    {/* Hex Color Input */}
                    <div className="hex-color-input-row">
                      <div
                        className="hex-color-swatch"
                        style={{ backgroundColor: hexColor }}
                      />
                      <input
                        type="text"
                        className="hex-color-input"
                        value={hexColor}
                        disabled={!hasSelection}
                        readOnly
                      />
                    </div>

                    {/* Hue Slider */}
                    <EffectSlider
                      label="Hue"
                      value={effects.hue}
                      min={0}
                      max={360}
                      unit="°"
                      disabled={!hasSelection}
                      onChange={(value) => updateEffects({ hue: value })}
                    />

                    {/* Saturation Slider */}
                    <EffectSlider
                      label="Saturation"
                      value={effects.saturation}
                      min={0}
                      max={200}
                      unit="%"
                      disabled={!hasSelection}
                      onChange={(value) => updateEffects({ saturation: value })}
                    />
                  </div>
                )}
              </div>

              {/* EFFECTS GROUP */}
              <div className={`effects-group ${effectsGroupOpen ? '' : 'collapsed'}`}>
                <div className="effects-group-header" onClick={() => setEffectsGroupOpen(!effectsGroupOpen)}>
                  <span className="group-title">Adjustments</span>
                  <ChevronDown size={12} className="group-chevron" />
                </div>
                {effectsGroupOpen && (
                  <div className="effects-group-content">
                    <EffectSlider
                      label="Brightness"
                      value={effects.brightness}
                      min={0}
                      max={200}
                      unit="%"
                      disabled={!hasSelection}
                      onChange={(value) => updateEffects({ brightness: value })}
                    />
                    <EffectSlider
                      label="Contrast"
                      value={effects.contrast}
                      min={0}
                      max={200}
                      unit="%"
                      disabled={!hasSelection}
                      onChange={(value) => updateEffects({ contrast: value })}
                    />
                    <EffectSlider
                      label="Blur"
                      value={effects.blur}
                      min={0}
                      max={20}
                      step={0.5}
                      unit="px"
                      disabled={!hasSelection}
                      onChange={(value) => updateEffects({ blur: value })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
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

// Individual effect slider
interface EffectSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

function EffectSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  disabled = false,
  onChange,
}: EffectSliderProps) {
  return (
    <div className={`effect-slider ${disabled ? 'disabled' : ''}`}>
      <div className="effect-label">
        <span>{label}</span>
        <span className="effect-value">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

