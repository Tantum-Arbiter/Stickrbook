/**
 * Generation Store - Zustand store for image generation, variations, and jobs
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generationApi, ApiClientError, jobEventManager } from '../api';
import type {
  GenerationState,
  GenerationMode,
  WorkflowType,
  GenerationPreset,
  Variation,
  GenerationJob,
  Asset,
} from './types';
import { useProjectsStore } from './projectsStore';

// Default canvas dimensions (from pinned info: 1080x704)
const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 704;

export const useGenerationStore = create<GenerationState>()(
  persist(
    (set, get) => ({
  // Generation mode
  mode: 'scene',
  workflowType: 'full_page',
  isGenerating: false,

  // Current generation params
  prompt: '',
  negativePrompt: '',
  seed: null,
  steps: 35,
  cfgScale: 5.5,
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  variationCount: 4, // Number of variations to generate

  // Character reference
  characterId: null,
  ipadapterWeight: 0.75,

  // Variations
  variations: [],
  selectedVariationId: null,
  compareMode: false, // Whether compare mode is active
  compareSelection: [], // IDs of variations selected for comparison (max 4)

  // Jobs
  activeJobs: [],
  jobHistory: [],

  // Preset
  currentPreset: null,

  // Mode actions
  setMode: (mode: GenerationMode) => {
    set({ mode });
  },

  setWorkflowType: (workflowType: WorkflowType) => {
    set({ workflowType });
  },

  setPrompt: (prompt: string) => {
    set({ prompt });
  },

  setNegativePrompt: (prompt: string) => {
    set({ negativePrompt: prompt });
  },

  setSeed: (seed: number | null) => {
    set({ seed });
  },

  setSteps: (steps: number) => {
    set({ steps: Math.max(1, Math.min(100, steps)) });
  },

  setCfgScale: (cfg: number) => {
    set({ cfgScale: Math.max(1, Math.min(20, cfg)) });
  },

  setDimensions: (width: number, height: number) => {
    set({ width, height });
  },

  setCharacter: (id: string | null, weight?: number) => {
    set({
      characterId: id,
      ipadapterWeight: weight ?? get().ipadapterWeight,
    });
  },

  setVariationCount: (count: number) => {
    set({ variationCount: Math.max(1, Math.min(12, count)) }); // Limit between 1-12
  },

  // Compare mode actions
  toggleCompareMode: () => {
    set((state) => ({
      compareMode: !state.compareMode,
      compareSelection: !state.compareMode ? [] : state.compareSelection,
    }));
  },

  toggleCompareSelection: (id: string) => {
    set((state) => {
      const isSelected = state.compareSelection.includes(id);
      if (isSelected) {
        return { compareSelection: state.compareSelection.filter((vid) => vid !== id) };
      } else if (state.compareSelection.length < 4) {
        return { compareSelection: [...state.compareSelection, id] };
      }
      return state; // Max 4 selections
    });
  },

  clearCompareSelection: () => {
    set({ compareSelection: [], compareMode: false });
  },

  // Generation actions
  generateVariations: async (batchName?: string) => {
    const state = get();
    // Don't block if already generating - just prevent double submission
    if (state.isGenerating) {
      console.log('Already submitting, please wait...');
      return;
    }

    // Get current book from projects store
    const currentBook = useProjectsStore.getState().currentBook();
    if (!currentBook) {
      console.error('No book selected for generation');
      throw new Error('No book selected. Please create or select a book first.');
    }

    // Set generating flag temporarily during submission
    set({ isGenerating: true });

    try {
      const response = await generationApi.submitVariations(currentBook.id, {
        prompt: state.prompt,
        negative_prompt: state.negativePrompt,
        base_seed: state.seed || undefined,
        width: state.width,
        height: state.height,
        generation_mode: state.mode,
        num_variations: state.variationCount, // Use user-selected count
        character_prompt: state.characterId || undefined,
      });

      // Create jobs from response
      const jobs: GenerationJob[] = response.job_ids.map((jobId: string, idx: number) => ({
        id: jobId,
        jobType: state.mode,
        status: 'pending' as const,
        prompt: state.prompt,
        negativePrompt: state.negativePrompt,
        seed: response.seeds?.[idx] ?? null,
        steps: state.steps,
        cfgScale: state.cfgScale,
        width: state.width,
        height: state.height,
        progress: 0,
        createdAt: new Date().toISOString(),
        batchName: batchName || undefined, // Add batch name for organization
      }));

      // Subscribe to SSE for each job (they will run sequentially on backend)
      jobs.forEach((job) => {
        get().subscribeToJob(job.id);
      });

      set((s) => ({
        activeJobs: [...s.activeJobs, ...jobs],
        // Don't clear variations - keep accumulating results
        isGenerating: false, // Unlock immediately after submission
      }));
    } catch (error) {
      const message = error instanceof ApiClientError ? error.detail || error.message : 'Generation failed';
      console.error('Generation failed:', message);

      // Always unlock on error
      set({ isGenerating: false });

      // Re-throw with user-friendly message
      if (error instanceof ApiClientError && error.status === 0) {
        throw new Error('Cannot connect to the backend server. Please ensure the server is running at the configured address.');
      }
      throw error;
    }
  },

  // Multi-view generation (for characters/objects with multiple poses/angles)
  generateMultiView: async (viewConfigs: Array<{ pose?: string; viewAngle?: string; poseLabel?: string; viewAngleLabel?: string }>, batchName?: string) => {
    const state = get();
    // Don't block if already generating - just prevent double submission
    if (state.isGenerating) {
      console.log('Already submitting, please wait...');
      return;
    }

    const currentBook = useProjectsStore.getState().currentBook();
    if (!currentBook) {
      console.error('No book selected for generation');
      throw new Error('No book selected. Please create or select a book first.');
    }

    // Set generating flag temporarily during submission
    set({ isGenerating: true });

    try {
      const allJobs: GenerationJob[] = [];

      // Submit a batch for each view configuration
      for (const config of viewConfigs) {
        const response = await generationApi.submitVariations(currentBook.id, {
          prompt: state.prompt,
          negative_prompt: state.negativePrompt,
          base_seed: state.seed || undefined,
          width: state.width,
          height: state.height,
          generation_mode: state.mode,
          num_variations: state.variationCount,
          character_prompt: state.characterId || undefined,
          pose_name: config.pose,
          view_angle: config.viewAngle,
          pose_label: config.poseLabel,
          view_angle_label: config.viewAngleLabel,
        });

        // Create jobs from response with metadata
        const jobs: GenerationJob[] = response.job_ids.map((jobId: string, idx: number) => ({
          id: jobId,
          jobType: state.mode,
          status: 'pending' as const,
          prompt: state.prompt,
          negativePrompt: state.negativePrompt,
          seed: response.seeds?.[idx] ?? null,
          steps: state.steps,
          cfgScale: state.cfgScale,
          width: state.width,
          height: state.height,
          progress: 0,
          createdAt: new Date().toISOString(),
          batchName: batchName || undefined, // Add batch name for organization
          metadata: {
            pose: config.pose,
            viewAngle: config.viewAngle,
            poseLabel: config.poseLabel,
            viewAngleLabel: config.viewAngleLabel,
          },
        }));

        allJobs.push(...jobs);
      }

      // Subscribe to SSE for each job
      allJobs.forEach((job) => {
        get().subscribeToJob(job.id);
      });

      set((s) => ({
        activeJobs: [...s.activeJobs, ...allJobs],
        isGenerating: false, // Unlock immediately after submission
      }));
    } catch (error) {
      const message = error instanceof ApiClientError ? error.detail || error.message : 'Generation failed';
      console.error('Multi-view generation failed:', message);

      // Always unlock on error
      set({ isGenerating: false });

      if (error instanceof ApiClientError && error.status === 0) {
        throw new Error('Cannot connect to the backend server. Please ensure the server is running at the configured address.');
      }
      throw error;
    }
  },

  selectVariation: (id: string) => {
    set((state) => ({
      selectedVariationId: id,
      variations: state.variations.map((v) => ({
        ...v,
        selected: v.id === id,
      })),
    }));
  },

  clearVariations: () => {
    set({ variations: [], selectedVariationId: null });
  },

  clearActiveJobs: () => {
    // Clear all active jobs (useful for cleanup after refresh)
    set({ activeJobs: [] });
  },

  clearJobHistory: () => {
    set({ jobHistory: [] });
  },

  saveVariation: async (id: string) => {
    const variation = get().variations.find((v) => v.id === id);
    if (!variation) throw new Error('Variation not found');

    // Save variation as an asset in the current book
    const currentBook = useProjectsStore.getState().currentBook();
    if (!currentBook) throw new Error('No book selected');

    const mode = get().mode;
    const assetType = mode === 'scene' ? 'background' : mode === 'character' ? 'character' : 'prop';

    // For character/object types, the backend already removed the background during generation
    // Just save normally and mark as transparent
    if (mode === 'character' || mode === 'object') {
      try {
        const response = await fetch(
          `/v1/storyboard/books/${currentBook.id}/variations/${id}/select?asset_type=${assetType}`,
          { method: 'POST' }
        );

        if (!response.ok) {
          throw new Error(`Failed to save asset: ${response.statusText}`);
        }

        const result = await response.json();
        const backendAsset = result.asset;

        // Convert backend asset to frontend Asset type
        // Mark as transparent since backend already processed it
        const asset: Asset = {
          id: backendAsset.id,
          name: backendAsset.name,
          assetType: backendAsset.type || assetType,
          imagePath: backendAsset.image_path,
          thumbnailPath: backendAsset.image_path,
          hasTransparency: true, // Backend already removed background during generation
          tags: backendAsset.tags || ['transparent', 'auto-processed'],
          createdAt: new Date().toISOString(),
        };

        // Add to projects store
        await useProjectsStore.getState().addAsset(currentBook.id, asset);
        return asset;
      } catch (error) {
        console.error('Failed to save asset, falling back to regular save:', error);
        // Fall through to regular save
      }
    }

    // Regular save for scenes or if transparency save failed
    const asset: Asset = {
      id: variation.id,
      name: `Variation ${variation.seed}`,
      assetType,
      imagePath: variation.imagePath,
      thumbnailPath: variation.thumbnailPath,
      hasTransparency: false,
      tags: [],
      createdAt: new Date().toISOString(),
    };

    // Add to projects store
    await useProjectsStore.getState().addAsset(currentBook.id, asset);
    return asset;
  },

  // SSE-based job subscription (replaces polling)
  subscribeToJob: (jobId: string) => {
    jobEventManager.subscribe(jobId, {
      onStatus: (data) => {
        set((state) => ({
          activeJobs: state.activeJobs.map((j) =>
            j.id === jobId ? { ...j, status: data.status as GenerationJob['status'] } : j
          ),
        }));
      },

      onProgress: (data) => {
        set((state) => ({
          activeJobs: state.activeJobs.map((j) =>
            j.id === jobId ? { ...j, progress: data.percent, status: 'running' as const } : j
          ),
        }));
      },

      onCompleted: async (_data) => {
        const job = get().activeJobs.find((j) => j.id === jobId);
        if (!job) return;

        // Fetch full job details to get output paths
        try {
          const response = await generationApi.getJobStatus(jobId);
          const output = response.outputs?.[0];

          if (output) {
            const variation: Variation = {
              id: jobId,
              seed: job.seed || 0,
              imagePath: output.download_url || `/v1/files/${output.file_id}`,
              thumbnailPath: output.download_url || `/v1/files/${output.file_id}`,
              prompt: job.prompt || '',
              negativePrompt: job.negativePrompt,
              selected: false,
              batchName: job.batchName, // Include batch name for organization
              // Include multi-view metadata if present
              pose: job.metadata?.pose,
              viewAngle: job.metadata?.viewAngle,
              poseLabel: job.metadata?.poseLabel,
              viewAngleLabel: job.metadata?.viewAngleLabel,
            };

            set((state) => ({
              activeJobs: state.activeJobs.filter((j) => j.id !== jobId),
              variations: [...state.variations, variation],
              jobHistory: [...state.jobHistory, { ...job, status: 'complete', completedAt: new Date().toISOString() }],
              // Don't set isGenerating based on job count - allow queueing anytime
            }));
          }
        } catch {
          // Fallback if fetch fails
          set((state) => ({
            activeJobs: state.activeJobs.filter((j) => j.id !== jobId),
            jobHistory: [...state.jobHistory, { ...job, status: 'complete', completedAt: new Date().toISOString() }],
            // Don't set isGenerating based on job count - allow queueing anytime
          }));
        }
      },

      onFailed: (data) => {
        const job = get().activeJobs.find((j) => j.id === jobId);
        if (!job) return;

        set((state) => ({
          activeJobs: state.activeJobs.filter((j) => j.id !== jobId),
          jobHistory: [
            ...state.jobHistory,
            { ...job, status: 'failed', errorMessage: data.message, completedAt: new Date().toISOString() },
          ],
          // Don't set isGenerating based on job count - allow queueing anytime
        }));
      },

      onError: (error) => {
        console.error('SSE error for job:', jobId, error);
        // Fall back to polling for this job
        get().pollSingleJob(jobId);
      },
    });
  },

  // Fallback polling for single job (when SSE fails)
  pollSingleJob: async (jobId: string) => {
    const job = get().activeJobs.find((j) => j.id === jobId);
    if (!job) return;

    try {
      const response = await generationApi.getJobStatus(jobId);

      if (response.status === 'completed' || response.status === 'complete') {
        const output = response.outputs?.[0];
        if (output) {
          const variation: Variation = {
            id: jobId,
            seed: job.seed || 0,
            imagePath: output.download_url || `/v1/files/${output.file_id}`,
            thumbnailPath: output.download_url || `/v1/files/${output.file_id}`,
            prompt: job.prompt || '',
            negativePrompt: job.negativePrompt,
            selected: false,
            // Include multi-view metadata if present
            pose: job.metadata?.pose,
            viewAngle: job.metadata?.viewAngle,
            poseLabel: job.metadata?.poseLabel,
            viewAngleLabel: job.metadata?.viewAngleLabel,
          };

          set((state) => ({
            activeJobs: state.activeJobs.filter((j) => j.id !== jobId),
            variations: [...state.variations, variation],
            jobHistory: [...state.jobHistory, { ...job, status: 'complete', completedAt: new Date().toISOString() }],
            isGenerating: state.activeJobs.length > 1,
          }));
        }
      } else if (response.status === 'failed') {
        set((state) => ({
          activeJobs: state.activeJobs.filter((j) => j.id !== jobId),
          jobHistory: [
            ...state.jobHistory,
            { ...job, status: 'failed', errorMessage: response.error_message || response.error, completedAt: new Date().toISOString() },
          ],
          isGenerating: state.activeJobs.length > 1,
        }));
      } else {
        // Still running - continue polling
        set((state) => ({
          activeJobs: state.activeJobs.map((j) =>
            j.id === jobId ? { ...j, progress: response.progress || 0, status: 'running' as const } : j
          ),
        }));
        setTimeout(() => get().pollSingleJob(jobId), 2000);
      }
    } catch (error) {
      console.error('Poll error for job:', jobId, error);
      setTimeout(() => get().pollSingleJob(jobId), 2000);
    }
  },

  // Legacy polling (kept for compatibility but now uses single job poll)
  pollJobs: async () => {
    const { activeJobs } = get();
    for (const job of activeJobs) {
      get().pollSingleJob(job.id);
    }
  },

  cancelJob: async (id: string) => {
    try {
      await generationApi.cancelJob(id);
      set((state) => ({
        activeJobs: state.activeJobs.filter((j) => j.id !== id),
        jobHistory: [
          ...state.jobHistory,
          {
            ...state.activeJobs.find((j) => j.id === id)!,
            status: 'cancelled' as const,
            completedAt: new Date().toISOString(),
          },
        ],
      }));
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  },

  clearJobHistory: () => {
    set({ jobHistory: [] });
  },

  resetGeneratingState: () => {
    console.log('Manually resetting isGenerating state');
    set({ isGenerating: false });
  },

  // Preset actions
  loadPreset: (preset: GenerationPreset) => {
    set({
      currentPreset: preset,
      negativePrompt: preset.negativePrompt,
      steps: preset.steps,
      cfgScale: preset.cfg,
    });
  },

  saveAsPreset: (name: string) => {
    const state = get();
    const preset: GenerationPreset = {
      name,
      artStyle: state.currentPreset?.artStyle || '',
      referencePrompt: state.currentPreset?.referencePrompt || '',
      negativePrompt: state.negativePrompt,
      steps: state.steps,
      cfg: state.cfgScale,
      model: state.currentPreset?.model,
    };
    set({ currentPreset: preset });
    return preset;
  },
    }),
    {
      name: 'stickrbook-generation',
      // Persist active jobs, variations, and generation params
      partialize: (state) => ({
        // Generation params
        mode: state.mode,
        workflowType: state.workflowType,
        prompt: state.prompt,
        negativePrompt: state.negativePrompt,
        seed: state.seed,
        steps: state.steps,
        cfgScale: state.cfgScale,
        width: state.width,
        height: state.height,
        variationCount: state.variationCount,
        characterId: state.characterId,
        ipadapterWeight: state.ipadapterWeight,
        // Active state
        variations: state.variations,
        activeJobs: state.activeJobs,
        jobHistory: state.jobHistory,
        currentPreset: state.currentPreset,
        // Don't persist UI state
        // isGenerating: false, // Always start fresh
        // selectedVariationId: null,
        // compareMode: false,
        // compareSelection: [],
      }),
      // Re-subscribe to active jobs on hydration
      onRehydrateStorage: () => (state) => {
        console.log('🔄 Rehydrating generation store...');

        if (!state) {
          console.log('⚠️ No state to rehydrate');
          return;
        }

        console.log(`📊 Rehydrated state: ${state.activeJobs?.length || 0} active jobs, ${state.variations?.length || 0} variations`);

        if (state?.activeJobs && state.activeJobs.length > 0) {
          console.log(`🔍 Validating ${state.activeJobs.length} active jobs...`);

          // Clear jobs older than 10 minutes (backend job retention time)
          const TEN_MINUTES = 10 * 60 * 1000;
          const now = Date.now();
          const validJobs: GenerationJob[] = [];
          const expiredJobs: GenerationJob[] = [];

          state.activeJobs.forEach((job) => {
            const jobAge = now - new Date(job.createdAt).getTime();

            // If job is older than 10 minutes, it's likely expired from backend
            if (jobAge > TEN_MINUTES) {
              console.log(`❌ Job ${job.id} is ${Math.round(jobAge / 60000)} minutes old, removing`);
              expiredJobs.push(job);
            } else if (job.status === 'complete' || job.status === 'completed') {
              // Completed jobs should be in variations, not active jobs
              console.log(`✅ Job ${job.id} is complete, removing from active jobs`);
              expiredJobs.push(job);
            } else {
              // Job is recent and still active, keep it
              console.log(`✓ Job ${job.id} is valid (age: ${Math.round(jobAge / 1000)}s, status: ${job.status})`);
              validJobs.push(job);

              // Re-subscribe if still generating
              if (job.status === 'pending' || job.status === 'generating') {
                console.log(`🔔 Re-subscribing to job ${job.id}`);
                state.subscribeToJob(job.id);
              }
            }
          });

          // Update state with only valid jobs
          if (expiredJobs.length > 0) {
            console.log(`🧹 Removed ${expiredJobs.length} expired/completed jobs, keeping ${validJobs.length}`);
            state.activeJobs = validJobs;
          } else {
            console.log(`✓ All ${validJobs.length} jobs are valid`);
          }
        } else {
          console.log('✓ No active jobs to validate');
        }
      },
    }
  )
);

