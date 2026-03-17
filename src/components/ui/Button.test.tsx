import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { Button } from './Button'

describe('Button', () => {
  describe('rendering', () => {
    it('renders children correctly', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('applies primary variant by default', () => {
      render(<Button>Primary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('button')
      expect(button).not.toHaveClass('button--secondary')
    })
  })

  describe('variants', () => {
    it.each(['secondary', 'ghost', 'danger', 'success'] as const)(
      'applies %s variant class',
      (variant) => {
        render(<Button variant={variant}>Button</Button>)
        expect(screen.getByRole('button')).toHaveClass(`button--${variant}`)
      }
    )
  })

  describe('sizes', () => {
    it('applies default size without extra class', () => {
      render(<Button size="default">Default</Button>)
      const button = screen.getByRole('button')
      expect(button).not.toHaveClass('button--small')
      expect(button).not.toHaveClass('button--large')
    })

    it.each(['small', 'large'] as const)('applies %s size class', (size) => {
      render(<Button size={size}>Button</Button>)
      expect(screen.getByRole('button')).toHaveClass(`button--${size}`)
    })
  })

  describe('block prop', () => {
    it('applies block class when block is true', () => {
      render(<Button block>Block Button</Button>)
      expect(screen.getByRole('button')).toHaveClass('button--block')
    })
  })

  describe('loading state', () => {
    it('applies loading class when loading', () => {
      render(<Button loading>Loading</Button>)
      expect(screen.getByRole('button')).toHaveClass('button--loading')
    })

    it('disables the button when loading', () => {
      render(<Button loading>Loading</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('hides icons when loading', () => {
      render(
        <Button loading leftIcon={<span data-testid="left-icon">←</span>}>
          Loading
        </Button>
      )
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument()
    })
  })

  describe('icon props', () => {
    it('renders left icon', () => {
      render(
        <Button leftIcon={<span data-testid="left-icon">←</span>}>With Icon</Button>
      )
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    })

    it('renders right icon', () => {
      render(
        <Button rightIcon={<span data-testid="right-icon">→</span>}>With Icon</Button>
      )
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })
  })

  describe('iconOnly prop', () => {
    it('applies icon-only class', () => {
      render(<Button iconOnly>🔍</Button>)
      expect(screen.getByRole('button')).toHaveClass('button--icon')
    })
  })

  describe('disabled state', () => {
    it('disables the button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('click handling', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn()
      const { user } = render(<Button onClick={handleClick}>Click me</Button>)

      await user.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn()
      const { user } = render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      )

      await user.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('does not call onClick when loading', async () => {
      const handleClick = vi.fn()
      const { user } = render(
        <Button onClick={handleClick} loading>
          Loading
        </Button>
      )

      await user.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('custom className', () => {
    it('merges custom className with default classes', () => {
      render(<Button className="custom-class">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('HTML attributes', () => {
    it('forwards type attribute', () => {
      render(<Button type="submit">Submit</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    it('forwards aria attributes', () => {
      render(<Button aria-label="Close dialog">×</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close dialog')
    })
  })
})

