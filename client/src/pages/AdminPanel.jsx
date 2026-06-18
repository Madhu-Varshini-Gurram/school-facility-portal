import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings, Download, Search, ChevronRight, AlertTriangle, RefreshCw
} from 'lucide-react';
import { apiFetch } from '../api';

function escapeCsvField(value) {
  const str = String(value ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

export default function AdminPanel({ token }) {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    priorities: { low: 0, medium: 0, high: 0 },
    categories: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchAdminData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');
    try {
      const [dataIssues, dataStats] = await Promise.all([
        apiFetch('/api/issues', {}, token),
        apiFetch('/api/issues/stats', {}, token)
      ]);

      setIssues(dataIssues);
      setStats(dataStats);
    } catch (err) {
      setError(err.message || 'Failed to load admin panel data.');
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const filteredIssues = issues.filter(issue => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      (issue.title || '').toLowerCase().includes(term) ||
      (issue.location || '').toLowerCase().includes(term) ||
      (issue.reporterName || '').toLowerCase().includes(term);

    const matchesStatus = !statusFilter || issue.status === statusFilter;
    const matchesPriority = !priorityFilter || issue.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleExportCSV = () => {
    if (filteredIssues.length === 0) return;

    const headers = ['Issue ID', 'Title', 'Description', 'Category', 'Location', 'Priority', 'Status', 'Reporter', 'Assigned Staff', 'Est Resolution Time', 'Date Reported'];

    const rows = filteredIssues.map(issue => [
      escapeCsvField(issue._id),
      escapeCsvField(issue.title),
      escapeCsvField(issue.description),
      escapeCsvField(issue.category),
      escapeCsvField(issue.location),
      escapeCsvField(issue.priority),
      escapeCsvField(issue.status),
      escapeCsvField(issue.reporterName),
      escapeCsvField(issue.assignedStaff || 'Unassigned'),
      escapeCsvField(issue.estimatedResolutionTime || 'TBD'),
      escapeCsvField(new Date(issue.createdAt).toLocaleDateString())
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `School_Facility_Repair_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const completionRate = stats?.total > 0 ? Math.round(((stats.resolved || 0) / stats.total) * 100) : 0;
  const categoriesList = ['Sanitation', 'Electrical', 'Furniture', 'Structural', 'Safety', 'Other'];
  const maxCategoryCount = Math.max(...categoriesList.map(cat => (stats?.categories || {})[cat] || 0), 1);

  return (
    <div className="content-container">
      <div className="page-header">
        <div>
          <h1 className="page-title page-title-with-icon">
            <Settings size={32} className="text-primary" aria-hidden="true" />
            <span>Admin Facility Control Center</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Review condition logs, assign repair tasks, update resolution schedules, and generate compliance reports.
          </p>
        </div>

        {filteredIssues.length > 0 && (
          <button type="button" onClick={handleExportCSV} className="btn btn-primary animate-fade-in">
            <Download size={18} aria-hidden="true" />
            <span>Export Repair Report (CSV)</span>
          </button>
        )}
      </div>

      {error && (
        <div className="alert-error" role="alert" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>{error}</span>
          <button type="button" className="btn btn-secondary" onClick={fetchAdminData} style={{ marginLeft: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
            <RefreshCw size={14} aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      <div className="grid grid-2 animate-fade-in admin-kpi-grid">
        <div className="card admin-kpi-card">
          <h3 className="admin-section-title">Performance Metrics</h3>

          {loading ? (
            <div className="admin-kpi-content">
              <div className="skeleton skeleton-circle" style={{ width: '120px', height: '120px', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div className="skeleton" style={{ width: '120px', height: '14px', marginBottom: '0.5rem' }} />
                  <div className="skeleton" style={{ width: '80px', height: '18px' }} />
                </div>
                <div>
                  <div className="skeleton" style={{ width: '120px', height: '14px', marginBottom: '0.5rem' }} />
                  <div className="skeleton" style={{ width: '80px', height: '18px' }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-kpi-content">
              <div className="completion-ring" style={{
                background: `conic-gradient(var(--status-resolved) ${completionRate}%, var(--border-color) ${completionRate}%)`
              }}>
                <div className="completion-ring-inner">
                  <span className="completion-rate-value">{completionRate}%</span>
                  <span className="completion-rate-label">Fixed</span>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pending Repair Review:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                    <div className="status-dot status-dot-pending" />
                    <strong style={{ fontSize: '1.1rem' }}>{stats?.pending || 0} issues</strong>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Work in Progress:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                    <div className="status-dot status-dot-inprogress" />
                    <strong style={{ fontSize: '1.1rem' }}>{stats?.inProgress || 0} repairs</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="admin-kpi-footer">
            <span>Total Issues Registered: <strong>{loading ? '...' : (stats?.total || 0)}</strong></span>
            <span>Priority High: <strong style={{ color: 'var(--status-pending)' }}>{loading ? '...' : (stats?.priorities?.high || 0)}</strong></span>
          </div>
        </div>

        <div className="card">
          <h3 className="admin-section-title">Condition Reports by Category</h3>

          {loading ? (
            <div className="bar-chart-container">
              {Array(6).fill(0).map((_, idx) => (
                <div key={idx} className="chart-bar-wrapper">
                  <div className="skeleton" style={{ width: '100%', height: '80%', borderRadius: '4px 4px 0 0' }} />
                  <div className="skeleton" style={{ width: '40px', height: '12px', marginTop: '0.5rem' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bar-chart-container">
              {categoriesList.map(cat => {
                const count = (stats?.categories || {})[cat] || 0;
                const heightPercent = stats?.total > 0 ? (count / maxCategoryCount) * 100 : 0;
                return (
                  <div key={cat} className="chart-bar-wrapper">
                    <div className="chart-bar" style={{ height: `${Math.max(heightPercent, 5)}%`, opacity: count > 0 ? 1 : 0.25 }}>
                      {count > 0 && <span className="chart-value">{count}</span>}
                    </div>
                    <span className="chart-label">{cat}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── New Charts Row ── */}
      <div className="admin-charts-row animate-fade-in">
        {/* Priority Breakdown */}
        <div className="card admin-chart-card">
          <h3 className="admin-section-title">Priority Breakdown</h3>
          {loading ? (
            <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }} />
          ) : (() => {
            const low = stats?.priorities?.low || 0;
            const medium = stats?.priorities?.medium || 0;
            const high = stats?.priorities?.high || 0;
            const total = low + medium + high || 1;
            const lowPct = Math.round((low / total) * 100);
            const medPct = Math.round((medium / total) * 100);
            const highPct = 100 - lowPct - medPct;
            return (
              <div>
                <div className="priority-bar-track" role="img" aria-label={`Priority breakdown: ${low} low, ${medium} medium, ${high} high`}>
                  {low > 0 && <div className="priority-bar-segment priority-bar-low" style={{ width: `${lowPct}%` }} title={`Low: ${low}`}><span>{lowPct}%</span></div>}
                  {medium > 0 && <div className="priority-bar-segment priority-bar-medium" style={{ width: `${medPct}%` }} title={`Medium: ${medium}`}><span>{medPct}%</span></div>}
                  {high > 0 && <div className="priority-bar-segment priority-bar-high" style={{ width: `${highPct}%` }} title={`High: ${high}`}><span>{highPct}%</span></div>}
                  {(low + medium + high) === 0 && <div className="priority-bar-segment" style={{ width: '100%', background: 'var(--border-color)', opacity: 0.4 }} />}
                </div>
                <div className="priority-bar-legend">
                  <span className="priority-legend-item"><span className="priority-legend-dot" style={{ background: 'var(--priority-low)' }} />Low: <strong>{low}</strong></span>
                  <span className="priority-legend-item"><span className="priority-legend-dot" style={{ background: 'var(--priority-medium)' }} />Medium: <strong>{medium}</strong></span>
                  <span className="priority-legend-item"><span className="priority-legend-dot" style={{ background: 'var(--priority-high)' }} />High: <strong>{high}</strong></span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Status Distribution Donut */}
        <div className="card admin-chart-card">
          <h3 className="admin-section-title">Status Distribution</h3>
          {loading ? (
            <div className="donut-chart-wrap">
              <div className="skeleton skeleton-circle" style={{ width: '130px', height: '130px' }} />
            </div>
          ) : (() => {
            const pending = stats?.pending || 0;
            const inProgress = stats?.inProgress || 0;
            const resolved = stats?.resolved || 0;
            const total = pending + inProgress + resolved || 1;
            const r = 54;
            const cx = 70;
            const cy = 70;
            const circumference = 2 * Math.PI * r;
            const segments = [
              { value: pending, color: 'var(--status-pending)', label: 'Pending' },
              { value: inProgress, color: 'var(--status-inprogress)', label: 'In Progress' },
              { value: resolved, color: 'var(--status-resolved)', label: 'Resolved' },
            ];
            let offset = 0;
            const arcs = segments.map((seg) => {
              const dash = (seg.value / total) * circumference;
              const arc = { ...seg, dash, offset };
              offset += dash;
              return arc;
            });
            return (
              <div className="donut-chart-wrap">
                <svg width="140" height="140" viewBox="0 0 140 140" aria-label="Status distribution donut chart">
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-color)" strokeWidth="16" />
                  {arcs.filter(a => a.value > 0).map((arc, i) => (
                    <circle
                      key={i}
                      className="donut-segment"
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke={arc.color}
                      strokeWidth="16"
                      strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
                      strokeDashoffset={-arc.offset}
                      style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.6s ease' }}
                    />
                  ))}
                  <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text-primary)">{pending + inProgress + resolved}</text>
                  <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="var(--text-muted)">Total</text>
                </svg>
                <div className="donut-legend">
                  {segments.map((seg, i) => (
                    <div key={i} className="donut-legend-item">
                      <span className="donut-legend-dot" style={{ background: seg.color }} />
                      <span className="donut-legend-label">{seg.label}</span>
                      <strong className="donut-legend-count">{seg.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="card animate-fade-in" style={{ padding: '1.5rem 0' }}>
        <div className="directory-header">
          <h3 style={{ fontSize: '1.3rem' }}>Infrastructure Repair Directory</h3>

          <div className="directory-filters">
            <div className="directory-search-wrapper">
              <label htmlFor="admin-search" className="sr-only">Search repair logs</label>
              <Search size={16} className="search-icon-directory" aria-hidden="true" />
              <input
                id="admin-search"
                type="search"
                placeholder="Search logs..."
                className="input-control directory-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <label htmlFor="admin-status-filter" className="sr-only">Filter by status</label>
            <select
              id="admin-status-filter"
              className="input-control directory-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <label htmlFor="admin-priority-filter" className="sr-only">Filter by priority</label>
            <select
              id="admin-priority-filter"
              className="input-control directory-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ padding: '1rem 1.5rem' }}><div className="skeleton" style={{ width: '100px', height: '14px' }} /></th>
                  <th style={{ padding: '1rem 1.5rem' }}><div className="skeleton" style={{ width: '80px', height: '14px' }} /></th>
                  <th style={{ padding: '1rem 1.5rem' }}><div className="skeleton" style={{ width: '60px', height: '14px' }} /></th>
                  <th style={{ padding: '1rem 1.5rem' }}><div className="skeleton" style={{ width: '60px', height: '14px' }} /></th>
                  <th style={{ padding: '1rem 1.5rem' }}><div className="skeleton" style={{ width: '80px', height: '14px' }} /></th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}><div className="skeleton" style={{ width: '50px', height: '14px', marginLeft: 'auto' }} /></th>
                </tr>
              </thead>
              <tbody>
                {Array(3).fill(0).map((_, idx) => (
                  <tr key={idx}>
                    <td data-label="Issue details" className="issue-details-cell" style={{ padding: '1rem 1.5rem' }}>
                      <div className="skeleton" style={{ width: '180px', height: '16px', marginBottom: '6px' }} />
                      <div className="skeleton" style={{ width: '140px', height: '12px' }} />
                    </td>
                    <td data-label="Category" style={{ padding: '1rem 1.5rem' }}><div className="skeleton" style={{ width: '70px', height: '16px' }} /></td>
                    <td data-label="Priority" style={{ padding: '1rem 1.5rem' }}><div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '9999px' }} /></td>
                    <td data-label="Status" style={{ padding: '1rem 1.5rem' }}><div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '9999px' }} /></td>
                    <td data-label="Assignee" style={{ padding: '1rem 1.5rem' }}><div className="skeleton" style={{ width: '90px', height: '16px' }} /></td>
                    <td className="actions-cell" style={{ padding: '1rem 1.5rem', textAlign: 'right' }}><div className="skeleton" style={{ width: '70px', height: '30px', borderRadius: 'var(--radius-sm)', marginLeft: 'auto' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem 2rem' }}>
            <AlertTriangle size={32} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
            <h4 style={{ color: 'var(--text-secondary)' }}>
              {error ? 'Unable to load repair directory' : 'No matches found'}
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {error ? 'Please retry loading the data.' : 'Try refining your status or search keyword filters.'}
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr className="data-table-header-row">
                  <th style={{ padding: '1rem 1.5rem' }}>Issue details</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Category</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Priority</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Assignee</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue) => (
                  <tr key={issue._id} className="table-row-hover">
                    <td data-label="Issue details" className="issue-details-cell" style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{issue.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Loc: <strong>{issue.location}</strong> | By: {issue.reporterName} ({new Date(issue.createdAt).toLocaleDateString()})
                      </div>
                    </td>
                    <td data-label="Category" style={{ padding: '1rem 1.5rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {issue.category}
                    </td>
                    <td data-label="Priority" style={{ padding: '1rem 1.5rem' }}>
                      <span className={`badge badge-${issue.priority}`}>{issue.priority}</span>
                    </td>
                    <td data-label="Status" style={{ padding: '1rem 1.5rem' }}>
                      <span className={`badge badge-${issue.status}`}>
                        {issue.status === 'in-progress' ? 'In Progress' : issue.status}
                      </span>
                    </td>
                    <td data-label="Assignee" style={{ padding: '1rem 1.5rem', color: issue.assignedStaff ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: issue.assignedStaff ? 500 : 400 }}>
                      {issue.assignedStaff || 'Unassigned'}
                    </td>
                    <td className="actions-cell" style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <Link
                        to={`/timeline/${issue._id}`}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '2px' }}
                      >
                        <span>Manage</span>
                        <ChevronRight size={14} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
