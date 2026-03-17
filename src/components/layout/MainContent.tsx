import { ReactNode } from 'react';

export interface ToolbarProps {
  /** Toolbar content */
  children: ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * Toolbar component for the workspace area
 */
export function Toolbar({ children, className = '' }: ToolbarProps) {
  const toolbarClassNames = ['toolbar', className].filter(Boolean).join(' ');
  return <div className={toolbarClassNames}>{children}</div>;
}

export interface ToolbarGroupProps {
  /** Group content */
  children: ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * Group of toolbar items
 */
export function ToolbarGroup({ children, className = '' }: ToolbarGroupProps) {
  const groupClassNames = ['toolbar-group', className].filter(Boolean).join(' ');
  return <div className={groupClassNames}>{children}</div>;
}

/**
 * Visual separator for toolbar groups
 */
export function ToolbarSeparator() {
  return <div className="toolbar-separator" />;
}

export interface PanelCardProps {
  /** Card title */
  title?: string;
  /** Title icon */
  icon?: ReactNode;
  /** Card content */
  children: ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * Panel card component for grouping content
 */
export function PanelCard({ title, icon, children, className = '' }: PanelCardProps) {
  const cardClassNames = ['panel-card', className].filter(Boolean).join(' ');

  return (
    <div className={cardClassNames}>
      {title && (
        <h3>
          {icon}
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export interface RightPanelProps {
  /** Panel title */
  title?: string;
  /** Header actions */
  headerActions?: ReactNode;
  /** Panel content */
  children: ReactNode;
  /** Whether the panel is visible */
  visible?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Right side panel for effects, properties, etc.
 */
export function RightPanel({
  title,
  headerActions,
  children,
  visible = true,
  className = '',
}: RightPanelProps) {
  if (!visible) return null;

  const panelClassNames = ['right-panel', className].filter(Boolean).join(' ');

  return (
    <div className={panelClassNames}>
      {(title || headerActions) && (
        <div className="right-panel-header">
          {title && <h3>{title}</h3>}
          {headerActions}
        </div>
      )}
      <div className="right-panel-content">{children}</div>
    </div>
  );
}

export interface WorkspaceProps {
  /** Toolbar content */
  toolbar?: ReactNode;
  /** Main workspace content */
  children: ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * Main workspace area that contains the canvas and panels
 */
export function Workspace({ toolbar, children, className = '' }: WorkspaceProps) {
  const workspaceClassNames = ['workspace', className].filter(Boolean).join(' ');

  return (
    <div className={workspaceClassNames}>
      {toolbar}
      <div className="content">{children}</div>
    </div>
  );
}

export interface MainContentProps {
  /** Content to render */
  children: ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * Main content container that holds the workspace and any side panels
 */
export function MainContent({ children, className = '' }: MainContentProps) {
  const mainClassNames = ['main-container', className].filter(Boolean).join(' ');
  return <div className={mainClassNames}>{children}</div>;
}

export default MainContent;

