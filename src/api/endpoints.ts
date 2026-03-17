/**
 * Typed API Endpoints
 * 
 * High-level functions for each backend endpoint.
 */

import { api } from './client';
import type {
  ProjectResponse,
  ProjectsListResponse,
  CreateProjectRequest,
  BookResponse,
  BooksListResponse,
  CreateBookRequest,
  PageResponse,
  AssetResponse,
  AssetsListResponse,
  GenerationJobResponse,
  SubmitJobRequest,
  SubmitJobResponse,
  PresetsListResponse,
} from './types';

// ============================================================
// Projects
// ============================================================

export const projectsApi = {
  list: () => api.get<ProjectsListResponse>('/projects'),

  get: (id: string) => api.get<{ project: ProjectResponse }>(`/projects/${id}`),

  create: (data: CreateProjectRequest) =>
    api.post<{ project: ProjectResponse }>('/projects', data),

  update: (id: string, data: Partial<CreateProjectRequest>) =>
    api.put<{ project: ProjectResponse }>(`/projects/${id}`, data),

  delete: (id: string) => api.delete<{ deleted: boolean }>(`/projects/${id}`),
};

// ============================================================
// Books
// ============================================================

export const booksApi = {
  list: () => api.get<BooksListResponse>('/books'),

  get: (id: string) => api.get<{ book: BookResponse }>(`/books/${id}`),

  create: (data: CreateBookRequest) =>
    api.post<{ book: BookResponse }>('/books', data),

  update: (id: string, data: Partial<CreateBookRequest>) =>
    api.put<{ book: BookResponse }>(`/books/${id}`, data),

  delete: (id: string) => api.delete<{ deleted: boolean }>(`/books/${id}`),

  addToProject: (projectId: string, bookId: string) =>
    api.post<{ status: string }>(`/projects/${projectId}/books/${bookId}`),
};

// ============================================================
// Pages
// ============================================================

export const pagesApi = {
  create: (bookId: string, number: number, name?: string) =>
    api.post<{ page: PageResponse }>(
      `/books/${bookId}/pages?number=${number}${name ? `&name=${encodeURIComponent(name)}` : ''}`
    ),

  update: (bookId: string, pageId: string, data: Partial<PageResponse>) =>
    api.put<{ page: PageResponse }>(`/books/${bookId}/pages/${pageId}`, data),

  delete: (bookId: string, pageId: string) =>
    api.delete<{ deleted: boolean }>(`/books/${bookId}/pages/${pageId}`),

  setFinal: (bookId: string, pageId: string, jobId: string) =>
    api.post<{ page: PageResponse }>(
      `/books/${bookId}/pages/${pageId}/set-final?job_id=${jobId}`
    ),
};

// ============================================================
// Assets
// ============================================================

export const assetsApi = {
  list: (bookId: string, assetType?: string) =>
    api.get<AssetsListResponse>(
      `/books/${bookId}/assets${assetType ? `?asset_type=${assetType}` : ''}`
    ),

  get: (bookId: string, assetId: string) =>
    api.get<{ asset: AssetResponse }>(`/books/${bookId}/assets/${assetId}`),

  update: (bookId: string, assetId: string, data: Partial<AssetResponse>) =>
    api.put<{ asset: AssetResponse }>(`/books/${bookId}/assets/${assetId}`, data),

  delete: (bookId: string, assetId: string) =>
    api.delete<{ deleted: boolean }>(`/books/${bookId}/assets/${assetId}`),
};

// ============================================================
// Generation
// ============================================================

export const generationApi = {
  submitVariations: (bookId: string, data: SubmitJobRequest) =>
    api.post<SubmitJobResponse>(`/books/${bookId}/variations`, data),

  getJobStatus: (jobId: string) =>
    api.get<GenerationJobResponse>(`/jobs/${jobId}`),

  cancelJob: (jobId: string) =>
    api.delete<{ cancelled: boolean }>(`/jobs/${jobId}`),
};

// ============================================================
// Presets
// ============================================================

export const presetsApi = {
  list: () => api.get<PresetsListResponse>('/presets'),
};

// ============================================================
// Health
// ============================================================

export const healthApi = {
  check: () => api.get<{ status: string; comfyui: string }>('/health'),
};

