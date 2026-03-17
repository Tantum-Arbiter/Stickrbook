/**
 * ProjectTree Component
 *
 * Hierarchical tree view of projects, books, and pages.
 * Uses extracted CSS from legacy storyboard (project-tree.css).
 */

import { useCallback, useState } from 'react';
import { useProjectsStore } from '../../store';
import type { Project, Book } from '../../store/types';
import { Folder, BookOpen, ChevronDown, MoreHorizontal, Plus } from 'lucide-react';
import { useToast } from '../ui/Toast';

export interface ProjectTreeProps {
  className?: string;
  onBookSelect?: (book: Book) => void;
}

export function ProjectTree({ className = '', onBookSelect }: ProjectTreeProps) {
  const {
    projects,
    currentProjectId,
    currentBookId,
    setCurrentProject,
    setCurrentBook,
  } = useProjectsStore();

  const handleBookClick = useCallback(
    (book: Book) => {
      // Set both the project and the book to ensure proper context
      setCurrentProject(book.projectId);
      setCurrentBook(book.id);
      onBookSelect?.(book);
    },
    [setCurrentProject, setCurrentBook, onBookSelect]
  );

  if (projects.length === 0) {
    return (
      <div className={`project-list ${className}`}>
        <div className="project-empty">
          <p><Folder size={16} /> No projects yet</p>
          <p className="text-muted">Create your first project to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`project-list ${className}`}>
      {projects.map((project) => (
        <ProjectItem
          key={project.id}
          project={project}
          isActive={project.id === currentProjectId}
          activeBookId={currentBookId}
          onProjectClick={() => setCurrentProject(project.id)}
          onBookClick={handleBookClick}
        />
      ))}
    </div>
  );
}

// Individual project item with collapsible books
interface ProjectItemProps {
  project: Project;
  isActive: boolean;
  activeBookId: string | null;
  onProjectClick: () => void;
  onBookClick: (book: Book) => void;
}

function ProjectItem({
  project,
  isActive,
  activeBookId,
  onProjectClick,
  onBookClick,
}: ProjectItemProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const createBook = useProjectsStore((s) => s.createBook);
  const toast = useToast();

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsCollapsed((prev) => !prev);
    },
    []
  );

  const handleNewBook = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const title = prompt('Enter book title:');
      if (!title) return;

      // Use a default preset for now
      const defaultPreset = {
        name: 'default',
        artStyle: 'Storybook illustration',
        referencePrompt: '',
        negativePrompt: '',
        steps: 35,
        cfg: 5.5,
      };

      await createBook(project.id, title, defaultPreset);
      toast.success(`Book "${title}" created`);
    } catch (error) {
      toast.error('Failed to create book');
    }
  }, [project.id, createBook, toast]);

  const books = project.books || [];

  return (
    <div className={`project-item ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Project Header */}
      <div
        className={`project-header ${isActive ? 'active' : ''}`}
        onClick={onProjectClick}
        title={project.name}
      >
        <span className="project-toggle" onClick={handleToggle}>
          <ChevronDown size={12} />
        </span>
        <h4 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Folder size={14} /> {project.name}
        </h4>
        <span className="count" title={`${books.length} book${books.length !== 1 ? 's' : ''}`}>
          {books.length}
        </span>
        <button className="project-menu-btn" title="Project options">
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Books List */}
      <div className="project-books">
        {books.map((book) => (
          <BookItem
            key={book.id}
            book={book}
            isActive={book.id === activeBookId}
            onClick={() => onBookClick(book)}
          />
        ))}

        {books.length === 0 && (
          <div className="book-empty">
            <p className="text-muted">No books in this project</p>
          </div>
        )}

        {/* Add Book Button */}
        <button
          className="book-item book-add-btn"
          onClick={handleNewBook}
          title="Create new book in this project"
        >
          <Plus size={14} /> New Book
        </button>
      </div>
    </div>
  );
}

// Individual book item
interface BookItemProps {
  book: Book;
  isActive: boolean;
  onClick: () => void;
}

function BookItem({ book, isActive, onClick }: BookItemProps) {
  const pageCount = book.pages?.length || 0;
  const pageText = `${pageCount} page${pageCount !== 1 ? 's' : ''}`;

  return (
    <div
      className={`book-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title={`${book.title} - ${pageText}`}
    >
      <h5>
        <BookOpen size={14} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {book.title}
        </span>
      </h5>
      <p>{pageText}</p>
      <button className="book-item-menu" title="Book options">
        <MoreHorizontal size={12} />
      </button>
    </div>
  );
}

