import { forwardRef, TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label text */
  label?: string;
  /** Helper text shown below the textarea */
  helperText?: string;
  /** Error message (also sets error state) */
  error?: string;
  /** Whether the textarea can be resized */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

/**
 * Textarea component with label support and validation.
 * Uses the extracted CSS from the legacy storyboard.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      resize = 'vertical',
      className = '',
      id,
      style,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    const textareaClassNames = [
      'textarea',
      error && 'textarea--error',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const textareaStyle = {
      ...style,
      resize: resize,
    };

    const textareaElement = (
      <textarea
        ref={ref}
        id={textareaId}
        className={textareaClassNames}
        style={textareaStyle}
        {...props}
      />
    );

    if (label || helperText || error) {
      return (
        <div className="form-group">
          {label && <label htmlFor={textareaId}>{label}</label>}
          {textareaElement}
          {(error || helperText) && (
            <span className={`input-helper ${error ? 'input-helper--error' : ''}`}>
              {error || helperText}
            </span>
          )}
        </div>
      );
    }

    return textareaElement;
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;

