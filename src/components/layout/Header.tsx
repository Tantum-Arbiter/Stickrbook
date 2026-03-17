import { ReactNode } from 'react';

export interface HeaderProps {
  /** Logo/title element or text */
  logo?: ReactNode;
  /** Application title */
  title?: string;
  /** Subtitle or tagline */
  subtitle?: string;
  /** Actions area (buttons, menus, etc.) */
  actions?: ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * Application header component with logo, title, and actions area.
 * Uses the extracted CSS from the legacy StickrBook.
 */
export function Header({
  logo,
  title = 'StickrBook',
  subtitle,
  actions,
  className = '',
}: HeaderProps) {
  const headerClassNames = ['header', className].filter(Boolean).join(' ');

  return (
    <header className={headerClassNames}>
      <div className="logo">
        {logo && <span className="logo-icon">{logo}</span>}
        <span className="logo-text">
          {title}
          {subtitle && <span className="logo-subtitle"> - {subtitle}</span>}
        </span>
      </div>

      {actions && <div className="header-actions">{actions}</div>}
    </header>
  );
}

export interface StatusBarProps {
  /** Status items to display on the left */
  leftContent?: ReactNode;
  /** Status items to display on the right */
  rightContent?: ReactNode;
  /** Job status counts */
  jobs?: {
    running?: number;
    completed?: number;
    failed?: number;
  };
  /** Additional class name */
  className?: string;
}

/**
 * Status bar component for showing job status and other information.
 */
export function StatusBar({
  leftContent,
  rightContent,
  jobs,
  className = '',
}: StatusBarProps) {
  const statusBarClassNames = ['status-bar', className].filter(Boolean).join(' ');

  return (
    <div className={statusBarClassNames}>
      <div className="status-jobs">
        {jobs && (
          <>
            {jobs.running !== undefined && jobs.running > 0 && (
              <span>
                <span className="status-dot running" />
                Running: {jobs.running}
              </span>
            )}
            {jobs.completed !== undefined && jobs.completed > 0 && (
              <span>
                <span className="status-dot complete" />
                Completed: {jobs.completed}
              </span>
            )}
            {jobs.failed !== undefined && jobs.failed > 0 && (
              <span>
                <span className="status-dot error" />
                Failed: {jobs.failed}
              </span>
            )}
          </>
        )}
        {leftContent}
      </div>
      {rightContent && <div className="status-info">{rightContent}</div>}
    </div>
  );
}

export default Header;

