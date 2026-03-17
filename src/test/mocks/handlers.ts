import { http, HttpResponse } from 'msw'

// Define API handlers for testing
export const handlers = [
  // Health check endpoint
  http.get('/v1/health', () => {
    return HttpResponse.json({
      status: 'ok',
      comfyui: 'connected',
      version: '1.0.0',
    })
  }),

  // Projects endpoints
  http.get('/v1/storyboard/projects', () => {
    return HttpResponse.json({
      projects: [
        {
          id: 'project-1',
          name: 'Test Project',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
    })
  }),

  http.post('/v1/storyboard/projects', async ({ request }) => {
    const body = (await request.json()) as { name: string }
    return HttpResponse.json({
      id: 'new-project-id',
      name: body.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  // Books endpoints
  http.get('/v1/storyboard/books', () => {
    return HttpResponse.json({
      books: [
        {
          id: 'book-1',
          title: 'Test Book',
          project_id: 'project-1',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
    })
  }),

  // Jobs endpoints
  http.post('/v1/jobs', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      id: 'job-123',
      status: 'queued',
      ...body,
    })
  }),

  http.get('/v1/jobs/:jobId', ({ params }) => {
    return HttpResponse.json({
      id: params.jobId,
      status: 'completed',
      outputs: ['/v1/files/output-1.png'],
    })
  }),

  // Presets endpoints
  http.get('/v1/storyboard/presets', () => {
    return HttpResponse.json({
      presets: [
        {
          id: 'preset-1',
          name: 'Watercolor',
          style: 'watercolor illustration',
          negative_prompt: 'ugly, blurry',
        },
      ],
    })
  }),
]

