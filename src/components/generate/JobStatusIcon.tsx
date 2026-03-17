/**
 * JobStatusIcon Component
 *
 * Small, discreet icon in the top-right header showing job status.
 * - Hover: Shows high-level summary tooltip
 * - Click: Opens detailed job queue panel
 */

import { useState, useRef, useEffect } from 'react';
import { useGenerationStore } from '../../store';
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle, X } from 'lucide-react';
import { JobQueue } from './JobQueue';

export interface JobStatusIconProps {
  className?: string;
}

export function JobStatusIcon({ className = '' }: JobStatusIconProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const iconRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { activeJobs, jobHistory } = useGenerationStore();

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showPanel &&
        panelRef.current &&
        iconRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !iconRef.current.contains(event.target as Node)
      ) {
        setShowPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPanel]);

  // Calculate stats
  const runningJobs = activeJobs.filter((j) => j.status === 'running' || j.status === 'generating').length;
  const queuedJobs = activeJobs.filter((j) => j.status === 'pending' || j.status === 'queued').length;
  const failedJobs = activeJobs.filter((j) => j.status === 'failed').length;
  const completedJobs = jobHistory.filter((j) => j.status === 'completed').length;

  const totalActive = activeJobs.length;
  const hasJobs = totalActive > 0 || completedJobs > 0;

  // Don't render if no jobs
  if (!hasJobs) return null;

  // Determine icon and color based on status
  let StatusIcon = Clock;
  let iconColor = 'var(--text-muted)';
  let pulseAnimation = false;

  if (failedJobs > 0) {
    StatusIcon = XCircle;
    iconColor = 'var(--error)';
  } else if (runningJobs > 0) {
    StatusIcon = Loader2;
    iconColor = 'var(--brand-teal)';
    pulseAnimation = true;
  } else if (queuedJobs > 0) {
    StatusIcon = Clock;
    iconColor = 'var(--warning)';
  } else if (completedJobs > 0) {
    StatusIcon = CheckCircle2;
    iconColor = 'var(--success)';
  }

  // Current job info for tooltip
  const currentJob = activeJobs.find((j) => j.status === 'running' || j.status === 'generating');

  // High-level summary for hover tooltip
  const totalJobs = totalActive + completedJobs;
  const successRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
  const estimatedTimeRemaining = runningJobs > 0 && currentJob
    ? Math.round((100 - currentJob.progress) / currentJob.progress * 2) // Rough estimate in minutes
    : null;

  return (
    <>
      <div
        ref={iconRef}
        className={`job-status-icon ${className}`}
        onMouseEnter={() => !showPanel && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => {
          setShowPanel(!showPanel);
          setShowTooltip(false);
        }}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          borderRadius: 'var(--radius)',
          background: showPanel ? 'var(--brand-teal)' : 'var(--bg-card)',
          border: `1px solid ${showPanel ? 'var(--brand-teal)' : 'var(--border)'}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Icon */}
        <StatusIcon
          size={16}
          style={{
            color: showPanel ? 'white' : iconColor,
            animation: pulseAnimation ? 'spin 1s linear infinite' : 'none',
          }}
        />

        {/* Badge count */}
        {totalActive > 0 && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: showPanel ? 'white' : iconColor,
            }}
          >
            {totalActive}
          </span>
        )}

        {/* High-level hover tooltip */}
        {showTooltip && !showPanel && (
          <div
            className="job-status-tooltip"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              minWidth: '280px',
              boxShadow: 'var(--shadow-card)',
              zIndex: 1000,
              fontSize: '0.85rem',
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '12px', color: 'var(--text)', fontSize: '0.9rem' }}>
              📊 Job Queue Summary
            </div>

            {/* High-level metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Jobs:</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{totalJobs}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Success Rate:</span>
                <span style={{ fontWeight: 600, color: successRate > 80 ? 'var(--success)' : 'var(--warning)' }}>
                  {successRate}%
                </span>
              </div>
              {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Est. Time:</span>
                  <span style={{ fontWeight: 600, color: 'var(--brand-teal)' }}>
                    ~{estimatedTimeRemaining} min
                  </span>
                </div>
              )}
            </div>

            {/* Current job preview */}
            {currentJob && (
              <div style={{
                padding: '8px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--brand-teal)',
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Currently Processing:
                </div>
                <div style={{ color: 'var(--text)', fontWeight: 500, fontSize: '0.85rem' }}>
                  {currentJob.prompt.substring(0, 40)}...
                </div>
                <div style={{
                  marginTop: '6px',
                  height: '4px',
                  background: 'var(--bg-panel)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${currentJob.progress}%`,
                    background: 'var(--brand-teal)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border)'
            }}>
              {runningJobs > 0 && (
                <div style={{ textAlign: 'center', padding: '4px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--brand-teal)' }}>{runningJobs}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Running</div>
                </div>
              )}
              {queuedJobs > 0 && (
                <div style={{ textAlign: 'center', padding: '4px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--warning)' }}>{queuedJobs}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Queued</div>
                </div>
              )}
              {completedJobs > 0 && (
                <div style={{ textAlign: 'center', padding: '4px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--success)' }}>{completedJobs}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Completed</div>
                </div>
              )}
              {failedJobs > 0 && (
                <div style={{ textAlign: 'center', padding: '4px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--error)' }}>{failedJobs}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Failed</div>
                </div>
              )}
            </div>

            <div style={{
              marginTop: '12px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textAlign: 'center'
            }}>
              Click to view detailed job queue
            </div>
          </div>
        )}
      </div>

      {/* Detailed Job Queue Panel (on click) */}
      {showPanel && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: '60px',
            right: '20px',
            width: '450px',
            maxHeight: 'calc(100vh - 100px)',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Panel Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-card)',
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>
              Job Queue
            </h3>
            <button
              onClick={() => setShowPanel(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Job Queue Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
            <JobQueue showHistory={true} />
          </div>
        </div>
      )}
    </>
  );
}

