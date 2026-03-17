/**
 * JobQueue Component
 *
 * Display active jobs with progress and status indicators.
 * Shows counts for completed, running, and queued jobs.
 */

import { useGenerationStore } from '../../store';
import { Button } from '../ui/Button';
import { X, Clock, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { GenerationJob, JobStatus } from '../../store/types';

export interface JobQueueProps {
  className?: string;
  showHistory?: boolean;
}

export function JobQueue({ className = '', showHistory = false }: JobQueueProps) {
  const {
    activeJobs,
    jobHistory,
    variations,
    cancelJob,
    clearJobHistory,
  } = useGenerationStore();

  // Count jobs by status
  const counts = {
    completed: variations.length,
    running: activeJobs.filter((j) => j.status === 'generating' || j.status === 'running').length,
    queued: activeJobs.filter((j) => j.status === 'pending').length,
    failed: activeJobs.filter((j) => j.status === 'failed').length,
  };

  const hasActiveJobs = activeJobs.length > 0;
  const totalJobs = counts.running + counts.queued;

  return (
    <div className={`job-queue ${className}`}>
      {/* Status Summary */}
      <div className="queue-summary">
        <div className="queue-stats">
          <div className="stat-item stat-completed">
            <CheckCircle2 size={16} />
            <span className="stat-label">Completed</span>
            <span className="stat-value">{counts.completed}</span>
          </div>
          <div className="stat-item stat-running">
            <Loader2 size={16} className={counts.running > 0 ? 'spinning' : ''} />
            <span className="stat-label">Running</span>
            <span className="stat-value">{counts.running}</span>
          </div>
          <div className="stat-item stat-queued">
            <Clock size={16} />
            <span className="stat-label">Queued</span>
            <span className="stat-value">{counts.queued}</span>
          </div>
          {counts.failed > 0 && (
            <div className="stat-item stat-failed">
              <XCircle size={16} />
              <span className="stat-label">Failed</span>
              <span className="stat-value">{counts.failed}</span>
            </div>
          )}
        </div>

        {hasActiveJobs && (
          <div className="queue-progress-summary">
            <div className="progress-text">
              {counts.running > 0 ? 'Processing...' : 'Waiting...'}
            </div>
            <div className="progress-count">
              {totalJobs - counts.queued} / {totalJobs}
            </div>
          </div>
        )}
      </div>

      {/* Active Jobs List */}
      {hasActiveJobs && (
        <div className="job-list">
          <div className="job-list-header">
            <h4>Active Jobs</h4>
            {counts.queued > 0 && (
              <span className="queue-info">
                {counts.queued} waiting
              </span>
            )}
          </div>
          <div className="job-items">
            {activeJobs.map((job, index) => (
              <JobItem
                key={job.id}
                job={job}
                position={index + 1}
                total={activeJobs.length}
                onCancel={cancelJob}
              />
            ))}
          </div>
        </div>
      )}

      {/* Job History */}
      {showHistory && jobHistory.length > 0 && (
        <div className="job-history">
          <div className="history-header">
            <h4>Recent History</h4>
            <Button size="small" variant="ghost" onClick={clearJobHistory}>
              Clear
            </Button>
          </div>
          <div className="history-list">
            {jobHistory.slice(0, 10).map((job) => (
              <JobHistoryItem key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasActiveJobs && (!showHistory || jobHistory.length === 0) && (
        <div className="queue-empty">
          <Clock size={32} />
          <p>No active jobs</p>
          <span>Generated images will appear here</span>
        </div>
      )}
    </div>
  );
}

// Individual job item
interface JobItemProps {
  job: GenerationJob;
  position: number;
  total: number;
  onCancel: (id: string) => void;
}

function JobItem({ job, position, total, onCancel }: JobItemProps) {
  const statusClass = getStatusClass(job.status);
  const statusLabel = getStatusLabel(job.status);
  const StatusIcon = getStatusIcon(job.status);
  const isActive = job.status === 'generating' || job.status === 'running';
  const canCancel = job.status === 'pending' || isActive;

  // Format time
  const getTimeInfo = () => {
    if (!job.createdAt) return null;
    const created = new Date(job.createdAt);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - created.getTime()) / 1000);

    if (elapsed < 60) return `${elapsed}s`;
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`;
    return `${Math.floor(elapsed / 3600)}h`;
  };

  return (
    <div className={`job-item ${statusClass}`}>
      <div className="job-header">
        <div className="job-icon">
          <StatusIcon size={16} className={isActive ? 'spinning' : ''} />
        </div>
        <div className="job-details">
          <div className="job-title">
            <span className="job-type">{formatJobType(job.jobType)}</span>
            {job.seed && <span className="job-seed">Seed: {job.seed}</span>}
          </div>
          <div className="job-meta">
            <span className="job-status">{statusLabel}</span>
            {getTimeInfo() && (
              <>
                <span className="meta-separator">•</span>
                <span className="job-time">{getTimeInfo()}</span>
              </>
            )}
            <span className="meta-separator">•</span>
            <span className="job-position">#{position} of {total}</span>
          </div>
        </div>
        {canCancel && (
          <button
            className="job-cancel-btn"
            onClick={() => onCancel(job.id)}
            title="Cancel job"
            aria-label="Cancel job"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {isActive && (
        <div className="job-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(job.progress || 0) * 100}%` }}
            />
          </div>
          <span className="progress-percentage">
            {Math.round((job.progress || 0) * 100)}%
          </span>
        </div>
      )}

      {/* Prompt Preview */}
      {job.prompt && (
        <div className="job-prompt">
          {job.prompt.length > 60 ? `${job.prompt.slice(0, 60)}...` : job.prompt}
        </div>
      )}

      {/* Error Message */}
      {job.status === 'failed' && job.errorMessage && (
        <div className="job-error">
          <AlertCircle size={14} />
          <span>{job.errorMessage}</span>
        </div>
      )}
    </div>
  );
}

