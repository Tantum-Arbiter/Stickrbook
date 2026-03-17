/**
 * SSE (Server-Sent Events) Client
 * 
 * Handles real-time job progress updates from the backend.
 */

export interface SSEStatusEvent {
  status: string;
}

export interface SSEProgressEvent {
  phase: string;
  percent: number;
}

export interface SSECompletedEvent {
  file_ids: string[];
}

export interface SSEFailedEvent {
  error_code: string;
  message: string;
}

export type SSEEventType = 'status' | 'progress' | 'completed' | 'failed';

export interface SSEHandlers {
  onStatus?: (data: SSEStatusEvent) => void;
  onProgress?: (data: SSEProgressEvent) => void;
  onCompleted?: (data: SSECompletedEvent) => void;
  onFailed?: (data: SSEFailedEvent) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

/**
 * Create an EventSource connection to track job progress
 */
export function subscribeToJobEvents(
  jobId: string,
  handlers: SSEHandlers
): () => void {
  const url = `/v1/jobs/${jobId}/events`;

  // Note: EventSource doesn't support custom headers natively
  // API key auth is handled by the Vite proxy configuration
  const eventSource = new EventSource(url);

  eventSource.addEventListener('status', (event) => {
    try {
      // Skip empty or invalid data
      if (!event.data || event.data.trim() === '') return;

      const data = JSON.parse(event.data) as SSEStatusEvent;
      handlers.onStatus?.(data);
    } catch (e) {
      console.error('Failed to parse status event:', e, 'Data:', event.data);
    }
  });

  eventSource.addEventListener('progress', (event) => {
    try {
      // Skip empty or invalid data
      if (!event.data || event.data.trim() === '') return;

      const data = JSON.parse(event.data) as SSEProgressEvent;
      handlers.onProgress?.(data);
    } catch (e) {
      console.error('Failed to parse progress event:', e, 'Data:', event.data);
    }
  });

  eventSource.addEventListener('completed', (event) => {
    try {
      // Skip empty or invalid data
      if (!event.data || event.data.trim() === '') return;

      const data = JSON.parse(event.data) as SSECompletedEvent;
      handlers.onCompleted?.(data);
      // Close connection on completion
      eventSource.close();
      handlers.onClose?.();
    } catch (e) {
      console.error('Failed to parse completed event:', e, 'Data:', event.data);
    }
  });

  eventSource.addEventListener('failed', (event) => {
    try {
      // Skip empty or invalid data
      if (!event.data || event.data.trim() === '') return;

      const data = JSON.parse(event.data) as SSEFailedEvent;
      handlers.onFailed?.(data);
      // Close connection on failure
      eventSource.close();
      handlers.onClose?.();
    } catch (e) {
      console.error('Failed to parse failed event:', e, 'Data:', event.data);
    }
  });

  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    handlers.onError?.(new Error('SSE connection failed'));
    eventSource.close();
    handlers.onClose?.();
  };

  // Return cleanup function
  return () => {
    eventSource.close();
    handlers.onClose?.();
  };
}

/**
 * Manager for multiple SSE subscriptions
 */
export class JobEventManager {
  private subscriptions = new Map<string, () => void>();

  subscribe(jobId: string, handlers: SSEHandlers): void {
    // Cleanup existing subscription if any
    this.unsubscribe(jobId);
    
    const cleanup = subscribeToJobEvents(jobId, {
      ...handlers,
      onClose: () => {
        this.subscriptions.delete(jobId);
        handlers.onClose?.();
      },
    });
    
    this.subscriptions.set(jobId, cleanup);
  }

  unsubscribe(jobId: string): void {
    const cleanup = this.subscriptions.get(jobId);
    if (cleanup) {
      cleanup();
      this.subscriptions.delete(jobId);
    }
  }

  unsubscribeAll(): void {
    for (const cleanup of this.subscriptions.values()) {
      cleanup();
    }
    this.subscriptions.clear();
  }

  get activeCount(): number {
    return this.subscriptions.size;
  }
}

// Singleton instance for app-wide use
export const jobEventManager = new JobEventManager();

