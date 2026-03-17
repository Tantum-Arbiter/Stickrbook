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
  variationCount: 2, // Number of variations to generate per angle/pose (default: 2)

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

  saveVariation: async (id: string, collectionName?: string) => {
    console.log('💾 saveVariation called:', { id, collectionName });
    const variation = get().variations.find((v) => v.id === id);
    if (!variation) {
      console.error('❌ Variation not found:', id);
      throw new Error('Variation not found');
    }

    // Save variation as an asset in the current book
    const currentBook = useProjectsStore.getState().currentBook();
    if (!currentBook) {
      console.error('❌ No book selected');
      throw new Error('No book selected');
    }

    console.log('📚 Current book:', currentBook.id, currentBook.title);

    const mode = get().mode;
    const assetType = mode === 'scene' ? 'background' : mode === 'character' ? 'character' : 'prop';

    console.log('🎨 Asset type:', assetType, 'from mode:', mode);

    // Prompt for collection name if not provided
    // Use batch name as default suggestion
    let collection = collectionName;
    if (!collection) {
      const defaultCollection = variation.batchName || '';

      // Get existing collections for this asset type
      const existingCollections = currentBook.assets
        .filter(a => a.assetType === assetType && a.collection)
        .map(a => a.collection!)
        .filter((v, i, arr) => arr.indexOf(v) === i) // unique
        .sort();

      const promptText = mode === 'scene'
        ? 'Enter collection name for this scene (e.g., "Forest Scenes", "Beach Backgrounds"):'
        : mode === 'character'
        ? 'Enter collection name for this character (e.g., "Hero Poses", "Villain Angles"):'
        : 'Enter collection name for this object (e.g., "Magic Items", "Weapons"):';

      let collectionOptions = '';
      if (existingCollections.length > 0) {
        collectionOptions = `\n\nExisting collections:\n${existingCollections.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nEnter a number to select, or type a new name:`;
      }

      const userInput = window.prompt(promptText + collectionOptions, defaultCollection);

      if (!userInput) {
        collection = undefined;
      } else {
        // Check if user entered a number to select existing collection
        const selectedIndex = parseInt(userInput) - 1;
        if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < existingCollections.length) {
          collection = existingCollections[selectedIndex];
        } else {
          collection = userInput;
        }
      }

      console.log('📝 Collection name from prompt:', collection);
    }

    // For character/object types, the backend already removed the background during generation
    // Just save normally and mark as transparent
    if (mode === 'character' || mode === 'object') {
      try {
        const params = new URLSearchParams({
          asset_type: assetType,
        });
        if (collection) {
          params.append('collection', collection);
        }

        console.log('🌐 Saving asset with params:', params.toString());
        const url = `/v1/storyboard/books/${currentBook.id}/variations/${id}/select?${params}`;
        console.log('🌐 URL:', url);

        const response = await fetch(url, { method: 'POST' });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Response error:', errorText);
          throw new Error(`Failed to save asset: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Backend response:', result);
        console.log('🔍 Backend asset fields:', Object.keys(result.asset));
        const backendAsset = result.asset;

        // Backend sends imagePath (camelCase) with proper URL, not image_path (snake_case)
        const asset: Asset = {
          id: backendAsset.id,
          name: backendAsset.name,
          assetType: backendAsset.asset_type || assetType,
          collection: backendAsset.collection,
          imagePath: backendAsset.imagePath || backendAsset.image_path || backendAsset.filename,
          thumbnailPath: backendAsset.thumbnailPath || backendAsset.image_path || backendAsset.filename,
          hasTransparency: backendAsset.has_transparency !== undefined ? backendAsset.has_transparency : true,
          tags: backendAsset.tags || ['transparent', 'auto-processed'],
          createdAt: new Date().toISOString(),
        };

        console.log('💾 Converted asset:', asset);

        // Add to projects store
        await useProjectsStore.getState().addAsset(currentBook.id, asset);
        console.log('✅ Asset added to projects store');
        return asset;
      } catch (error) {
        console.error('❌ Failed to save asset, falling back to regular save:', error);
        // Fall through to regular save
      }
    }

    // Regular save for scenes or if transparency save failed
    const params = new URLSearchParams({
      asset_type: assetType,
    });
    if (collection) {
      params.append('collection', collection);
    }

    console.log('🌐 [Regular save] Saving asset with params:', params.toString());

    try {
      const url = `/v1/storyboard/books/${currentBook.id}/variations/${id}/select?${params}`;
      console.log('🌐 [Regular save] URL:', url);

      const response = await fetch(url, { method: 'POST' });

      console.log('📡 [Regular save] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Regular save] Response error:', errorText);
        throw new Error(`Failed to save asset: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [Regular save] Backend response:', result);
      const backendAsset = result.asset;

      // Backend sends imagePath (camelCase) with proper URL, not image_path (snake_case)
      const asset: Asset = {
        id: backendAsset.id,
        name: backendAsset.name,
        assetType: backendAsset.asset_type || assetType,
        collection: backendAsset.collection,
        imagePath: backendAsset.imagePath || backendAsset.image_path || backendAsset.filename,
        thumbnailPath: backendAsset.thumbnailPath || backendAsset.image_path || backendAsset.filename,
        hasTransparency: backendAsset.has_transparency !== undefined ? backendAsset.has_transparency : false,
        tags: backendAsset.tags || [],
        createdAt: new Date().toISOString(),
      };

      console.log('💾 [Regular save] Converted asset:', asset);

      // Add to projects store
      await useProjectsStore.getState().addAsset(currentBook.id, asset);
      console.log('✅ [Regular save] Asset added to projects store');
      return asset;
    } catch (error) {
      console.error('❌ [Regular save] Failed to save asset:', error);
      throw error;
    }
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
              createdAt: job.createdAt, // Use job creation time for age tracking
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
            createdAt: job.createdAt, // Use job creation time for age tracking
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
      // Persist generation params, active jobs, and recent variations
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
        // Active state (will be validated on rehydration)
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

        // Clear everything on rehydration to prevent 404 errors from expired files
        // The backend only keeps job outputs for ~10 minutes, so old variations will 404
        const TEN_MINUTES = 10 * 60 * 1000;
        const now = Date.now();

        // Clear old active jobs
        if (state?.activeJobs && state.activeJobs.length > 0) {
          console.log(`🔍 Validating ${state.activeJobs.length} active jobs...`);

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

        // Clear old variations (they reference temporary files that expire)
        // Keep recent variations (within 10 minutes) so they still show in the grid
        if (state?.variations && state.variations.length > 0) {
          console.log(`🖼️ Validating ${state.variations.length} variations...`);

          const validVariations = state.variations.filter((variation) => {
            // If no createdAt (old data), remove it
            if (!variation.createdAt) {
              console.log(`❌ Variation ${variation.id} has no createdAt, removing`);
              return false;
            }

            const variationAge = now - new Date(variation.createdAt).getTime();

            // If older than 10 minutes, remove it (files likely expired)
            if (variationAge > TEN_MINUTES) {
              console.log(`❌ Variation ${variation.id} is ${Math.round(variationAge / 60000)} minutes old, removing`);
              return false;
            }

            return true;
          });

          if (validVariations.length < state.variations.length) {
            console.log(`🧹 Removed ${state.variations.length - validVariations.length} old variations, keeping ${validVariations.length}`);
            state.variations = validVariations;
          } else {
            console.log(`✓ All ${validVariations.length} variations are recent`);
          }
        }

        // Clear job history older than 10 minutes
        if (state?.jobHistory && state.jobHistory.length > 0) {
          const validHistory = state.jobHistory.filter((job) => {
            const jobAge = now - new Date(job.createdAt).getTime();
            return jobAge <= TEN_MINUTES;
          });

          if (validHistory.length < state.jobHistory.length) {
            console.log(`🗑️ Cleared ${state.jobHistory.length - validHistory.length} old history entries`);
            state.jobHistory = validHistory;
          }
        }
      },
    }
  )
);

