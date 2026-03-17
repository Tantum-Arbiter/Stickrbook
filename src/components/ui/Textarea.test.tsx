import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { Textarea } from './Textarea'

describe('Textarea', () => {
  describe('rendering', () => {
    it('renders a textarea element', () => {
      render(<Textarea />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('applies default classes', () => {
      render(<Textarea />)
      expect(screen.getByRole('textbox')).toHaveClass('textarea')
    })
  })

  describe('label', () => {
    it('renders label when provided', () => {
      render(<Textarea label="Description" />)
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
    })

    it('wraps textarea in form-group when label is provided', () => {
      render(<Textarea label="Notes" />)
      expect(screen.getByRole('textbox').closest('.form-group')).toBeInTheDocument()
    })

    it('associates label with textarea via htmlFor', () => {
      render(<Textarea label="Content" id="content-field" />)
      const textarea = screen.getByLabelText('Content')
      expect(textarea).toHaveAttribute('id', 'content-field')
    })
  })

  describe('helper text', () => {
    it('renders helper text when provided', () => {
      render(<Textarea helperText="Maximum 500 characters" />)
      expect(screen.getByText('Maximum 500 characters')).toBeInTheDocument()
    })

    it('wraps textarea in form-group when helperText is provided', () => {
      render(<Textarea helperText="Help text" />)
      expect(screen.getByRole('textbox').closest('.form-group')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('applies error class when error is provided', () => {
      render(<Textarea error="This field is required" />)
      expect(screen.getByRole('textbox')).toHaveClass('textarea--error')
    })

    it('displays error message', () => {
      render(<Textarea error="Content is required" />)
      expect(screen.getByText('Content is required')).toBeInTheDocument()
    })

    it('shows error instead of helper text when both provided', () => {
      render(<Textarea error="Error message" helperText="Helper text" />)
      expect(screen.getByText('Error message')).toBeInTheDocument()
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument()
    })

    it('applies error class to helper text', () => {
      render(<Textarea error="Error message" />)
      expect(screen.getByText('Error message')).toHaveClass('input-helper--error')
    })
  })

  describe('resize prop', () => {
    it('applies vertical resize by default', () => {
      render(<Textarea />)
      expect(screen.getByRole('textbox')).toHaveStyle({ resize: 'vertical' })
    })

    it.each(['none', 'vertical', 'horizontal', 'both'] as const)(
      'applies %s resize style',
      (resize) => {
        render(<Textarea resize={resize} />)
        expect(screen.getByRole('textbox')).toHaveStyle({ resize })
      }
    )
  })

  describe('controlled textarea', () => {
    it('displays controlled value', () => {
      render(<Textarea value="test content" onChange={() => {}} />)
      expect(screen.getByRole('textbox')).toHaveValue('test content')
    })

    it('calls onChange when value changes', async () => {
      const handleChange = vi.fn()
      const { user } = render(<Textarea value="" onChange={handleChange} />)

      await user.type(screen.getByRole('textbox'), 'a')
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('uncontrolled textarea', () => {
    it('accepts defaultValue', () => {
      render(<Textarea defaultValue="default content" />)
      expect(screen.getByRole('textbox')).toHaveValue('default content')
    })

    it('allows typing in uncontrolled mode', async () => {
      const { user } = render(<Textarea />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, 'hello world')
      expect(textarea).toHaveValue('hello world')
    })
  })

  describe('HTML attributes', () => {
    it('forwards placeholder attribute', () => {
      render(<Textarea placeholder="Enter your message..." />)
      expect(screen.getByPlaceholderText('Enter your message...')).toBeInTheDocument()
    })

    it('forwards disabled attribute', () => {
      render(<Textarea disabled />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('forwards rows attribute', () => {
      render(<Textarea rows={5} />)
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5')
    })

    it('forwards maxLength attribute', () => {
      render(<Textarea maxLength={500} />)
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '500')
    })

    it('forwards aria attributes', () => {
      render(<Textarea aria-describedby="help-text" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'help-text')
    })
  })

  describe('custom className', () => {
    it('merges custom className with default classes', () => {
      render(<Textarea className="custom-textarea" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('textarea')
      expect(textarea).toHaveClass('custom-textarea')
    })
  })
})

