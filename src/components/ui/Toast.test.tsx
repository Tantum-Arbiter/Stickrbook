import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider, useToast } from './Toast'

// Test component that uses the toast hook
function ToastTester() {
  const { toast, success, error, warning, info } = useToast()
  return (
    <div>
      <button onClick={() => toast('Generic message')}>Show Toast</button>
      <button onClick={() => success('Success message')}>Success</button>
      <button onClick={() => error('Error message')}>Error</button>
      <button onClick={() => warning('Warning message')}>Warning</button>
      <button onClick={() => info('Info message')}>Info</button>
      <button onClick={() => toast('Custom duration', 'info', 1000)}>Custom Duration</button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <ToastProvider>
      <ToastTester />
    </ToastProvider>
  )
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('ToastProvider', () => {
    it('renders children', () => {
      render(
        <ToastProvider>
          <p>Child content</p>
        </ToastProvider>
      )
      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('renders toast container', () => {
      render(
        <ToastProvider>
          <p>Content</p>
        </ToastProvider>
      )
      expect(document.querySelector('.toast-container')).toBeInTheDocument()
    })
  })

  describe('useToast hook', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<ToastTester />)
      }).toThrow('useToast must be used within a ToastProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('showing toasts', () => {
    it('shows toast when toast() is called', async () => {
      renderWithProvider()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Show Toast' }))
      })

      expect(screen.getByText('Generic message')).toBeInTheDocument()
    })

    it('shows success toast with correct class', async () => {
      renderWithProvider()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Success' }))
      })

      const toast = screen.getByText('Success message').closest('.toast')
      expect(toast).toHaveClass('toast--success')
    })

    it('shows error toast with correct class', async () => {
      renderWithProvider()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Error' }))
      })

      const toast = screen.getByText('Error message').closest('.toast')
      expect(toast).toHaveClass('toast--error')
    })

    it('shows warning toast with correct class', async () => {
      renderWithProvider()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Warning' }))
      })

      const toast = screen.getByText('Warning message').closest('.toast')
      expect(toast).toHaveClass('toast--warning')
    })

    it('shows info toast with correct class', async () => {
      renderWithProvider()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Info' }))
      })

      const toast = screen.getByText('Info message').closest('.toast')
      expect(toast).toHaveClass('toast--info')
    })
  })

  describe('auto-dismiss', () => {
    it('removes toast after default duration (4000ms)', async () => {
      renderWithProvider()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Success' }))
      })

      expect(screen.getByText('Success message')).toBeInTheDocument()

      // Advance past the duration
      await act(async () => {
        vi.advanceTimersByTime(4000)
      })

      // Wait for exit animation (300ms)
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      expect(screen.queryByText('Success message')).not.toBeInTheDocument()
    })

    it('respects custom duration', async () => {
      renderWithProvider()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Custom Duration' }))
      })

      expect(screen.getByText('Custom duration')).toBeInTheDocument()

      // Should still be visible before custom duration
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      expect(screen.getByText('Custom duration')).toBeInTheDocument()

      // Advance past custom duration
      await act(async () => {
        vi.advanceTimersByTime(500)
      })

      // Wait for exit animation
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      expect(screen.queryByText('Custom duration')).not.toBeInTheDocument()
    })
  })

  describe('close button', () => {
    it('renders close button', async () => {
      renderWithProvider()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Success' }))
      })

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })

    it('removes toast when close button is clicked', async () => {
      renderWithProvider()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Success' }))
      })

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Close' }))
      })

      // Wait for exit animation
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      expect(screen.queryByText('Success message')).not.toBeInTheDocument()
    })
  })

  describe('multiple toasts', () => {
    it('can show multiple toasts at once', async () => {
      renderWithProvider()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Success' }))
        fireEvent.click(screen.getByRole('button', { name: 'Error' }))
        fireEvent.click(screen.getByRole('button', { name: 'Warning' }))
      })

      expect(screen.getByText('Success message')).toBeInTheDocument()
      expect(screen.getByText('Error message')).toBeInTheDocument()
      expect(screen.getByText('Warning message')).toBeInTheDocument()
    })
  })
})

