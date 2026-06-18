import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Bell, Shield, LogOut, Wrench, Menu, X } from 'lucide-react';

export default function Navbar({ user, notifications, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const navbarRef = useRef(null);
  const skipInitialAnimation = useRef(true);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    if (skipInitialAnimation.current) {
      skipInitialAnimation.current = false;
      return;
    }
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [menuOpen]);

  useEffect(() => {
    let resizeTimer;
    function handleResize() {
      document.body.classList.add('resize-animation-stopper');
      setMenuOpen(false);
      setIsAnimating(false);
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        document.body.classList.remove('resize-animation-stopper');
      }, 400);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      document.body.classList.remove('resize-animation-stopper');
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuOpen && navbarRef.current && !navbarRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const navLinks = user ? (
    <>
      <Link
        to="/dashboard"
        className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
        onClick={() => setMenuOpen(false)}
      >
        <Home size={18} aria-hidden="true" />
        <span>Dashboard</span>
      </Link>

      {user.role !== 'admin' && (
        <Link
          to="/report"
          className={`navbar-link ${location.pathname === '/report' ? 'active' : ''}`}
          onClick={() => setMenuOpen(false)}
        >
          <PlusCircle size={18} aria-hidden="true" />
          <span>Report Issue</span>
        </Link>
      )}

      {user.role === 'admin' && (
        <Link
          to="/admin"
          className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`}
          onClick={() => setMenuOpen(false)}
        >
          <Shield size={18} aria-hidden="true" />
          <span>Admin Panel</span>
        </Link>
      )}

      <Link
        to="/notifications"
        className={`navbar-link ${location.pathname === '/notifications' ? 'active' : ''}`}
        onClick={() => setMenuOpen(false)}
      >
        <div className="navbar-badge-container">
          <Bell size={18} aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="navbar-badge" aria-label={`${unreadCount} unread notifications`}>
              {unreadCount}
            </span>
          )}
        </div>
        <span>Alerts</span>
      </Link>

      <div className="navbar-user">
        <div className="navbar-avatar" aria-hidden="true">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="navbar-user-info">
          <span className="navbar-user-name">{user.name}</span>
          <span className="navbar-user-role">
            {user.role} ({user.schoolId})
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-secondary navbar-logout-btn"
          title="Log Out"
          aria-label="Log out"
        >
          <LogOut size={16} aria-hidden="true" />
        </button>
      </div>
    </>
  ) : (
    <div className="navbar-auth-actions">
      <Link
        to="/login"
        className={`btn navbar-auth-btn ${location.pathname === '/login' ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => setMenuOpen(false)}
      >
        Sign In
      </Link>
      <Link
        to="/register"
        className={`btn navbar-auth-btn ${location.pathname === '/register' ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => setMenuOpen(false)}
      >
        Register
      </Link>
    </div>
  );

  return (
    <nav ref={navbarRef} className="navbar" aria-label="Main navigation">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <Wrench size={24} className="text-primary" aria-hidden="true" />
          <span>School Repair</span>
        </Link>

        <button
          type="button"
          className="navbar-toggle"
          onClick={() => setMenuOpen(prev => !prev)}
          aria-expanded={menuOpen}
          aria-controls="navbar-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <button
          type="button"
          className={`navbar-overlay ${menuOpen ? 'active' : ''} ${isAnimating ? 'menu-animating' : ''}`}
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
          aria-hidden={!menuOpen}
          tabIndex={menuOpen ? 0 : -1}
        />

        <div
          id="navbar-menu"
          className={`navbar-links ${menuOpen ? 'active' : ''} ${isAnimating ? 'menu-animating' : ''}`}
        >
          {navLinks}
        </div>
      </div>
    </nav>
  );
}
