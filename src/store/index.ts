/**
 * Store Index - Barrel exports and custom hooks for Zustand stores
 *
 * This module provides:
 * - Re-exports of all store hooks
 * - Type exports
 * - Convenience hooks for common patterns
 */

// Re-export stores
export { useProjectsStore } from './projectsStore';
export { useEditorStore } from './editorStore';
export { useGenerationStore } from './generationStore';
export { useUIStore } from './uiStore';

// Re-export types
export type {
  // Asset & Content types
  AssetType,
  GenerationMode,
  JobStatus,
  PageStatus,
  TextLayout,
  // Data types
  Project,
  Book,
  Page,
  Asset,
  Character,
  LayerOverlay,
  LayerEffects,
  Selection,
  HistoryEntry,
  EditorSnapshot,
  GenerationJob,
  JobOutput,
  Variation,
  GenerationPreset,
  ToastMessage,
  // Store types
  ProjectState,
  EditorState,
  GenerationState,
  UIState,
} from './types';

// ============================================================
// Convenience Hooks
// ============================================================

import { useProjectsStore } from './projectsStore';
import { useEditorStore } from './editorStore';
import { useGenerationStore } from './generationStore';
import { useUIStore } from './uiStore';

/**
 * Hook to get the current project, book, and page
 * Fixed to properly track ID changes for reactivity
 */
export function useCurrentContext() {
  const currentProjectId = useProjectsStore((s) => s.currentProjectId);
  const currentBookId = useProjectsStore((s) => s.currentBookId);
  const currentPageId = useProjectsStore((s) => s.currentPageId);

  const currentProject = useProjectsStore((s) =>
    s.projects.find((p) => p.id === currentProjectId)
  );
  const currentBook = useProjectsStore((s) => {
    const project = s.projects.find((p) => p.id === currentProjectId);
    return project?.books.find((b) => b.id === currentBookId);
  });
  const currentPage = useProjectsStore((s) => {
    const project = s.projects.find((p) => p.id === currentProjectId);
    const book = project?.books.find((b) => b.id === currentBookId);
    return book?.pages.find((p) => p.id === currentPageId);
  });

  return { currentProject, currentBook, currentPage };
}

/**
 * Hook to get loading and error state across stores
 */
export function useAppStatus() {
  const projectsLoading = useProjectsStore((s) => s.isLoading);
  const projectsError = useProjectsStore((s) => s.error);
  const uiLoading = useUIStore((s) => s.isLoading);
  const loadingMessage = useUIStore((s) => s.loadingMessage);
  const isGenerating = useGenerationStore((s) => s.isGenerating);

  return {
    isLoading: projectsLoading || uiLoading || isGenerating,
    loadingMessage,
    error: projectsError,
  };
}

/**
 * Hook to get editor state for the canvas
 */
export function useCanvas() {
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setPan = useEditorStore((s) => s.setPan);
  const resetView = useEditorStore((s) => s.resetView);

  return { zoom, panX, panY, setZoom, setPan, resetView };
}

/**
 * Hook to get selected layer and actions
 */
export function useSelectedLayer() {
  const layers = useEditorStore((s) => s.layers);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const selectLayer = useEditorStore((s) => s.selectLayer);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const deleteLayer = useEditorStore((s) => s.deleteLayer);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  return {
    selectedLayer,
    selectedLayerId,
    selectLayer,
    updateLayer,
    deleteLayer,
  };
}

/**
 * Hook for history (undo/redo)
 */
export function useHistory() {
  const canUndo = useEditorStore((s) => s.canUndo());
  const canRedo = useEditorStore((s) => s.canRedo());
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);

  return { canUndo, canRedo, undo, redo };
}

/**
 * Hook for project management
 * Fixed to properly track ID changes for reactivity
 */
export function useProjects() {
  const projects = useProjectsStore((s) => s.projects);
  const currentProjectId = useProjectsStore((s) => s.currentProjectId);
  const currentBookId = useProjectsStore((s) => s.currentBookId);
  const currentPageId = useProjectsStore((s) => s.currentPageId);

  const currentProject = useProjectsStore((s) =>
    s.projects.find((p) => p.id === currentProjectId)
  );
  const currentBook = useProjectsStore((s) => {
    const project = s.projects.find((p) => p.id === currentProjectId);
    return project?.books.find((b) => b.id === currentBookId);
  });
  const currentPage = useProjectsStore((s) => {
    const project = s.projects.find((p) => p.id === currentProjectId);
    const book = project?.books.find((b) => b.id === currentBookId);
    return book?.pages.find((p) => p.id === currentPageId);
  });

  const isLoading = useProjectsStore((s) => s.isLoading);
  const error = useProjectsStore((s) => s.error);
  const loadProjects = useProjectsStore((s) => s.loadProjects);
  const createProject = useProjectsStore((s) => s.createProject);
  const setCurrentProject = useProjectsStore((s) => s.setCurrentProject);
  const setCurrentBook = useProjectsStore((s) => s.setCurrentBook);
  const setCurrentPage = useProjectsStore((s) => s.setCurrentPage);

  return {
    projects,
    currentProject,
    currentBook,
    currentPage,
    isLoading,
    error,
    loadProjects,
    createProject,
    setCurrentProject,
    setCurrentBook,
    setCurrentPage,
  };
}

/**
 * Hook for generation state
 */
export function useGeneration() {
  const mode = useGenerationStore((s) => s.mode);
  const isGenerating = useGenerationStore((s) => s.isGenerating);
  const variations = useGenerationStore((s) => s.variations);
  const selectedVariationId = useGenerationStore((s) => s.selectedVariationId);
  const activeJobs = useGenerationStore((s) => s.activeJobs);

  const generateVariations = useGenerationStore((s) => s.generateVariations);
  const selectVariation = useGenerationStore((s) => s.selectVariation);

  return {
    mode,
    isGenerating,
    variations,
    selectedVariationId,
    activeJobs,
    generateVariations,
    selectVariation,
  };
}

/**
 * Hook to show toast notifications
 */
export function useToast() {
  const addToast = useUIStore((s) => s.addToast);

  return {
    success: (message: string) => addToast({ message, variant: 'success' }),
    error: (message: string) => addToast({ message, variant: 'error' }),
    warning: (message: string) => addToast({ message, variant: 'warning' }),
    info: (message: string) => addToast({ message, variant: 'info' }),
    custom: addToast,
  };
}

