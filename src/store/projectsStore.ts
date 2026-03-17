/**
 * Projects Store - Zustand store for project, book, page, and asset management
 */

import { create } from 'zustand';
import { projectsApi, booksApi, pagesApi, assetsApi, ApiClientError } from '../api';
import type {
  ProjectState,
  Project,
  Book,
  Page,
  Asset,
  Character,
  GenerationPreset,
} from './types';

// Transform API response to frontend types
const transformProject = (p: Record<string, unknown>): Project => ({
  id: p.id as string,
  name: p.name as string,
  description: p.description as string | undefined,
  createdAt: p.created_at as string,
  updatedAt: p.updated_at as string,
  books: ((p.books as Record<string, unknown>[]) || []).map(transformBook),
});

const transformCharacter = (c: Record<string, unknown>): Character => ({
  id: c.id as string,
  bookId: c.book_id as string,
  name: c.name as string,
  description: c.description as string | undefined,
  prompt: c.prompt as string | undefined,
  seed: c.seed as number | undefined,
  referenceImagePath: c.reference_image_path as string | undefined,
  features: c.features as Record<string, string> | undefined,
  colorPalette: c.color_palette as string[] | undefined,
  poseAssetIds: c.pose_asset_ids as string[] | undefined,
  createdAt: c.created_at as string,
  updatedAt: c.updated_at as string,
});

const transformBook = (b: Record<string, unknown>): Book => ({
  id: b.id as string,
  projectId: b.project_id as string,
  title: b.title as string,
  description: b.description as string | undefined,
  width: (b.width as number) || 1080,
  height: (b.height as number) || 704,
  coverImage: b.cover_image as string | undefined,
  presetName: b.preset_name as string | undefined,
  artStyle: b.art_style as string | undefined,
  referencePrompt: b.reference_prompt as string | undefined,
  negativePrompt: b.negative_prompt as string | undefined,
  defaultSteps: (b.default_steps as number) || 35,
  defaultCfg: (b.default_cfg as number) || 5.5,
  defaultModel: b.default_model as string | undefined,
  createdAt: b.created_at as string,
  updatedAt: b.updated_at as string,
  pages: ((b.pages as Record<string, unknown>[]) || []).map(transformPage),
  assets: ((b.assets as Record<string, unknown>[]) || []).map(transformAsset),
  characters: ((b.characters as Record<string, unknown>[]) || []).map(transformCharacter),
});

const transformPage = (pg: Record<string, unknown>): Page => ({
  id: pg.id as string,
  bookId: pg.book_id as string,
  name: pg.name as string,
  pageNumber: pg.page_number as number,
  width: pg.width as number,
  height: pg.height as number,
  imagePath: pg.image_path as string | undefined,
  textContent: pg.text_content as string | undefined,
  textTitle: pg.text_title as string | undefined,
  textLayout: (pg.text_layout as Page['textLayout']) || 'bottom',
  overlays: (pg.overlays as Page['overlays']) || [],
  status: (pg.status as Page['status']) || 'pending',
  createdAt: pg.created_at as string,
  updatedAt: pg.updated_at as string,
});

const transformAsset = (a: Record<string, unknown>): Asset => ({
  id: a.id as string,
  bookId: a.book_id as string | undefined,
  name: a.name as string,
  description: a.description as string | undefined,
  assetType: a.asset_type as Asset['assetType'],
  imagePath: a.image_path as string,
  thumbnailPath: a.thumbnail_path as string | undefined,
  hasTransparency: (a.has_transparency as boolean) || false,
  seed: a.seed as number | undefined,
  prompt: a.prompt as string | undefined,
  tags: a.tags as string[] | undefined,
  metadata: a.metadata as Record<string, unknown> | undefined,
  createdAt: a.created_at as string,
});

