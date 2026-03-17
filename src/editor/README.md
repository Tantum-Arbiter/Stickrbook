# Photo Editor Module

A professional-grade, browser-based photo editor built with React, TypeScript, and Canvas API. Designed for storybook creation with AI-assisted compositing.

## Architecture

### Core Principles

1. **Non-Destructive Editing**: All operations preserve original data
2. **Command Pattern**: Every action is reversible with undo/redo
3. **Layer-Based**: Photoshop-style layer system with blend modes
4. **Type-Safe**: Full TypeScript coverage with strict mode
5. **Test-Driven**: 80%+ test coverage with TDD approach

### Module Structure

```
src/editor/
├── types/              # TypeScript type definitions
│   └── index.ts       # Core types (layers, commands, document)
│
├── core/              # Core systems
│   ├── CommandManager.ts      # Command pattern implementation
│   ├── LayerManager.ts        # Layer tree management (TODO)
│   ├── ViewportManager.ts     # Zoom/pan/coordinate transforms (TODO)
│   └── KeyboardManager.ts     # Keyboard shortcuts (TODO)
│
├── store/             # Zustand state management
│   ├── documentStore.ts       # Document and layer state
│   ├── viewportStore.ts       # Viewport state (TODO)
│   └── toolStore.ts           # Active tool state (TODO)
│
├── layers/            # Layer implementations
│   ├── BaseLayer.ts           # Abstract base class (TODO)
│   ├── ImageLayer.ts          # Image layer (TODO)
│   ├── TextLayer.ts           # Text layer (TODO)
│   ├── ShapeLayer.ts          # Shape layer (TODO)
│   ├── AdjustmentLayer.ts     # Adjustment layer (TODO)
│   └── GroupLayer.ts          # Group layer (TODO)
│
├── commands/          # Command implementations
│   ├── layer/                 # Layer commands (TODO)
│   ├── transform/             # Transform commands (TODO)
│   ├── adjustment/            # Adjustment commands (TODO)
│   └── paint/                 # Paint/brush commands (TODO)
│
├── tools/             # Editing tools
│   ├── SelectionTool.ts       # Selection tool (TODO)
│   ├── TransformTool.ts       # Transform tool (TODO)
│   ├── CropTool.ts            # Crop tool (TODO)
│   ├── BrushTool.ts           # Brush tool (TODO)
│   ├── EraserTool.ts          # Eraser tool (TODO)
│   ├── TextTool.ts            # Text tool (TODO)
│   ├── ShapeTool.ts           # Shape tool (TODO)
│   └── MagicMergeTool.ts      # AI Magic Merge (TODO)
│
├── rendering/         # Canvas rendering
│   ├── CanvasRenderer.ts      # Main renderer (TODO)
│   ├── LayerRenderer.ts       # Layer rendering (TODO)
│   ├── BlendModes.ts          # Blend mode calculations (TODO)
│   └── PixelGrid.ts           # Pixel grid overlay (TODO)
│
├── processing/        # Image processing
│   ├── FilterEngine.ts        # Filter application (TODO)
│   ├── MaskProcessor.ts       # Mask operations (TODO)
│   └── Resampler.ts           # Image resampling (TODO)
│
├── services/          # External services
│   ├── MagicMergeService.ts   # AI service client (TODO)
│   ├── FileImporter.ts        # File import (TODO)
│   └── ExportService.ts       # Export service (TODO)
│
└── io/                # File I/O
    ├── DocumentPersistence.ts # IndexedDB storage (TODO)
    └── AutosaveManager.ts     # Autosave (TODO)
```

## Implemented Features

### ✅ Core Types System
- Comprehensive TypeScript definitions
- 12 blend modes
- 5 layer types (image, text, shape, adjustment, group)
- 10 adjustment types
- Mask and filter data structures

### ✅ Command Manager
- Execute/undo/redo operations
- Command batching for complex operations
- History size limits (default: 50)
- History serialization
- **Tests**: 14/14 passing

### ✅ Document Store
- Document creation and loading
- Layer management (add, update, delete, reorder, duplicate)
- Multi-layer selection
- Viewport state (zoom, pan)
- **Tests**: 10/10 passing

## Usage Examples

### Creating a Document

```typescript
import { useDocumentStore } from '@/editor/store/documentStore';

function MyComponent() {
  const createDocument = useDocumentStore(s => s.createDocument);
  
  const handleCreate = () => {
    createDocument('My Storybook Page', 1920, 1080);
  };
  
  return <button onClick={handleCreate}>New Document</button>;
}
```

### Adding Layers

```typescript
import { useDocumentStore } from '@/editor/store/documentStore';

function AddImageLayer() {
  const addLayer = useDocumentStore(s => s.addLayer);
  
  const handleAdd = () => {
    const layerId = addLayer({
      type: 'image',
      name: 'Character',
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal',
      x: 100,
      y: 100,
      width: 500,
      height: 500,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      parentId: null,
      zIndex: 0,
      imageData: 'data:image/png;base64,...',
      originalImageData: 'data:image/png;base64,...',
      filters: [],
    });
    
    console.log('Created layer:', layerId);
  };
  
  return <button onClick={handleAdd}>Add Image</button>;
}
```

### Using Commands

```typescript
import { CommandManager } from '@/editor/core/CommandManager';
import type { Command } from '@/editor/types';

class MoveLayerCommand implements Command {
  id = `move-${Date.now()}`;
  type = 'move-layer';
  timestamp = Date.now();
  
  constructor(
    private layerId: string,
    private oldX: number,
    private oldY: number,
    private newX: number,
    private newY: number,
    private updateLayer: (id: string, updates: any) => void
  ) {}
  
  execute() {
    this.updateLayer(this.layerId, { x: this.newX, y: this.newY });
  }
  
  undo() {
    this.updateLayer(this.layerId, { x: this.oldX, y: this.oldY });
  }
  
  serialize() {
    return {
      id: this.id,
      type: this.type,
      timestamp: this.timestamp,
      layerId: this.layerId,
      oldX: this.oldX,
      oldY: this.oldY,
      newX: this.newX,
      newY: this.newY,
    };
  }
}

// Usage
const manager = new CommandManager();
const cmd = new MoveLayerCommand('layer-1', 0, 0, 100, 100, updateLayer);
manager.execute(cmd);
manager.undo(); // Moves back to 0, 0
manager.redo(); // Moves to 100, 100
```

## Testing

### Running Tests

```bash
# Run all editor tests
npm test -- src/editor

# Run specific test file
npm test -- src/editor/core/CommandManager.test.ts

# Run with coverage
npm run test:coverage -- src/editor
```

### Test Coverage Goals

- **Core Systems**: 90%+
- **Commands**: 85%+
- **Tools**: 80%+
- **UI Components**: 70%+ (integration tests)

## Development Workflow

1. **Write Tests First** (TDD)
2. **Implement Feature**
3. **Run Tests**
4. **Refactor**
5. **Document**

## Next Steps

See [PHOTO_EDITOR_DELIVERY_PLAN.md](../../PHOTO_EDITOR_DELIVERY_PLAN.md) for the complete implementation roadmap.

