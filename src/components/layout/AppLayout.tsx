import { ReactNode } from 'react';
import { Header, HeaderProps, StatusBar, StatusBarProps } from './Header';
import { Sidebar, SidebarProps } from './Sidebar';
import { MainContent } from './MainContent';

export interface AppLayoutProps {
  /** Header configuration */
  header?: HeaderProps;
  /** Status bar configuration */
  statusBar?: StatusBarProps;
  /** Left sidebar configuration */
  leftSidebar?: SidebarProps;
  /** Right sidebar configuration */
  rightSidebar?: SidebarProps;
  /** Main content area */
  children: ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * Root application layout that composes Header, Sidebar(s), and MainContent.
 * Provides the standard three-column layout with header and optional status bar.
 *
 * Layout Structure:
 * ```
 * ┌─────────────────────────────────────────────────────┐
 * │                      Header                         │
 * ├──────────┬────────────────────────────┬─────────────┤
 * │          │                            │             │
 * │   Left   │        MainContent         │    Right    │
 * │  Sidebar │                            │   Sidebar   │
 * │          │                            │             │
 * ├──────────┴────────────────────────────┴─────────────┤
 * │                    Status Bar                       │
 * └─────────────────────────────────────────────────────┘
 * ```
 */
export function AppLayout({
  header,
  statusBar,
  leftSidebar,
  rightSidebar,
  children,
  className = '',
}: AppLayoutProps) {
  const appClassNames = ['app-layout', className].filter(Boolean).join(' ');

  return (
    <div className={appClassNames}>
      {/* Header */}
      {header && <Header {...header} />}

      {/* Main container with sidebars */}
      <MainContent>
        {/* Left Sidebar */}
        {leftSidebar && <Sidebar {...leftSidebar} resizePosition="right" />}

        {/* Workspace/Content Area */}
        <div className="workspace">{children}</div>

        {/* Right Sidebar */}
        {rightSidebar && <Sidebar {...rightSidebar} resizePosition="left" />}
      </MainContent>

      {/* Status Bar */}
      {statusBar && <StatusBar {...statusBar} />}
    </div>
  );
}

export default AppLayout;

