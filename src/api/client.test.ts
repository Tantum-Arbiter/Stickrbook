import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiRequest, ApiClientError, api, API_BASE } from './client'

// Mock fetch globally
const mockFetch = vi.fn()

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('ApiClientError', () => {
    it('creates error with status and message', () => {
      const error = new ApiClientError(404, 'Not Found')
      expect(error.status).toBe(404)
      expect(error.message).toBe('Not Found')
      expect(error.name).toBe('ApiClientError')
    })

    it('includes optional detail', () => {
      const error = new ApiClientError(400, 'Bad Request', 'Invalid field: name')
      expect(error.detail).toBe('Invalid field: name')
    })
  })

  describe('apiRequest', () => {
    describe('happy path', () => {
      it('makes GET request successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ data: 'test' }))
        })

        const result = await apiRequest('/test')
        expect(result).toEqual({ data: 'test' })
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE}/test`,
          expect.objectContaining({ headers: expect.any(Object) })
        )
      })

      it('makes POST request with body', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ id: '123' }))
        })

        const result = await apiRequest('/items', {
          method: 'POST',
          body: { name: 'test' }
        })

        expect(result).toEqual({ id: '123' })
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE}/items`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ name: 'test' })
          })
        )
      })

      it('handles empty response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('')
        })

        const result = await apiRequest('/empty')
        expect(result).toEqual({})
      })

      it('includes custom headers', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('{}')
        })

        await apiRequest('/test', {
          headers: { 'X-Custom': 'value' }
        })

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'X-Custom': 'value'
            })
          })
        )
      })
    })

    describe('error handling', () => {
      it('throws ApiClientError on 4xx response', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          text: () => Promise.resolve('{"detail": "Item not found"}')
        })

        const error = await apiRequest('/missing').catch(e => e)
        expect(error).toBeInstanceOf(ApiClientError)
        expect(error.status).toBe(404)
        expect(error.detail).toBe('Item not found')
      })

      it('throws ApiClientError on 5xx response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('Server error')
        })

        await expect(apiRequest('/error')).rejects.toThrow(ApiClientError)
      })

      it('handles non-JSON error body', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          text: () => Promise.resolve('Plain text error')
        })

        await expect(apiRequest('/down')).rejects.toMatchObject({
          detail: 'Plain text error'
        })
      })

      it('handles network errors', async () => {
        mockFetch.mockRejectedValueOnce(new TypeError('Network failure'))

        await expect(apiRequest('/network')).rejects.toThrow(ApiClientError)
        await expect(apiRequest('/network')).rejects.toMatchObject({
          status: 0
        })
      })
    })

    describe('retry logic', () => {
      it('retries on 5xx errors', async () => {
        vi.useFakeTimers()

        mockFetch
          .mockResolvedValueOnce({
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            text: () => Promise.resolve('Retry')
          })
          .mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve('{"success": true}')
          })

        const promise = apiRequest('/flaky', { retry: 1, retryDelay: 100 })

        // Advance through retry delay and run all pending timers
        await vi.runAllTimersAsync()

        const result = await promise
        expect(result).toEqual({ success: true })
        expect(mockFetch).toHaveBeenCalledTimes(2)

        vi.useRealTimers()
      })

      it('does not retry on 4xx errors', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: () => Promise.resolve('{"detail": "Invalid"}')
        })

        await expect(apiRequest('/bad', { retry: 3 })).rejects.toThrow(ApiClientError)
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      it('throws after all retries exhausted', async () => {
        vi.useFakeTimers()

        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('Error')
        })

        const promise = apiRequest('/always-fail', { retry: 2, retryDelay: 50 })

        // Attach error handler immediately to prevent unhandled rejection
        let caughtError: ApiClientError | null = null
        promise.catch((e) => {
          caughtError = e
        })

        // Run all pending timers to completion
        await vi.runAllTimersAsync()

        // Wait for the promise to settle
        await vi.waitFor(() => {
          expect(caughtError).not.toBeNull()
        })

        expect(caughtError).toBeInstanceOf(ApiClientError)
        expect(caughtError!.status).toBe(500)
        expect(mockFetch).toHaveBeenCalledTimes(3) // Initial + 2 retries

        vi.useRealTimers()
      })
    })
  })

  describe('api convenience methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('{"result": "ok"}')
      })
    })

    it('api.get sends GET request', async () => {
      await api.get('/items')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('api.post sends POST request with body', async () => {
      await api.post('/items', { name: 'test' })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' })
        })
      )
    })

    it('api.put sends PUT request with body', async () => {
      await api.put('/items/1', { name: 'updated' })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'updated' })
        })
      )
    })

    it('api.delete sends DELETE request', async () => {
      await api.delete('/items/1')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })
})