// Job history item (simplified)
function JobHistoryItem({ job }: { job: GenerationJob }) {
  const statusClass = getStatusClass(job.status);
  const StatusIcon = getStatusIcon(job.status);

  return (
    <div className={`job-history-item ${statusClass}`}>
      <StatusIcon size={14} />
      <span className="history-type">{formatJobType(job.jobType)}</span>
      {job.seed && <span className="history-seed">Seed: {job.seed}</span>}
      {job.status === 'failed' && job.errorMessage && (
        <span className="history-error" title={job.errorMessage}>
          <AlertCircle size={12} />
          Error
        </span>
      )}
      {job.completedAt && (
        <span className="history-time">
          {new Date(job.completedAt).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

// Helper functions
function getStatusClass(status: JobStatus): string {
  switch (status) {
    case 'complete':
    case 'completed':
      return 'status-complete';
    case 'generating':
    case 'running':
      return 'status-running';
    case 'pending':
      return 'status-pending';
    case 'failed':
      return 'status-failed';
    case 'cancelled':
      return 'status-cancelled';
    default:
      return '';
  }
}

function getStatusLabel(status: JobStatus): string {
  switch (status) {
    case 'complete':
    case 'completed':
      return 'Complete';
    case 'generating':
    case 'running':
      return 'Generating...';
    case 'pending':
      return 'Queued';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

function getStatusIcon(status: JobStatus) {
  switch (status) {
    case 'complete':
    case 'completed':
      return CheckCircle2;
    case 'generating':
    case 'running':
      return Loader2;
    case 'pending':
      return Clock;
    case 'failed':
      return XCircle;
    case 'cancelled':
      return X;
    default:
      return Clock;
  }
}

function formatJobType(type: string): string {
  // Convert snake_case or camelCase to Title Case
  return type
    .replace(/[_-]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

