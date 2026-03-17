/**
 * Photo Editor - Main Export
 * 
 * Professional-grade photo editor for Stickrbook application.
 * Implements SPEC-1-React-Photo-Editor-Requirements.
 */

// Main Component
export { PhotoEditor } from './components/PhotoEditor';
export { CanvasWorkspace } from './components/CanvasWorkspace';
export { LayersPanel } from './components/LayersPanel';

// Core Systems
export { CommandManager } from './core/CommandManager';
export { LayerManager } from './core/LayerManager';
export { ViewportManager } from './core/ViewportManager';
export { KeyboardManager, DEFAULT_SHORTCUTS } from './core/KeyboardManager';

// State Management
export { useDocumentStore } from './store/documentStore';

// Layer Classes
export { BaseLayer } from './layers/BaseLayer';
export { ImageLayer } from './layers/ImageLayer';
export { TextLayer } from './layers/TextLayer';
export { ShapeLayer } from './layers/ShapeLayer';

// Commands
export { AddLayerCommand } from './commands/layer/AddLayerCommand';
export { UpdateLayerCommand } from './commands/layer/UpdateLayerCommand';
export { DeleteLayerCommand } from './commands/layer/DeleteLayerCommand';
export { MoveCommand } from './commands/transform/MoveCommand';
export { RotateCommand } from './commands/transform/RotateCommand';
export { ScaleCommand } from './commands/transform/ScaleCommand';

// Tools
export { BaseTool } from './tools/BaseTool';
export { SelectTool } from './tools/SelectTool';
export { BrushTool } from './tools/BrushTool';

// Rendering
export { CanvasRenderer } from './rendering/CanvasRenderer';

// Processing
export { FilterEngine } from './processing/FilterEngine';
export { MaskProcessor } from './processing/MaskProcessor';

// AI Services
export { MagicMergeService } from './ai/MagicMergeService';
export type { MagicMergeOptions, MagicMergeResult } from './ai/MagicMergeService';

// Services
export { ExportService } from './services/ExportService';
export type { ExportOptions } from './services/ExportService';
export { StorageService, AutosaveService } from './services/StorageService';
export { AssetBridge } from './services/AssetBridge';

// Types
export type {
  // Core types
  BlendMode,
  LayerType,
  AdjustmentType,
  
  // Layer data types
  LayerData,
  BaseLayerData,
  ImageLayerData,
  TextLayerData,
  ShapeLayerData,
  AdjustmentLayerData,
  GroupLayerData,
  
  // Other types
  FilterData,
  DocumentData,
  Command,
  ViewportState,
} from './types';

