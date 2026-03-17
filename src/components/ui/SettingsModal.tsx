/**
 * SettingsModal Component
 * 
 * Modal for adjusting application settings like text scale
 */

import { useEffect } from 'react';
import { useUIStore } from '../../store';
import { Button } from './Button';
import { X, Type } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const textScale = useUIStore((s) => s.textScale);
  const setTextScale = useUIStore((s) => s.setTextScale);

  // Apply text scale on mount and when it changes
  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', textScale.toString());
  }, [textScale]);

  if (!isOpen) return null;

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    setTextScale(newScale);
  };

  const resetScale = () => {
    setTextScale(1.0);
  };

  return (
    <div 
      className="modal-overlay open" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-modal)',
      }}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <h2 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 600,
            color: 'var(--text)',
            margin: 0,
          }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Text Scale Setting */}
        <div style={{
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}>
            <Type size={20} color="var(--accent)" />
            <label style={{
              fontSize: 'var(--font-size-md)',
              fontWeight: 500,
              color: 'var(--text)',
            }}>
              Text Size
            </label>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.05"
              value={textScale}
              onChange={handleScaleChange}
              style={{
                flex: 1,
                accentColor: 'var(--accent)',
              }}
            />
            <span style={{
              fontSize: 'var(--font-size-md)',
              color: 'var(--text)',
              minWidth: '50px',
              textAlign: 'right',
            }}>
              {Math.round(textScale * 100)}%
            </span>
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px',
          }}>
            <Button size="small" variant="secondary" onClick={() => setTextScale(0.8)}>
              Small
            </Button>
            <Button size="small" variant="secondary" onClick={() => setTextScale(1.0)}>
              Default
            </Button>
            <Button size="small" variant="secondary" onClick={() => setTextScale(1.2)}>
              Large
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
        }}>
          <Button variant="secondary" onClick={resetScale}>
            Reset to Default
          </Button>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

