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
      setCurrentBook(book.id);
      onBookSelect?.(book);
    },
    [setCurrentBook, onBookSelect]
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
      >
        <span className="project-toggle" onClick={handleToggle}>
          <ChevronDown size={12} />
        </span>
        <h4>
          <Folder size={14} /> {project.name}
        </h4>
        <span className="count">{books.length}</span>
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
          title="Create new book"
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

  return (
    <div
      className={`book-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <h5><BookOpen size={14} /> {book.title}</h5>
      <p>{pageCount} page{pageCount !== 1 ? 's' : ''}</p>
      <button className="book-item-menu" title="Book options">
        <MoreHorizontal size={12} />
      </button>
    </div>
  );
}

