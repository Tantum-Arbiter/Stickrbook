/**
 * API Module Barrel Export
 */

export { api, apiRequest, ApiClientError, API_BASE } from './client';
export type { ApiError } from './client';

export * from './types';
export * from './endpoints';

// SSE (Server-Sent Events) for real-time job updates
export {
  subscribeToJobEvents,
  JobEventManager,
  jobEventManager,
} from './sse';
export type {
  SSEStatusEvent,
  SSEProgressEvent,
  SSECompletedEvent,
  SSEFailedEvent,
  SSEHandlers,
} from './sse';

