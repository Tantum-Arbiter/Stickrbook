import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

export type InputSize = 'small' | 'default' | 'large';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Size of the input */
  inputSize?: InputSize;
  /** Label text */
  label?: string;
  /** Helper text shown below the input */
  helperText?: string;
  /** Error message (also sets error state) */
  error?: string;
  /** Icon to display at the start of the input */
  leftIcon?: ReactNode;
  /** Icon to display at the end of the input */
  rightIcon?: ReactNode;
}

/**
 * Input component with label support and variants.
 * Uses the extracted CSS from the legacy storyboard.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      inputSize = 'default',
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const inputClassNames = [
      'input',
      inputSize !== 'default' && `input--${inputSize}`,
      error && 'input--error',
      leftIcon && 'input--with-left-icon',
      rightIcon && 'input--with-right-icon',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const inputElement = (
      <div className="input-wrapper">
        {leftIcon && <span className="input-icon input-icon--left">{leftIcon}</span>}
        <input ref={ref} id={inputId} className={inputClassNames} {...props} />
        {rightIcon && <span className="input-icon input-icon--right">{rightIcon}</span>}
      </div>
    );

    if (label || helperText || error) {
      return (
        <div className="form-group">
          {label && <label htmlFor={inputId}>{label}</label>}
          {inputElement}
          {(error || helperText) && (
            <span className={`input-helper ${error ? 'input-helper--error' : ''}`}>
              {error || helperText}
            </span>
          )}
        </div>
      );
    }

    return inputElement;
  }
);

Input.displayName = 'Input';

export default Input;

