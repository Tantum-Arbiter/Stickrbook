import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from './editorStore'
import type { LayerOverlay, Page } from './types'

describe('EditorStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useEditorStore.setState({
      zoom: 1,
      panX: 0,
      panY: 0,
      canvasWidth: 1080,
      canvasHeight: 704,
      layers: [],
      selectedLayerId: null,
      baseImagePath: null,
      selection: null,
      isSelecting: false,
      history: [],
      historyIndex: -1,
      activeTool: 'select',
    })
  })

  describe('zoom and pan', () => {
    it('sets zoom within bounds', () => {
      const { setZoom } = useEditorStore.getState()
      
      setZoom(2)
      expect(useEditorStore.getState().zoom).toBe(2)
      
      setZoom(0.5)
      expect(useEditorStore.getState().zoom).toBe(0.5)
    })

    it('clamps zoom to minimum 0.1', () => {
      const { setZoom } = useEditorStore.getState()
      
      setZoom(0.01)
      expect(useEditorStore.getState().zoom).toBe(0.1)
    })

    it('clamps zoom to maximum 5', () => {
      const { setZoom } = useEditorStore.getState()
      
      setZoom(10)
      expect(useEditorStore.getState().zoom).toBe(5)
    })

    it('sets pan position', () => {
      const { setPan } = useEditorStore.getState()
      
      setPan(100, 200)
      
      expect(useEditorStore.getState().panX).toBe(100)
      expect(useEditorStore.getState().panY).toBe(200)
    })

    it('resets view to default', () => {
      const { setZoom, setPan, resetView } = useEditorStore.getState()
      
      setZoom(2)
      setPan(100, 200)
      resetView()
      
      expect(useEditorStore.getState().zoom).toBe(1)
      expect(useEditorStore.getState().panX).toBe(0)
      expect(useEditorStore.getState().panY).toBe(0)
    })

    it('fits to canvas', () => {
      const { setZoom, setPan, fitToCanvas } = useEditorStore.getState()
      
      setZoom(0.5)
      setPan(100, 200)
      fitToCanvas()
      
      expect(useEditorStore.getState().zoom).toBe(1)
      expect(useEditorStore.getState().panX).toBe(0)
      expect(useEditorStore.getState().panY).toBe(0)
    })
  })

  describe('layers', () => {
    const mockLayer: Omit<LayerOverlay, 'id'> = {
      type: 'image',
      name: 'Test Layer',
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      zIndex: 0,
      scale: 1,
      rotation: 0,
      opacity: 1,
    }

    it('adds layer and generates ID', () => {
      const { addLayer } = useEditorStore.getState()
      
      addLayer(mockLayer)
      
      const layers = useEditorStore.getState().layers
      expect(layers).toHaveLength(1)
      expect(layers[0].id).toBeDefined()
      expect(layers[0].name).toBe('Test Layer')
    })

    it('selects newly added layer', () => {
      const { addLayer } = useEditorStore.getState()
      
      addLayer(mockLayer)
      
      const { layers, selectedLayerId } = useEditorStore.getState()
      expect(selectedLayerId).toBe(layers[0].id)
    })

    it('updates layer properties', () => {
      const { addLayer, updateLayer } = useEditorStore.getState()
      
      addLayer(mockLayer)
      const layerId = useEditorStore.getState().layers[0].id
      
      updateLayer(layerId, { x: 50, y: 50, opacity: 0.5 })
      
      const layer = useEditorStore.getState().layers[0]
      expect(layer.x).toBe(50)
      expect(layer.y).toBe(50)
      expect(layer.opacity).toBe(0.5)
    })

    it('deletes layer', () => {
      const { addLayer, deleteLayer } = useEditorStore.getState()
      
      addLayer(mockLayer)
      const layerId = useEditorStore.getState().layers[0].id
      
      deleteLayer(layerId)
      
      expect(useEditorStore.getState().layers).toHaveLength(0)
    })

    it('clears selection when selected layer is deleted', () => {
      const { addLayer, deleteLayer } = useEditorStore.getState()

      addLayer(mockLayer)
      const layerId = useEditorStore.getState().layers[0].id

      expect(useEditorStore.getState().selectedLayerId).toBe(layerId)

      deleteLayer(layerId)

      expect(useEditorStore.getState().selectedLayerId).toBeNull()
    })

    it('selects layer by ID', () => {
      const { addLayer, selectLayer } = useEditorStore.getState()

      addLayer(mockLayer)
      addLayer({ ...mockLayer, name: 'Layer 2' })

      const layers = useEditorStore.getState().layers
      selectLayer(layers[0].id)

      expect(useEditorStore.getState().selectedLayerId).toBe(layers[0].id)
    })

    it('deselects layer with null', () => {
      const { addLayer, selectLayer } = useEditorStore.getState()

      addLayer(mockLayer)
      selectLayer(null)

      expect(useEditorStore.getState().selectedLayerId).toBeNull()
    })

    it('duplicates layer with offset', () => {
      const { addLayer, duplicateLayer } = useEditorStore.getState()

      addLayer(mockLayer)
      const originalId = useEditorStore.getState().layers[0].id

      duplicateLayer(originalId)

      const layers = useEditorStore.getState().layers
      expect(layers).toHaveLength(2)
      expect(layers[1].x).toBe(mockLayer.x + 20)
      expect(layers[1].y).toBe(mockLayer.y + 20)
      expect(layers[1].id).not.toBe(originalId)
    })

    it('does nothing when duplicating non-existent layer', () => {
      const { duplicateLayer } = useEditorStore.getState()

      duplicateLayer('non-existent')

      expect(useEditorStore.getState().layers).toHaveLength(0)
    })

    it('reorders layers', () => {
      const { addLayer, reorderLayers } = useEditorStore.getState()

      addLayer({ ...mockLayer, name: 'Layer 1' })
      addLayer({ ...mockLayer, name: 'Layer 2' })
      addLayer({ ...mockLayer, name: 'Layer 3' })

      const layers = useEditorStore.getState().layers
      const ids = layers.map(l => l.id)

      reorderLayers([ids[2], ids[0], ids[1]])

      const reordered = useEditorStore.getState().layers
      expect(reordered[0].name).toBe('Layer 3')
      expect(reordered[1].name).toBe('Layer 1')
      expect(reordered[2].name).toBe('Layer 2')
    })
  })

  describe('selection', () => {
    it('sets selection', () => {
      const { setSelection } = useEditorStore.getState()

      setSelection({ x: 10, y: 20, width: 100, height: 50 })

      const { selection, isSelecting } = useEditorStore.getState()
      expect(selection).toEqual({ x: 10, y: 20, width: 100, height: 50 })
      expect(isSelecting).toBe(true)
    })

    it('clears selection', () => {
      const { setSelection, clearSelection } = useEditorStore.getState()

      setSelection({ x: 10, y: 20, width: 100, height: 50 })
      clearSelection()

      const { selection, isSelecting } = useEditorStore.getState()
      expect(selection).toBeNull()
      expect(isSelecting).toBe(false)
    })
  })

  describe('history', () => {
    const mockLayer: Omit<LayerOverlay, 'id'> = {
      type: 'image',
      name: 'Test Layer',
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      zIndex: 0,
      scale: 1,
      rotation: 0,
      opacity: 1,
    }

    it('pushes history entry', () => {
      const { pushHistory } = useEditorStore.getState()

      pushHistory('Test action')

      const { history, historyIndex } = useEditorStore.getState()
      expect(history).toHaveLength(1)
      expect(history[0].action).toBe('Test action')
      expect(historyIndex).toBe(0)
    })

    it('canUndo returns false when at start', () => {
      const { canUndo } = useEditorStore.getState()

      expect(canUndo()).toBe(false)
    })

    it('canUndo returns true after changes', () => {
      const { addLayer, canUndo } = useEditorStore.getState()

      addLayer(mockLayer) // This pushes history
      addLayer(mockLayer) // Second entry

      expect(canUndo()).toBe(true)
    })

    it('undo restores previous state', () => {
      const { addLayer, updateLayer, undo } = useEditorStore.getState()

      // Add a layer - pushes history with empty state BEFORE adding layer
      addLayer(mockLayer)
      const layerId = useEditorStore.getState().layers[0].id
      expect(useEditorStore.getState().history).toHaveLength(1)
      // history[0] contains empty layers (state before addLayer)

      // Update the layer - pushes history with layer at x=0 BEFORE updating
      updateLayer(layerId, { x: 100 })
      expect(useEditorStore.getState().history).toHaveLength(2)
      // history[1] contains layer at x=0 (state before updateLayer)
      expect(useEditorStore.getState().layers[0].x).toBe(100)
      expect(useEditorStore.getState().historyIndex).toBe(1)

      // Undo goes to history[historyIndex - 1] = history[0] = empty layers
      undo()
      expect(useEditorStore.getState().historyIndex).toBe(0)
      // The first undo goes all the way back to before addLayer (empty)
      expect(useEditorStore.getState().layers).toHaveLength(0)
    })

    it('redo restores next state', () => {
      const { addLayer, updateLayer, undo, redo } = useEditorStore.getState()

      // Add a layer and update it
      addLayer(mockLayer)
      const layerId = useEditorStore.getState().layers[0].id
      updateLayer(layerId, { x: 100 })
      expect(useEditorStore.getState().historyIndex).toBe(1)

      // Undo goes to history[0] = empty layers
      undo()
      expect(useEditorStore.getState().historyIndex).toBe(0)
      expect(useEditorStore.getState().layers).toHaveLength(0)

      // Redo goes to history[1] = layer with x=0 (state captured before updateLayer)
      redo()
      expect(useEditorStore.getState().historyIndex).toBe(1)
      expect(useEditorStore.getState().layers).toHaveLength(1)
      expect(useEditorStore.getState().layers[0].x).toBe(0)
    })

    it('clears redo history on new action', () => {
      const { addLayer, updateLayer, undo, canRedo } = useEditorStore.getState()

      addLayer(mockLayer)
      const layerId = useEditorStore.getState().layers[0].id

      updateLayer(layerId, { x: 100 })
      undo()

      expect(canRedo()).toBe(true)

      updateLayer(layerId, { y: 50 })

      expect(canRedo()).toBe(false)
    })

    it('clears history', () => {
      const { pushHistory, clearHistory } = useEditorStore.getState()

      pushHistory('Action 1')
      pushHistory('Action 2')

      expect(useEditorStore.getState().history).toHaveLength(2)

      clearHistory()

      expect(useEditorStore.getState().history).toHaveLength(0)
      expect(useEditorStore.getState().historyIndex).toBe(-1)
    })

    it('limits history to 50 entries', () => {
      const { pushHistory } = useEditorStore.getState()

      for (let i = 0; i < 60; i++) {
        pushHistory(`Action ${i}`)
      }

      expect(useEditorStore.getState().history).toHaveLength(50)
    })
  })

  describe('tools', () => {
    it('sets active tool', () => {
      const { setActiveTool } = useEditorStore.getState()

      setActiveTool('move')
      expect(useEditorStore.getState().activeTool).toBe('move')

      setActiveTool('crop')
      expect(useEditorStore.getState().activeTool).toBe('crop')
    })
  })

  describe('page load/save', () => {
    it('loads page data', () => {
      const { loadPage } = useEditorStore.getState()

      const page: Page = {
        id: 'page-1',
        bookId: 'book-1',
        name: 'Test Page',
        pageNumber: 1,
        width: 800,
        height: 600,
        imagePath: '/images/test.png',
        overlays: [],
        status: 'pending',
        textLayout: 'text-below',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }

      loadPage(page)

      const state = useEditorStore.getState()
      expect(state.canvasWidth).toBe(800)
      expect(state.canvasHeight).toBe(600)
      expect(state.baseImagePath).toBe('/images/test.png')
      expect(state.zoom).toBe(1)
      expect(state.panX).toBe(0)
    })

    it('saves page data', () => {
      const { setBaseImage, addLayer, savePage } = useEditorStore.getState()

      setBaseImage('/images/saved.png')
      addLayer({
        type: 'text',
        name: 'Text Layer',
        visible: true,
        locked: false,
        x: 10,
        y: 10,
        width: 200,
        height: 50,
        zIndex: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
      })

      const page = savePage()

      expect(page.imagePath).toBe('/images/saved.png')
      expect(page.overlays).toHaveLength(1)
      expect(page.width).toBe(1080)
      expect(page.height).toBe(704)
    })
  })

  describe('base image', () => {
    it('sets base image', () => {
      const { setBaseImage } = useEditorStore.getState()

      setBaseImage('/images/base.png')

      expect(useEditorStore.getState().baseImagePath).toBe('/images/base.png')
    })

    it('clears base image with null', () => {
      const { setBaseImage } = useEditorStore.getState()

      setBaseImage('/images/base.png')
      setBaseImage(null)

      expect(useEditorStore.getState().baseImagePath).toBeNull()
    })
  })
})

