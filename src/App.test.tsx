import { describe, it, expect } from 'vitest'
import { render, screen } from './test/test-utils'
import App from './App'

describe('App', () => {
  it('renders the header with title', () => {
    render(<App />)
    expect(screen.getByText('StickrBook')).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(<App />)
    // Subtitle is rendered inside a span with " - " prefix
    expect(screen.getByText(/Grow with Freya/)).toBeInTheDocument()
  })

  it('renders the main tab navigation', () => {
    render(<App />)
    expect(screen.getByRole('tab', { name: 'Generate' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Story' })).toBeInTheDocument()
  })

  it('renders the sidebar with projects section', () => {
    render(<App />)
    // Multiple elements contain "Projects" text, use getAllByText
    expect(screen.getAllByText('Projects').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Assets').length).toBeGreaterThan(0)
  })
})

