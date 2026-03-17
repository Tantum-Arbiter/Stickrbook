/**
 * Store Types - TypeScript interfaces for all Zustand stores
 *
 * These types mirror the backend database models (SQLAlchemy)
 * and the legacy StickrBook state structure.
 */

// ============================================================
// Asset & Content Types
// ============================================================

export type AssetType = 'character' | 'prop' | 'background' | 'variation' | 'final' | 'object' | 'reference';

export type GenerationMode = 'scene' | 'character' | 'object' | 'sketch';

export type WorkflowType = 'full_page' | 'ipadapter' | 'character_ref' | 'background';

export type JobStatus = 'pending' | 'generating' | 'running' | 'complete' | 'completed' | 'failed' | 'cancelled';

export type PageStatus = 'pending' | 'generating' | 'complete' | 'failed';

export type TextLayout = 'text-below' | 'text-above' | 'text-left' | 'text-right' | 'text-overlay' | 'bottom' | 'top' | 'left' | 'right' | 'overlay' | 'none';

// ============================================================
// Project & Book Types
// ============================================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  books: Book[];
}

export interface Book {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  width: number;
  height: number;
  coverImage?: string;
  // Generation preset settings
  presetName?: string;
  artStyle?: string;
  referencePrompt?: string;
  negativePrompt?: string;
  defaultSteps: number;
  defaultCfg: number;
  defaultModel?: string;
  // Relations
  pages: Page[];
  characters: Character[];
  assets: Asset[];
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  bookId: string;
  name: string;
  pageNumber: number;
  width: number;
  height: number;
  imagePath?: string;
  textContent?: string;
  textTitle?: string;
  textLayout: TextLayout;
  overlays: LayerOverlay[];
  status: PageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  bookId?: string;
  name: string;
  description?: string;
  assetType: AssetType;
  imagePath: string;
  thumbnailPath?: string;
  hasTransparency: boolean;
  seed?: number;
  prompt?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Character {
  id: string;
  bookId: string;
  name: string;
  description?: string;
  prompt?: string;
  seed?: number;
  referenceImagePath?: string;
  features?: Record<string, string>;
  colorPalette?: string[];
  poseAssetIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Editor Types
// ============================================================

export interface LayerOverlay {
  id: string;
  assetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  effects?: LayerEffects;
}

export interface LayerEffects {
  hue: number;
  saturation: number;
  brightness: number;
  contrast: number;
  blur: number;
}

export interface Selection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HistoryEntry {
  id: string;
  action: string;
  timestamp: number;
  state: EditorSnapshot;
}

export interface EditorSnapshot {
  layers: LayerOverlay[];
  baseImage?: string;
}

// ============================================================
// Generation Types
// ============================================================

export interface GenerationJob {
  id: string;
  bookId?: string;
  jobType: string;
  status: JobStatus;
  prompt?: string;
  negativePrompt?: string;
  seed?: number;
  steps: number;
  cfgScale: number;
  width: number;
  height: number;
  outputs?: JobOutput[];
  errorMessage?: string;
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  metadata?: {
    pose?: string;
    viewAngle?: string;
    poseLabel?: string;
    viewAngleLabel?: string;
  };
}

export interface JobOutput {
  fileId: string;
  filePath: string;
  width: number;
  height: number;
}

export interface Variation {
  id: string;
  seed: number;
  imagePath: string;
  thumbnailPath?: string;
  prompt: string;
  negativePrompt?: string;
  selected: boolean;
  // Multi-view metadata
  pose?: string;
  viewAngle?: string;
  poseLabel?: string;
  viewAngleLabel?: string;
}

export interface GenerationPreset {
  name: string;
  artStyle: string;
  referencePrompt: string;
  negativePrompt: string;
  steps: number;
  cfg: number;
  model?: string;
}

// ============================================================
// Store State Interfaces
// ============================================================

export interface ProjectState {
  // State
  projects: Project[];
  currentProjectId: string | null;
  currentBookId: string | null;
  currentPageId: string | null;
  isLoading: boolean;
  error: string | null;

  // Computed getters
  currentProject: () => Project | undefined;
  currentBook: () => Book | undefined;
  currentPage: () => Page | undefined;

  // Project actions
  loadProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (id: string | null) => void;

  // Book actions
  createBook: (projectId: string, title: string, preset: GenerationPreset) => Promise<Book>;
  updateBook: (id: string, data: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  setCurrentBook: (id: string | null) => void;

  // Page actions
  createPage: (bookId: string, name: string) => Promise<Page>;
  updatePage: (id: string, data: Partial<Page>) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  reorderPages: (bookId: string, pageIds: string[]) => Promise<void>;
  setCurrentPage: (id: string | null) => void;

  // Asset actions
  addAsset: (bookId: string, asset: Omit<Asset, 'id' | 'createdAt'>) => Promise<Asset>;
  updateAsset: (id: string, data: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
}

export interface EditorState {
  // Canvas state
  zoom: number;
  panX: number;
  panY: number;
  canvasWidth: number;
  canvasHeight: number;

  // Layer state
  layers: LayerOverlay[];
  selectedLayerId: string | null;
  selectedLayerIds: string[]; // For multi-selection
  baseImagePath: string | null;

  // Selection state
  selection: Selection | null;
  isSelecting: boolean;

  // History (undo/redo)
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Tool state
  activeTool: 'select' | 'pan' | 'crop' | 'draw' | 'eraser';

  // Actions
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  fitToCanvas: () => void;

  // Layer actions
  addLayer: (layer: Omit<LayerOverlay, 'id'>) => void;
  updateLayer: (id: string, data: Partial<LayerOverlay>) => void;
  deleteLayer: (id: string) => void;
  selectLayer: (id: string | null) => void;
  reorderLayers: (layerIds: string[]) => void;
  duplicateLayer: (id: string) => void;

  // Selection actions
  setSelection: (selection: Selection | null) => void;
  clearSelection: () => void;

  // History actions
  undo: () => void;
  redo: () => void;
  pushHistory: (action: string) => void;
  clearHistory: () => void;

  // Tool actions
  setActiveTool: (tool: EditorState['activeTool']) => void;

  // Load/save
  loadPage: (page: Page) => void;
  savePage: () => Page;
  setBaseImage: (path: string | null) => void;
}

export interface GenerationState {
  // Generation mode
  mode: GenerationMode;
  workflowType: WorkflowType;
  isGenerating: boolean;

  // Current generation
  prompt: string;
  negativePrompt: string;
  seed: number | null;
  steps: number;
  cfgScale: number;
  width: number;
  height: number;
  variationCount: number;

  // Character reference
  characterId: string | null;
  ipadapterWeight: number;

  // Variations
  variations: Variation[];
  selectedVariationId: string | null;
  compareMode: boolean;
  compareSelection: string[];

  // Jobs
  activeJobs: GenerationJob[];
  jobHistory: GenerationJob[];

  // Preset
  currentPreset: GenerationPreset | null;

  // Actions
  setMode: (mode: GenerationMode) => void;
  setWorkflowType: (workflowType: WorkflowType) => void;
  setPrompt: (prompt: string) => void;
  setNegativePrompt: (prompt: string) => void;
  setSeed: (seed: number | null) => void;
  setSteps: (steps: number) => void;
  setCfgScale: (cfg: number) => void;
  setDimensions: (width: number, height: number) => void;
  setCharacter: (id: string | null, weight?: number) => void;
  setVariationCount: (count: number) => void;

  // Compare mode actions
  toggleCompareMode: () => void;
  toggleCompareSelection: (id: string) => void;
  clearCompareSelection: () => void;

  // Generation actions
  generateVariations: () => Promise<void>;
  generateMultiView: (viewConfigs: Array<{ pose?: string; viewAngle?: string; poseLabel?: string; viewAngleLabel?: string }>) => Promise<void>;
  selectVariation: (id: string) => void;
  clearVariations: () => void;
  saveVariation: (id: string) => Promise<Asset>;

  // Job actions (SSE-based with polling fallback)
  subscribeToJob: (jobId: string) => void;
  pollSingleJob: (jobId: string) => Promise<void>;
  pollJobs: () => Promise<void>;
  cancelJob: (id: string) => Promise<void>;
  clearJobHistory: () => void;
  resetGeneratingState: () => void;

  // Preset actions
  loadPreset: (preset: GenerationPreset) => void;
  saveAsPreset: (name: string) => GenerationPreset;
}

export interface UIState {
  // Sidebar state
  leftSidebarWidth: number;
  leftSidebarCollapsed: boolean;
  rightSidebarWidth: number;
  rightSidebarCollapsed: boolean;
  sidebarZoom: number; // Zoom level for sidebar content (0.5 to 2.0)

  // Text scale setting
  textScale: number; // Global text scale (0.7 to 1.5, default 1.0)

  // Tab state
  activeTab: 'generate' | 'edit' | 'story';

  // Modal state
  activeModal: string | null;
  modalProps: Record<string, unknown>;

  // Panel state
  expandedPanels: string[];

  // Notifications
  toasts: ToastMessage[];

  // Loading states
  isLoading: boolean;
  loadingMessage: string | null;

  // Actions
  setLeftSidebarWidth: (width: number) => void;
  toggleLeftSidebar: () => void;
  setRightSidebarWidth: (width: number) => void;
  toggleRightSidebar: () => void;
  setSidebarZoom: (zoom: number) => void;
  setTextScale: (scale: number) => void;

  setActiveTab: (tab: UIState['activeTab']) => void;

  openModal: (modalId: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;

  togglePanel: (panelId: string) => void;
  expandPanel: (panelId: string) => void;
  collapsePanel: (panelId: string) => void;

  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  setLoading: (isLoading: boolean, message?: string) => void;
}

export interface ToastMessage {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

