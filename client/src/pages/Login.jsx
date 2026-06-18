import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User as UserIcon, School, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { apiFetch } from '../api';

export default function Login({ onLogin, mode = 'login' }) {
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'parent',
    schoolId: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [mode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isRegister && formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (isForgot) {
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    const endpoint = isForgot ? '/api/auth/forgot-password' : (isRegister ? '/api/auth/register' : '/api/auth/login');
    
    let payload;
    if (isForgot) {
      payload = { email: formData.email, schoolId: formData.schoolId, newPassword: formData.password };
    } else if (isRegister) {
      payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        schoolId: formData.schoolId
      };
    } else {
      payload = { email: formData.email, password: formData.password };
    }

    try {
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (isForgot) {
        setSuccess('Password reset successfully. Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        onLogin(data.token, data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="card animate-fade-in login-card">
        <div className="login-header">
          <h2>{isForgot ? 'Reset Password' : (isRegister ? 'Create Account' : 'Welcome Back')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isForgot
              ? 'Verify your credentials to reset your password'
              : (isRegister
                ? 'Join the school infrastructure improvement initiative'
                : 'Sign in to report and track infrastructure issues')}
          </p>
        </div>

        {error && (
          <div className="alert-error" role="alert">
            <ShieldAlert size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-success" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', backgroundColor: 'var(--status-resolved-light)', color: 'var(--status-resolved)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.9rem' }}>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <div className="input-with-icon">
                <UserIcon size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  className="input-control input-with-icon-padding"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" aria-hidden="true" />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@school.org"
                className="input-control input-with-icon-padding"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {(isRegister || isForgot) && (
            <div className="form-group">
              <label className="form-label" htmlFor="schoolId">School ID</label>
              <div className="input-with-icon">
                <School size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="schoolId"
                  type="text"
                  name="schoolId"
                  placeholder="SCH-90210"
                  className="input-control input-with-icon-padding"
                  value={formData.schoolId}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              {isForgot ? 'New Password' : 'Password'}
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                className="input-control input-with-icon-padding input-with-right-icon-padding"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={isRegister || isForgot ? 6 : undefined}
                autoComplete={isForgot || isRegister ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {isForgot && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••"
                  className="input-control input-with-icon-padding input-with-right-icon-padding"
                  value={formData.confirmPassword || ''}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {!isRegister && !isForgot && (
            <div style={{ textAlign: 'right', marginTop: '-0.75rem', marginBottom: '1.1rem' }}>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="auth-toggle-btn"
                style={{ fontSize: '0.85rem' }}
              >
                Forgot Password?
              </button>
            </div>
          )}

          {isRegister && (
            <div className="form-group">
              <label className="form-label" htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                className="input-control"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="parent">Parent</option>
                <option value="teacher">Teacher</option>
                <option value="admin">School Administrator</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isForgot ? 'Reset Password' : (isRegister ? 'Create Account' : 'Sign In'))}
          </button>
        </form>

        <div className="auth-toggle-section">
          {isForgot ? (
            <>
              Remember your password?
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="auth-toggle-btn"
              >
                Sign In
              </button>
            </>
          ) : isRegister ? (
            <>
              Already have an account?
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="auth-toggle-btn"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Need an account?
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="auth-toggle-btn"
              >
                Register Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
