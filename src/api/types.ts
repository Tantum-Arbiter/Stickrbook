/**
 * API Response Types
 * 
 * Types matching the FastAPI backend responses.
 */

// ============================================================
// Projects
// ============================================================

export interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  books: BookResponse[];
}

export interface ProjectsListResponse {
  projects: ProjectResponse[];
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

// ============================================================
// Books
// ============================================================

export interface BookResponse {
  id: string;
  title: string;
  description?: string;
  preset_name?: string;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
  pages: PageResponse[];
  assets: AssetResponse[];
  characters: CharacterResponse[];
}

export interface BooksListResponse {
  books: BookResponse[];
}

export interface CreateBookRequest {
  title: string;
  description?: string;
  preset_name?: string;
  project_id?: string;
}

// ============================================================
// Pages
// ============================================================

export interface PageResponse {
  id: string;
  name: string;
  page_number: number;
  width: number;
  height: number;
  base_image?: string;
  final_image?: string;
  text_content?: string;
  text_layout?: string;
  overlays?: PageOverlay[];
  created_at: string;
  updated_at: string;
}

export interface PageOverlay {
  asset_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z_index: number;
}

// ============================================================
// Assets
// ============================================================

export interface AssetResponse {
  id: string;
  name: string;
  asset_type: 'character' | 'background' | 'object' | 'reference';
  image_path: string;
  thumbnail_path?: string;
  width?: number;
  height?: number;
  tags?: string[];
  description?: string;
  created_at: string;
}

export interface AssetsListResponse {
  assets: AssetResponse[];
}

// ============================================================
// Characters
// ============================================================

export interface CharacterResponse {
  id: string;
  name: string;
  description?: string;
  reference_image?: string;
  thumbnail_path?: string;
  created_at: string;
}

// ============================================================
// Generation Jobs
// ============================================================

export interface JobOutput {
  file_id: string;
  file_path?: string;
  download_url?: string;
  thumbnail_path?: string;
}

export interface GenerationJobResponse {
  job_id: string;
  status: 'pending' | 'running' | 'completed' | 'complete' | 'failed' | 'cancelled';
  progress: number;
  outputs?: JobOutput[];
  error?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface SubmitJobRequest {
  prompt: string;
  negative_prompt?: string;
  base_seed?: number;
  preset_override?: Record<string, any>;
  width?: number;
  height?: number;
  generation_mode?: string;
  character_prompt?: string;
  num_variations?: number;
  pose_name?: string;
  view_angle?: string;
  pose_label?: string;
  view_angle_label?: string;
}

export interface SubmitJobResponse {
  job_ids: string[];
  seeds: number[];
}

// ============================================================
// Presets
// ============================================================

export interface PresetResponse {
  name: string;
  display_name: string;
  description?: string;
  style_prompt: string;
  negative_prompt?: string;
}

export interface PresetsListResponse {
  presets: PresetResponse[];
}

