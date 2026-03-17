/**
 * JobStatusIcon Component
 *
 * Small, discreet icon in the top-right header showing job status.
 * Displays a concise tooltip on hover with current job information.
 */

import { useState, useRef, useEffect } from 'react';
import { useGenerationStore } from '../../store';
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export interface JobStatusIconProps {
  className?: string;
}

export function JobStatusIcon({ className = '' }: JobStatusIconProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const iconRef = useRef<HTMLDivElement>(null);
  const { activeJobs, jobHistory } = useGenerationStore();

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

  return (
    <div
      ref={iconRef}
      className={`job-status-icon ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        borderRadius: 'var(--radius)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Icon */}
      <StatusIcon
        size={16}
        style={{
          color: iconColor,
          animation: pulseAnimation ? 'spin 1s linear infinite' : 'none',
        }}
      />

      {/* Badge count */}
      {totalActive > 0 && (
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: iconColor,
          }}
        >
          {totalActive}
        </span>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="job-status-tooltip"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '12px',
            minWidth: '220px',
            boxShadow: 'var(--shadow-card)',
            zIndex: 1000,
            fontSize: '0.85rem',
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>
            Job Status
          </div>

          {currentJob && (
            <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--brand-teal)', fontWeight: 500 }}>
                ⟳ {currentJob.prompt.substring(0, 30)}...
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {currentJob.progress}% complete
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {runningJobs > 0 && (
              <div style={{ color: 'var(--brand-teal)' }}>⟳ Running: {runningJobs}</div>
            )}
            {queuedJobs > 0 && (
              <div style={{ color: 'var(--warning)' }}>⏱ Queued: {queuedJobs}</div>
            )}
            {completedJobs > 0 && (
              <div style={{ color: 'var(--success)' }}>✓ Completed: {completedJobs}</div>
            )}
            {failedJobs > 0 && (
              <div style={{ color: 'var(--error)' }}>✗ Failed: {failedJobs}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

