/**
 * Core Type Definitions for Photo Editor
 * 
 * Defines all fundamental types for the non-destructive photo editing system.
 */

// ============================================================================
// Blend Modes
// ============================================================================

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

// ============================================================================
// Layer Types
// ============================================================================

export type LayerType = 'image' | 'text' | 'shape' | 'adjustment' | 'group';

export interface BaseLayerData {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0-1
  blendMode: BlendMode;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  scaleX: number;
  scaleY: number;
  parentId: string | null; // For groups
  zIndex: number;
  mask?: MaskData;
}

export interface ImageLayerData extends BaseLayerData {
  type: 'image';
  imageData: string; // Base64 or URL
  originalImageData: string; // Preserved original
  filters: FilterData[];
}

export interface TextLayerData extends BaseLayerData {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  lineHeight: number;
  letterSpacing: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface ShapeLayerData extends BaseLayerData {
  type: 'shape';
  shapeType: 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'rounded-rectangle';
  fill?: string;
  stroke?: string;
  strokeWidth: number;
  cornerRadius?: number; // For rounded rectangles
}

export interface AdjustmentLayerData extends BaseLayerData {
  type: 'adjustment';
  adjustmentType: AdjustmentType;
  parameters: Record<string, number>;
  affectsLayersBelow: boolean;
}

export interface GroupLayerData extends BaseLayerData {
  type: 'group';
  expanded: boolean;
  childIds: string[];
}

export type LayerData =
  | ImageLayerData
  | TextLayerData
  | ShapeLayerData
  | AdjustmentLayerData
  | GroupLayerData;

// ============================================================================
// Adjustments & Filters
// ============================================================================

export type AdjustmentType =
  | 'brightness-contrast'
  | 'hue-saturation'
  | 'temperature-tint'
  | 'grayscale'
  | 'invert'
  | 'blur'
  | 'sharpen'
  | 'exposure'
  | 'vibrance'
  | 'shadows-highlights';

export interface FilterData {
  id: string;
  type: AdjustmentType;
  enabled: boolean;
  parameters: Record<string, number>;
}

// ============================================================================
// Masks
// ============================================================================

export interface MaskData {
  id: string;
  enabled: boolean;
  inverted: boolean;
  imageData: string; // Grayscale mask data
  feather: number; // Edge softness
}

// ============================================================================
// Document Model
// ============================================================================

export interface DocumentData {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: LayerData[];
  backgroundColor: string;
  createdAt: string;
  updatedAt: string;
  version: string; // Document format version
}

// ============================================================================
// Commands
// ============================================================================

export interface Command {
  id: string;
  type: string;
  timestamp: number;
  execute(): void;
  undo(): void;
  serialize(): Record<string, unknown>;
}

