import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'
import { Modal } from './Modal'

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <p>Modal content</p>,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders content when open', () => {
      render(<Modal {...defaultProps} />)
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(<Modal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
    })

    it('renders with dialog role', () => {
      render(<Modal {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('has aria-modal attribute', () => {
      render(<Modal {...defaultProps} />)
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    })
  })

  describe('title', () => {
    it('renders title when provided', () => {
      render(<Modal {...defaultProps} title="My Modal" />)
      expect(screen.getByRole('heading', { name: 'My Modal' })).toBeInTheDocument()
    })

    it('does not render heading when title not provided', () => {
      render(<Modal {...defaultProps} />)
      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })
  })

  describe('footer', () => {
    it('renders footer when provided', () => {
      render(<Modal {...defaultProps} footer={<button>Save</button>} />)
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    })

    it('wraps footer in modal-actions', () => {
      render(<Modal {...defaultProps} footer={<button>Save</button>} />)
      expect(screen.getByRole('button', { name: 'Save' }).closest('.modal-actions')).toBeInTheDocument()
    })
  })

  describe('variants', () => {
    it('applies default variant without extra class', () => {
      render(<Modal {...defaultProps} variant="default" />)
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveClass('modal')
      expect(modal).not.toHaveClass('modal--wide')
      expect(modal).not.toHaveClass('modal--fullscreen')
    })

    it.each(['wide', 'fullscreen'] as const)('applies %s variant class', (variant) => {
      render(<Modal {...defaultProps} variant={variant} />)
      expect(screen.getByRole('dialog')).toHaveClass(`modal--${variant}`)
    })
  })

  describe('overlay click', () => {
    it('calls onClose when overlay is clicked', () => {
      const onClose = vi.fn()
      render(<Modal {...defaultProps} onClose={onClose} />)

      // Click the overlay (the element with modal-overlay class)
      const overlay = screen.getByRole('dialog').parentElement
      fireEvent.click(overlay!)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose when modal content is clicked', () => {
      const onClose = vi.fn()
      render(<Modal {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByRole('dialog'))

      expect(onClose).not.toHaveBeenCalled()
    })

    it('does not call onClose on overlay click when closeOnOverlayClick is false', () => {
      const onClose = vi.fn()
      render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />)

      const overlay = screen.getByRole('dialog').parentElement
      fireEvent.click(overlay!)

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('escape key', () => {
    it('calls onClose when Escape key is pressed', () => {
      const onClose = vi.fn()
      render(<Modal {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose on Escape when closeOnEscape is false', () => {
      const onClose = vi.fn()
      render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('body scroll lock', () => {
    it('sets body overflow to hidden when open', () => {
      render(<Modal {...defaultProps} />)
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores body overflow when closed', () => {
      const { rerender } = render(<Modal {...defaultProps} />)
      expect(document.body.style.overflow).toBe('hidden')

      rerender(<Modal {...defaultProps} isOpen={false} />)
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('custom className', () => {
    it('merges custom className with default classes', () => {
      render(<Modal {...defaultProps} className="custom-modal" />)
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveClass('modal')
      expect(modal).toHaveClass('custom-modal')
    })
  })
})

