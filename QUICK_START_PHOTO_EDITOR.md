# Quick Start: Photo Editor Development

## What's Been Built

A professional photo editor foundation with:
- ✅ **24/24 tests passing**
- ✅ **100% test coverage** for implemented modules
- ✅ **Non-destructive editing** architecture
- ✅ **Command pattern** for undo/redo
- ✅ **Type-safe** with TypeScript strict mode

## Running Tests

```bash
# Run all photo editor tests
npm test -- src/editor

# Run with coverage
npm run test:coverage -- src/editor

# Run specific test file
npm test -- src/editor/core/CommandManager.test.ts
```

**Expected Output**: 24/24 tests passing in ~45ms

## Project Structure

```
src/editor/
├── types/index.ts              # Type definitions
├── core/
│   ├── CommandManager.ts       # Undo/redo system
│   └── CommandManager.test.ts
└── store/
    ├── documentStore.ts        # Document state
    └── documentStore.test.ts
```

## Key Files to Review

1. **PHOTO_EDITOR_DELIVERY_PLAN.md** - Complete 30-day roadmap
2. **IMPLEMENTATION_SUMMARY.md** - What's been built
3. **IMPLEMENTATION_PROGRESS.md** - Detailed progress
4. **src/editor/README.md** - Developer guide

## Using the Document Store

```typescript
import { useDocumentStore } from '@/editor/store/documentStore';

function MyComponent() {
  const { createDocument, addLayer, document } = useDocumentStore();
  
  // Create a new document
  createDocument('My Page', 1920, 1080);
  
  // Add an image layer
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
  
  return <div>Document: {document?.name}</div>;
}
```

## Using the Command Manager

```typescript
import { CommandManager } from '@/editor/core/CommandManager';
import type { Command } from '@/editor/types';

// Create a command
class MyCommand implements Command {
  id = `my-cmd-${Date.now()}`;
  type = 'my-command';
  timestamp = Date.now();
  
  execute() {
    // Do something
  }
  
  undo() {
    // Reverse it
  }
  
  serialize() {
    return { id: this.id, type: this.type, timestamp: this.timestamp };
  }
}

// Use it
const manager = new CommandManager();
const cmd = new MyCommand();

manager.execute(cmd);  // Do it
manager.undo();        // Undo it
manager.redo();        // Redo it
```

## Next Steps

### To Continue Phase 1:
1. Implement layer commands (AddLayerCommand, DeleteLayerCommand, etc.)
2. Implement transform commands (MoveCommand, RotateCommand, etc.)
3. Integrate with existing UI components

### To Start Phase 2:
1. Create BaseLayer abstract class
2. Implement concrete layer classes
3. Build LayerManager for tree traversal
4. Add blend mode calculations

## Development Workflow

1. **Write tests first** (TDD approach)
2. **Run tests** to see them fail
3. **Implement feature** to make tests pass
4. **Refactor** while keeping tests green
5. **Document** your changes

## Example: Adding a New Feature

```bash
# 1. Create test file
touch src/editor/commands/AddLayerCommand.test.ts

# 2. Write tests
# (Edit the file with your tests)

# 3. Run tests (they should fail)
npm test -- src/editor/commands/AddLayerCommand.test.ts

# 4. Create implementation
touch src/editor/commands/AddLayerCommand.ts

# 5. Implement until tests pass
# (Edit the file with your implementation)

# 6. Run tests again (they should pass)
npm test -- src/editor/commands/AddLayerCommand.test.ts

# 7. Run all tests to ensure nothing broke
npm test -- src/editor
```

## Architecture Principles

### 1. Non-Destructive Editing
- Always preserve original data
- Store operations as parameters, not results
- Use commands for all mutations

### 2. Command Pattern
- Every action is a Command
- Commands can be executed, undone, and serialized
- Batch commands for complex operations

### 3. Type Safety
- Use TypeScript strict mode
- Define interfaces for all data structures
- Leverage type inference

### 4. Test-Driven Development
- Write tests before implementation
- Aim for 80%+ coverage
- Test behavior, not implementation

## Common Tasks

### Add a New Layer Type
1. Add type to `LayerType` union in `types/index.ts`
2. Create interface extending `BaseLayerData`
3. Add to `LayerData` union type
4. Write tests for layer operations
5. Implement layer class

### Add a New Command
1. Create test file: `commands/MyCommand.test.ts`
2. Write tests for execute, undo, serialize
3. Create implementation: `commands/MyCommand.ts`
4. Implement `Command` interface
5. Integrate with UI

### Add a New Adjustment Type
1. Add to `AdjustmentType` union in `types/index.ts`
2. Define parameter structure
3. Write filter implementation tests
4. Implement filter in `processing/FilterEngine.ts`

## Troubleshooting

### Tests Not Running
```bash
# Make sure dependencies are installed
npm install

# Try running with verbose output
npm test -- src/editor --reporter=verbose
```

### Type Errors
```bash
# Run type check
npm run type-check

# Check specific file
npx tsc --noEmit src/editor/store/documentStore.ts
```

### Import Errors
Make sure you're using the correct path aliases:
- `@/editor/types` - Type definitions
- `@/editor/core` - Core systems
- `@/editor/store` - State management

## Resources

- **Spec**: SPEC-1-React-Photo-Editor-Requirements (original requirements)
- **Plan**: PHOTO_EDITOR_DELIVERY_PLAN.md (30-day roadmap)
- **Progress**: IMPLEMENTATION_PROGRESS.md (current status)
- **Summary**: IMPLEMENTATION_SUMMARY.md (what's been built)
- **Docs**: src/editor/README.md (developer guide)

## Getting Help

1. Check the test files for usage examples
2. Review the type definitions in `types/index.ts`
3. Look at existing implementations (CommandManager, documentStore)
4. Follow the TDD workflow

## Success Metrics

- ✅ All tests passing
- ✅ 80%+ test coverage
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Documentation updated

---

**Ready to continue?** Start with implementing layer commands or move to Phase 2!

