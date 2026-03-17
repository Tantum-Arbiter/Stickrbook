# Photo Editor Delivery Plan - TDD Implementation

## Overview
This document outlines the delivery plan for implementing SPEC-1-React-Photo-Editor-Requirements using Test-Driven Development (TDD) best practices.

## Architecture Principles

### 1. Separation of Concerns
- **UI Layer (React)**: Layout, panels, toolbars, controls
- **State Layer (Zustand)**: Document state, command history, UI state
- **Rendering Layer (Canvas)**: Document rendering, overlays, transforms
- **Processing Layer (Workers)**: Heavy pixel operations, filters, masks
- **AI Layer (Backend)**: Magic Merge, segmentation, harmonization

### 2. Non-Destructive Editing
- All operations stored as commands
- Original assets preserved
- Adjustments remain editable
- Masks are non-destructive
- History supports full undo/redo

### 3. Command Pattern
Every user action is a reversible command with:
- `execute()`: Apply the change
- `undo()`: Reverse the change
- `serialize()`: Save to document
- `deserialize()`: Load from document

## Phase 1: Architecture & Foundation (Days 1-2)

### Deliverables
1. **Core Types System** (`src/editor/types/`)
   - Layer types (Image, Text, Shape, Adjustment, Group)
   - Document model
   - Command interfaces
   - Transform types
   - Blend modes

2. **Command Manager** (`src/editor/core/CommandManager.ts`)
   - Command execution
   - Undo/redo stack
   - History persistence
   - Command batching

3. **Document Store** (`src/editor/store/documentStore.ts`)
   - Document state management
   - Layer tree management
   - Selection state
   - Canvas state (zoom, pan)

### Tests
- ✅ Command execution and undo/redo
- ✅ Layer creation and manipulation
- ✅ Document serialization/deserialization
- ✅ History limits and cleanup

## Phase 2: Document Model & Layer System (Days 3-5)

### Deliverables
1. **Layer System** (`src/editor/layers/`)
   - BaseLayer abstract class
   - ImageLayer implementation
   - TextLayer implementation
   - ShapeLayer implementation
   - AdjustmentLayer implementation
   - GroupLayer implementation

2. **Layer Operations** (`src/editor/commands/layer/`)
   - AddLayerCommand
   - DeleteLayerCommand
   - ReorderLayerCommand
   - DuplicateLayerCommand
   - GroupLayersCommand
   - UpdateLayerPropertiesCommand

3. **Layer Manager** (`src/editor/core/LayerManager.ts`)
   - Layer tree traversal
   - Z-index management
   - Visibility/lock state
   - Opacity and blend modes

### Tests
- ✅ Each layer type creation and properties
- ✅ Layer operations (add, delete, reorder, duplicate)
- ✅ Layer grouping and nesting
- ✅ Blend mode calculations
- ✅ Layer visibility and locking

## Phase 3: Canvas Rendering & Interaction (Days 6-9)

### Deliverables
1. **Canvas Renderer** (`src/editor/rendering/CanvasRenderer.ts`)
   - Layer composition
   - Blend mode rendering
   - Transform application
   - Pixel-perfect rendering at high zoom
   - Checkerboard transparency background

2. **Viewport Manager** (`src/editor/core/ViewportManager.ts`)
   - Zoom (0.1x to 16x)
   - Pan with bounds
   - Fit to screen
   - Actual size (100%)
   - Coordinate transformations

3. **Pixel Grid** (`src/editor/rendering/PixelGrid.ts`)
   - Grid overlay at high zoom (>400%)
   - Configurable threshold
   - Nearest-neighbor preview mode

### Tests
- ✅ Canvas rendering with multiple layers
- ✅ Blend mode compositing
- ✅ Zoom and pan transformations
- ✅ Coordinate conversion (screen ↔ canvas)
- ✅ Pixel grid visibility at zoom levels

## Phase 4: Core Editing Tools (Days 10-15)

