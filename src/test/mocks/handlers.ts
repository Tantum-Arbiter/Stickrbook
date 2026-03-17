import { http, HttpResponse, delay } from 'msw'

// Mock image data URL (placeholder image)
const MOCK_IMAGE_URL = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1080" height="704"%3E%3Crect width="1080" height="704" fill="%234ECDC4"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="48" fill="white"%3EMock Generated Image%3C/text%3E%3C/svg%3E'

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
          name: 'My Storybook Project',
          description: 'A magical adventure',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          books: [],
        },
      ],
    })
  }),

  http.post('/v1/storyboard/projects', async ({ request }) => {
    const body = (await request.json()) as { name: string; description?: string }
    return HttpResponse.json({
      project: {
        id: `project-${Date.now()}`,
        name: body.name,
        description: body.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        books: [],
      },
    })
  }),

  // Books endpoints
  http.get('/v1/storyboard/books', () => {
    return HttpResponse.json({
      books: [
        {
          id: 'book-1',
          title: 'The Magical Forest',
          project_id: 'project-1',
          width: 1080,
          height: 704,
          default_steps: 35,
          default_cfg: 5.5,
          pages: [],
          characters: [],
          assets: [],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
    })
  }),

  http.post('/v1/storyboard/books', async ({ request }) => {
    const body = (await request.json()) as { title: string; project_id: string }
    return HttpResponse.json({
      book: {
        id: `book-${Date.now()}`,
        title: body.title,
        project_id: body.project_id,
        width: 1080,
        height: 704,
        default_steps: 35,
        default_cfg: 5.5,
        pages: [],
        characters: [],
        assets: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    })
  }),

  // Generation endpoints
  http.post('/v1/storyboard/books/:bookId/generate/variations', async ({ request }) => {
    await delay(500) // Simulate network delay
    const jobIds = Array.from({ length: 4 }, (_, i) => `job-${Date.now()}-${i}`)
    const seeds = Array.from({ length: 4 }, () => Math.floor(Math.random() * 2147483647))

    return HttpResponse.json({
      job_ids: jobIds,
      seeds: seeds,
    })
  }),

  // Jobs endpoints
  http.get('/v1/storyboard/jobs/:jobId', async ({ params }) => {
    await delay(1000) // Simulate processing time
    return HttpResponse.json({
      job_id: params.jobId,
      status: 'completed',
      progress: 100,
      outputs: [
        {
          file_id: `file-${params.jobId}`,
          file_path: `/outputs/${params.jobId}.png`,
          download_url: MOCK_IMAGE_URL,
          width: 1080,
          height: 704,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  http.delete('/v1/storyboard/jobs/:jobId', () => {
    return HttpResponse.json({ cancelled: true })
  }),

  // File serving
  http.get('/v1/files/:fileId', () => {
    return new HttpResponse(MOCK_IMAGE_URL, {
      headers: {
        'Content-Type': 'image/svg+xml',
      },
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

