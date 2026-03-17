/**
 * VariationsGrid Component
 *
 * 4-panel grid displaying generated variations with selection and actions.
 * Uses extracted CSS from legacy storyboard (variation-grid.css).
 */

import { useState } from 'react';
import { useGenerationStore } from '../../store';
import { Button } from '../ui/Button';
import type { Variation, GenerationJob } from '../../store/types';

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
    selectVariation,
    saveVariation,
  } = useGenerationStore();

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Create 4 slots - fill with variations or jobs
  const slots = Array.from({ length: 4 }, (_, index) => {
    const variation = variations[index];
    const job = activeJobs[index];
    return { index, variation, job };
  });

  const handleSelect = (variation: Variation) => {
    selectVariation(variation.id);
    onSelect?.(variation);
  };

  const handleSave = async (variation: Variation) => {
    try {
      await saveVariation(variation.id);
      onSave?.(variation);
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

  return (
    <>
      <div className={`variation-grid ${className}`}>
        {slots.map(({ index, variation, job }) => (
          <VariationCard
            key={index}
            index={index}
            variation={variation}
            job={job}
            isSelected={variation?.id === selectedVariationId}
            onSelect={handleSelect}
            onSave={handleSave}
            onEnlarge={handleEnlarge}
          />
        ))}
      </div>

      {/* Image Preview Overlay */}
      {previewImage && (
        <div
          className="image-preview-overlay active"
          onClick={closePreview}
        >
          <img src={previewImage} alt="Preview" onClick={(e) => e.stopPropagation()} />
        </div>
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
  onSelect: (variation: Variation) => void;
  onSave: (variation: Variation) => void;
  onEnlarge: (variation: Variation) => void;
}

function VariationCard({
  index,
  variation,
  job,
  isSelected,
  onSelect,
  onSave,
  onEnlarge,
}: VariationCardProps) {
  // Show loading state if job is active
  if (job && !variation) {
    return (
      <div className="variation-card">
        <div className={`variation-placeholder ${job.status === 'generating' ? 'loading' : ''}`}>
          <span className="placeholder-number">{index + 1}</span>
          <span className="placeholder-status">
            {job.status === 'pending' ? 'Queued' : 'Generating'}
          </span>
          {job.progress > 0 && (
            <span className="placeholder-progress">{Math.round(job.progress * 100)}%</span>
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
      className={`variation-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(variation)}
    >
      <img src={variation.imagePath} alt={`Variation ${index + 1}`} />

      <span className="seed-badge">Seed: {variation.seed}</span>

      <button
        className="enlarge-btn"
        onClick={(e) => { e.stopPropagation(); onEnlarge(variation); }}
        title="Enlarge"
      >
        🔍
      </button>

      <div className="variation-actions">
        <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); onSave(variation); }}>
          💾 Save
        </Button>
        <Button size="small" variant="primary" onClick={(e) => { e.stopPropagation(); onSelect(variation); }}>
          ✓ Use
        </Button>
      </div>
    </div>
  );
}

