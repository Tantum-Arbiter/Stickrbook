/**
 * CompareModal Component
 *
 * Modal for comparing up to 4 variations side-by-side
 */

import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Variation } from '../../store/types';

export interface CompareModalProps {
  variations: Variation[];
  onClose: () => void;
}

export function CompareModal({ variations, onClose }: CompareModalProps) {
  if (variations.length === 0) return null;

  // Determine grid layout based on number of variations
  const gridCols = variations.length === 1 ? 1 : variations.length === 2 ? 2 : 2;
  const gridRows = variations.length <= 2 ? 1 : 2;

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div 
        className="modal-content compare-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '95vw',
          maxHeight: '95vh',
          width: 'auto',
          height: 'auto',
        }}
      >
        {/* Header */}
        <div className="modal-header">
          <h3>Compare Variations ({variations.length})</h3>
          <Button
            variant="ghost"
            size="small"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Comparison Grid */}
        <div 
          className="compare-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${gridRows}, 1fr)`,
            gap: '16px',
            padding: '20px',
            maxHeight: 'calc(95vh - 80px)',
            overflow: 'auto',
          }}
        >
          {variations.map((variation) => (
            <div 
              key={variation.id}
              className="compare-item"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '12px',
              }}
            >
              <img
                src={variation.imagePath}
                alt={`Variation ${variation.seed}`}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 'var(--radius-sm)',
                  objectFit: 'contain',
                  maxHeight: '70vh',
                }}
              />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div><strong>Seed:</strong> {variation.seed}</div>
                {variation.prompt && (
                  <div style={{ marginTop: '4px', fontSize: '0.8rem' }}>
                    {variation.prompt.substring(0, 100)}
                    {variation.prompt.length > 100 ? '...' : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

