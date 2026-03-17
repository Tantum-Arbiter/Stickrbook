/**
 * PageCarousel Component
 *
 * Page thumbnails with navigation arrows (filmstrip/timeline).
 * Uses extracted CSS from legacy storyboard (page-timeline.css).
 */

import { useCallback, useRef, useEffect } from 'react';
import { useProjectsStore } from '../../store';
import type { Page } from '../../store/types';
import { ChevronLeft, ChevronRight, ImagePlus } from 'lucide-react';

export interface PageCarouselProps {
  className?: string;
  onPageClick?: (page: Page) => void;
  onAddPage?: () => void;
}

export function PageCarousel({
  className = '',
  onPageClick,
  onAddPage,
}: PageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentBook = useProjectsStore((s) => s.currentBook());
  const currentPageId = useProjectsStore((s) => s.currentPageId);
  const setCurrentPage = useProjectsStore((s) => s.setCurrentPage);

  const pages = currentBook?.pages || [];

  const handlePageClick = useCallback(
    (page: Page) => {
      setCurrentPage(page.id);
      onPageClick?.(page);
    },
    [setCurrentPage, onPageClick]
  );

  // Scroll to active page
  useEffect(() => {
    if (!currentPageId || !scrollRef.current) return;
    const activeEl = scrollRef.current.querySelector('.timeline-page.active');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  }, [currentPageId]);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <div className={`page-timeline-container ${className}`}>
      {/* Scroll Left Button */}
      <button
        className="timeline-scroll-btn left"
        onClick={scrollLeft}
        title="Scroll left"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Pages Filmstrip */}
      <div ref={scrollRef} className="page-timeline">
        {/* Add Page Button */}
        <div className="timeline-add-page" onClick={onAddPage}>
          <span>+</span>
          <small>Add Page</small>
        </div>

        {/* Page Thumbnails */}
        {pages.map((page, index) => (
          <PageThumbnail
            key={page.id}
            page={page}
            index={index}
            isActive={page.id === currentPageId}
            onClick={() => handlePageClick(page)}
          />
        ))}

        {/* Empty state */}
        {pages.length === 0 && (
          <div className="timeline-empty">
            <p>No pages yet</p>
          </div>
        )}
      </div>

      {/* Scroll Right Button */}
      <button
        className="timeline-scroll-btn right"
        onClick={scrollRight}
        title="Scroll right"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// Individual page thumbnail
interface PageThumbnailProps {
  page: Page;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

function PageThumbnail({ page, index, isActive, onClick }: PageThumbnailProps) {
  const statusClass = `timeline-page-status ${page.status}`;

  return (
    <div
      className={`timeline-page ${isActive ? 'active' : ''}`}
      onClick={onClick}
      draggable
    >
      {/* Page Number Badge */}
      <div className="timeline-page-number">{index + 1}</div>

      {/* Thumbnail Image */}
      {page.imagePath ? (
        <img src={page.imagePath} alt={`Page ${index + 1}`} />
      ) : (
        <div className="timeline-page-placeholder">
          <ImagePlus size={24} />
        </div>
      )}

      {/* Page Info */}
      <div className="timeline-page-info">
        <span className="page-name">{page.name || `Page ${index + 1}`}</span>
        <span className={statusClass} title={page.status} />
      </div>
    </div>
  );
}