### Deliverables
1. **Selection Tool** (`src/editor/tools/SelectionTool.ts`)
   - Rectangle selection
   - Multi-layer selection
   - Transform handles
   - Keyboard nudging

2. **Transform Tool** (`src/editor/tools/TransformTool.ts`)
   - Move, resize, rotate
   - Maintain aspect ratio
   - Flip horizontal/vertical
   - Numeric input

3. **Crop Tool** (`src/editor/tools/CropTool.ts`)
   - Free crop
   - Fixed aspect ratio
   - Rule of thirds guides
   - Non-destructive crop

4. **Brush Tool** (`src/editor/tools/BrushTool.ts`)
   - Configurable size, opacity, hardness
   - Pressure sensitivity (if supported)
   - Brush presets
   - Paint on raster layers and masks

5. **Eraser Tool** (`src/editor/tools/EraserTool.ts`)
   - Erase on raster layers
   - Erase on masks
   - Same controls as brush

6. **Text Tool** (`src/editor/tools/TextTool.ts`)
   - Add text layers
   - Font family, size, weight
   - Alignment, spacing
   - Editable until rasterized

7. **Shape Tool** (`src/editor/tools/ShapeTool.ts`)
   - Rectangle, ellipse, line, arrow
   - Fill and stroke
   - Editable until rasterized

### Tests
- ✅ Selection creation and manipulation
- ✅ Transform operations with constraints
- ✅ Crop with aspect ratio preservation
- ✅ Brush strokes at various sizes
- ✅ Eraser functionality
- ✅ Text layer creation and editing
- ✅ Shape creation and properties

## Phase 5: Adjustments & Effects (Days 16-18)

### Deliverables
1. **Adjustment Layers** (`src/editor/layers/adjustments/`)
   - Brightness/Contrast
   - Hue/Saturation
   - Temperature/Tint
   - Grayscale
   - Invert
   - Blur
   - Sharpen

2. **Filter Engine** (`src/editor/processing/FilterEngine.ts`)
   - Apply adjustments to layer data
   - Live preview
   - Non-destructive parameters

3. **Mask System** (`src/editor/core/MaskManager.ts`)
   - Layer masks
   - Paint into masks
   - Invert masks
   - Enable/disable masks

### Tests
- ✅ Each adjustment type with various parameters
- ✅ Adjustment layer stacking
- ✅ Mask creation and editing
- ✅ Mask inversion and disable
- ✅ Filter performance benchmarks

## Phase 6: Magic Merge AI Integration (Days 19-23)

### Deliverables
1. **Magic Merge Tool** (`src/editor/tools/MagicMergeTool.ts`)
   - Detect/confirm subject mask
   - Trigger AI pipeline
   - Preview before/after
   - Manual refinement controls

2. **AI Service Client** (`src/editor/services/MagicMergeService.ts`)
   - API client for backend
   - Progress tracking
   - Error handling
   - Retry logic

3. **Backend AI Pipeline** (`backend/magic_merge/`)
   - Subject segmentation endpoint
   - Scene analysis endpoint
   - Harmonization endpoint
   - Shadow/relight endpoint
   - Seam inpainting endpoint

4. **Merge Controls** (`src/components/editor/MagicMergePanel.tsx`)
   - Strength sliders
   - Style match controls
   - Shadow controls
   - Edge softness
   - Preview modes

### Tests
- ✅ Magic Merge API client
- ✅ Mock AI responses
- ✅ Progress tracking
- ✅ Error handling and recovery
- ✅ Parameter adjustment
- ✅ Before/after comparison

## Phase 7: File I/O & Export (Days 24-26)

### Deliverables
1. **File Import** (`src/editor/io/FileImporter.ts`)
   - PNG, JPEG, WebP support
   - SVG flattening
   - File validation
   - Dimension limits

2. **Document Persistence** (`src/editor/io/DocumentPersistence.ts`)
   - IndexedDB storage
   - Autosave (every 30s)
   - Document recovery
   - Version management

