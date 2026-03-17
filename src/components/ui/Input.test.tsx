import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { Input } from './Input'

describe('Input', () => {
  describe('rendering', () => {
    it('renders an input element', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('applies default classes', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toHaveClass('input')
    })
  })

  describe('sizes', () => {
    it('applies default size without extra class', () => {
      render(<Input inputSize="default" />)
      const input = screen.getByRole('textbox')
      expect(input).not.toHaveClass('input--small')
      expect(input).not.toHaveClass('input--large')
    })

    it.each(['small', 'large'] as const)('applies %s size class', (size) => {
      render(<Input inputSize={size} />)
      expect(screen.getByRole('textbox')).toHaveClass(`input--${size}`)
    })
  })

  describe('label', () => {
    it('renders label when provided', () => {
      render(<Input label="Username" />)
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
    })

    it('wraps input in form-group when label is provided', () => {
      render(<Input label="Email" />)
      expect(screen.getByRole('textbox').closest('.form-group')).toBeInTheDocument()
    })

    it('associates label with input via htmlFor', () => {
      render(<Input label="Password" id="password-field" />)
      const input = screen.getByLabelText('Password')
      expect(input).toHaveAttribute('id', 'password-field')
    })
  })

  describe('helper text', () => {
    it('renders helper text when provided', () => {
      render(<Input helperText="Enter your email address" />)
      expect(screen.getByText('Enter your email address')).toBeInTheDocument()
    })

    it('wraps input in form-group when helperText is provided', () => {
      render(<Input helperText="Help text" />)
      expect(screen.getByRole('textbox').closest('.form-group')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('applies error class when error is provided', () => {
      render(<Input error="This field is required" />)
      expect(screen.getByRole('textbox')).toHaveClass('input--error')
    })

    it('displays error message', () => {
      render(<Input error="Invalid email format" />)
      expect(screen.getByText('Invalid email format')).toBeInTheDocument()
    })

    it('shows error instead of helper text when both provided', () => {
      render(<Input error="Error message" helperText="Helper text" />)
      expect(screen.getByText('Error message')).toBeInTheDocument()
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument()
    })

    it('applies error class to helper text', () => {
      render(<Input error="Error message" />)
      expect(screen.getByText('Error message')).toHaveClass('input-helper--error')
    })
  })

  describe('icons', () => {
    it('renders left icon', () => {
      render(<Input leftIcon={<span data-testid="left-icon">🔍</span>} />)
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    })

    it('renders right icon', () => {
      render(<Input rightIcon={<span data-testid="right-icon">✓</span>} />)
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })

    it('applies with-left-icon class when leftIcon provided', () => {
      render(<Input leftIcon={<span>🔍</span>} />)
      expect(screen.getByRole('textbox')).toHaveClass('input--with-left-icon')
    })

    it('applies with-right-icon class when rightIcon provided', () => {
      render(<Input rightIcon={<span>✓</span>} />)
      expect(screen.getByRole('textbox')).toHaveClass('input--with-right-icon')
    })
  })

  describe('controlled input', () => {
    it('displays controlled value', () => {
      render(<Input value="test value" onChange={() => {}} />)
      expect(screen.getByRole('textbox')).toHaveValue('test value')
    })

    it('calls onChange when value changes', async () => {
      const handleChange = vi.fn()
      const { user } = render(<Input value="" onChange={handleChange} />)

      await user.type(screen.getByRole('textbox'), 'a')
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('uncontrolled input', () => {
    it('accepts defaultValue', () => {
      render(<Input defaultValue="default" />)
      expect(screen.getByRole('textbox')).toHaveValue('default')
    })

    it('allows typing in uncontrolled mode', async () => {
      const { user } = render(<Input />)
      const input = screen.getByRole('textbox')

      await user.type(input, 'hello')
      expect(input).toHaveValue('hello')
    })
  })

  describe('HTML attributes', () => {
    it('forwards placeholder attribute', () => {
      render(<Input placeholder="Enter text..." />)
      expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()
    })

    it('forwards disabled attribute', () => {
      render(<Input disabled />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('forwards type attribute', () => {
      render(<Input type="email" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
    })

    it('forwards aria attributes', () => {
      render(<Input aria-describedby="help-text" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'help-text')
    })
  })

  describe('custom className', () => {
    it('merges custom className with default classes', () => {
      render(<Input className="custom-input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('input')
      expect(input).toHaveClass('custom-input')
    })
  })
})

