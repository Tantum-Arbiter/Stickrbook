/**
 * TextOverlay Component
 *
 * Text display positioned on pages based on layout setting.
 * Uses extracted CSS from legacy storyboard (story-mode.css).
 */

import type { TextLayout } from '../../store/types';

export interface TextOverlayProps {
  text: string;
  title?: string;
  layout: TextLayout;
  className?: string;
  editable?: boolean;
  onTextChange?: (text: string) => void;
  onTitleChange?: (title: string) => void;
}

export function TextOverlay({
  text,
  title,
  layout,
  className = '',
  editable = false,
  onTextChange,
  onTitleChange,
}: TextOverlayProps) {
  const layoutClass = `story-text-overlay layout-${layout}`;

  if (editable) {
    return (
      <div className={`${layoutClass} editable ${className}`}>
        {title !== undefined && (
          <input
            type="text"
            className="story-text-title-input"
            value={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            placeholder="Page title (optional)"
          />
        )}
        <textarea
          className="story-text-input"
          value={text}
          onChange={(e) => onTextChange?.(e.target.value)}
          placeholder="Enter page text..."
        />
      </div>
    );
  }

  return (
    <div className={`${layoutClass} ${className}`}>
      {title && <h3 className="story-text-title">{title}</h3>}
      <p className="story-text-display">{text}</p>
    </div>
  );
}

/**
 * LayoutSelector Component
 *
 * UI for selecting text layout position.
 */
export interface LayoutSelectorProps {
  value: TextLayout;
  onChange: (layout: TextLayout) => void;
  className?: string;
}

const LAYOUT_OPTIONS: { value: TextLayout; label: string; icon: string }[] = [
  { value: 'text-below', label: 'Below', icon: '⬇️' },
  { value: 'text-above', label: 'Above', icon: '⬆️' },
  { value: 'text-left', label: 'Left', icon: '⬅️' },
  { value: 'text-right', label: 'Right', icon: '➡️' },
  { value: 'text-overlay', label: 'Overlay', icon: '🔲' },
];

export function LayoutSelector({
  value,
  onChange,
  className = '',
}: LayoutSelectorProps) {
  return (
    <div className={`layout-selector ${className}`}>
      {LAYOUT_OPTIONS.map((option) => (
        <button
          key={option.value}
          className={`layout-option ${value === option.value ? 'active' : ''}`}
          onClick={() => onChange(option.value)}
          title={option.label}
        >
          <span className="layout-icon">{option.icon}</span>
          <span className="layout-label">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

