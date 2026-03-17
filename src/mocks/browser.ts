import { setupWorker } from 'msw/browser'
import { handlers } from '../test/mocks/handlers'

// Setup MSW browser worker for development
export const worker = setupWorker(...handlers)

// Log all requests for debugging
worker.events.on('request:start', ({ request }) => {
  console.log('[MSW] Intercepted:', request.method, request.url)
})

worker.events.on('response:mocked', ({ request, response }) => {
  console.log('[MSW] Mocked response for:', request.method, request.url, response.status)
})

