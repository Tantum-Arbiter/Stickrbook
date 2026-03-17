/**
 * FloatingJobQueue Component
 *
 * A collapsible floating bar at the bottom of the screen showing job status.
 * Expands to show full job details when clicked.
 */

import { useState } from 'react';
import { useGenerationStore } from '../../store';
import { X, ChevronUp, ChevronDown, CheckCircle2, Loader2, Clock, XCircle } from 'lucide-react';
import { JobQueue } from './JobQueue';

export interface FloatingJobQueueProps {
  className?: string;
}

export function FloatingJobQueue({ className = '' }: FloatingJobQueueProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { activeJobs, variations } = useGenerationStore();

  // Count jobs by status
  const counts = {
    completed: variations.length,
    running: activeJobs.filter((j) => j.status === 'generating' || j.status === 'running').length,
    queued: activeJobs.filter((j) => j.status === 'pending').length,
    failed: activeJobs.filter((j) => j.status === 'failed').length,
  };

  const hasActiveJobs = activeJobs.length > 0;
  const totalActive = counts.running + counts.queued;

  // Don't show if no jobs at all
  if (!hasActiveJobs && counts.completed === 0) {
    return null;
  }

  return (
    <div className={`floating-job-queue ${isExpanded ? 'expanded' : 'collapsed'} ${className}`}>
      {/* Collapsed Bar */}
      <div className="job-queue-bar" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="bar-content">
          {/* Status Summary */}
          <div className="bar-stats">
            {counts.completed > 0 && (
              <div className="bar-stat stat-completed">
                <CheckCircle2 size={16} />
                <span>{counts.completed}</span>
              </div>
            )}
            {counts.running > 0 && (
              <div className="bar-stat stat-running">
                <Loader2 size={16} className="spinning" />
                <span>{counts.running}</span>
              </div>
            )}
            {counts.queued > 0 && (
              <div className="bar-stat stat-queued">
                <Clock size={16} />
                <span>{counts.queued}</span>
              </div>
            )}
            {counts.failed > 0 && (
              <div className="bar-stat stat-failed">
                <XCircle size={16} />
                <span>{counts.failed}</span>
              </div>
            )}
          </div>

          {/* Status Text */}
          <div className="bar-status">
            {hasActiveJobs ? (
              <>
                {counts.running > 0 ? (
                  <span className="status-text">
                    Generating... ({totalActive - counts.queued} / {totalActive})
                  </span>
                ) : (
                  <span className="status-text">
                    {counts.queued} job{counts.queued !== 1 ? 's' : ''} queued
                  </span>
                )}
              </>
            ) : (
              <span className="status-text">All jobs complete</span>
            )}
          </div>

          {/* Expand/Collapse Button */}
          <button
            className="bar-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            aria-label={isExpanded ? 'Collapse job queue' : 'Expand job queue'}
          >
            {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>

        {/* Progress Bar for Active Jobs */}
        {hasActiveJobs && counts.running > 0 && (
          <div className="bar-progress">
            <div
              className="bar-progress-fill"
              style={{ width: `${((totalActive - counts.queued) / totalActive) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="job-queue-expanded">
          <div className="expanded-header">
            <h3>Job Queue</h3>
            <button
              className="close-btn"
              onClick={() => setIsExpanded(false)}
              aria-label="Close job queue"
            >
              <X size={18} />
            </button>
          </div>
          <div className="expanded-content">
            <JobQueue showHistory={true} />
          </div>
        </div>
      )}
    </div>
  );
}

