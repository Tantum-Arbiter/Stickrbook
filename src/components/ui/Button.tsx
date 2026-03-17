import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'small' | 'default' | 'large';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Whether the button should take full width */
  block?: boolean;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Whether this is an icon-only button */
  iconOnly?: boolean;
  /** Icon to display before the label */
  leftIcon?: ReactNode;
  /** Icon to display after the label */
  rightIcon?: ReactNode;
  /** Button content */
  children?: ReactNode;
}

/**
 * Button component with multiple variants and sizes.
 * Uses the extracted CSS from the legacy storyboard.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'default',
      block = false,
      loading = false,
      iconOnly = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const classNames = [
      'button',
      variant !== 'primary' && `button--${variant}`,
      size !== 'default' && `button--${size}`,
      block && 'button--block',
      loading && 'button--loading',
      iconOnly && 'button--icon',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classNames}
        disabled={disabled || loading}
        {...props}
      >
        {leftIcon && !loading && <span className="button-icon">{leftIcon}</span>}
        {children}
        {rightIcon && !loading && <span className="button-icon">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

