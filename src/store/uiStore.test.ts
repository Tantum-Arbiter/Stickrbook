import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useUIStore } from './uiStore'

describe('UIStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Reset store state
    useUIStore.setState({
      leftSidebarWidth: 280,
      leftSidebarCollapsed: false,
      rightSidebarWidth: 320,
      rightSidebarCollapsed: true,
      activeTab: 'generate',
      activeModal: null,
      modalProps: {},
      expandedPanels: ['projects', 'assets'],
      toasts: [],
      isLoading: false,
      loadingMessage: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('sidebar', () => {
    it('sets left sidebar width within bounds', () => {
      const { setLeftSidebarWidth } = useUIStore.getState()
      
      setLeftSidebarWidth(350)
      expect(useUIStore.getState().leftSidebarWidth).toBe(350)
    })

    it('clamps left sidebar width to minimum 200', () => {
      const { setLeftSidebarWidth } = useUIStore.getState()
      
      setLeftSidebarWidth(100)
      expect(useUIStore.getState().leftSidebarWidth).toBe(200)
    })

    it('clamps left sidebar width to maximum 500', () => {
      const { setLeftSidebarWidth } = useUIStore.getState()
      
      setLeftSidebarWidth(600)
      expect(useUIStore.getState().leftSidebarWidth).toBe(500)
    })

    it('toggles left sidebar collapsed state', () => {
      const { toggleLeftSidebar } = useUIStore.getState()
      
      expect(useUIStore.getState().leftSidebarCollapsed).toBe(false)
      
      toggleLeftSidebar()
      expect(useUIStore.getState().leftSidebarCollapsed).toBe(true)
      
      toggleLeftSidebar()
      expect(useUIStore.getState().leftSidebarCollapsed).toBe(false)
    })

    it('sets right sidebar width within bounds', () => {
      const { setRightSidebarWidth } = useUIStore.getState()
      
      setRightSidebarWidth(400)
      expect(useUIStore.getState().rightSidebarWidth).toBe(400)
    })

    it('toggles right sidebar collapsed state', () => {
      const { toggleRightSidebar } = useUIStore.getState()
      
      expect(useUIStore.getState().rightSidebarCollapsed).toBe(true)
      
      toggleRightSidebar()
      expect(useUIStore.getState().rightSidebarCollapsed).toBe(false)
    })
  })

  describe('tabs', () => {
    it('sets active tab', () => {
      const { setActiveTab } = useUIStore.getState()
      
      setActiveTab('edit')
      expect(useUIStore.getState().activeTab).toBe('edit')
      
      setActiveTab('story')
      expect(useUIStore.getState().activeTab).toBe('story')
    })
  })

  describe('modals', () => {
    it('opens modal with ID', () => {
      const { openModal } = useUIStore.getState()
      
      openModal('confirm-delete')
      
      expect(useUIStore.getState().activeModal).toBe('confirm-delete')
    })

    it('opens modal with props', () => {
      const { openModal } = useUIStore.getState()
      
      openModal('edit-item', { itemId: '123', itemName: 'Test' })
      
      const state = useUIStore.getState()
      expect(state.activeModal).toBe('edit-item')
      expect(state.modalProps).toEqual({ itemId: '123', itemName: 'Test' })
    })

    it('closes modal and clears props', () => {
      const { openModal, closeModal } = useUIStore.getState()
      
      openModal('test-modal', { data: 'value' })
      closeModal()
      
      const state = useUIStore.getState()
      expect(state.activeModal).toBeNull()
      expect(state.modalProps).toEqual({})
    })
  })

  describe('panels', () => {
    it('toggles panel expanded state', () => {
      const { togglePanel } = useUIStore.getState()
      
      expect(useUIStore.getState().expandedPanels).toContain('projects')
      
      togglePanel('projects')
      expect(useUIStore.getState().expandedPanels).not.toContain('projects')
      
      togglePanel('projects')
      expect(useUIStore.getState().expandedPanels).toContain('projects')
    })

    it('expands panel if not already expanded', () => {
      const { collapsePanel, expandPanel } = useUIStore.getState()
      
      collapsePanel('projects')
      expect(useUIStore.getState().expandedPanels).not.toContain('projects')
      
      expandPanel('projects')
      expect(useUIStore.getState().expandedPanels).toContain('projects')
    })

    it('does not duplicate panel in expanded list', () => {
      const { expandPanel } = useUIStore.getState()
      
      expandPanel('projects')
      expandPanel('projects')
      
      const count = useUIStore.getState().expandedPanels.filter(p => p === 'projects').length
      expect(count).toBe(1)
    })

    it('collapses panel', () => {
      const { collapsePanel } = useUIStore.getState()

      collapsePanel('projects')
      expect(useUIStore.getState().expandedPanels).not.toContain('projects')
    })
  })

  describe('toasts', () => {
    it('adds toast with generated ID', () => {
      const { addToast } = useUIStore.getState()

      addToast({ type: 'success', message: 'Operation completed' })

      const toasts = useUIStore.getState().toasts
      expect(toasts).toHaveLength(1)
      expect(toasts[0].id).toBeDefined()
      expect(toasts[0].message).toBe('Operation completed')
      expect(toasts[0].type).toBe('success')
    })

    it('adds multiple toasts', () => {
      const { addToast } = useUIStore.getState()

      addToast({ type: 'success', message: 'Success' })
      addToast({ type: 'error', message: 'Error' })
      addToast({ type: 'warning', message: 'Warning' })

      expect(useUIStore.getState().toasts).toHaveLength(3)
    })

    it('removes toast by ID', () => {
      const { addToast, removeToast } = useUIStore.getState()

      addToast({ type: 'info', message: 'Info message' })
      const toastId = useUIStore.getState().toasts[0].id

      removeToast(toastId)

      expect(useUIStore.getState().toasts).toHaveLength(0)
    })

    it('auto-removes toast after duration', async () => {
      const { addToast } = useUIStore.getState()

      addToast({ type: 'success', message: 'Auto remove', duration: 1000 })

      expect(useUIStore.getState().toasts).toHaveLength(1)

      vi.advanceTimersByTime(1000)

      expect(useUIStore.getState().toasts).toHaveLength(0)
    })

    it('uses default duration of 5000ms', async () => {
      const { addToast } = useUIStore.getState()

      addToast({ type: 'success', message: 'Default duration' })

      vi.advanceTimersByTime(4999)
      expect(useUIStore.getState().toasts).toHaveLength(1)

      vi.advanceTimersByTime(1)
      expect(useUIStore.getState().toasts).toHaveLength(0)
    })

    it('does not auto-remove when duration is 0', () => {
      const { addToast } = useUIStore.getState()

      addToast({ type: 'info', message: 'Persistent', duration: 0 })

      vi.advanceTimersByTime(10000)

      expect(useUIStore.getState().toasts).toHaveLength(1)
    })

    it('clears all toasts', () => {
      const { addToast, clearToasts } = useUIStore.getState()

      addToast({ type: 'success', message: 'Toast 1' })
      addToast({ type: 'error', message: 'Toast 2' })
      addToast({ type: 'warning', message: 'Toast 3' })

      clearToasts()

      expect(useUIStore.getState().toasts).toHaveLength(0)
    })
  })

  describe('loading', () => {
    it('sets loading state with message', () => {
      const { setLoading } = useUIStore.getState()

      setLoading(true, 'Processing...')

      const state = useUIStore.getState()
      expect(state.isLoading).toBe(true)
      expect(state.loadingMessage).toBe('Processing...')
    })

    it('sets loading state without message', () => {
      const { setLoading } = useUIStore.getState()

      setLoading(true)

      const state = useUIStore.getState()
      expect(state.isLoading).toBe(true)
      expect(state.loadingMessage).toBeNull()
    })

    it('clears loading state and message', () => {
      const { setLoading } = useUIStore.getState()

      setLoading(true, 'Loading...')
      setLoading(false)

      const state = useUIStore.getState()
      expect(state.isLoading).toBe(false)
      expect(state.loadingMessage).toBeNull()
    })
  })
})

