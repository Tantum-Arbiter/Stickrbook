import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { subscribeToJobEvents, JobEventManager } from './sse'

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = []
  
  url: string
  listeners: Map<string, (event: MessageEvent) => void> = new Map()
  onerror: ((error: Event) => void) | null = null
  closed = false

  constructor(url: string) {
    this.url = url
    MockEventSource.instances.push(this)
  }

  addEventListener(type: string, handler: (event: MessageEvent) => void) {
    this.listeners.set(type, handler)
  }

  close() {
    this.closed = true
  }

  // Helper to emit events in tests
  emit(type: string, data: unknown) {
    const handler = this.listeners.get(type)
    if (handler) {
      handler({ data: JSON.stringify(data) } as MessageEvent)
    }
  }

  emitError() {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }
}

describe('SSE Client', () => {
  beforeEach(() => {
    MockEventSource.instances = []
    // @ts-expect-error - mocking global
    global.EventSource = MockEventSource
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('subscribeToJobEvents', () => {
    it('creates EventSource with correct URL', () => {
      subscribeToJobEvents('job-123', {})
      
      expect(MockEventSource.instances).toHaveLength(1)
      expect(MockEventSource.instances[0].url).toBe('/v1/jobs/job-123/events')
    })

    it('calls onStatus handler when status event received', () => {
      const onStatus = vi.fn()
      subscribeToJobEvents('job-123', { onStatus })
      
      MockEventSource.instances[0].emit('status', { status: 'running' })
      
      expect(onStatus).toHaveBeenCalledWith({ status: 'running' })
    })

    it('calls onProgress handler when progress event received', () => {
      const onProgress = vi.fn()
      subscribeToJobEvents('job-123', { onProgress })
      
      MockEventSource.instances[0].emit('progress', { phase: 'generating', percent: 50 })
      
      expect(onProgress).toHaveBeenCalledWith({ phase: 'generating', percent: 50 })
    })

    it('calls onCompleted handler and closes on completion', () => {
      const onCompleted = vi.fn()
      const onClose = vi.fn()
      subscribeToJobEvents('job-123', { onCompleted, onClose })
      
      MockEventSource.instances[0].emit('completed', { file_ids: ['file-1', 'file-2'] })
      
      expect(onCompleted).toHaveBeenCalledWith({ file_ids: ['file-1', 'file-2'] })
      expect(MockEventSource.instances[0].closed).toBe(true)
      expect(onClose).toHaveBeenCalled()
    })

    it('calls onFailed handler and closes on failure', () => {
      const onFailed = vi.fn()
      const onClose = vi.fn()
      subscribeToJobEvents('job-123', { onFailed, onClose })
      
      MockEventSource.instances[0].emit('failed', { error_code: 'TIMEOUT', message: 'Job timed out' })
      
      expect(onFailed).toHaveBeenCalledWith({ error_code: 'TIMEOUT', message: 'Job timed out' })
      expect(MockEventSource.instances[0].closed).toBe(true)
      expect(onClose).toHaveBeenCalled()
    })

    it('calls onError handler on connection error', () => {
      const onError = vi.fn()
      const onClose = vi.fn()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      subscribeToJobEvents('job-123', { onError, onClose })
      
      MockEventSource.instances[0].emitError()
      
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(MockEventSource.instances[0].closed).toBe(true)
      expect(onClose).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('returns cleanup function that closes connection', () => {
      const onClose = vi.fn()
      const cleanup = subscribeToJobEvents('job-123', { onClose })
      
      expect(MockEventSource.instances[0].closed).toBe(false)
      
      cleanup()
      
      expect(MockEventSource.instances[0].closed).toBe(true)
      expect(onClose).toHaveBeenCalled()
    })

    it('handles malformed JSON gracefully', () => {
      const onStatus = vi.fn()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      subscribeToJobEvents('job-123', { onStatus })

      // Emit invalid JSON
      const handler = MockEventSource.instances[0].listeners.get('status')
      handler?.({ data: 'not valid json' } as MessageEvent)

      expect(onStatus).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('JobEventManager', () => {
    it('subscribes to job events', () => {
      const manager = new JobEventManager()
      const onStatus = vi.fn()

      manager.subscribe('job-1', { onStatus })

      expect(MockEventSource.instances).toHaveLength(1)
      expect(manager.activeCount).toBe(1)
    })

    it('tracks multiple subscriptions', () => {
      const manager = new JobEventManager()

      manager.subscribe('job-1', {})
      manager.subscribe('job-2', {})
      manager.subscribe('job-3', {})

      expect(manager.activeCount).toBe(3)
    })

    it('unsubscribes from specific job', () => {
      const manager = new JobEventManager()

      manager.subscribe('job-1', {})
      manager.subscribe('job-2', {})

      expect(manager.activeCount).toBe(2)

      manager.unsubscribe('job-1')

      expect(manager.activeCount).toBe(1)
      expect(MockEventSource.instances[0].closed).toBe(true)
    })

    it('replaces existing subscription for same job', () => {
      const manager = new JobEventManager()
      const onStatus1 = vi.fn()
      const onStatus2 = vi.fn()

      manager.subscribe('job-1', { onStatus: onStatus1 })
      const firstInstance = MockEventSource.instances[0]

      manager.subscribe('job-1', { onStatus: onStatus2 })

      expect(firstInstance.closed).toBe(true)
      expect(manager.activeCount).toBe(1)
    })

    it('unsubscribes all jobs', () => {
      const manager = new JobEventManager()

      manager.subscribe('job-1', {})
      manager.subscribe('job-2', {})
      manager.subscribe('job-3', {})

      manager.unsubscribeAll()

      expect(manager.activeCount).toBe(0)
      expect(MockEventSource.instances.every(i => i.closed)).toBe(true)
    })

    it('removes subscription on completion', () => {
      const manager = new JobEventManager()
      const onCompleted = vi.fn()

      manager.subscribe('job-1', { onCompleted })

      expect(manager.activeCount).toBe(1)

      MockEventSource.instances[0].emit('completed', { file_ids: [] })

      expect(manager.activeCount).toBe(0)
      expect(onCompleted).toHaveBeenCalled()
    })

    it('removes subscription on failure', () => {
      const manager = new JobEventManager()
      const onFailed = vi.fn()

      manager.subscribe('job-1', { onFailed })

      MockEventSource.instances[0].emit('failed', { error_code: 'ERR', message: 'Failed' })

      expect(manager.activeCount).toBe(0)
      expect(onFailed).toHaveBeenCalled()
    })

    it('handles unsubscribe for non-existent job', () => {
      const manager = new JobEventManager()

      // Should not throw
      expect(() => manager.unsubscribe('non-existent')).not.toThrow()
    })
  })
})

