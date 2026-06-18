import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import Timeline from './pages/Timeline';
import Notifications from './pages/Notifications';
import AdminPanel from './pages/AdminPanel';
import { apiFetch, setUnauthorizedHandler } from './api';

function getStoredAuth() {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  if (!storedToken || !storedUser) return { token: '', user: null };
  try {
    return { token: storedToken, user: JSON.parse(storedUser) };
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { token: '', user: null };
  }
}

function AppRoutes() {
  const initialAuth = getStoredAuth();
  const [token, setToken] = useState(initialAuth.token);
  const [user, setUser] = useState(initialAuth.user);
  const [authLoading, setAuthLoading] = useState(!!initialAuth.token);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setNotifications([]);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      handleLogout();
    });
    return () => setUnauthorizedHandler(null);
  }, [handleLogout]);

  useEffect(() => {
    if (!token) {
      setAuthLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const profile = await apiFetch('/api/auth/me', {}, token);
        if (cancelled) return;
        const syncedUser = {
          id: profile._id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          schoolId: profile.schoolId
        };
        setUser(syncedUser);
        localStorage.setItem('user', JSON.stringify(syncedUser));
      } catch {
        if (!cancelled) handleLogout();
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token, handleLogout]);

  const fetchNotifications = useCallback(async () => {
    const activeToken = localStorage.getItem('token');
    if (!activeToken) return;

    setNotificationsLoading(true);
    try {
      const data = await apiFetch('/api/notifications', {}, activeToken);
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err.message);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token && user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
    setNotifications([]);
  }, [token, user, fetchNotifications]);

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setAuthLoading(false);
  };

  if (authLoading) {
    return (
      <div className="app-container">
        <div className="auth-loading" role="status" aria-live="polite">
          <div className="skeleton skeleton-circle" style={{ width: '48px', height: '48px', marginBottom: '1rem' }} />
          <p>Loading your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar user={user} notifications={notifications} onLogout={handleLogout} />

      <main id="main-content">
        <Routes>
          <Route
            path="/login"
            element={!token ? <Login onLogin={handleLogin} mode="login" /> : <Navigate to="/dashboard" replace />}
          />

          <Route
            path="/register"
            element={!token ? <Login onLogin={handleLogin} mode="register" /> : <Navigate to="/dashboard" replace />}
          />

          <Route
            path="/forgot-password"
            element={!token ? <Login onLogin={handleLogin} mode="forgot" /> : <Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={token ? <Dashboard user={user} token={token} /> : <Navigate to="/login" replace />}
          />

          <Route
            path="/report"
            element={
              token ? (
                user?.role !== 'admin' ? (
                  <ReportIssue token={token} />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/timeline/:id"
            element={token ? <Timeline user={user} token={token} /> : <Navigate to="/login" replace />}
          />

          <Route
            path="/notifications"
            element={
              token ? (
                <Notifications
                  token={token}
                  notifications={notifications}
                  notificationsLoading={notificationsLoading}
                  onRefreshNotifications={fetchNotifications}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/admin"
            element={
              token ? (
                user?.role === 'admin' ? (
                  <AdminPanel token={token} />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/"
            element={<Navigate to={token ? '/dashboard' : '/login'} replace />}
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <AppRoutes />
    </Router>
  );
}
