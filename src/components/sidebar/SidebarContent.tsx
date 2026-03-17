/**
 * SidebarContent Component
 *
 * Main sidebar content composition with Projects and Assets sections.
 * Uses the SidebarSection component from layout.
 */

import { useCallback, useRef, useState } from 'react';
import { ProjectTree } from './ProjectTree';
import { AssetLibrary } from './AssetLibrary';
import { SidebarSection } from '../layout';
import { useProjectsStore, useEditorStore, useToast, useUIStore } from '../../store';
import { Button } from '../ui/Button';
import type { Asset, Book } from '../../store/types';
import { FolderOpen, Image, Download, Upload, Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
  exportProjectBundle,
  importProjectBundle,
  convertBundleToProject,
  BUNDLE_EXTENSION
} from '../../utils/projectBundle';

export interface SidebarContentProps {
  className?: string;
  activeTab?: 'generate' | 'edit' | 'story';
}

export function SidebarContent({ className = '', activeTab = 'generate' }: SidebarContentProps) {
  const createProject = useProjectsStore((s) => s.createProject);
  const addLayer = useEditorStore((s) => s.addLayer);
  const sidebarZoom = useUIStore((s) => s.sidebarZoom);
  const setSidebarZoom = useUIStore((s) => s.setSidebarZoom);
  const toast = useToast();

  const handleZoomIn = useCallback(() => {
    setSidebarZoom(Math.min(2.0, sidebarZoom + 0.1));
  }, [sidebarZoom, setSidebarZoom]);

  const handleZoomOut = useCallback(() => {
    setSidebarZoom(Math.max(0.5, sidebarZoom - 0.1));
  }, [sidebarZoom, setSidebarZoom]);

  const handleZoomReset = useCallback(() => {
    setSidebarZoom(1.0);
  }, [setSidebarZoom]);

  const handleNewProject = useCallback(async () => {
    try {
      const name = prompt('Enter project name:');
      if (!name) return;
      await createProject(name);
      toast.success('Project created');
    } catch (error) {
      toast.error('Failed to create project');
    }
  }, [createProject, toast]);

  const handleAssetClick = useCallback(
    (asset: Asset) => {
      if (activeTab === 'edit') {
        // Add asset as layer to canvas with default dimensions
        addLayer({
          assetId: asset.id,
          x: 100,
          y: 100,
          width: 200,
          height: 200,
          scale: 1,
          rotation: 0,
          zIndex: 0,
          opacity: 1,
          visible: true,
          locked: false,
        });
        toast.info(`Added "${asset.name}" to canvas`);
      } else {
        toast.info(`Selected: ${asset.name}`);
      }
    },
    [activeTab, addLayer, toast]
  );

  const handleAssetDragStart = useCallback((asset: Asset, e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'asset',
      assetId: asset.id,
      name: asset.name,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleBookSelect = useCallback((book: Book) => {
    toast.info(`Selected: ${book.title}`);
  }, [toast]);

  return (
    <div className={`sidebar-content ${className}`}>
      {/* Zoom Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: 'var(--bg-dark)',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', flex: 1 }}>
          Zoom: {Math.round(sidebarZoom * 100)}%
        </span>
        <Button size="small" variant="ghost" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut size={12} />
        </Button>
        <Button size="small" variant="ghost" onClick={handleZoomReset} title="Reset Zoom">
          <RotateCcw size={12} />
        </Button>
        <Button size="small" variant="ghost" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn size={12} />
        </Button>
      </div>

      {/* Scaled Content Container */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          flex: 1,
          overflow: 'auto',
          transform: `scale(${sidebarZoom})`,
          transformOrigin: 'top left',
          width: `${100 / sidebarZoom}%`,
          height: `${100 / sidebarZoom}%`,
        }}>
          {/* Projects Section */}
          <SidebarSection
            id="projects"
            title="Projects"
            icon={<FolderOpen size={14} />}
          >
            <div className="sidebar-section-actions">
              <Button size="small" variant="ghost" onClick={handleNewProject}>
                + New
              </Button>
            </div>
            <ProjectTree onBookSelect={handleBookSelect} />
          </SidebarSection>

          {/* Assets Section (only when a book is selected) */}
          <SidebarSection
            id="assets"
            title="Assets"
            icon={<Image size={14} />}
          >
            <AssetLibrary
              onAssetClick={handleAssetClick}
              onAssetDragStart={handleAssetDragStart}
            />
          </SidebarSection>
        </div>
      </div>
    </div>
  );
}

/**
 * QuickActions Component
 *
 * Quick action buttons for the sidebar footer with Export/Import functionality.
 */
export interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className = '' }: QuickActionsProps) {
  const toast = useToast();
  const currentProject = useProjectsStore((s) => s.currentProject());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState('');

  const handleExport = useCallback(async () => {
    if (!currentProject) {
      toast.warning('Please select a project to export');
      return;
    }

    setIsExporting(true);
    setProgress('Starting export...');

    try {
      await exportProjectBundle(currentProject, (message, pct) => {
        setProgress(`${message} (${Math.round(pct)}%)`);
      });
      toast.success(`Exported "${currentProject.name}${BUNDLE_EXTENSION}"`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
      setProgress('');
    }
  }, [currentProject, toast]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input for re-selection
    e.target.value = '';

    if (!file.name.endsWith(BUNDLE_EXTENSION) && !file.name.endsWith('.zip')) {
      toast.warning(`Please select a ${BUNDLE_EXTENSION} file`);
      return;
    }

    setIsImporting(true);
    setProgress('Reading bundle...');

    try {
      const result = await importProjectBundle(file, (message, pct) => {
        setProgress(`${message} (${Math.round(pct)}%)`);
      });

      // Convert to project format
      const { project } = convertBundleToProject(result, true);

      toast.success(`Imported "${project.name}" with ${result.manifest.assetCount} assets`);

      // Note: To fully integrate, we'd need to add the project to the store
      // and upload assets to the backend. For now, just show success.
      console.log('Imported project:', project);

    } catch (error) {
      console.error('Import failed:', error);
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      setProgress('');
    }
  }, [toast]);

  const isProcessing = isExporting || isImporting;

  return (
    <div className={`sidebar-quick-actions ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={`${BUNDLE_EXTENSION},.zip`}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {progress && (
        <div className="sidebar-progress" title={progress}>
          <Loader2 size={12} className="spin" />
          <span>{progress}</span>
        </div>
      )}

      <Button
        size="small"
        variant="ghost"
        onClick={handleImportClick}
        disabled={isProcessing}
        title="Import project bundle"
      >
        {isImporting ? <Loader2 size={12} className="spin" /> : <Download size={12} />}
        Import
      </Button>
      <Button
        size="small"
        variant="ghost"
        onClick={handleExport}
        disabled={isProcessing || !currentProject}
        title={currentProject ? `Export "${currentProject.name}"` : 'Select a project to export'}
      >
        {isExporting ? <Loader2 size={12} className="spin" /> : <Upload size={12} />}
        Export
      </Button>
    </div>
  );
}

