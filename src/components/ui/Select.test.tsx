import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { Select } from './Select'

const testOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
]

describe('Select', () => {
  describe('rendering', () => {
    it('renders a select element', () => {
      render(<Select options={testOptions} />)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('applies default classes', () => {
      render(<Select options={testOptions} />)
      expect(screen.getByRole('combobox')).toHaveClass('select')
    })
  })

  describe('options', () => {
    it('renders all options', () => {
      render(<Select options={testOptions} />)
      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument()
    })

    it('renders disabled options', () => {
      render(<Select options={testOptions} />)
      expect(screen.getByRole('option', { name: 'Option 3' })).toBeDisabled()
    })

    it('renders placeholder option when provided', () => {
      render(<Select options={testOptions} placeholder="Select an option" />)
      expect(screen.getByRole('option', { name: 'Select an option' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Select an option' })).toBeDisabled()
    })

    it('renders children when no options prop provided', () => {
      render(
        <Select>
          <option value="a">Child A</option>
          <option value="b">Child B</option>
        </Select>
      )
      expect(screen.getByRole('option', { name: 'Child A' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Child B' })).toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    it('applies default size without extra class', () => {
      render(<Select options={testOptions} selectSize="default" />)
      const select = screen.getByRole('combobox')
      expect(select).not.toHaveClass('select--small')
      expect(select).not.toHaveClass('select--large')
    })

    it.each(['small', 'large'] as const)('applies %s size class', (size) => {
      render(<Select options={testOptions} selectSize={size} />)
      expect(screen.getByRole('combobox')).toHaveClass(`select--${size}`)
    })
  })

  describe('label', () => {
    it('renders label when provided', () => {
      render(<Select options={testOptions} label="Category" />)
      expect(screen.getByLabelText('Category')).toBeInTheDocument()
    })

    it('wraps select in form-group when label is provided', () => {
      render(<Select options={testOptions} label="Type" />)
      expect(screen.getByRole('combobox').closest('.form-group')).toBeInTheDocument()
    })
  })

  describe('helper text', () => {
    it('renders helper text when provided', () => {
      render(<Select options={testOptions} helperText="Choose your preferred option" />)
      expect(screen.getByText('Choose your preferred option')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('applies error class when error is provided', () => {
      render(<Select options={testOptions} error="Selection required" />)
      expect(screen.getByRole('combobox')).toHaveClass('select--error')
    })

    it('displays error message', () => {
      render(<Select options={testOptions} error="Please select an option" />)
      expect(screen.getByText('Please select an option')).toBeInTheDocument()
    })

    it('shows error instead of helper text when both provided', () => {
      render(<Select options={testOptions} error="Error" helperText="Helper" />)
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.queryByText('Helper')).not.toBeInTheDocument()
    })
  })

  describe('controlled select', () => {
    it('displays controlled value', () => {
      render(<Select options={testOptions} value="option2" onChange={() => {}} />)
      expect(screen.getByRole('combobox')).toHaveValue('option2')
    })

    it('calls onChange when selection changes', async () => {
      const handleChange = vi.fn()
      const { user } = render(<Select options={testOptions} value="" onChange={handleChange} />)

      await user.selectOptions(screen.getByRole('combobox'), 'option1')
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('uncontrolled select', () => {
    it('accepts defaultValue', () => {
      render(<Select options={testOptions} defaultValue="option2" />)
      expect(screen.getByRole('combobox')).toHaveValue('option2')
    })

    it('allows selection in uncontrolled mode', async () => {
      const { user } = render(<Select options={testOptions} />)
      const select = screen.getByRole('combobox')

      await user.selectOptions(select, 'option1')
      expect(select).toHaveValue('option1')
    })
  })

  describe('HTML attributes', () => {
    it('forwards disabled attribute', () => {
      render(<Select options={testOptions} disabled />)
      expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('forwards required attribute', () => {
      render(<Select options={testOptions} required />)
      expect(screen.getByRole('combobox')).toBeRequired()
    })

    it('forwards aria attributes', () => {
      render(<Select options={testOptions} aria-describedby="help" />)
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-describedby', 'help')
    })
  })

  describe('custom className', () => {
    it('merges custom className with default classes', () => {
      render(<Select options={testOptions} className="custom-select" />)
      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('select')
      expect(select).toHaveClass('custom-select')
    })
  })
})

