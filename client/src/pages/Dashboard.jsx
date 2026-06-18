import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Clock, Wrench, CheckCircle, Search,
  PlusCircle, Calendar, MapPin, Eye, AlertTriangle, RefreshCw
} from 'lucide-react';
import { apiFetch } from '../api';

export default function Dashboard({ user, token }) {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showMyReports, setShowMyReports] = useState(false);

  const fetchIssuesAndStats = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (showMyReports) params.append('myReports', 'true');

      const [issuesData, statsData] = await Promise.all([
        apiFetch(`/api/issues?${params.toString()}`, {}, token),
        apiFetch('/api/issues/stats', {}, token)
      ]);

      setIssues(issuesData);
      setStats(statsData);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, priorityFilter, categoryFilter, showMyReports]);

  useEffect(() => {
    fetchIssuesAndStats();
  }, [fetchIssuesAndStats]);

  const filteredIssues = issues.filter(issue => {
    const term = searchQuery.toLowerCase();
    return (
      (issue.title || '').toLowerCase().includes(term) ||
      (issue.description || '').toLowerCase().includes(term) ||
      (issue.location || '').toLowerCase().includes(term) ||
      (issue.reporterName || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="content-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">School Infrastructure Status</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Monitoring safety conditions and maintenance progress for <strong>School ID: {user?.schoolId}</strong>
          </p>
        </div>
        {user?.role !== 'admin' && (
          <Link to="/report" className="btn btn-primary animate-fade-in">
            <PlusCircle size={18} aria-hidden="true" />
            <span>Report New Issue</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="alert-error" role="alert" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>{error}</span>
          <button type="button" className="btn btn-secondary" onClick={fetchIssuesAndStats} style={{ marginLeft: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
            <RefreshCw size={14} aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      <div className="stats-grid animate-fade-in">
        {loading ? (
          Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="stat-card" style={{ cursor: 'default' }}>
              <div className="skeleton skeleton-circle" style={{ flexShrink: 0 }} />
              <div className="stat-info" style={{ width: '100%' }}>
                <div className="skeleton" style={{ width: '40px', height: '24px', marginBottom: '6px' }} />
                <div className="skeleton" style={{ width: '90px', height: '14px' }} />
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--color-primary)' }}>
                <ClipboardList size={24} aria-hidden="true" />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Reported</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'var(--status-pending-light)', color: 'var(--status-pending)' }}>
                <Clock size={24} aria-hidden="true" />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.pending || 0}</div>
                <div className="stat-label">Pending Reviews</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'var(--status-inprogress-light)', color: 'var(--status-inprogress)' }}>
                <Wrench size={24} aria-hidden="true" />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.inProgress || 0}</div>
                <div className="stat-label">In Progress</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'var(--status-resolved-light)', color: 'var(--status-resolved)' }}>
                <CheckCircle size={24} aria-hidden="true" />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.resolved || 0}</div>
                <div className="stat-label">Resolved Repairs</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="card animate-fade-in filter-panel">
        <div className="filter-panel-inner">
          <div className="search-input-wrapper">
            <label htmlFor="dashboard-search" className="sr-only">Search issues</label>
            <Search size={18} className="search-icon" aria-hidden="true" />
            <input
              id="dashboard-search"
              type="search"
              placeholder="Search by issue title, details or location..."
              className="input-control"
              style={{ paddingLeft: '2.5rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <label htmlFor="category-filter" className="sr-only">Filter by category</label>
            <select
              id="category-filter"
              className="input-control filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Sanitation">Sanitation</option>
              <option value="Electrical">Electrical</option>
              <option value="Furniture">Furniture</option>
              <option value="Structural">Structural</option>
              <option value="Safety">Safety</option>
              <option value="Other">Other</option>
            </select>

            <label htmlFor="status-filter" className="sr-only">Filter by status</label>
            <select
              id="status-filter"
              className="input-control filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <label htmlFor="priority-filter" className="sr-only">Filter by priority</label>
            <select
              id="priority-filter"
              className="input-control filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            {user?.role !== 'admin' && (
              <label className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={showMyReports}
                  onChange={(e) => setShowMyReports(e.target.checked)}
                />
                My Reports
              </label>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-3">
          {Array(3).fill(0).map((_, idx) => (
            <div key={idx} className="card animate-fade-in issue-card-skeleton">
              <div className="skeleton aspect-video issue-card-image-skeleton" />
              <div className="issue-card-body-skeleton">
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div className="skeleton" style={{ width: '70px', height: '20px', borderRadius: '9999px' }} />
                  <div className="skeleton" style={{ width: '90px', height: '20px', borderRadius: '9999px' }} />
                </div>
                <div className="skeleton skeleton-title" style={{ marginTop: '0.25rem' }} />
                <div className="skeleton skeleton-text" style={{ width: '100%' }} />
                <div className="skeleton skeleton-text" style={{ width: '90%' }} />
                <div className="skeleton skeleton-text" style={{ width: '40%', marginTop: 'auto' }} />
              </div>
              <div className="issue-card-footer-skeleton">
                <div className="skeleton skeleton-btn" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="empty-state card animate-fade-in">
          <AlertTriangle size={48} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          <h3 style={{ fontSize: '1.5rem' }}>
            {error ? 'Unable to load issues' : 'No issues found'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            {error
              ? 'Please check your connection and try again.'
              : 'There are currently no reported issues matching your filter criteria. If you spotted broken furniture, structural damage, sanitation concerns, or electrical hazards, please submit a report.'}
          </p>
          {!error && user?.role !== 'admin' && (
            <Link to="/report" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              <PlusCircle size={18} aria-hidden="true" />
              <span>Submit First Report</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-3 animate-fade-in">
          {filteredIssues.map((issue) => (
            <div key={issue._id} className="card issue-card">
              {issue.image ? (
                <div className="issue-card-image" role="img" aria-label={`Photo of ${issue.title}`}>
                  <img src={issue.image} alt="" className="issue-card-img" />
                  <span className="badge badge-low issue-card-category-badge">
                    {issue.category}
                  </span>
                </div>
              ) : (
                <div className="issue-card-placeholder">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span className="issue-card-no-image-label">No Image Uploaded</span>
                  <span className="badge badge-low issue-card-category-badge">
                    {issue.category}
                  </span>
                </div>
              )}

              <div className="issue-card-body">
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span className={`badge badge-${issue.status}`}>
                    {issue.status === 'in-progress' ? 'In Progress' : issue.status}
                  </span>
                  <span className={`badge badge-${issue.priority}`}>
                    {issue.priority} Priority
                  </span>
                </div>

                <h3 className="issue-card-title">{issue.title}</h3>

                <p className="issue-card-description">{issue.description}</p>

                <div className="issue-card-meta">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={14} aria-hidden="true" />
                    <span>Location: <strong>{issue.location}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} aria-hidden="true" />
                    <span>Reported on {new Date(issue.createdAt).toLocaleDateString()} by {issue.reporterName}</span>
                  </div>
                </div>
              </div>

              <div className="issue-card-footer">
                <Link to={`/timeline/${issue._id}`} className="btn btn-secondary" style={{ width: '100%', padding: '0.5rem' }}>
                  <Eye size={16} aria-hidden="true" />
                  <span>Track Progress</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
