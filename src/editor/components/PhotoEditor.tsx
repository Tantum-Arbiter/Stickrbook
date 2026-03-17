/**
 * PhotoEditor
 * 
 * Main photo editor component that integrates all systems.
 */

import React, { useEffect, useRef } from 'react';
import { CanvasWorkspace } from './CanvasWorkspace';
import { LayersPanel } from './LayersPanel';
import { useDocumentStore } from '../store/documentStore';
import { CommandManager } from '../core/CommandManager';
import { KeyboardManager, DEFAULT_SHORTCUTS } from '../core/KeyboardManager';
import { StorageService, AutosaveService } from '../services/StorageService';

interface PhotoEditorProps {
  documentId?: string;
  width?: number;
  height?: number;
}

export const PhotoEditor: React.FC<PhotoEditorProps> = ({
  documentId,
  width = 1920,
  height = 1080,
}) => {
  const { document, createDocument, undo, redo, setViewport } = useDocumentStore();
  const commandManagerRef = useRef<CommandManager>(new CommandManager());
  const keyboardManagerRef = useRef<KeyboardManager>(new KeyboardManager());
  const storageServiceRef = useRef<StorageService>(new StorageService());
  const autosaveServiceRef = useRef<AutosaveService>(
    new AutosaveService(storageServiceRef.current)
  );

  // Initialize document
  useEffect(() => {
    if (!document) {
      if (documentId) {
        // Load existing document
        storageServiceRef.current.loadDocument(documentId).then((doc) => {
          if (doc) {
            // Load document into store
            console.log('Loaded document:', doc);
          } else {
            // Create new document
            createDocument('Untitled', width, height);
          }
        });
      } else {
        // Create new document
        createDocument('Untitled', width, height);
      }
    }
  }, [documentId, document, createDocument, width, height]);

  // Setup keyboard shortcuts
  useEffect(() => {
    const km = keyboardManagerRef.current;

    // Register shortcuts
    km.register({
      ...DEFAULT_SHORTCUTS.UNDO,
      action: () => undo(),
    });

    km.register({
      ...DEFAULT_SHORTCUTS.REDO,
      action: () => redo(),
    });

    km.register({
      ...DEFAULT_SHORTCUTS.ZOOM_IN,
      action: () => {
        const viewport = useDocumentStore.getState().viewport;
        setViewport({ zoom: Math.min(16, viewport.zoom * 1.2) });
      },
    });

    km.register({
      ...DEFAULT_SHORTCUTS.ZOOM_OUT,
      action: () => {
        const viewport = useDocumentStore.getState().viewport;
        setViewport({ zoom: Math.max(0.1, viewport.zoom / 1.2) });
      },
    });

    km.register({
      ...DEFAULT_SHORTCUTS.ZOOM_100,
      action: () => {
        setViewport({ zoom: 1 });
      },
    });

    return () => {
      km.destroy();
    };
  }, [undo, redo, setViewport]);

  // Setup autosave
  useEffect(() => {
    const autosave = autosaveServiceRef.current;
    autosave.start(() => useDocumentStore.getState().document);

    return () => {
      autosave.stop();
    };
  }, []);

  if (!document) {
    return (
      <div className="photo-editor-loading">
        <div>Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="photo-editor">
      <div className="editor-toolbar">
        <div className="toolbar-section">
          <button onClick={() => undo()} title="Undo (Ctrl+Z)">
            ↶ Undo
          </button>
          <button onClick={() => redo()} title="Redo (Ctrl+Shift+Z)">
            ↷ Redo
          </button>
        </div>
        
        <div className="toolbar-section">
          <span className="document-name">{document.name}</span>
        </div>
        
        <div className="toolbar-section">
          <span className="zoom-level">
            {Math.round(useDocumentStore.getState().viewport.zoom * 100)}%
          </span>
        </div>
      </div>

      <div className="editor-content">
        <LayersPanel />
        
        <div className="editor-canvas">
          <CanvasWorkspace width={1200} height={800} />
        </div>
        
        <div className="editor-properties">
          <h3>Properties</h3>
          <p>Select a layer to edit properties</p>
        </div>
      </div>

      <style jsx>{`
        .photo-editor {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #1a1a1a;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .photo-editor-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: #1a1a1a;
          color: #fff;
        }
        
        .editor-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          background: #2a2a2a;
          border-bottom: 1px solid #444;
          height: 48px;
        }
        
        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .toolbar-section button {
          background: #444;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 13px;
        }
        
        .toolbar-section button:hover {
          background: #555;
        }
        
        .document-name {
          font-size: 14px;
          font-weight: 500;
        }
        
        .zoom-level {
          font-size: 13px;
          color: #aaa;
        }
        
        .editor-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        
        .editor-canvas {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #2a2a2a;
        }
        
        .editor-properties {
          width: 300px;
          background: #2a2a2a;
          border-left: 1px solid #444;
          padding: 16px;
        }
        
        .editor-properties h3 {
          margin: 0 0 16px 0;
          font-size: 14px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

