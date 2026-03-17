import { useState, ReactNode, ReactElement, Children, isValidElement } from 'react';

export type TabsVariant = 'default' | 'vertical' | 'compact';

export interface TabProps {
  /** Unique identifier for the tab */
  id: string;
  /** Tab label */
  label: ReactNode;
  /** Icon to show before the label */
  icon?: ReactNode;
  /** Tab content */
  children: ReactNode;
  /** Whether the tab is disabled */
  disabled?: boolean;
}

export interface TabsProps {
  /** Currently active tab id (controlled mode) */
  activeTab?: string;
  /** Default active tab id (uncontrolled mode) */
  defaultTab?: string;
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void;
  /** Visual variant */
  variant?: TabsVariant;
  /** Tab components - can be single or multiple */
  children: ReactElement<TabProps> | ReactElement<TabProps>[];
  /** Additional class name */
  className?: string;
}

/**
 * Individual Tab component - used as children of Tabs
 */
export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

/**
 * Tabs container component with controlled/uncontrolled modes.
 * Uses the extracted CSS from the legacy storyboard.
 */
export function Tabs({
  activeTab: controlledActiveTab,
  defaultTab,
  onTabChange,
  variant = 'default',
  children,
  className = '',
}: TabsProps) {
  // Get first tab id as fallback default
  const firstTabId = Children.toArray(children).find(
    (child): child is ReactElement<TabProps> => isValidElement(child)
  )?.props.id;

  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || firstTabId || '');

  const activeTabId = controlledActiveTab ?? internalActiveTab;

  const handleTabClick = (tabId: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  const tabsClassNames = [
    'tabs',
    variant !== 'default' && `tabs--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Extract tab data from children
  const tabs = Children.toArray(children).filter(
    (child): child is ReactElement<TabProps> => isValidElement(child)
  );

  return (
    <div>
      {/* Tab buttons */}
      <div className={tabsClassNames} role="tablist">
        {tabs.map((tab) => {
          const { id, label, icon, disabled } = tab.props;
          const isActive = activeTabId === id;

          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${id}`}
              className={`tab ${isActive ? 'active' : ''}`}
              onClick={() => !disabled && handleTabClick(id)}
              disabled={disabled}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      {tabs.map((tab) => {
        const { id, children: tabContent } = tab.props;
        const isActive = activeTabId === id;

        return (
          <div
            key={id}
            id={`tabpanel-${id}`}
            role="tabpanel"
            aria-labelledby={id}
            className={`tab-panel ${isActive ? 'active' : ''}`}
          >
            {isActive && tabContent}
          </div>
        );
      })}
    </div>
  );
}

export default Tabs;

