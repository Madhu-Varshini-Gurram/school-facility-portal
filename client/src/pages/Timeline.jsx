import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, User, Tag, ShieldCheck, AlertCircle } from 'lucide-react';
import { apiFetch, formatStatus } from '../api';

export default function Timeline({ user, token }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateError, setUpdateError] = useState('');

  const [adminForm, setAdminForm] = useState({
    status: '',
    assignedStaff: '',
    estimatedResolutionTime: '',
    notes: ''
  });
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');

  const fetchIssue = useCallback(async () => {
    if (!token || !id) return;

    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/issues/${id}`, {}, token);

      setIssue(data);
      setAdminForm({
        status: data.status,
        assignedStaff: data.assignedStaff || '',
        estimatedResolutionTime: data.estimatedResolutionTime || '',
        notes: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  const handleAdminUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      const data = await apiFetch(`/api/issues/${id}`, {
        method: 'PUT',
        body: JSON.stringify(adminForm)
      }, token);

      setIssue(data);
      setAdminForm(prev => ({ ...prev, notes: '' }));
      setUpdateSuccess('Issue status and timeline logs updated successfully!');
      setTimeout(() => setUpdateSuccess(''), 4000);
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="content-container">
        <div className="skeleton" style={{ width: '150px', height: '35px', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }} />
        <div className="grid timeline-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card animate-fade-in" style={{ padding: '0', cursor: 'default' }}>
              <div className="skeleton aspect-video" style={{ borderBottom: '1px solid var(--border-color)', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }} />
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div className="skeleton" style={{ width: '80px', height: '20px', borderRadius: '9999px' }} />
                  <div className="skeleton" style={{ width: '100px', height: '20px', borderRadius: '9999px' }} />
                </div>
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" style={{ width: '100%' }} />
                <div className="skeleton skeleton-text" style={{ width: '95%' }} />
                <div className="skeleton skeleton-text" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
          <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
            <div className="skeleton" style={{ width: '200px', height: '24px', marginBottom: '1.5rem' }} />
            {Array(3).fill(0).map((_, idx) => (
              <div key={idx} className="skeleton" style={{ width: '100%', height: '60px', marginBottom: '1rem' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !issue) {
    return (
      <div className="content-container">
        <div className="card empty-state" role="alert">
          <h3 style={{ color: 'var(--status-pending)', marginBottom: '1rem' }}>Error Loading Details</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
          <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container">
      <button
        type="button"
        onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/dashboard')}
        className="btn btn-secondary"
        style={{ marginBottom: '1.5rem', padding: '0.4rem 1rem' }}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Back to Directory</span>
      </button>

      <div className="grid timeline-grid animate-fade-in" style={{ gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '0' }}>
            {issue.image ? (
              <div className="aspect-video timeline-image-banner">
                <img src={issue.image} alt={`Photo of ${issue.title}`} className="timeline-banner-img" />
                <span className={`badge badge-${issue.status} timeline-status-badge`}>
                  {formatStatus(issue.status)}
                </span>
              </div>
            ) : (
              <div className="aspect-video timeline-placeholder">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--text-muted)', opacity: 0.45 }}>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span className="timeline-no-image-label">No Image Uploaded</span>
                <span className={`badge badge-${issue.status} timeline-status-badge`}>
                  {formatStatus(issue.status)}
                </span>
              </div>
            )}

            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="badge badge-low" style={{ textTransform: 'capitalize' }}>
                  <Tag size={12} aria-hidden="true" style={{ marginRight: '4px' }} />
                  {issue.category}
                </span>
                <span className={`badge badge-${issue.priority}`}>
                  {issue.priority} Priority
                </span>
              </div>

              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{issue.title}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                {issue.description}
              </p>

              <div className="timeline-specs-grid">
                <div>
                  <div className="timeline-spec-label">
                    <MapPin size={14} aria-hidden="true" /> Location
                  </div>
                  <strong>{issue.location}</strong>
                </div>

                <div>
                  <div className="timeline-spec-label">
                    <User size={14} aria-hidden="true" /> Reporter
                  </div>
                  <strong>{issue.reporterName}</strong>
                </div>

                <div>
                  <div className="timeline-spec-label">
                    <Calendar size={14} aria-hidden="true" /> Reported Date
                  </div>
                  <strong>{new Date(issue.createdAt).toLocaleDateString()}</strong>
                </div>
              </div>

              {(issue.assignedStaff || issue.estimatedResolutionTime) && (
                <div className="timeline-maintenance-info">
                  {issue.assignedStaff && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Assigned Staff:</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {issue.assignedStaff}
                      </div>
                    </div>
                  )}
                  {issue.estimatedResolutionTime && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Est. Resolution Time:</span>
                      <div style={{ fontWeight: 600, color: 'var(--color-primary)', marginTop: '2px' }}>
                        {issue.estimatedResolutionTime}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="card admin-action-card">
              <h3 className="admin-action-title">
                <ShieldCheck size={20} className="text-primary" aria-hidden="true" />
                <span>Admin Action Center</span>
              </h3>

              <form onSubmit={handleAdminUpdate} noValidate>
                {updateSuccess && (
                  <div className="alert-success" role="status">{updateSuccess}</div>
                )}
                {updateError && (
                  <div className="alert-error" role="alert" style={{ marginBottom: '1rem' }}>
                    <AlertCircle size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
                    <span>{updateError}</span>
                  </div>
                )}

                <div className="grid grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label" htmlFor="admin-status">Repair Status</label>
                    <select
                      id="admin-status"
                      className="input-control"
                      value={adminForm.status}
                      onChange={(e) => setAdminForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="pending">Pending Review</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved / Fixed</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label" htmlFor="assigned-staff">Assigned Staff / Vendor</label>
                    <input
                      id="assigned-staff"
                      type="text"
                      className="input-control"
                      placeholder="e.g., Plumber Dave, Acme Electric"
                      value={adminForm.assignedStaff}
                      onChange={(e) => setAdminForm(prev => ({ ...prev, assignedStaff: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="est-resolution">Estimated Resolution Time</label>
                  <input
                    id="est-resolution"
                    type="text"
                    className="input-control"
                    placeholder="e.g., 2 days, By Friday morning, Completed"
                    value={adminForm.estimatedResolutionTime}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, estimatedResolutionTime: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="admin-notes">Update Logs & Progress Note</label>
                  <textarea
                    id="admin-notes"
                    rows="2"
                    className="input-control"
                    placeholder="Describe actions taken (e.g. dispatched crew, parts ordered)..."
                    value={adminForm.notes}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, notes: e.target.value }))}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={updating}
                >
                  {updating ? 'Saving Update...' : 'Commit Repair Update'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            Repair Tracking History
          </h3>

          <div className="timeline-list" style={{ flex: 1 }}>
            {issue.timeline && issue.timeline.length > 0 ? (
              issue.timeline.map((event, index) => (
                <div key={`${event.timestamp}-${index}`} className="timeline-item">
                  <div className={`timeline-dot timeline-dot-${event.status}`} />
                  <div className="timeline-header">
                    <strong style={{ textTransform: 'capitalize', fontSize: '0.95rem' }}>
                      {event.status === 'in-progress' ? 'WIP (In Progress)' : formatStatus(event.status)}
                    </strong>
                    <span className="timeline-time">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="timeline-notes">{event.notes}</div>
                </div>
              ))
            ) : (
              <div className="empty-state-inline">
                No events logged on this timeline yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
