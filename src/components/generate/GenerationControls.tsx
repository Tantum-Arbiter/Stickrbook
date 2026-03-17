/**
 * GenerationControls Component
 *
 * Controls for generation parameters: steps, CFG, dimensions, seed.
 * Uses extracted CSS from legacy storyboard.
 */

import { useGenerationStore } from '../../store';
import { Input } from '../ui/Input';

// Common dimension presets
const DIMENSION_PRESETS = [
  { label: 'Book Page (1080×704)', width: 1080, height: 704 },
  { label: 'Square (1024×1024)', width: 1024, height: 1024 },
  { label: 'Portrait (704×1024)', width: 704, height: 1024 },
  { label: 'Landscape (1024×704)', width: 1024, height: 704 },
  { label: 'Wide (1280×720)', width: 1280, height: 720 },
];

export interface GenerationControlsProps {
  className?: string;
  compact?: boolean;
}

export function GenerationControls({ className = '', compact = false }: GenerationControlsProps) {
  const {
    steps,
    cfgScale,
    width,
    height,
    seed,
    isGenerating,
    setSteps,
    setCfgScale,
    setDimensions,
    setSeed,
  } = useGenerationStore();

  const handleDimensionPreset = (preset: typeof DIMENSION_PRESETS[0]) => {
    setDimensions(preset.width, preset.height);
  };

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 2147483647));
  };

  return (
    <div className={`generation-controls ${compact ? 'compact' : ''} ${className}`}>
      {/* Steps & CFG Row */}
      <div className="control-row">
        <div className="control-group">
          <label>Steps</label>
          <Input
            type="number"
            value={steps}
            onChange={(e) => setSteps(parseInt(e.target.value) || 35)}
            inputSize="small"
            disabled={isGenerating}
          />
          <input
            type="range"
            min="10"
            max="50"
            value={steps}
            onChange={(e) => setSteps(parseInt(e.target.value))}
            disabled={isGenerating}
          />
        </div>

        <div className="control-group">
          <label>CFG Scale</label>
          <Input
            type="number"
            value={cfgScale}
            onChange={(e) => setCfgScale(parseFloat(e.target.value) || 5.5)}
            inputSize="small"
            disabled={isGenerating}
          />
          <input
            type="range"
            min="1"
            max="15"
            step="0.5"
            value={cfgScale}
            onChange={(e) => setCfgScale(parseFloat(e.target.value))}
            disabled={isGenerating}
          />
        </div>
      </div>

      {/* Dimensions Row */}
      {!compact && (
        <div className="control-row dimensions-row">
          <div className="control-group">
            <label>Width</label>
            <Input
              type="number"
              value={width}
              onChange={(e) => setDimensions(parseInt(e.target.value) || 1080, height)}
              inputSize="small"
              disabled={isGenerating}
            />
          </div>

          <span className="dimension-separator">×</span>

          <div className="control-group">
            <label>Height</label>
            <Input
              type="number"
              value={height}
              onChange={(e) => setDimensions(width, parseInt(e.target.value) || 704)}
              inputSize="small"
              disabled={isGenerating}
            />
          </div>

          <div className="dimension-presets">
            {DIMENSION_PRESETS.map((preset) => (
              <button
                key={preset.label}
                className={`preset-btn ${width === preset.width && height === preset.height ? 'active' : ''}`}
                onClick={() => handleDimensionPreset(preset)}
                disabled={isGenerating}
                title={preset.label}
              >
                {preset.width}×{preset.height}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seed Row */}
      <div className="control-row seed-row">
        <div className="control-group seed-group">
          <label>Seed</label>
          <Input
            type="number"
            value={seed ?? ''}
            onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Random"
            inputSize="small"
            disabled={isGenerating}
          />
          <button
            className="seed-random-btn"
            onClick={handleRandomSeed}
            disabled={isGenerating}
            title="Generate random seed"
          >
            🎲
          </button>
          <button
            className="seed-clear-btn"
            onClick={() => setSeed(null)}
            disabled={isGenerating || seed === null}
            title="Clear seed (use random)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

