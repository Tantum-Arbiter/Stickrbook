/**
 * ToolBar Component
 *
 * Tool buttons for selection, move, paint, zoom modes.
 * Matches vanilla storyboard.html production editor toolbar with Lucide icons.
 */

import { useState, type ReactNode } from 'react';
import { useEditorStore } from '../../store';
import type { EditorState } from '../../store/types';
import {
  SquareDashed,
  Hand,
  Brush,
  Pipette,
  Undo2,
  Redo2,
  X,
  RotateCcw,
} from 'lucide-react';

type Tool = EditorState['activeTool'];

interface ToolDefinition {
  id: Tool;
  label: string;
  icon: ReactNode;
  shortcut: string;
}

const TOOLS: ToolDefinition[] = [
  { id: 'select', label: 'Select Region', icon: <SquareDashed size={16} />, shortcut: 'S' },
  { id: 'pan', label: 'Pan', icon: <Hand size={16} />, shortcut: 'H' },
  { id: 'draw', label: 'Paint Brush', icon: <Brush size={16} />, shortcut: 'B' },
  { id: 'eraser', label: 'Eyedropper', icon: <Pipette size={16} />, shortcut: 'I' },
];

const COLOR_PALETTE = [
  { color: '#000000', name: 'Black' },
  { color: '#FFFFFF', name: 'White' },
  { color: '#FF0000', name: 'Red' },
  { color: '#00FF00', name: 'Green' },
  { color: '#0000FF', name: 'Blue' },
  { color: '#FFFF00', name: 'Yellow' },
  { color: '#FF00FF', name: 'Magenta' },
  { color: '#00FFFF', name: 'Cyan' },
  { color: '#FFA500', name: 'Orange' },
  { color: '#800080', name: 'Purple' },
  { color: '#8B4513', name: 'Brown' },
  { color: '#808080', name: 'Gray' },
];

export interface ToolBarProps {
  className?: string;
  vertical?: boolean;
}

export function ToolBar({ className = '', vertical = false }: ToolBarProps) {
  const { activeTool, setActiveTool, canUndo, canRedo, undo, redo } = useEditorStore();
  const [paintColor, setPaintColor] = useState('#FF0000');
  const [brushSize, setBrushSize] = useState(1);

  const showPaintControls = activeTool === 'draw';

  return (
    <div className={`editor-toolbar ${vertical ? 'vertical' : ''} ${className}`}>
      {/* Primary Tool Group */}
      <div className="editor-tool-group">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={`editor-tool ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => setActiveTool(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
            data-tool={tool.id}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <div className="toolbar-separator" />

      {/* Paint Controls (visible when paint tool active) */}
      {showPaintControls && (
        <div className="editor-tool-group paint-controls">
          <div
            className="paint-color-swatch"
            style={{ backgroundColor: paintColor }}
            onClick={() => document.getElementById('paintColorPicker')?.click()}
            title="Current color - click to change"
          />
          <input
            type="color"
            id="paintColorPicker"
            value={paintColor}
            onChange={(e) => setPaintColor(e.target.value)}
            style={{ display: 'none' }}
          />
          <div className="brush-size-control">
            <label>Size:</label>
            <input
              type="range"
              min="1"
              max="32"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
            <span className="brush-size-value">{brushSize}px</span>
          </div>
          <div className="color-palette">
            {COLOR_PALETTE.map((c) => (
              <div
                key={c.color}
                className="palette-color"
                style={{ backgroundColor: c.color }}
                onClick={() => setPaintColor(c.color)}
                title={c.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Undo/Redo Group */}
      <div className="editor-tool-group">
        <button
          className="editor-tool"
          onClick={undo}
          disabled={!canUndo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          className="editor-tool"
          onClick={redo}
          disabled={!canRedo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Action Buttons */}
      <button className="editor-action-btn secondary" title="Clear Selection">
        <X size={14} /> Clear Selection
      </button>
      <button className="editor-action-btn secondary" title="Reset Image">
        <RotateCcw size={14} /> Reset Image
      </button>
    </div>
  );
}

/**
 * ToolButton Component
 *
 * Individual tool button for use outside toolbar.
 */
export interface ToolButtonProps {
  tool: Tool;
  className?: string;
}

export function ToolButton({ tool, className = '' }: ToolButtonProps) {
  const { activeTool, setActiveTool } = useEditorStore();
  const toolDef = TOOLS.find((t) => t.id === tool);

  if (!toolDef) return null;

  return (
    <button
      className={`toolbar-btn ${activeTool === tool ? 'active' : ''} ${className}`}
      onClick={() => setActiveTool(tool)}
      title={`${toolDef.label} (${toolDef.shortcut})`}
    >
      <span className="tool-icon">{toolDef.icon}</span>
    </button>
  );
}

