import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useGenerationStore } from './generationStore'
import { useProjectsStore } from './projectsStore'
import { generationApi, jobEventManager } from '../api'

// Mock the API module
vi.mock('../api', () => ({
  generationApi: {
    submitVariations: vi.fn(),
    getJobStatus: vi.fn(),
    cancelJob: vi.fn(),
  },
  jobEventManager: {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  },
  ApiClientError: class ApiClientError extends Error {
    status: number
    detail?: string
    constructor(status: number, message: string, detail?: string) {
      super(message)
      this.status = status
      this.detail = detail
    }
  },
}))

describe('GenerationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset generation store state
    useGenerationStore.setState({
      mode: 'scene',
      workflowType: 'full_page',
      isGenerating: false,
      prompt: '',
      negativePrompt: '',
      seed: null,
      steps: 35,
      cfgScale: 5.5,
      width: 1080,
      height: 704,
      characterId: null,
      ipadapterWeight: 0.75,
      variations: [],
      selectedVariationId: null,
      activeJobs: [],
      jobHistory: [],
      currentPreset: null,
    })
    // Reset projects store with a current book
    useProjectsStore.setState({
      projects: [{
        id: 'proj-1',
        name: 'Test Project',
        createdAt: '',
        updatedAt: '',
        books: [{
          id: 'book-1',
          projectId: 'proj-1',
          title: 'Test Book',
          createdAt: '',
          updatedAt: '',
          pages: [],
          assets: [],
          characters: [],
          width: 1080,
          height: 704,
        }],
      }],
      currentProjectId: 'proj-1',
      currentBookId: 'book-1',
      currentPageId: null,
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('mode and parameters', () => {
    it('sets generation mode', () => {
      useGenerationStore.getState().setMode('character')
      expect(useGenerationStore.getState().mode).toBe('character')
    })

    it('sets workflow type', () => {
      useGenerationStore.getState().setWorkflowType('ipadapter')
      expect(useGenerationStore.getState().workflowType).toBe('ipadapter')

      useGenerationStore.getState().setWorkflowType('background')
      expect(useGenerationStore.getState().workflowType).toBe('background')

      useGenerationStore.getState().setWorkflowType('full_page')
      expect(useGenerationStore.getState().workflowType).toBe('full_page')
    })

    it('sets prompt', () => {
      useGenerationStore.getState().setPrompt('A magical forest')
      expect(useGenerationStore.getState().prompt).toBe('A magical forest')
    })

    it('sets negative prompt', () => {
      useGenerationStore.getState().setNegativePrompt('blurry, distorted')
      expect(useGenerationStore.getState().negativePrompt).toBe('blurry, distorted')
    })

    it('sets seed', () => {
      useGenerationStore.getState().setSeed(12345)
      expect(useGenerationStore.getState().seed).toBe(12345)
    })

    it('clears seed with null', () => {
      useGenerationStore.getState().setSeed(12345)
      useGenerationStore.getState().setSeed(null)
      expect(useGenerationStore.getState().seed).toBeNull()
    })

    it('sets steps within bounds', () => {
      useGenerationStore.getState().setSteps(50)
      expect(useGenerationStore.getState().steps).toBe(50)
    })

    it('clamps steps to minimum 1', () => {
      useGenerationStore.getState().setSteps(0)
      expect(useGenerationStore.getState().steps).toBe(1)
    })

    it('clamps steps to maximum 100', () => {
      useGenerationStore.getState().setSteps(150)
      expect(useGenerationStore.getState().steps).toBe(100)
    })

    it('sets CFG scale within bounds', () => {
      useGenerationStore.getState().setCfgScale(7.5)
      expect(useGenerationStore.getState().cfgScale).toBe(7.5)
    })

    it('clamps CFG scale to minimum 1', () => {
      useGenerationStore.getState().setCfgScale(0.5)
      expect(useGenerationStore.getState().cfgScale).toBe(1)
    })

    it('clamps CFG scale to maximum 20', () => {
      useGenerationStore.getState().setCfgScale(25)
      expect(useGenerationStore.getState().cfgScale).toBe(20)
    })

    it('sets dimensions', () => {
      useGenerationStore.getState().setDimensions(800, 600)
      const state = useGenerationStore.getState()
      expect(state.width).toBe(800)
      expect(state.height).toBe(600)
    })

    it('sets character with weight', () => {
      useGenerationStore.getState().setCharacter('char-1', 0.9)
      const state = useGenerationStore.getState()
      expect(state.characterId).toBe('char-1')
      expect(state.ipadapterWeight).toBe(0.9)
    })

    it('sets character keeping existing weight', () => {
      useGenerationStore.getState().setCharacter('char-1')
      expect(useGenerationStore.getState().ipadapterWeight).toBe(0.75)
    })
  })

  describe('variations', () => {
    it('selects variation and marks as selected', () => {
      useGenerationStore.setState({
        variations: [
          { id: 'var-1', seed: 1, imagePath: '/1.png', thumbnailPath: '/1.png', prompt: '', selected: false },
          { id: 'var-2', seed: 2, imagePath: '/2.png', thumbnailPath: '/2.png', prompt: '', selected: false },
        ],
      })

      useGenerationStore.getState().selectVariation('var-2')

      const state = useGenerationStore.getState()
      expect(state.selectedVariationId).toBe('var-2')
      expect(state.variations[0].selected).toBe(false)
      expect(state.variations[1].selected).toBe(true)
    })

    it('clears variations', () => {
      useGenerationStore.setState({
        variations: [
          { id: 'var-1', seed: 1, imagePath: '/1.png', thumbnailPath: '/1.png', prompt: '', selected: true },
        ],
        selectedVariationId: 'var-1',
      })

      useGenerationStore.getState().clearVariations()

      const state = useGenerationStore.getState()
      expect(state.variations).toHaveLength(0)
      expect(state.selectedVariationId).toBeNull()
    })
  })

  describe('generateVariations', () => {
    it('submits generation request', async () => {
      vi.mocked(generationApi.submitVariations).mockResolvedValueOnce({
        job_ids: ['job-1', 'job-2'],
        seeds: [123, 456],
      })

      useGenerationStore.getState().setPrompt('A forest scene')
      await useGenerationStore.getState().generateVariations()

      expect(generationApi.submitVariations).toHaveBeenCalledWith('book-1', expect.objectContaining({
        prompt: 'A forest scene',
        count: 4,
      }))
      expect(useGenerationStore.getState().activeJobs).toHaveLength(2)
    })

    it('does nothing if already generating', async () => {
      useGenerationStore.setState({ isGenerating: true })

      await useGenerationStore.getState().generateVariations()

      expect(generationApi.submitVariations).not.toHaveBeenCalled()
    })

    it('does nothing if no book selected', async () => {
      useProjectsStore.setState({ currentBookId: null })

      await useGenerationStore.getState().generateVariations()

      expect(generationApi.submitVariations).not.toHaveBeenCalled()
    })

    it('subscribes to SSE for each job', async () => {
      vi.mocked(generationApi.submitVariations).mockResolvedValueOnce({
        job_ids: ['job-1', 'job-2'],
        seeds: [123, 456],
      })

      await useGenerationStore.getState().generateVariations()

      expect(jobEventManager.subscribe).toHaveBeenCalledTimes(2)
      expect(jobEventManager.subscribe).toHaveBeenCalledWith('job-1', expect.any(Object))
      expect(jobEventManager.subscribe).toHaveBeenCalledWith('job-2', expect.any(Object))
    })
  })

  describe('job management', () => {
    it('cancels job', async () => {
      useGenerationStore.setState({
        activeJobs: [
          { id: 'job-1', jobType: 'scene', status: 'running', prompt: '', negativePrompt: '', seed: 1, steps: 35, cfgScale: 5.5, width: 1080, height: 704, progress: 50, createdAt: '' },
        ],
      })
      vi.mocked(generationApi.cancelJob).mockResolvedValueOnce({})

      await useGenerationStore.getState().cancelJob('job-1')

      const state = useGenerationStore.getState()
      expect(state.activeJobs).toHaveLength(0)
      expect(state.jobHistory).toHaveLength(1)
      expect(state.jobHistory[0].status).toBe('cancelled')
    })

    it('clears job history', () => {
      useGenerationStore.setState({
        jobHistory: [
          { id: 'job-1', jobType: 'scene', status: 'complete', prompt: '', negativePrompt: '', seed: 1, steps: 35, cfgScale: 5.5, width: 1080, height: 704, progress: 100, createdAt: '', completedAt: '' },
        ],
      })

      useGenerationStore.getState().clearJobHistory()

      expect(useGenerationStore.getState().jobHistory).toHaveLength(0)
    })
  })

  describe('presets', () => {
    it('loads preset values', () => {
      const preset = {
        name: 'Watercolor',
        artStyle: 'watercolor',
        referencePrompt: 'soft colors',
        negativePrompt: 'harsh lines',
        steps: 40,
        cfg: 6.0,
      }

      useGenerationStore.getState().loadPreset(preset)

      const state = useGenerationStore.getState()
      expect(state.currentPreset).toEqual(preset)
      expect(state.negativePrompt).toBe('harsh lines')
      expect(state.steps).toBe(40)
      expect(state.cfgScale).toBe(6.0)
    })

    it('saves current settings as preset', () => {
      useGenerationStore.setState({
        negativePrompt: 'ugly, bad',
        steps: 45,
        cfgScale: 7.0,
      })

      const preset = useGenerationStore.getState().saveAsPreset('My Preset')

      expect(preset.name).toBe('My Preset')
      expect(preset.negativePrompt).toBe('ugly, bad')
      expect(preset.steps).toBe(45)
      expect(preset.cfg).toBe(7.0)
    })
  })

  describe('saveVariation', () => {
    it('saves variation as asset', async () => {
      useGenerationStore.setState({
        mode: 'scene',
        variations: [
          { id: 'var-1', seed: 12345, imagePath: '/gen/1.png', thumbnailPath: '/gen/1.png', prompt: 'forest', selected: false },
        ],
      })

      const asset = await useGenerationStore.getState().saveVariation('var-1')

      expect(asset.assetType).toBe('background')
      expect(asset.imagePath).toBe('/gen/1.png')
      expect(useProjectsStore.getState().projects[0].books[0].assets).toHaveLength(1)
    })

    it('throws error for non-existent variation', async () => {
      await expect(
        useGenerationStore.getState().saveVariation('non-existent')
      ).rejects.toThrow('Variation not found')
    })

    it('throws error when no book selected', async () => {
      useGenerationStore.setState({
        variations: [
          { id: 'var-1', seed: 1, imagePath: '/1.png', thumbnailPath: '/1.png', prompt: '', selected: false },
        ],
      })
      useProjectsStore.setState({ currentBookId: null })

      await expect(
        useGenerationStore.getState().saveVariation('var-1')
      ).rejects.toThrow('No book selected')
    })
  })

  describe('SSE job subscription', () => {
    it('subscribes to job with callbacks', () => {
      useGenerationStore.setState({
        activeJobs: [{ id: 'job-1', status: 'pending', progress: 0, variationCount: 4, createdAt: '' }]
      })

      useGenerationStore.getState().subscribeToJob('job-1')

      expect(jobEventManager.subscribe).toHaveBeenCalledWith(
        'job-1',
        expect.objectContaining({
          onStatus: expect.any(Function),
          onProgress: expect.any(Function),
          onCompleted: expect.any(Function),
          onError: expect.any(Function),
        })
      )
    })

    it('calls SSE callbacks correctly', () => {
      // Capture the callbacks when subscribe is called
      let capturedCallbacks: Record<string, (data: unknown) => void> = {}
      ;(jobEventManager.subscribe as ReturnType<typeof vi.fn>).mockImplementation(
        (_jobId: string, callbacks: Record<string, (data: unknown) => void>) => {
          capturedCallbacks = callbacks
        }
      )

      useGenerationStore.setState({
        activeJobs: [{ id: 'job-1', status: 'pending', progress: 0, variationCount: 4, createdAt: '' }]
      })

      useGenerationStore.getState().subscribeToJob('job-1')

      // Test onStatus callback
      capturedCallbacks.onStatus({ status: 'running' })
      expect(useGenerationStore.getState().activeJobs[0].status).toBe('running')

      // Test onProgress callback
      capturedCallbacks.onProgress({ percent: 50 })
      expect(useGenerationStore.getState().activeJobs[0].progress).toBe(50)
    })

    it('handles onCompleted callback with output', async () => {
      let capturedCallbacks: Record<string, (data: unknown) => void | Promise<void>> = {}
      ;(jobEventManager.subscribe as ReturnType<typeof vi.fn>).mockImplementation(
        (_jobId: string, callbacks: Record<string, (data: unknown) => void | Promise<void>>) => {
          capturedCallbacks = callbacks
        }
      )
      ;(generationApi.getJobStatus as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: 'job-1',
        status: 'completed',
        outputs: [{ file_id: 'file-123', download_url: '/v1/files/file-123' }]
      })

      useGenerationStore.setState({
        activeJobs: [{ id: 'job-1', status: 'running', progress: 80, variationCount: 4, createdAt: '', prompt: 'test prompt', seed: 42 }],
        variations: [],
        jobHistory: []
      })

      useGenerationStore.getState().subscribeToJob('job-1')
      await capturedCallbacks.onCompleted({})

      const state = useGenerationStore.getState()
      expect(state.activeJobs).toHaveLength(0)
      expect(state.variations).toHaveLength(1)
      expect(state.variations[0].id).toBe('job-1')
      expect(state.jobHistory).toHaveLength(1)
      expect(state.jobHistory[0].status).toBe('complete')
    })

    it('handles onCompleted when job not found', async () => {
      let capturedCallbacks: Record<string, (data: unknown) => void | Promise<void>> = {}
      ;(jobEventManager.subscribe as ReturnType<typeof vi.fn>).mockImplementation(
        (_jobId: string, callbacks: Record<string, (data: unknown) => void | Promise<void>>) => {
          capturedCallbacks = callbacks
        }
      )

      useGenerationStore.setState({ activeJobs: [] })
      useGenerationStore.getState().subscribeToJob('job-1')
      await capturedCallbacks.onCompleted({})
      // Should not throw
      expect(generationApi.getJobStatus).not.toHaveBeenCalled()
    })

    it('handles onCompleted with fetch error fallback', async () => {
      let capturedCallbacks: Record<string, (data: unknown) => void | Promise<void>> = {}
      ;(jobEventManager.subscribe as ReturnType<typeof vi.fn>).mockImplementation(
        (_jobId: string, callbacks: Record<string, (data: unknown) => void | Promise<void>>) => {
          capturedCallbacks = callbacks
        }
      )
      ;(generationApi.getJobStatus as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Fetch failed'))

      useGenerationStore.setState({
        activeJobs: [{ id: 'job-1', status: 'running', progress: 80, variationCount: 4, createdAt: '' }],
        jobHistory: []
      })

      useGenerationStore.getState().subscribeToJob('job-1')
      await capturedCallbacks.onCompleted({})

      const state = useGenerationStore.getState()
      expect(state.activeJobs).toHaveLength(0)
      expect(state.jobHistory).toHaveLength(1)
      expect(state.jobHistory[0].status).toBe('complete')
    })

    it('handles onFailed callback', () => {
      let capturedCallbacks: Record<string, (data: unknown) => void> = {}
      ;(jobEventManager.subscribe as ReturnType<typeof vi.fn>).mockImplementation(
        (_jobId: string, callbacks: Record<string, (data: unknown) => void>) => {
          capturedCallbacks = callbacks
        }
      )

      useGenerationStore.setState({
        activeJobs: [{ id: 'job-1', status: 'running', progress: 50, variationCount: 4, createdAt: '' }],
        jobHistory: []
      })

      useGenerationStore.getState().subscribeToJob('job-1')
      capturedCallbacks.onFailed({ message: 'Generation failed' })

      const state = useGenerationStore.getState()
      expect(state.activeJobs).toHaveLength(0)
      expect(state.jobHistory).toHaveLength(1)
      expect(state.jobHistory[0].status).toBe('failed')
      expect(state.jobHistory[0].errorMessage).toBe('Generation failed')
    })

    it('handles onFailed when job not found', () => {
      let capturedCallbacks: Record<string, (data: unknown) => void> = {}
      ;(jobEventManager.subscribe as ReturnType<typeof vi.fn>).mockImplementation(
        (_jobId: string, callbacks: Record<string, (data: unknown) => void>) => {
          capturedCallbacks = callbacks
        }
      )

      useGenerationStore.setState({ activeJobs: [] })
      useGenerationStore.getState().subscribeToJob('job-1')
      capturedCallbacks.onFailed({ message: 'Failed' })
      // Should not throw
      expect(useGenerationStore.getState().jobHistory).toHaveLength(0)
    })

    it('handles onError callback and falls back to polling', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      let capturedCallbacks: Record<string, (data: unknown) => void> = {}
      ;(jobEventManager.subscribe as ReturnType<typeof vi.fn>).mockImplementation(
        (_jobId: string, callbacks: Record<string, (data: unknown) => void>) => {
          capturedCallbacks = callbacks
        }
      )

      useGenerationStore.setState({
        activeJobs: [{ id: 'job-1', status: 'running', progress: 50, variationCount: 4, createdAt: '' }]
      })

      const pollSpy = vi.spyOn(useGenerationStore.getState(), 'pollSingleJob')

      useGenerationStore.getState().subscribeToJob('job-1')
      capturedCallbacks.onError(new Error('SSE connection failed'))

      expect(consoleError).toHaveBeenCalled()
      expect(pollSpy).toHaveBeenCalledWith('job-1')

      consoleError.mockRestore()
      pollSpy.mockRestore()
    })
  })

  describe('generateVariations error handling', () => {
    it('handles generic error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      useGenerationStore.setState({ prompt: 'test prompt' })
      ;(generationApi.submitVariations as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      )

      await useGenerationStore.getState().generateVariations()

      expect(useGenerationStore.getState().isGenerating).toBe(false)
      expect(consoleError).toHaveBeenCalledWith('Generation failed:', 'Generation failed')
      consoleError.mockRestore()
    })
  })

  describe('cancelJob', () => {
    it('cancels job and removes from active jobs', async () => {
      ;(generationApi.cancelJob as ReturnType<typeof vi.fn>).mockResolvedValueOnce({})

      useGenerationStore.setState({
        activeJobs: [{ id: 'job-1', status: 'running', progress: 50, variationCount: 4, createdAt: '' }]
      })

      await useGenerationStore.getState().cancelJob('job-1')

      expect(generationApi.cancelJob).toHaveBeenCalledWith('job-1')
      expect(useGenerationStore.getState().activeJobs).toHaveLength(0)
    })

    it('handles error cancelling job', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      ;(generationApi.cancelJob as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Cannot cancel'))

      useGenerationStore.setState({
        activeJobs: [{ id: 'job-1', status: 'running', progress: 50, variationCount: 4, createdAt: '' }]
      })

      await useGenerationStore.getState().cancelJob('job-1')

      expect(consoleError).toHaveBeenCalledWith('Failed to cancel job:', expect.any(Error))
      consoleError.mockRestore()
    })
  })

  describe('pollSingleJob', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('handles completed job status', async () => {
      ;(generationApi.getJobStatus as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: 'job-1',
        status: 'completed',
        outputs: [{ file_id: 'file-1', download_url: '/v1/files/file-1' }]
      })

      useGenerationStore.setState({
        activeJobs: [{ id: 'job-1', status: 'running', progress: 90, variationCount: 4, createdAt: '', prompt: 'test', seed: 123 }],
        variations: [],
        jobHistory: []
      })

      await useGenerationStore.getState().pollSingleJob('job-1')

      const state = useGenerationStore.getState()
      expect(state.activeJobs).toHaveLength(0)
      expect(state.variations).toHaveLength(1)
      expect(state.variations[0].imagePath).toBe('/v1/files/file-1')
    })

    it('handles failed job status', async () => {
      ;(generationApi.getJobStatus as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: 'job-1',
        status: 'failed',
        error_message: 'Out of memory'
      })

      useGenerationStore.setState({
        activeJobs: [{ id: 'job-1', status: 'running', progress: 50, variationCount: 4, createdAt: '' }],
        jobHistory: []
      })

      await useGenerationStore.getState().pollSingleJob('job-1')

      const state = useGenerationStore.getState()
      expect(state.activeJobs).toHaveLength(0)
      expect(state.jobHistory).toHaveLength(1)
      expect(state.jobHistory[0].status).toBe('failed')
      expect(state.jobHistory[0].errorMessage).toBe('Out of memory')
    })

    it('continues polling for running job', async () => {
      ;(generationApi.getJobStatus as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: 'job-1',
        status: 'running',
        progress: 60
      })

      useGenerationStore.setState({
        activeJobs: [{ id: 'job-1', status: 'running', progress: 50, variationCount: 4, createdAt: '' }]
      })

      await useGenerationStore.getState().pollSingleJob('job-1')

      const state = useGenerationStore.getState()
      expect(state.activeJobs[0].progress).toBe(60)
    })

    it('does nothing if job not found', async () => {
      useGenerationStore.setState({ activeJobs: [] })
      await useGenerationStore.getState().pollSingleJob('job-1')
      expect(generationApi.getJobStatus).not.toHaveBeenCalled()
    })

    it('handles poll error and retries', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      ;(generationApi.getJobStatus as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))

      useGenerationStore.setState({
        activeJobs: [{ id: 'job-1', status: 'running', progress: 50, variationCount: 4, createdAt: '' }]
      })

      await useGenerationStore.getState().pollSingleJob('job-1')

      expect(consoleError).toHaveBeenCalled()
      consoleError.mockRestore()
    })
  })

  describe('pollJobs', () => {
    it('polls all active jobs', async () => {
      const pollSingleJobSpy = vi.spyOn(useGenerationStore.getState(), 'pollSingleJob').mockResolvedValue()

      useGenerationStore.setState({
        activeJobs: [
          { id: 'job-1', status: 'running', progress: 50, variationCount: 4, createdAt: '' },
          { id: 'job-2', status: 'running', progress: 30, variationCount: 2, createdAt: '' }
        ]
      })

      await useGenerationStore.getState().pollJobs()

      expect(pollSingleJobSpy).toHaveBeenCalledWith('job-1')
      expect(pollSingleJobSpy).toHaveBeenCalledWith('job-2')
      pollSingleJobSpy.mockRestore()
    })
  })
})