export const useProjectsStore = create<ProjectState>((set, get) => ({
  // Initial state
  projects: [],
  currentProjectId: null,
  currentBookId: null,
  currentPageId: null,
  isLoading: false,
  error: null,

  // Computed getters
  currentProject: () => {
    const { projects, currentProjectId } = get();
    return projects.find((p: Project) => p.id === currentProjectId);
  },

  currentBook: () => {
    const project = get().currentProject();
    const { currentBookId } = get();
    return project?.books.find((b: Book) => b.id === currentBookId);
  },

  currentPage: () => {
    const book = get().currentBook();
    const { currentPageId } = get();
    return book?.pages.find((p: Page) => p.id === currentPageId);
  },

  // Project actions
  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectsApi.list();
      const projects = response.projects.map((p) => transformProject(p as unknown as Record<string, unknown>));
      set({ projects, isLoading: false });
    } catch (error) {
      const message = error instanceof ApiClientError ? error.detail || error.message : 'Failed to load projects';
      set({ error: message, isLoading: false });
    }
  },

  createProject: async (name: string, description?: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[ProjectStore] Creating project:', { name, description });
      const response = await projectsApi.create({ name, description });
      console.log('[ProjectStore] API response:', response);
      const project = transformProject(response.project as unknown as Record<string, unknown>);
      console.log('[ProjectStore] Transformed project:', project);
      set((state) => ({
        projects: [...state.projects, project],
        currentProjectId: project.id,
        isLoading: false,
      }));
      console.log('[ProjectStore] Project added to state');
      return project;
    } catch (error) {
      console.error('[ProjectStore] Failed to create project:', error);
      const message = error instanceof ApiClientError ? error.detail || error.message : 'Failed to create project';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateProject: async (id: string, data: Partial<Project>) => {
    try {
      const response = await projectsApi.update(id, {
        name: data.name,
        description: data.description,
      });
      const updated = transformProject(response.project as unknown as Record<string, unknown>);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
      }));
    } catch (error) {
      const message = error instanceof ApiClientError ? error.detail || error.message : 'Failed to update project';
      set({ error: message });
    }
  },

  deleteProject: async (id: string) => {
    try {
      await projectsApi.delete(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
      }));
    } catch (error) {
      const message = error instanceof ApiClientError ? error.detail || error.message : 'Failed to delete project';
      set({ error: message });
    }
  },

  setCurrentProject: (id: string | null) => {
    set({ currentProjectId: id, currentBookId: null, currentPageId: null });
  },

  // Book actions
  createBook: async (projectId: string, title: string, preset: GenerationPreset) => {
    set({ isLoading: true, error: null });
    try {
      const response = await booksApi.create({
        title,
        preset_name: preset as unknown as string,
        project_id: projectId
      });
      const book = transformBook(response.book as unknown as Record<string, unknown>);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId ? { ...p, books: [...p.books, book] } : p
        ),
        currentBookId: book.id,
        isLoading: false,
      }));
      return book;
    } catch (error) {
      const message = error instanceof ApiClientError ? error.detail || error.message : 'Failed to create book';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateBook: async (id: string, data: Partial<Book>) => {
    try {
      const response = await booksApi.update(id, {
        title: data.title,
        description: data.description,
      });
      const updated = transformBook(response.book as unknown as Record<string, unknown>);
      set((state) => ({
        projects: state.projects.map((p) => ({
          ...p,
          books: p.books.map((b) => (b.id === id ? updated : b)),
        })),
      }));
    } catch (error) {
      const message = error instanceof ApiClientError ? error.detail || error.message : 'Failed to update book';
      set({ error: message });
    }
  },

  deleteBook: async (id: string) => {
    try {
      await booksApi.delete(id);
      set((state) => ({
        projects: state.projects.map((p) => ({
          ...p,
          books: p.books.filter((b) => b.id !== id),
        })),
        currentBookId: state.currentBookId === id ? null : state.currentBookId,
      }));
    } catch (error) {
      const message = error instanceof ApiClientError ? error.detail || error.message : 'Failed to delete book';
      set({ error: message });
    }
  },

  setCurrentBook: (id: string | null) => {
    set({ currentBookId: id, currentPageId: null });
  },

  // Page actions
  createPage: async (bookId: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const book = get().currentBook();
      const pageNumber = (book?.pages.length || 0) + 1;
      const response = await pagesApi.create(bookId, pageNumber, name);
      const page = transformPage(response.page as unknown as Record<string, unknown>);
      set((state) => ({
        projects: state.projects.map((p) => ({
          ...p,
          books: p.books.map((b) =>
            b.id === bookId ? { ...b, pages: [...b.pages, page] } : b
          ),
        })),
        currentPageId: page.id,
        isLoading: false,
      }));
      return page;
    } catch (error) {
      const message = error instanceof ApiClientError ? error.detail || error.message : 'Failed to create page';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updatePage: async (id: string, data: Partial<Page>) => {
    const book = get().currentBook();
    if (!book) return;

    try {
      const response = await pagesApi.update(book.id, id, {
        text_content: data.textContent,
        text_layout: data.textLayout,
      });
      const updated = transformPage(response.page as unknown as Record<string, unknown>);
      set((state) => ({
        projects: state.projects.map((p) => ({
          ...p,
          books: p.books.map((b) => ({
            ...b,
            pages: b.pages.map((pg) => (pg.id === id ? updated : pg)),
          })),
        })),
      }));
    } catch (error) {
      const message = error instanceof ApiClientError ? error.detail || error.message : 'Failed to update page';
      set({ error: message });
    }
  },

  deletePage: async (id: string) => {
    const book = get().currentBook();
    if (!book) return;

    try {
      await pagesApi.delete(book.id, id);
      set((state) => ({
        projects: state.projects.map((p) => ({
          ...p,
          books: p.books.map((b) => ({
            ...b,
            pages: b.pages.filter((pg) => pg.id !== id),
          })),
        })),
        currentPageId: state.currentPageId === id ? null : state.currentPageId,
      }));
    } catch (error) {
      const message = error instanceof ApiClientError ? error.detail || error.message : 'Failed to delete page';
      set({ error: message });
    }
  },

  reorderPages: async (bookId: string, pageIds: string[]) => {
    // Optimistic update - reorder locally first
    set((state) => ({
      projects: state.projects.map((p) => ({
        ...p,
        books: p.books.map((b) => {
          if (b.id !== bookId) return b;
          const orderedPages = pageIds
            .map((id) => b.pages.find((pg) => pg.id === id))
            .filter((pg): pg is Page => pg !== undefined)
            .map((pg, idx) => ({ ...pg, pageNumber: idx }));
          return { ...b, pages: orderedPages };
        }),
      })),
    }));
    // TODO: Add reorder endpoint when backend supports it
  },

  setCurrentPage: (id: string | null) => {
    set({ currentPageId: id });
  },

  // Asset actions
  addAsset: async (bookId: string, asset: Omit<Asset, 'id' | 'createdAt'>) => {
    // Assets are added via generation - this is for local state only
    const newAsset: Asset = {
      ...asset,
      id: Math.random().toString(36).substring(2, 10),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      projects: state.projects.map((p) => ({
        ...p,
        books: p.books.map((b) =>
          b.id === bookId ? { ...b, assets: [...b.assets, newAsset] } : b
        ),
      })),
    }));
    return newAsset;
  },

  updateAsset: async (id: string, data: Partial<Asset>) => {
    // Optimistic update
    set((state) => ({
      projects: state.projects.map((p) => ({
        ...p,
        books: p.books.map((b) => ({
          ...b,
          assets: b.assets.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),
      })),
    }));
  },

  deleteAsset: async (id: string) => {
    const book = get().currentBook();
    if (!book) return;

    try {
      await assetsApi.delete(book.id, id);
      set((state) => ({
        projects: state.projects.map((p) => ({
          ...p,
          books: p.books.map((b) => ({
            ...b,
            assets: b.assets.filter((a) => a.id !== id),
          })),
        })),
      }));
    } catch (error) {
      const message = error instanceof ApiClientError ? error.detail || error.message : 'Failed to delete asset';
      set({ error: message });
    }
  },
}));

