import { setupWorker } from 'msw/browser'
import { handlers } from '../test/mocks/handlers'

// Setup MSW browser worker for development
export const worker = setupWorker(...handlers)

