/**
 * StoryPanel Component
 *
 * Main container composing all story mode components:
 * - StoryView (center - page display)
 * - PageCarousel (bottom - page timeline)
 * - StoryEditor (right - text editing)
 */

import { useCallback, useState } from 'react';
import { StoryView } from './StoryView';
import { PageCarousel } from './PageCarousel';
import { LayoutSelector } from './TextOverlay';
import { useProjectsStore, useToast } from '../../store';
import type { TextLayout } from '../../store/types';
import { FileText, X, BookOpen } from 'lucide-react';

export interface StoryPanelProps {
  className?: string;
}

export function StoryPanel({ className = '' }: StoryPanelProps) {
  const [showEditor, setShowEditor] = useState(true);

  const currentBook = useProjectsStore((s) => s.currentBook());
  const currentPage = useProjectsStore((s) => s.currentPage());
  const createPage = useProjectsStore((s) => s.createPage);
  const updatePage = useProjectsStore((s) => s.updatePage);
  const toast = useToast();

  const handleAddPage = useCallback(async () => {
    if (!currentBook) {
      toast.warning('Select a book first');
      return;
    }
    try {
      const pageCount = currentBook.pages?.length || 0;
      await createPage(currentBook.id, `Page ${pageCount + 1}`);
      toast.success('Page created');
    } catch (error) {
      toast.error('Failed to create page');
    }
  }, [currentBook, createPage, toast]);

  const handleTextChange = useCallback(
    async (text: string) => {
      if (!currentPage) return;
      await updatePage(currentPage.id, { textContent: text });
    },
    [currentPage, updatePage]
  );

  const handleTitleChange = useCallback(
    async (title: string) => {
      if (!currentPage) return;
      await updatePage(currentPage.id, { textTitle: title });
    },
    [currentPage, updatePage]
  );

  const handleLayoutChange = useCallback(
    async (layout: TextLayout) => {
      if (!currentPage) return;
      await updatePage(currentPage.id, { textLayout: layout });
    },
    [currentPage, updatePage]
  );

  return (
    <div className={`story-mode active ${className}`}>
      {/* Main Content Area */}
      <div className="story-preview-container">
        {/* Story Preview (Center) */}
        <StoryView />

        {/* Story Editor Panel (Right) */}
        {showEditor && currentPage && (
          <div className="story-editor-panel">
            <div className="story-editor-header">
              <h3><FileText size={14} /> Page Text</h3>
              <button
                className="close-btn"
                onClick={() => setShowEditor(false)}
                title="Close editor"
              >
                <X size={14} />
              </button>
            </div>
            <div className="story-editor-content">
              {/* Text Title Input */}
              <div className="form-group">
                <label>Title (optional)</label>
                <input
                  type="text"
                  className="input"
                  value={currentPage.textTitle || ''}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Page title..."
                />
              </div>

              {/* Text Content */}
              <div className="form-group flex-1">
                <label>Text</label>
                <textarea
                  className="story-text-input"
                  value={currentPage.textContent || ''}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Enter the story text for this page..."
                />
              </div>

              {/* Layout Selector */}
              <div className="form-group">
                <label>Text Position</label>
                <LayoutSelector
                  value={currentPage.textLayout}
                  onChange={handleLayoutChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* Toggle Editor Button (when hidden) */}
        {!showEditor && (
          <button
            className="story-editor-toggle"
            onClick={() => setShowEditor(true)}
            title="Show text editor"
          >
            <FileText size={16} />
          </button>
        )}
      </div>

      {/* Page Timeline (Bottom) */}
      <PageCarousel onAddPage={handleAddPage} />
    </div>
  );
}

/**
 * StorySidebar Component
 *
 * Content for the left sidebar when in Story mode.
 */
export function StorySidebar({ className = '' }: { className?: string }) {
  const currentBook = useProjectsStore((s) => s.currentBook());

  return (
    <div className={`story-sidebar ${className}`}>
      <div className="sidebar-section">
        <h4><BookOpen size={14} /> {currentBook?.title || 'No book selected'}</h4>
        <p className="text-muted">{currentBook?.pages?.length || 0} pages</p>
      </div>
    </div>
  );
}

