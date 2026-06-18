import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, BellOff, ExternalLink, Calendar, AlertCircle } from 'lucide-react';
import { apiFetch } from '../api';

export default function Notifications({ token, notifications, notificationsLoading, onRefreshNotifications }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const markAsRead = async (id) => {
    try {
      await apiFetch(`/api/notifications/${id}`, { method: 'PUT' }, token);
      onRefreshNotifications();
    } catch (err) {
      setError(err.message || 'Failed to mark notification as read.');
    }
  };

  const markAllRead = async () => {
    setActionLoading(true);
    setError('');
    try {
      await apiFetch('/api/notifications/read/all', { method: 'PUT' }, token);
      onRefreshNotifications();
    } catch (err) {
      setError(err.message || 'Failed to mark all notifications as read.');
    } finally {
      setActionLoading(false);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="content-container notifications-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">School Alerts & Notifications</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Stay updated on repair statuses, schedules, and resolution comments for reported facilities.
          </p>
        </div>

        {unreadNotifications.length > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="btn btn-secondary"
            disabled={actionLoading || notificationsLoading}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <CheckSquare size={16} aria-hidden="true" />
            <span>{actionLoading ? 'Marking...' : 'Mark all as read'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="alert-error" role="alert" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {notificationsLoading ? (
        <div className="notifications-loading" role="status" aria-live="polite">
          {Array(3).fill(0).map((_, idx) => (
            <div key={idx} className="card notification-skeleton">
              <div className="skeleton" style={{ width: '70%', height: '16px', marginBottom: '0.5rem' }} />
              <div className="skeleton" style={{ width: '40%', height: '12px' }} />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card animate-fade-in empty-state">
          <BellOff size={48} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          <h3 style={{ fontSize: '1.4rem' }}>All caught up!</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '360px', margin: '0 auto' }}>
            You have no notifications. Updates on infrastructure reports and scheduling changes will appear here.
          </p>
        </div>
      ) : (
        <div className="notifications-list animate-fade-in">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`card animate-fade-in notification-card ${notif.read ? 'notification-read' : 'notification-unread'}`}
            >
              <div className="notification-content">
                {!notif.read && (
                  <div className="notification-unread-dot" aria-hidden="true" />
                )}

                <div style={{ flex: 1 }}>
                  <p className={`notification-message ${notif.read ? 'read' : 'unread'}`}>
                    {notif.message}
                  </p>

                  <div className="notification-timestamp">
                    <Calendar size={12} aria-hidden="true" />
                    <span>{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="notification-actions">
                {notif.issueId && (
                  <Link
                    to={`/timeline/${notif.issueId}`}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => { if (!notif.read) markAsRead(notif._id); }}
                  >
                    <span>Track</span>
                    <ExternalLink size={12} aria-hidden="true" />
                  </Link>
                )}

                {!notif.read && (
                  <button
                    type="button"
                    onClick={() => markAsRead(notif._id)}
                    className="notification-mark-read"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
