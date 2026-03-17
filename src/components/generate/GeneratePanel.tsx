/**
 * GeneratePanel Component
 *
 * Main container composing all generate mode components:
 * - PromptInput (left sidebar content)
 * - VariationsGrid (main workspace)
 * - GenerationControls (collapsible panel)
 * - JobQueue (status bar integration)
 */

import { useState } from 'react';
import { PromptInput } from './PromptInput';
import { VariationsGrid } from './VariationsGrid';
import { GenerationControls } from './GenerationControls';
import { useGenerationStore, useProjectsStore, useToast, useEditorStore, useUIStore } from '../../store';
import { Button } from '../ui/Button';
import type { Variation } from '../../store/types';

export interface GeneratePanelProps {
  className?: string;
}

export function GeneratePanel({ className = '' }: GeneratePanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { variations, selectedVariationId, saveVariation } = useGenerationStore();
  // Fix reactivity: depend on currentBookId
  const currentBookId = useProjectsStore((s) => s.currentBookId);
  const currentBook = useProjectsStore((s) => {
    const project = s.currentProject();
    return project?.books.find((b) => b.id === currentBookId);
  });
  const setBaseImage = useEditorStore((s) => s.setBaseImage);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const toast = useToast();

  const selectedVariation = variations.find((v) => v.id === selectedVariationId);

  const handleSaveVariation = async (variation: Variation) => {
    if (!currentBook) {
      toast.warning('Please select a book first');
      return;
    }

    try {
      const asset = await saveVariation(variation.id);
      toast.success(`Saved as asset: ${asset.name}`);
    } catch (error) {
      toast.error('Failed to save variation');
    }
  };

  const handleUseVariation = async (variation: Variation) => {
    if (!currentBook) {
      toast.warning('Please select a book first');
      return;
    }

    // Load the variation image into the editor as the base image
    setBaseImage(variation.imagePath);
    // Switch to the Edit tab
    setActiveTab('edit');
    toast.success('Image loaded into editor');
  };

  return (
    <div className={`generate-panel ${className}`}>
      {/* Main Content Area */}
      <div className="generate-content">
        {/* Variations Grid - Main Workspace */}
        <div className="generate-workspace">
          <VariationsGrid
            onSelect={handleUseVariation}
            onSave={handleSaveVariation}
          />
        </div>

        {/* Right Panel - Controls */}
        <div className="generate-controls-panel">
          <div className="panel-section">
            <PromptInput />
          </div>

          <div className="panel-section collapsible">
            <button
              className="section-header"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span>Advanced Settings</span>
              <span className={`chevron ${showAdvanced ? 'open' : ''}`}>▼</span>
            </button>
            {showAdvanced && (
              <div className="section-content">
                <GenerationControls />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * GenerateSidebar Component
 *
 * Content for the left sidebar when in Generate mode.
 * Shows prompt input and quick presets.
 */
export function GenerateSidebar({ className = '' }: { className?: string }) {
  return (
    <div className={`generate-sidebar ${className}`}>
      <PromptInput />
      <GenerationControls compact />
    </div>
  );
}

/**
 * GenerateToolbar Component
 *
 * Toolbar content for Generate mode.
 */
export function GenerateToolbar({ className = '' }: { className?: string }) {
  const { isGenerating, clearVariations, variations } = useGenerationStore();

  return (
    <div className={`generate-toolbar ${className}`}>
      <Button
        size="small"
        variant="ghost"
        onClick={clearVariations}
        disabled={isGenerating || variations.length === 0}
      >
        🗑️ Clear
      </Button>
    </div>
  );
}

