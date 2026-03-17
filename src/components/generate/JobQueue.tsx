/**
 * JobQueue Component
 *
 * Display active jobs with progress and status indicators.
 * Shows counts for completed, running, and queued jobs.
 */

import { useGenerationStore } from '../../store';
import { Button } from '../ui/Button';
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
    running: activeJobs.filter((j) => j.status === 'generating').length,
    queued: activeJobs.filter((j) => j.status === 'pending').length,
  };

  return (
    <div className={`job-queue ${className}`}>
      {/* Status Summary */}
      <div className="queue-section">
        <div className="queue-item">
          <span className="status status-complete" />
          <span>
            Completed: <strong>{counts.completed}</strong>
          </span>
        </div>
        <div className="queue-item">
          <span className="status status-running" />
          <span>
            Running: <strong>{counts.running}</strong>
          </span>
        </div>
        <div className="queue-item">
          <span className="status status-pending" />
          <span>
            Queued: <strong>{counts.queued}</strong>
          </span>
        </div>
      </div>

      {/* Active Jobs List */}
      {activeJobs.length > 0 && (
        <div className="job-list">
          {activeJobs.map((job) => (
            <JobItem key={job.id} job={job} onCancel={cancelJob} />
          ))}
        </div>
      )}

      {/* Job History */}
      {showHistory && jobHistory.length > 0 && (
        <div className="job-history">
          <div className="history-header">
            <h4>History</h4>
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
    </div>
  );
}

// Individual job item
interface JobItemProps {
  job: GenerationJob;
  onCancel: (id: string) => void;
}

function JobItem({ job, onCancel }: JobItemProps) {
  const statusClass = getStatusClass(job.status);
  const statusLabel = getStatusLabel(job.status);

  return (
    <div className={`job-item ${statusClass}`}>
      <div className="job-info">
        <span className={`status ${statusClass}`} />
        <span className="job-type">{job.jobType}</span>
        <span className="job-status">{statusLabel}</span>
      </div>

      {job.status === 'generating' && job.progress > 0 && (
        <div className="job-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${job.progress * 100}%` }}
            />
          </div>
          <span className="progress-text">{Math.round(job.progress * 100)}%</span>
        </div>
      )}

      {(job.status === 'pending' || job.status === 'generating') && (
        <button
          className="job-cancel"
          onClick={() => onCancel(job.id)}
          title="Cancel job"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// Job history item (simplified)
function JobHistoryItem({ job }: { job: GenerationJob }) {
  const statusClass = getStatusClass(job.status);

  return (
    <div className={`job-history-item ${statusClass}`}>
      <span className={`status ${statusClass}`} />
      <span className="job-type">{job.jobType}</span>
      {job.seed && <span className="job-seed">Seed: {job.seed}</span>}
      {job.status === 'failed' && job.errorMessage && (
        <span className="job-error" title={job.errorMessage}>
          Error
        </span>
      )}
    </div>
  );
}

// Helper functions
function getStatusClass(status: JobStatus): string {
  switch (status) {
    case 'complete': return 'status-complete';
    case 'generating': return 'status-running';
    case 'pending': return 'status-pending';
    case 'failed': return 'status-failed';
    case 'cancelled': return 'status-cancelled';
    default: return '';
  }
}

function getStatusLabel(status: JobStatus): string {
  switch (status) {
    case 'complete': return 'Complete';
    case 'generating': return 'Generating...';
    case 'pending': return 'Queued';
    case 'failed': return 'Failed';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