3. **Export Service** (`src/editor/io/ExportService.ts`)
   - Flatten layers
   - PNG/JPEG/WebP export
   - Quality settings
   - Dimension control
   - Progress feedback

### Tests
- ✅ File import validation
- ✅ Unsupported format handling
- ✅ Document save/load
- ✅ Autosave triggers
- ✅ Export with various formats
- ✅ Export quality settings

## Phase 8: UI Polish & Accessibility (Days 27-30)

### Deliverables
1. **Keyboard Shortcuts** (`src/editor/core/KeyboardManager.ts`)
   - Tool shortcuts (S, H, B, etc.)
   - Undo/Redo (Cmd+Z, Cmd+Shift+Z)
   - Copy/Paste (Cmd+C, Cmd+V)
   - Delete, Zoom, Save

2. **Panels & Inspectors** (`src/components/editor/panels/`)
   - Properties panel
   - Layers panel with drag-drop
   - History panel
   - Tools panel

3. **Accessibility** (`src/editor/a11y/`)
   - ARIA labels
   - Keyboard navigation
   - Focus management
   - Screen reader support

4. **Error Handling** (`src/editor/core/ErrorHandler.ts`)
   - User-friendly error messages
   - Recovery suggestions
   - Error logging

### Tests
- ✅ Keyboard shortcut handling
- ✅ Panel interactions
- ✅ Accessibility compliance
- ✅ Error message display
- ✅ Focus management

## Testing Strategy

### Unit Tests (Vitest)
- **Coverage Target**: 80%+ for core logic
- **Focus Areas**:
  - Command execution and undo/redo
  - Layer operations
  - Transform calculations
  - Filter algorithms
  - State management

### Integration Tests (Vitest + Testing Library)
- **Focus Areas**:
  - Tool interactions
  - Multi-layer operations
  - File import/export
  - Autosave/recovery

### E2E Tests (Playwright)
- **Critical Workflows**:
  1. Create document → Add layers → Transform → Export
  2. Import image → Apply adjustments → Save → Reopen
  3. Insert asset → Magic Merge → Refine → Export
  4. Multi-layer composition → Group → Export

### Performance Tests
- **Benchmarks**:
  - Canvas rendering at various zoom levels
  - Filter application on large images
  - Undo/redo with deep history
  - Export time for various formats

## Dependencies to Install

```bash
# Canvas manipulation
npm install konva react-konva

# Image processing
npm install pica sharp-wasm

# Color utilities
npm install tinycolor2 @types/tinycolor2

# File handling
npm install file-saver jszip

# Already installed
# - zustand (state management)
# - lucide-react (icons)
# - vitest (testing)
# - playwright (e2e)
```

## Success Criteria

### MVP Complete When:
1. ✅ User can create/open a document
2. ✅ User can import base image and assets
3. ✅ User can add, transform, and reorder layers
4. ✅ User can apply non-destructive adjustments
5. ✅ User can use brush/eraser on layers and masks
6. ✅ User can add text and shapes
7. ✅ User can run Magic Merge on inserted assets
8. ✅ User can refine Magic Merge results manually
9. ✅ User can undo/redo all operations
10. ✅ User can export final composition
11. ✅ Document autosaves and recovers
12. ✅ All critical workflows pass E2E tests
13. ✅ 80%+ unit test coverage
14. ✅ Performance benchmarks met

## Timeline Summary

- **Phase 1**: Days 1-2 (Architecture)
- **Phase 2**: Days 3-5 (Layers)
- **Phase 3**: Days 6-9 (Canvas)
- **Phase 4**: Days 10-15 (Tools)
- **Phase 5**: Days 16-18 (Adjustments)
- **Phase 6**: Days 19-23 (Magic Merge)
- **Phase 7**: Days 24-26 (File I/O)
- **Phase 8**: Days 27-30 (Polish)

**Total**: ~30 working days (6 weeks)

## Next Steps

1. Install required dependencies
2. Set up Phase 1 folder structure
3. Write first tests for Command pattern
4. Implement CommandManager with TDD
5. Continue through phases sequentially

