/**
 * EditPanel Component
 *
 * Production image editor matching the vanilla storyboard.html structure:
 * - Editor Toolbar (top)
 * - Page Tabs Bar
 * - Editor Main: Canvas Area + Layers Panel + Effects Panel
 * - Editor Info Bar (bottom)
 */

import { useCallback, useState } from 'react';
import { EditorCanvas } from './EditorCanvas';
import { LayerPanel } from './LayerPanel';
import { ToolBar } from './ToolBar';
import { ZoomControls } from './ZoomControls';
import { SelectionOverlay } from './SelectionOverlay';
import { EffectsPanel } from './EffectsPanel';
import { CompositionGrid } from './CompositionGrid';
import { useEditorStore, useProjectsStore, useToast } from '../../store';
import type { Selection, LayerOverlay } from '../../store/types';
import { ImagePlus, Keyboard } from 'lucide-react';

export interface EditPanelProps {
  className?: string;
}

export function EditPanel({ className = '' }: EditPanelProps) {
  const [compositionGrid, setCompositionGrid] = useState('none');
  const { zoom, selection, canvasWidth, canvasHeight, savePage, history, historyIndex, baseImagePath } = useEditorStore();
  const currentPage = useProjectsStore((s) => s.currentPage());
  const currentBook = useProjectsStore((s) => s.currentBook());
  const pages = currentBook?.pages || [];
  const updatePage = useProjectsStore((s) => s.updatePage);
  const createPage = useProjectsStore((s) => s.createPage);
  const setCurrentPage = useProjectsStore((s) => s.setCurrentPage);
  const isLoading = useProjectsStore((s) => s.isLoading);
  const toast = useToast();

  const handleSelectionComplete = useCallback((sel: Selection) => {
    console.log('Selection completed:', sel);
  }, []);

  const handleLayerClick = useCallback((_layer: LayerOverlay) => {
    // Layer selected - effects panel will show controls
  }, []);

  const handleSavePage = useCallback(async () => {
    if (!currentPage) {
      toast.warning('No page selected');
      return;
    }
    try {
      const pageData = savePage();
      await updatePage(currentPage.id, {
        overlays: pageData.overlays,
        width: pageData.width,
        height: pageData.height,
      });
      toast.success('Page saved');
    } catch (error) {
      toast.error('Failed to save page');
    }
  }, [currentPage, savePage, updatePage, toast]);

  const handlePageClick = useCallback((pageId: string) => {
    setCurrentPage(pageId);
  }, [setCurrentPage]);

  const handleAddPage = useCallback(async () => {
    if (!currentBook) {
      toast.warning('No book selected');
      return;
    }
    try {
      const pageNumber = pages.length + 1;
      await createPage(currentBook.id, `Page ${pageNumber}`);
      toast.success(`Page ${pageNumber} created`);
    } catch (error) {
      toast.error('Failed to create page');
    }
  }, [currentBook, pages.length, createPage, toast]);

  return (
    <div className={`production-editor ${className}`}>
      {/* Editor Toolbar */}
      <ToolBar />

      {/* Page Tabs Bar */}
      <div className="editor-page-tabs">
        <div className="page-tabs-container">
          {pages.length > 0 ? (
            pages.map((page, idx) => (
              <button
                key={page.id}
                className={`page-tab ${currentPage?.id === page.id ? 'active' : ''}`}
                onClick={() => handlePageClick(page.id)}
                title={`Switch to Page ${idx + 1}`}
              >
                <span className="page-tab-name">Page {idx + 1}</span>
                <span className="page-tab-size">{page.width}×{page.height}</span>
              </button>
            ))
          ) : (
            <div className="page-tab active">
              <span className="page-tab-name">Untitled</span>
            </div>
          )}
        </div>
        <button
          className="page-tab-add"
          title="New blank page"
          onClick={handleAddPage}
          disabled={isLoading || !currentBook}
        >
          +
        </button>
      </div>

      {/* Editor Main Area */}
      <div className="editor-main">
        {/* Canvas Area */}
        <div className="editor-canvas-area">
          <div className="editor-canvas-container">
            {baseImagePath ? (
              <div className="editor-canvas-wrapper">
                <EditorCanvas onLayerClick={handleLayerClick} />
                <SelectionOverlay onSelectionComplete={handleSelectionComplete} />
                <CompositionGrid gridType={compositionGrid} />
              </div>
            ) : (
              <div className="editor-placeholder">
                <ImagePlus size={48} className="placeholder-icon" />
                <p className="placeholder-title">No base image loaded</p>
                <p className="placeholder-subtitle">To get started:</p>
                <ol className="placeholder-steps">
                  <li>Go to the <strong>"Generate"</strong> tab and create variations</li>
                  <li>Click <strong>Scene</strong> to save to Assets</li>
                  <li>Click any asset in the <strong>Assets</strong> panel (left) to edit it here</li>
                </ol>
                <p className="placeholder-hint">You can drag additional assets onto the canvas to add layers</p>
              </div>
            )}
          </div>

          {/* Editor Info Bar */}
          <div className="editor-info-bar">
            <ZoomControls compact />
            <div className="composition-controls">
              <label>Grid:</label>
              <select value={compositionGrid} onChange={(e) => setCompositionGrid(e.target.value)}>
                <option value="none">None</option>
                <option value="thirds">Rule of Thirds</option>
                <option value="golden">Golden Ratio</option>
                <option value="diagonal">Diagonals</option>
                <option value="center">Center Cross</option>
              </select>
            </div>
            <span className="info-item">
              Selection: <span className="info-value">
                {selection ? `${Math.round(selection.width)}×${Math.round(selection.height)}` : 'None'}
              </span>
            </span>
            <span className="info-item">
              Size: <span className="info-value">{canvasWidth}×{canvasHeight}</span>
            </span>
            <span className="info-item">
              History: <span className="info-value">{historyIndex + 1} / {history.length}</span>
            </span>
            <div className="info-spacer" />
            <button className="shortcuts-btn" title="Keyboard Shortcuts">
              <Keyboard size={12} /> <kbd>?</kbd>
            </button>
          </div>
        </div>

        {/* Layers Panel (Right Side) */}
        <LayerPanel />

        {/* Effects Panel (Right Side) */}
        <EffectsPanel />
      </div>
    </div>
  );
}

/**
 * EditSidebar Component
 *
 * Content for the left sidebar when in Edit mode.
 */
export function EditSidebar({ className = '' }: { className?: string }) {
  return (
    <div className={`edit-sidebar ${className}`}>
      <ToolBar vertical />
    </div>
  );
}

/**
 * EditToolbar Component
 *
 * Toolbar content for Edit mode.
 */
export function EditToolbar({ className = '' }: { className?: string }) {
  const { canUndo, canRedo, undo, redo } = useEditorStore();

  return (
    <div className={`edit-toolbar-content ${className}`}>
      <button className="editor-tool" onClick={undo} disabled={!canUndo()} title="Undo">↶</button>
      <button className="editor-tool" onClick={redo} disabled={!canRedo()} title="Redo">↷</button>
    </div>
  );
}

