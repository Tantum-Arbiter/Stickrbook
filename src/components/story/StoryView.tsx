/**
 * StoryView Component
 *
 * Main book reader view with page display and navigation.
 * Uses extracted CSS from legacy storyboard (story-mode.css).
 */

import { useCallback, useState, useEffect } from 'react';
import { useProjectsStore } from '../../store';
import { TextOverlay } from './TextOverlay';
import type { Page } from '../../store/types';
import { BookOpen, FileText, ImagePlus, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export interface StoryViewProps {
  className?: string;
  onPageChange?: (page: Page) => void;
}

export function StoryView({ className = '', onPageChange }: StoryViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const currentBook = useProjectsStore((s) => s.currentBook());
  const currentPage = useProjectsStore((s) => s.currentPage());
  const setCurrentPage = useProjectsStore((s) => s.setCurrentPage);

  const pages = currentBook?.pages || [];
  const currentIndex = pages.findIndex((p) => p.id === currentPage?.id);

  const goToPage = useCallback(
    (index: number) => {
      if (index >= 0 && index < pages.length) {
        const page = pages[index];
        setCurrentPage(page.id);
        onPageChange?.(page);
      }
    },
    [pages, setCurrentPage, onPageChange]
  );

  const goToPrev = useCallback(() => {
    goToPage(currentIndex - 1);
  }, [currentIndex, goToPage]);

  const goToNext = useCallback(() => {
    goToPage(currentIndex + 1);
  }, [currentIndex, goToPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrev();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFullscreen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext, isFullscreen]);

  if (!currentBook) {
    return (
      <div className={`story-preview ${className}`}>
        <div className="story-empty">
          <p><BookOpen size={24} /> Select a book to preview</p>
        </div>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className={`story-preview ${className}`}>
        <div className="story-empty">
          <p><FileText size={24} /> No pages in this book</p>
          <p className="text-muted">Create your first page to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`story-preview ${isFullscreen ? 'fullscreen' : ''} ${className}`}>
      {/* Page Display */}
      <div className="story-preview-page">
        {currentPage.imagePath ? (
          <img
            src={currentPage.imagePath}
            alt={`Page ${currentPage.pageNumber}`}
            onClick={goToNext}
          />
        ) : (
          <div className="page-placeholder">
            <ImagePlus size={48} />
            <p>No image yet</p>
          </div>
        )}

        {/* Text Overlay */}
        {currentPage.textContent && (
          <TextOverlay
            text={currentPage.textContent}
            title={currentPage.textTitle}
            layout={currentPage.textLayout}
          />
        )}
      </div>

      {/* Navigation Arrows */}
      <button
        className="story-nav-arrow prev"
        onClick={goToPrev}
        disabled={currentIndex <= 0}
        title="Previous page (←)"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        className="story-nav-arrow next"
        onClick={goToNext}
        disabled={currentIndex >= pages.length - 1}
        title="Next page (→)"
      >
        <ChevronRight size={24} />
      </button>

      {/* Page Counter */}
      <div className="story-page-counter">
        {currentIndex + 1} / {pages.length}
      </div>

      {/* Fullscreen Toggle */}
      <button
        className="story-fullscreen-btn"
        onClick={() => setIsFullscreen(!isFullscreen)}
        title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
      >
        <Maximize2 size={16} />
      </button>
    </div>
  );
}

