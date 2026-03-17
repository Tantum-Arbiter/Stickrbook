import { useCallback, useEffect } from 'react';
import {
  AppLayout,
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from './components/layout';
import { Button, Tabs, Tab } from './components/ui';
import { ToastProvider } from './components/ui/Toast';
import { Palette, FolderOpen } from 'lucide-react';

// Domain components
import { GeneratePanel, JobStatusIcon } from './components/generate';
import { EditPanel } from './components/editor';
import { StoryPanel } from './components/story';
import { SidebarContent } from './components/sidebar';

// State management
import { useUIStore, useGenerationStore, useHistory, useProjects } from './store';

/**
 * Main application component for StickrBook.
 * Uses the AppLayout with sidebars for project tree/assets
 * and main workspace for generation/editing.
 */
function App() {
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const { canUndo, canRedo, undo, redo } = useHistory();
  const { loadProjects } = useProjects();

  // Job tracking from generation store
  const completedJobs = useGenerationStore((s) => s.jobHistory.length);
  const runningJobs = useGenerationStore((s) =>
    s.activeJobs.filter((j) => j.status === 'running' || j.status === 'pending' || j.status === 'generating').length
  );

  // Load projects on app mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId as 'generate' | 'edit' | 'story');
  }, [setActiveTab]);

  return (
    <ToastProvider>
      <AppLayout
        header={{
          title: 'StickrBook',
          subtitle: 'Grow with Freya',
          logo: <Palette size={24} />,
          actions: (
            <>
              <JobStatusIcon />
              <Button variant="ghost" size="small">
                Settings
              </Button>
              <Button variant="primary" size="small">
                Export
              </Button>
            </>
          ),
        }}
        leftSidebar={{
          title: 'Projects',
          icon: <FolderOpen size={16} />,
          initialWidth: 280,
          children: <SidebarContent activeTab={activeTab} />,
        }}
        statusBar={{
          jobs: { running: runningJobs, completed: completedJobs },
          rightContent: <span>{runningJobs > 0 ? 'Processing...' : 'Ready'}</span>,
        }}
      >
        {/* Toolbar */}
        <Toolbar>
          <ToolbarGroup>
            <Tabs activeTab={activeTab} onTabChange={handleTabChange}>
              <Tab id="generate" label="Generate">Generate</Tab>
              <Tab id="edit" label="Edit">Edit</Tab>
              <Tab id="story" label="Story">Story</Tab>
            </Tabs>
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup>
            <Button
              variant="ghost"
              size="small"
              onClick={undo}
              disabled={!canUndo}
            >
              ↶ Undo
            </Button>
            <Button
              variant="ghost"
              size="small"
              onClick={redo}
              disabled={!canRedo}
            >
              Redo ↷
            </Button>
          </ToolbarGroup>
        </Toolbar>

        {/* Main Content Area - Tab-based */}
        {activeTab === 'generate' && <GeneratePanel />}
        {activeTab === 'edit' && <EditPanel />}
        {activeTab === 'story' && <StoryPanel />}
      </AppLayout>
    </ToastProvider>
  );
}

export default App;

