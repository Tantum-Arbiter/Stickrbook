/**
 * VariationsGrid Component
 *
 * Dynamic grid displaying generated variations with selection and actions.
 * Supports responsive layout, scrolling, and compare mode.
 */

import { useState } from 'react';
import { useGenerationStore, useUIStore, useProjectsStore } from '../../store';
import { Button } from '../ui/Button';
import { CompareModal } from './CompareModal';
import { useToast } from '../ui/Toast';
import { GitCompare, Sparkles, Zap, Maximize2, RefreshCw, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import type { Variation, GenerationJob } from '../../store/types';
import { generationApi } from '../../api/endpoints';

export interface VariationsGridProps {
  className?: string;
  onSelect?: (variation: Variation) => void;
  onSave?: (variation: Variation) => void;
  onEnlarge?: (variation: Variation) => void;
}

export function VariationsGrid({
  className = '',
  onSelect,
  onSave,
  onEnlarge,
}: VariationsGridProps) {
  const {
    variations,
    selectedVariationId,
    activeJobs,
    variationCount,
    compareMode,
    compareSelection,
    selectVariation,
    saveVariation,
    toggleCompareMode,
    toggleCompareSelection,
    clearCompareSelection,
    clearVariations,
  } = useGenerationStore();
  const toast = useToast();

  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const activeTab = useUIStore((s) => s.activeTab);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [collapsedBatches, setCollapsedBatches] = useState<Set<string>>(new Set());

  // Create slots based on actual content - only show slots for variations or active jobs
  // Don't create empty slots based on variationCount alone
  const totalSlots = Math.max(variations.length, activeJobs.length);
  const slots = Array.from({ length: totalSlots }, (_, index) => {
    const variation = variations[index];
    const job = activeJobs[index];
    return { index, variation, job };
  });

  // Determine grid columns based on number of items - more compact layout
  const getGridColumns = () => {
    if (totalSlots === 1) return 1;
    if (totalSlots === 2) return 2;
    if (totalSlots === 3) return 3;
    if (totalSlots <= 6) return 3;
    if (totalSlots <= 9) return 3;
    return 4;
  };

  const handleSelect = (variation: Variation) => {
    if (compareMode) {
      toggleCompareSelection(variation.id);
    } else {
      // If not on Generate tab, switch to it when selecting a variation
      if (activeTab !== 'generate') {
        setActiveTab('generate');
      }
      selectVariation(variation.id);
      onSelect?.(variation);
    }
  };

  const handleSave = async (variation: Variation) => {
    try {
      await saveVariation(variation.id);
      // Don't call onSave callback - it would trigger a duplicate save
      // The saveVariation function already handles the save operation
    } catch (error) {
      console.error('Failed to save variation:', error);
    }
  };

  const handleEnlarge = (variation: Variation) => {
    setPreviewImage(variation.imagePath);
    onEnlarge?.(variation);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  const toggleBatchCollapse = (batchKey: string) => {
    setCollapsedBatches(prev => {
      const next = new Set(prev);
      if (next.has(batchKey)) {
        next.delete(batchKey);
      } else {
        next.add(batchKey);
      }
      return next;
    });
  };

  const handleCompare = () => {
    if (compareSelection.length > 0) {
      setShowCompareModal(true);
    }
  };

  const handleCloseCompare = () => {
    setShowCompareModal(false);
    clearCompareSelection();
  };

  // Midjourney-style variation actions
  const handleVarySubtle = async (variation: Variation) => {
    const currentBook = useProjectsStore.getState().currentBook();
    if (!currentBook) {
      toast.error('No book selected');
      return;
    }

    try {
      toast.info('Creating subtle variations...');
      await generationApi.submitVariations(currentBook.id, {
        prompt: variation.prompt,
        negative_prompt: variation.negativePrompt || '',
        base_seed: variation.seed,
        num_variations: 4,
        generation_mode: 'scene',
      });
      toast.success('Subtle variations queued!');
    } catch (error) {
      console.error('Failed to create subtle variations:', error);
      toast.error('Failed to create variations');
    }
  };

  const handleVaryStrong = async (variation: Variation) => {
    const currentBook = useProjectsStore.getState().currentBook();
    if (!currentBook) {
      toast.error('No book selected');
      return;
    }

    try {
      toast.info('Creating strong variations...');
      // Use a different seed range for stronger variations
      const newSeed = variation.seed + 1000;
      await generationApi.submitVariations(currentBook.id, {
        prompt: variation.prompt,
        negative_prompt: variation.negativePrompt || '',
        base_seed: newSeed,
        num_variations: 4,
        generation_mode: 'scene',
      });
      toast.success('Strong variations queued!');
    } catch (error) {
      console.error('Failed to create strong variations:', error);
      toast.error('Failed to create variations');
    }
  };

  const handleRegenerate = async (variation: Variation) => {
    const currentBook = useProjectsStore.getState().currentBook();
    if (!currentBook) {
      toast.error('No book selected');
      return;
    }

    try {
      toast.info('Regenerating with same seed...');
      await generationApi.submitVariations(currentBook.id, {
        prompt: variation.prompt,
        negative_prompt: variation.negativePrompt || '',
        base_seed: variation.seed,
        num_variations: 1,
        generation_mode: 'scene',
      });
      toast.success('Regeneration queued!');
    } catch (error) {
      console.error('Failed to regenerate:', error);
      toast.error('Failed to regenerate');
    }
  };

  const compareVariations = variations.filter(v => compareSelection.includes(v.id));

  return (
    <>
      {/* Compare Mode Controls & Clear Button */}
      {variations.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
          alignItems: 'center',
          padding: '8px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-sm)',
        }}>
          {variations.length > 1 && (
            <Button
              size="small"
              variant={compareMode ? 'primary' : 'secondary'}
              onClick={toggleCompareMode}
            >
              <GitCompare size={16} />
              {compareMode ? 'Exit Compare' : 'Compare Mode'}
            </Button>
          )}
          {compareMode && (
            <>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Select up to 4 variations to compare ({compareSelection.length}/4)
              </span>
              {compareSelection.length > 0 && (
                <Button
                  size="small"
                  variant="primary"
                  onClick={handleCompare}
                >
                  Compare {compareSelection.length} Selected
                </Button>
              )}
            </>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <Button
              size="small"
              variant="secondary"
              onClick={() => {
                if (window.confirm('Clear all generated variations? (Saved assets will not be affected)')) {
                  clearVariations();
                }
              }}
              title="Clear all generated variations"
            >
              <Trash2 size={16} />
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Variations Grid - Grouped by Batch Name, then Pose/Angle, or Flat */}
      {(() => {
        // Check if we should group by batch name or pose/angle
        const hasBatchNames = variations.some(v => v.batchName) || activeJobs.some(j => j.batchName);
        const hasMultiView = variations.some(v => v.pose || v.viewAngle);

        if (hasBatchNames || hasMultiView) {
          // Group variations by batch name first, then by pose/angle
          const groups = new Map<string, typeof slots>();

          slots.forEach(slot => {
            const { variation, job } = slot;
            const batchName = variation?.batchName || job?.batchName;
            const pose = variation?.pose;
            const viewAngle = variation?.viewAngle;

            // Create a hierarchical key: batchName_pose_viewAngle
            let key: string;
            if (batchName) {
              // If has batch name, use it as primary grouping
              if (pose || viewAngle) {
                key = `${batchName}_${pose || 'none'}_${viewAngle || 'none'}`;
              } else {
                key = batchName;
              }
            } else if (pose || viewAngle) {
              // If no batch name but has pose/angle, group by that
              key = `${pose || 'none'}_${viewAngle || 'none'}`;
            } else {
              // No grouping metadata - use a default key
              key = 'ungrouped';
            }

            if (!groups.has(key)) {
              groups.set(key, []);
            }
            groups.get(key)!.push(slot);
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', padding: '4px' }}>
              {Array.from(groups.entries()).map(([key, groupSlots]) => {
                const firstVariation = groupSlots.find(s => s.variation)?.variation;
                const firstJob = groupSlots.find(s => s.job)?.job;
                const batchName = firstVariation?.batchName || firstJob?.batchName;
                const isCollapsed = collapsedBatches.has(key);

                // Determine label - use job metadata if no variations yet
                let label: string;
                if (batchName) {
                  if (firstVariation?.pose || firstVariation?.viewAngle) {
                    label = `${batchName} - ${firstVariation.poseLabel || firstVariation.pose || ''} ${firstVariation.viewAngleLabel || firstVariation.viewAngle || ''}`.trim();
                  } else {
                    label = batchName;
                  }
                } else if (firstVariation?.pose || firstVariation?.viewAngle) {
                  label = `${firstVariation.poseLabel || firstVariation.pose || ''} ${firstVariation.viewAngleLabel || firstVariation.viewAngle || ''}`.trim();
                } else if (firstJob) {
                  // Use job type as label if no other metadata
                  const jobTypeLabel = firstJob.jobType === 'character' ? 'Characters' :
                                      firstJob.jobType === 'object' ? 'Objects' :
                                      firstJob.jobType === 'scene' ? 'Scenes' : 'Generating';
                  label = jobTypeLabel;
                } else {
                  label = 'Generating...';
                }

                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div
                      onClick={() => toggleBatchCollapse(key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                      <h3 style={{
                        fontSize: 'calc(var(--font-size-md) * 1.1)',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        margin: 0,
                      }}>
                        {label} ({groupSlots.length})
                      </h3>
                    </div>
                    {!isCollapsed && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${Math.min(groupSlots.length, 4)}, 1fr)`,
                          gap: '16px',
                          paddingLeft: '26px', // Indent content under the header
                        }}
                      >
                        {groupSlots.map(({ index, variation, job }) => (
                          <VariationCard
                            key={index}
                            index={index}
                            variation={variation}
                            job={job}
                            isSelected={variation?.id === selectedVariationId}
                            isCompareSelected={variation ? compareSelection.includes(variation.id) : false}
                            compareMode={compareMode}
                            onSelect={handleSelect}
                            onSave={handleSave}
                            onEnlarge={handleEnlarge}
                            onVarySubtle={handleVarySubtle}
                            onVaryStrong={handleVaryStrong}
                            onRegenerate={handleRegenerate}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        } else {
          // Standard flat grid for single-view generations
          return (
            <div
              className={`variation-grid ${className}`}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`,
                gap: totalSlots <= 3 ? '20px' : '16px',
                maxHeight: 'calc(100vh - 300px)',
                overflowY: totalSlots > 9 ? 'auto' : 'visible',
                padding: '4px',
                justifyContent: 'center',
                alignItems: 'start',
              }}
            >
              {slots.map(({ index, variation, job }) => (
                <VariationCard
                  key={index}
                  index={index}
                  variation={variation}
                  job={job}
                  isSelected={variation?.id === selectedVariationId}
                  isCompareSelected={variation ? compareSelection.includes(variation.id) : false}
                  compareMode={compareMode}
                  onSelect={handleSelect}
                  onSave={handleSave}
                  onEnlarge={handleEnlarge}
                  onVarySubtle={handleVarySubtle}
                  onVaryStrong={handleVaryStrong}
                  onRegenerate={handleRegenerate}
                />
              ))}
            </div>
          );
        }
      })()}

      {/* Image Preview Overlay */}
      {previewImage && (
        <div
          className="image-preview-overlay active"
          onClick={closePreview}
        >
          <img src={previewImage} alt="Preview" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <CompareModal
          variations={compareVariations}
          onClose={handleCloseCompare}
        />
      )}
    </>
  );
}

// Individual variation card
interface VariationCardProps {
  index: number;
  variation?: Variation;
  job?: GenerationJob;
  isSelected: boolean;
  isCompareSelected: boolean;
  compareMode: boolean;
  onSelect: (variation: Variation) => void;
  onSave: (variation: Variation) => void;
  onEnlarge: (variation: Variation) => void;
  onVarySubtle: (variation: Variation) => void;
  onVaryStrong: (variation: Variation) => void;
  onRegenerate: (variation: Variation) => void;
}

function VariationCard({
  index,
  variation,
  job,
  isSelected,
  isCompareSelected,
  compareMode,
  onSelect,
  onSave,
  onEnlarge,
  onVarySubtle,
  onVaryStrong,
  onRegenerate,
}: VariationCardProps) {
  // Show loading state if job is active
  if (job && !variation) {
    const isFailed = job.status === 'failed' || job.status === 'error';
    return (
      <div className="variation-card">
        <div
          className={`variation-placeholder ${job.status === 'generating' ? 'loading' : ''}`}
          style={{
            border: isFailed ? '2px solid #ef4444' : undefined,
            background: isFailed ? 'rgba(239, 68, 68, 0.1)' : undefined,
          }}
        >
          <span className="placeholder-number">{index + 1}</span>
          <span className="placeholder-status" style={{ color: isFailed ? '#ef4444' : undefined }}>
            {isFailed ? 'Failed' : job.status === 'pending' ? 'Queued' : 'Generating'}
          </span>
          {job.progress > 0 && !isFailed && (
            <span className="placeholder-progress">{Math.round(job.progress * 100)}%</span>
          )}
          {isFailed && job.error && (
            <span className="placeholder-error" style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>
              {job.error}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Show placeholder if no variation
  if (!variation) {
    return (
      <div className="variation-card">
        <div className="variation-placeholder">
          <span className="placeholder-number">{index + 1}</span>
          <span className="placeholder-status">Empty</span>
        </div>
      </div>
    );
  }

  // Show variation
  return (
    <div
      className={`variation-card ${isSelected ? 'selected' : ''} ${isCompareSelected ? 'compare-selected' : ''}`}
      style={{
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      {/* Compare Mode Checkbox */}
      {compareMode && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            zIndex: 10,
            background: 'var(--bg-card)',
            borderRadius: '4px',
            padding: '4px',
            border: '2px solid var(--border)',
          }}
        >
          <input
            type="checkbox"
            checked={isCompareSelected}
            onChange={() => onSelect(variation)}
            onClick={(e) => e.stopPropagation()}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
        </div>
      )}

      {/* Clicking image shows preview */}
      <img
        src={variation.imagePath}
        alt={`Variation ${index + 1}`}
        onClick={() => compareMode ? onSelect(variation) : onEnlarge(variation)}
      />

      <span className="seed-badge">Seed: {variation.seed}</span>

      {!compareMode && (
        <>
          {/* Primary action - Save */}
          <div className="variation-actions" style={{ marginBottom: '4px' }}>
            <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); onSave(variation); }}>
              💾 Save
            </Button>
          </div>

          {/* Midjourney-style variation actions */}
          <div className="variation-actions-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            padding: '0 8px 8px 8px',
          }}>
            <Button
              size="small"
              variant="secondary"
              onClick={(e) => { e.stopPropagation(); onVarySubtle(variation); }}
              title="Create subtle variations"
              style={{ fontSize: '0.7rem', padding: '4px 6px' }}
            >
              <Sparkles size={12} style={{ marginRight: '2px' }} />
              Vary (S)
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={(e) => { e.stopPropagation(); onVaryStrong(variation); }}
              title="Create strong variations"
              style={{ fontSize: '0.7rem', padding: '4px 6px' }}
            >
              <Zap size={12} style={{ marginRight: '2px' }} />
              Vary (St)
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={(e) => { e.stopPropagation(); onRegenerate(variation); }}
              title="Regenerate with same seed"
              style={{ fontSize: '0.7rem', padding: '4px 6px' }}
            >
              <RefreshCw size={12} style={{ marginRight: '2px' }} />
              Regen
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={(e) => { e.stopPropagation(); onEnlarge(variation); }}
              title="View full size"
              style={{ fontSize: '0.7rem', padding: '4px 6px' }}
            >
              <Maximize2 size={12} style={{ marginRight: '2px' }} />
              View
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

