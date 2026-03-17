import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useProjectsStore } from './projectsStore'
import { projectsApi, booksApi, pagesApi, assetsApi, ApiClientError } from '../api'

// Mock the API module
vi.mock('../api', () => ({
  projectsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  booksApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  pagesApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  assetsApi: {
    delete: vi.fn(),
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

describe('ProjectsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state
    useProjectsStore.setState({
      projects: [],
      currentProjectId: null,
      currentBookId: null,
      currentPageId: null,
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('loadProjects', () => {
    it('loads projects successfully', async () => {
      const mockProjects = [
        { id: 'proj-1', name: 'Project 1', created_at: '2024-01-01', updated_at: '2024-01-01', books: [] },
        { id: 'proj-2', name: 'Project 2', created_at: '2024-01-02', updated_at: '2024-01-02', books: [] },
      ]
      vi.mocked(projectsApi.list).mockResolvedValueOnce({ projects: mockProjects })

      await useProjectsStore.getState().loadProjects()

      const state = useProjectsStore.getState()
      expect(state.projects).toHaveLength(2)
      expect(state.projects[0].name).toBe('Project 1')
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('sets loading state during fetch', async () => {
      vi.mocked(projectsApi.list).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ projects: [] }), 100))
      )

      const promise = useProjectsStore.getState().loadProjects()
      expect(useProjectsStore.getState().isLoading).toBe(true)
      
      await promise
      expect(useProjectsStore.getState().isLoading).toBe(false)
    })

    it('handles API error', async () => {
      vi.mocked(projectsApi.list).mockRejectedValueOnce(
        new ApiClientError(500, 'Server Error', 'Database connection failed')
      )

      await useProjectsStore.getState().loadProjects()

      const state = useProjectsStore.getState()
      expect(state.error).toBe('Database connection failed')
      expect(state.isLoading).toBe(false)
    })

    it('handles generic error', async () => {
      vi.mocked(projectsApi.list).mockRejectedValueOnce(new Error('Network error'))

      await useProjectsStore.getState().loadProjects()

      expect(useProjectsStore.getState().error).toBe('Failed to load projects')
    })
  })

  describe('createProject', () => {
    it('creates project and sets as current', async () => {
      const newProject = { id: 'new-proj', name: 'New Project', created_at: '2024-01-01', updated_at: '2024-01-01', books: [] }
      vi.mocked(projectsApi.create).mockResolvedValueOnce({ project: newProject })

      const result = await useProjectsStore.getState().createProject('New Project', 'Description')

      expect(result.name).toBe('New Project')
      expect(useProjectsStore.getState().currentProjectId).toBe('new-proj')
      expect(useProjectsStore.getState().projects).toHaveLength(1)
    })

    it('throws error on failure', async () => {
      vi.mocked(projectsApi.create).mockRejectedValueOnce(
        new ApiClientError(400, 'Bad Request', 'Name is required')
      )

      await expect(
        useProjectsStore.getState().createProject('', '')
      ).rejects.toThrow()
      
      expect(useProjectsStore.getState().error).toBe('Name is required')
    })
  })

  describe('setCurrentProject', () => {
    it('sets current project and clears book/page selection', () => {
      useProjectsStore.setState({
        currentBookId: 'book-1',
        currentPageId: 'page-1',
      })

      useProjectsStore.getState().setCurrentProject('proj-1')

      const state = useProjectsStore.getState()
      expect(state.currentProjectId).toBe('proj-1')
      expect(state.currentBookId).toBeNull()
      expect(state.currentPageId).toBeNull()
    })
  })

  describe('currentProject getter', () => {
    it('returns current project', () => {
      useProjectsStore.setState({
        projects: [
          { id: 'proj-1', name: 'Project 1', createdAt: '', updatedAt: '', books: [] },
          { id: 'proj-2', name: 'Project 2', createdAt: '', updatedAt: '', books: [] },
        ],
        currentProjectId: 'proj-2',
      })

      const current = useProjectsStore.getState().currentProject()
      expect(current?.name).toBe('Project 2')
    })

    it('returns undefined when no project selected', () => {
      expect(useProjectsStore.getState().currentProject()).toBeUndefined()
    })
  })

  describe('updateProject', () => {
    it('updates project in state', async () => {
      useProjectsStore.setState({
        projects: [{ id: 'proj-1', name: 'Old Name', createdAt: '', updatedAt: '', books: [] }],
      })

      vi.mocked(projectsApi.update).mockResolvedValueOnce({
        project: { id: 'proj-1', name: 'New Name', created_at: '', updated_at: '', books: [] }
      })

      await useProjectsStore.getState().updateProject('proj-1', { name: 'New Name' })

      expect(useProjectsStore.getState().projects[0].name).toBe('New Name')
    })
  })

  describe('deleteProject', () => {
    it('removes project from state', async () => {
      useProjectsStore.setState({
        projects: [
          { id: 'proj-1', name: 'Project 1', createdAt: '', updatedAt: '', books: [] },
          { id: 'proj-2', name: 'Project 2', createdAt: '', updatedAt: '', books: [] },
        ],
        currentProjectId: 'proj-1',
      })

      vi.mocked(projectsApi.delete).mockResolvedValueOnce({})

      await useProjectsStore.getState().deleteProject('proj-1')

      const state = useProjectsStore.getState()
      expect(state.projects).toHaveLength(1)
      expect(state.projects[0].id).toBe('proj-2')
      expect(state.currentProjectId).toBeNull()
    })

    it('does not clear currentProjectId if different project deleted', async () => {
      useProjectsStore.setState({
        projects: [
          { id: 'proj-1', name: 'Project 1', createdAt: '', updatedAt: '', books: [] },
          { id: 'proj-2', name: 'Project 2', createdAt: '', updatedAt: '', books: [] },
        ],
        currentProjectId: 'proj-1',
      })

      vi.mocked(projectsApi.delete).mockResolvedValueOnce({})

      await useProjectsStore.getState().deleteProject('proj-2')

      expect(useProjectsStore.getState().currentProjectId).toBe('proj-1')
    })
  })

  describe('book actions', () => {
    beforeEach(() => {
      useProjectsStore.setState({
        projects: [{
          id: 'proj-1',
          name: 'Project',
          createdAt: '',
          updatedAt: '',
          books: [],
        }],
        currentProjectId: 'proj-1',
      })
    })

    it('creates book in project', async () => {
      vi.mocked(booksApi.create).mockResolvedValueOnce({
        book: {
          id: 'book-1',
          project_id: 'proj-1',
          title: 'New Book',
          created_at: '',
          updated_at: '',
          pages: [],
          assets: [],
          characters: [],
        }
      })

      const result = await useProjectsStore.getState().createBook('proj-1', 'New Book', {
        name: 'default',
        artStyle: '',
        referencePrompt: '',
        negativePrompt: '',
        steps: 35,
        cfg: 5.5,
      })

      expect(result.title).toBe('New Book')
      expect(useProjectsStore.getState().currentBookId).toBe('book-1')
    })

    it('deletes book from project', async () => {
      useProjectsStore.setState({
        projects: [{
          id: 'proj-1',
          name: 'Project',
          createdAt: '',
          updatedAt: '',
          books: [{
            id: 'book-1',
            projectId: 'proj-1',
            title: 'Book',
            createdAt: '',
            updatedAt: '',
            pages: [],
            assets: [],
            characters: [],
          }],
        }],
        currentBookId: 'book-1',
      })

      vi.mocked(booksApi.delete).mockResolvedValueOnce({})

      await useProjectsStore.getState().deleteBook('book-1')

      expect(useProjectsStore.getState().projects[0].books).toHaveLength(0)
      expect(useProjectsStore.getState().currentBookId).toBeNull()
    })
  })

  describe('page actions', () => {
    beforeEach(() => {
      useProjectsStore.setState({
        projects: [{
          id: 'proj-1',
          name: 'Project',
          createdAt: '',
          updatedAt: '',
          books: [{
            id: 'book-1',
            projectId: 'proj-1',
            title: 'Book',
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
      })
    })

    it('creates page in book', async () => {
      vi.mocked(pagesApi.create).mockResolvedValueOnce({
        page: {
          id: 'page-1',
          book_id: 'book-1',
          name: 'Page 1',
          page_number: 1,
          width: 1080,
          height: 704,
          status: 'pending',
          text_layout: 'bottom',
          created_at: '',
          updated_at: '',
        }
      })

      await useProjectsStore.getState().createPage('book-1', 'Page 1')

      expect(useProjectsStore.getState().currentPageId).toBe('page-1')
    })

    it('reorders pages locally', async () => {
      useProjectsStore.setState({
        projects: [{
          id: 'proj-1',
          name: 'Project',
          createdAt: '',
          updatedAt: '',
          books: [{
            id: 'book-1',
            projectId: 'proj-1',
            title: 'Book',
            createdAt: '',
            updatedAt: '',
            width: 1080,
            height: 704,
            pages: [
              { id: 'page-1', bookId: 'book-1', name: 'P1', pageNumber: 0, width: 1080, height: 704, status: 'pending', textLayout: 'bottom', createdAt: '', updatedAt: '' },
              { id: 'page-2', bookId: 'book-1', name: 'P2', pageNumber: 1, width: 1080, height: 704, status: 'pending', textLayout: 'bottom', createdAt: '', updatedAt: '' },
            ],
            assets: [],
            characters: [],
          }],
        }],
      })

      await useProjectsStore.getState().reorderPages('book-1', ['page-2', 'page-1'])

      const pages = useProjectsStore.getState().projects[0].books[0].pages
      expect(pages[0].id).toBe('page-2')
      expect(pages[1].id).toBe('page-1')
    })
  })

  describe('asset actions', () => {
    it('adds asset to book', async () => {
      useProjectsStore.setState({
        projects: [{
          id: 'proj-1',
          name: 'Project',
          createdAt: '',
          updatedAt: '',
          books: [{
            id: 'book-1',
            projectId: 'proj-1',
            title: 'Book',
            createdAt: '',
            updatedAt: '',
            pages: [],
            assets: [],
            characters: [],
          }],
        }],
      })

      await useProjectsStore.getState().addAsset('book-1', {
        name: 'Asset',
        assetType: 'background',
        imagePath: '/images/bg.png',
        hasTransparency: false,
      })

      expect(useProjectsStore.getState().projects[0].books[0].assets).toHaveLength(1)
    })
  })

  describe('updateBook', () => {
    it('updates book successfully', async () => {
      ;(booksApi.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        book: { id: 'book-1', title: 'Updated Title', created_at: '', updated_at: '', pages: [], assets: [] }
      })

      useProjectsStore.setState({
        projects: [{
          id: 'proj-1',
          name: 'Project',
          createdAt: '',
          updatedAt: '',
          books: [{ id: 'book-1', projectId: 'proj-1', title: 'Old', createdAt: '', updatedAt: '', pages: [], assets: [], characters: [] }]
        }]
      })

      await useProjectsStore.getState().updateBook('book-1', { title: 'Updated Title' })
      expect(useProjectsStore.getState().projects[0].books[0].title).toBe('Updated Title')
    })

    it('handles error updating book', async () => {
      ;(booksApi.update as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new ApiClientError(500, 'Fail', 'Server error'))

      useProjectsStore.setState({
        projects: [{
          id: 'proj-1', name: 'Project', createdAt: '', updatedAt: '',
          books: [{ id: 'book-1', projectId: 'proj-1', title: 'Old', createdAt: '', updatedAt: '', pages: [], assets: [], characters: [] }]
        }]
      })

      await useProjectsStore.getState().updateBook('book-1', { title: 'Updated' })
      expect(useProjectsStore.getState().error).toBe('Server error')
    })
  })

  describe('deleteBook', () => {
    it('deletes book successfully', async () => {
      ;(booksApi.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({})

      useProjectsStore.setState({
        projects: [{
          id: 'proj-1', name: 'Project', createdAt: '', updatedAt: '',
          books: [{ id: 'book-1', projectId: 'proj-1', title: 'Book', createdAt: '', updatedAt: '', pages: [], assets: [], characters: [] }]
        }],
        currentBookId: 'book-1'
      })

      await useProjectsStore.getState().deleteBook('book-1')
      expect(useProjectsStore.getState().projects[0].books).toHaveLength(0)
      expect(useProjectsStore.getState().currentBookId).toBeNull()
    })

    it('handles error deleting book', async () => {
      ;(booksApi.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Fail'))

      useProjectsStore.setState({
        projects: [{
          id: 'proj-1', name: 'Project', createdAt: '', updatedAt: '',
          books: [{ id: 'book-1', projectId: 'proj-1', title: 'Book', createdAt: '', updatedAt: '', pages: [], assets: [], characters: [] }]
        }]
      })

      await useProjectsStore.getState().deleteBook('book-1')
      expect(useProjectsStore.getState().error).toBe('Failed to delete book')
    })
  })

  describe('updatePage', () => {
    it('updates page successfully', async () => {
      ;(pagesApi.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        page: { id: 'page-1', book_id: 'book-1', name: 'Updated', page_number: 1, text_content: 'Hello', created_at: '', updated_at: '' }
      })

      useProjectsStore.setState({
        projects: [{
          id: 'proj-1', name: 'Project', createdAt: '', updatedAt: '',
          books: [{
            id: 'book-1', projectId: 'proj-1', title: 'Book', createdAt: '', updatedAt: '',
            pages: [{ id: 'page-1', bookId: 'book-1', name: 'Old', pageNumber: 1, layers: [], createdAt: '', updatedAt: '' }],
            assets: [], characters: []
          }]
        }],
        currentProjectId: 'proj-1',
        currentBookId: 'book-1'
      })

      await useProjectsStore.getState().updatePage('page-1', { textContent: 'Hello' })
      expect(pagesApi.update).toHaveBeenCalledWith('book-1', 'page-1', expect.any(Object))
    })

    it('handles error updating page', async () => {
      ;(pagesApi.update as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new ApiClientError(500, 'Fail', 'Update failed'))

      useProjectsStore.setState({
        projects: [{
          id: 'proj-1', name: 'Project', createdAt: '', updatedAt: '',
          books: [{
            id: 'book-1', projectId: 'proj-1', title: 'Book', createdAt: '', updatedAt: '',
            pages: [{ id: 'page-1', bookId: 'book-1', name: 'Old', pageNumber: 1, layers: [], createdAt: '', updatedAt: '' }],
            assets: [], characters: []
          }]
        }],
        currentProjectId: 'proj-1',
        currentBookId: 'book-1'
      })

      await useProjectsStore.getState().updatePage('page-1', { textContent: 'Hello' })
      expect(useProjectsStore.getState().error).toBe('Update failed')
    })

    it('does nothing without current book', async () => {
      useProjectsStore.setState({ currentBookId: null })
      await useProjectsStore.getState().updatePage('page-1', { textContent: 'Hello' })
      expect(pagesApi.update).not.toHaveBeenCalled()
    })
  })

  describe('deletePage', () => {
    it('deletes page successfully', async () => {
      ;(pagesApi.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({})

      useProjectsStore.setState({
        projects: [{
          id: 'proj-1', name: 'Project', createdAt: '', updatedAt: '',
          books: [{
            id: 'book-1', projectId: 'proj-1', title: 'Book', createdAt: '', updatedAt: '',
            pages: [{ id: 'page-1', bookId: 'book-1', name: 'Page', pageNumber: 1, layers: [], createdAt: '', updatedAt: '' }],
            assets: [], characters: []
          }]
        }],
        currentProjectId: 'proj-1',
        currentBookId: 'book-1',
        currentPageId: 'page-1'
      })

      await useProjectsStore.getState().deletePage('page-1')
      expect(pagesApi.delete).toHaveBeenCalledWith('book-1', 'page-1')
      expect(useProjectsStore.getState().projects[0].books[0].pages).toHaveLength(0)
      expect(useProjectsStore.getState().currentPageId).toBeNull()
    })

    it('handles error deleting page', async () => {
      ;(pagesApi.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Fail'))

      useProjectsStore.setState({
        projects: [{
          id: 'proj-1', name: 'Project', createdAt: '', updatedAt: '',
          books: [{
            id: 'book-1', projectId: 'proj-1', title: 'Book', createdAt: '', updatedAt: '',
            pages: [{ id: 'page-1', bookId: 'book-1', name: 'Page', pageNumber: 1, layers: [], createdAt: '', updatedAt: '' }],
            assets: [], characters: []
          }]
        }],
        currentProjectId: 'proj-1',
        currentBookId: 'book-1'
      })

      await useProjectsStore.getState().deletePage('page-1')
      expect(useProjectsStore.getState().error).toBe('Failed to delete page')
    })

    it('does nothing without current book', async () => {
      useProjectsStore.setState({ currentBookId: null })
      await useProjectsStore.getState().deletePage('page-1')
      expect(pagesApi.delete).not.toHaveBeenCalled()
    })
  })
})

