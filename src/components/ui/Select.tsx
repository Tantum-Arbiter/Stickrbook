import { forwardRef, SelectHTMLAttributes, ReactNode } from 'react';

export type SelectSize = 'small' | 'default' | 'large';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Size of the select */
  selectSize?: SelectSize;
  /** Label text */
  label?: string;
  /** Helper text shown below the select */
  helperText?: string;
  /** Error message (also sets error state) */
  error?: string;
  /** Options to display */
  options?: SelectOption[];
  /** Placeholder option */
  placeholder?: string;
  /** Children can be used instead of options prop */
  children?: ReactNode;
}

/**
 * Select component with label support and variants.
 * Uses the extracted CSS from the legacy storyboard.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      selectSize = 'default',
      label,
      helperText,
      error,
      options,
      placeholder,
      children,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    const selectClassNames = [
      'select',
      selectSize !== 'default' && `select--${selectSize}`,
      error && 'select--error',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const selectElement = (
      <select ref={ref} id={selectId} className={selectClassNames} {...props}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))
          : children}
      </select>
    );

    if (label || helperText || error) {
      return (
        <div className="form-group">
          {label && <label htmlFor={selectId}>{label}</label>}
          {selectElement}
          {(error || helperText) && (
            <span className={`input-helper ${error ? 'input-helper--error' : ''}`}>
              {error || helperText}
            </span>
          )}
        </div>
      );
    }

    return selectElement;
  }
);

Select.displayName = 'Select';

export default Select;

