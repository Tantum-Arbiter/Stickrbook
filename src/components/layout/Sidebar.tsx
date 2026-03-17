import { useState, useCallback, useRef, ReactNode, MouseEvent } from 'react';
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export interface SidebarSectionProps {
  /** Section ID */
  id: string;
  /** Section title */
  title: string;
  /** Section icon */
  icon?: ReactNode;
  /** Section content */
  children: ReactNode;
  /** Whether the section is collapsed */
  collapsed?: boolean;
  /** Callback when section collapse state changes */
  onToggle?: (collapsed: boolean) => void;
  /** Whether to remove padding from content */
  noPadding?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Collapsible section within the sidebar (dropdown accordion style)
 */
export function SidebarSection({
  id,
  title,
  icon,
  children,
  collapsed = false,
  onToggle,
  noPadding = false,
  className = '',
}: SidebarSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const actualCollapsed = onToggle ? collapsed : isCollapsed;

  const handleToggle = () => {
    if (onToggle) {
      onToggle(!actualCollapsed);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const sectionClassNames = [
    'sidebar-section',
    actualCollapsed && 'collapsed',
    className,
  ].filter(Boolean).join(' ');

  const contentClassNames = [
    'sidebar-section-content',
    noPadding && 'no-padding',
  ].filter(Boolean).join(' ');

  return (
    <div id={id} className={sectionClassNames}>
      <div className="sidebar-section-header" onClick={handleToggle}>
        <h4>
          {icon}
          {title}
        </h4>
        <ChevronDown size={12} className="section-chevron" />
      </div>
      {!actualCollapsed && <div className={contentClassNames}>{children}</div>}
    </div>
  );
}

export interface SidebarProps {
  /** Sidebar title */
  title?: string;
  /** Sidebar icon */
  icon?: ReactNode;
  /** Whether the sidebar is collapsed */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Sidebar content (sections) */
  children: ReactNode;
  /** Whether the sidebar is resizable */
  resizable?: boolean;
  /** Initial width in pixels */
  initialWidth?: number;
  /** Minimum width when resizing */
  minWidth?: number;
  /** Maximum width when resizing */
  maxWidth?: number;
  /** Callback when width changes */
  onWidthChange?: (width: number) => void;
  /** Position of resize handle */
  resizePosition?: 'left' | 'right';
  /** Additional class name */
  className?: string;
}

/**
 * Sidebar component with collapsible sections and optional resizing.
 * Uses the extracted CSS from the legacy storyboard.
 */
export function Sidebar({
  title,
  icon,
  collapsed = false,
  onCollapsedChange,
  children,
  resizable = true,
  initialWidth = 280,
  minWidth = 200,
  maxWidth = 500,
  onWidthChange,
  resizePosition = 'right',
  className = '',
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(collapsed);
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Support both controlled and uncontrolled collapse
  const isCollapsed = onCollapsedChange ? collapsed : internalCollapsed;

  const handleCollapse = useCallback(() => {
    if (onCollapsedChange) {
      onCollapsedChange(!isCollapsed);
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  }, [isCollapsed, internalCollapsed, onCollapsedChange]);

  const handleResizeStart = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const delta = resizePosition === 'right'
        ? moveEvent.clientX - startX
        : startX - moveEvent.clientX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + delta));
      setWidth(newWidth);
      onWidthChange?.(newWidth);
      // Auto-expand if dragging past collapsed width
      if (isCollapsed && newWidth > 60) {
        if (onCollapsedChange) {
          onCollapsedChange(false);
        } else {
          setInternalCollapsed(false);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width, minWidth, maxWidth, onWidthChange, resizePosition, isCollapsed, onCollapsedChange]);

  const sidebarClassNames = [
    'sidebar',
    isCollapsed && 'collapsed',
    isResizing && 'resizing',
    className,
  ].filter(Boolean).join(' ');

  const handleClassNames = [
    'resize-handle',
    `resize-handle-${resizePosition}`,
    isResizing && 'active',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={sidebarRef}
      className={sidebarClassNames}
      style={{ width: isCollapsed ? undefined : width }}
    >
      {title && (
        <div className="sidebar-header">
          <h3>
            {icon}
            <span>{title}</span>
          </h3>
          <button
            className="collapse-btn"
            onClick={handleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      )}

      {!isCollapsed && <div className="sidebar-content">{children}</div>}

      {resizable && (
        <div className={handleClassNames} onMouseDown={handleResizeStart} />
      )}
    </div>
  );
}

export default Sidebar;

