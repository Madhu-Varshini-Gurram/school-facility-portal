import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Upload, AlertCircle, Camera, Check } from 'lucide-react';
import { apiFetch } from '../api';

export default function ReportIssue({ token }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Furniture',
    location: '',
    priority: 'medium',
    image: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image file must be under 2MB in size.');
        return;
      }
      setError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.title.trim().length < 5) {
      setError('Please provide a descriptive title (at least 5 characters).');
      return;
    }
    if (formData.description.trim().length < 15) {
      setError('Please provide more description details (at least 15 characters).');
      return;
    }
    if (!formData.location.trim()) {
      setError('Please specify the exact location of the infrastructure issue.');
      return;
    }

    setLoading(true);

    try {
      await apiFetch('/api/issues', {
        method: 'POST',
        body: JSON.stringify(formData)
      }, token);

      setSubmitted(true);
      setFormData({
        title: '',
        description: '',
        category: 'Furniture',
        location: '',
        priority: 'medium',
        image: ''
      });
      setPreview(null);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Something went wrong while reporting the issue.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="content-container success-page">
        <div className="card animate-fade-in success-card" role="status">
          <div className="success-icon">
            <Check size={36} aria-hidden="true" />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Report Submitted!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            The infrastructure report has been recorded. Administrators have been notified. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container report-page">
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="btn btn-secondary"
        style={{ marginBottom: '1.5rem', padding: '0.4rem 1rem' }}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Back to Dashboard</span>
      </button>

      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Report Infrastructure Issue</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Help us maintain a safe school environment by providing detailed, accurate reports of infrastructure damage.
        </p>
      </div>

      {error && (
        <div className="alert-error" role="alert">
          <AlertCircle size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-2 animate-fade-in report-grid">
        <form onSubmit={handleSubmit} className="card report-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="title">Issue Title</label>
            <input
              id="title"
              type="text"
              name="title"
              placeholder="e.g., Broken fan in Classroom 3B"
              className="input-control"
              value={formData.title}
              onChange={handleChange}
              required
              minLength={5}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              className="input-control"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="Furniture">Furniture & Desks</option>
              <option value="Sanitation">Sanitation & Washrooms</option>
              <option value="Electrical">Electrical & Fans</option>
              <option value="Structural">Structural & Classroom walls</option>
              <option value="Safety">Safety & Hazards</option>
              <option value="Other">Other / Miscellaneous</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="location">Exact Location</label>
            <input
              id="location"
              type="text"
              name="location"
              placeholder="e.g., Main building, Floor 2, Room 204"
              className="input-control"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <fieldset className="form-group priority-fieldset">
            <legend className="form-label">Priority Level</legend>
            <div className="priority-options">
              {['low', 'medium', 'high'].map((lvl) => (
                <label key={lvl} className={`priority-option priority-option-${lvl} ${formData.priority === lvl ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="priority"
                    value={lvl}
                    checked={formData.priority === lvl}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  {lvl}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Description Details</label>
            <textarea
              id="description"
              name="description"
              rows="4"
              placeholder="Provide a description of the condition, safety issues, and what needs repair..."
              className="input-control"
              value={formData.description}
              onChange={handleChange}
              required
              minLength={15}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            <Send size={18} aria-hidden="true" />
            <span>{loading ? 'Submitting Report...' : 'Submit Condition Report'}</span>
          </button>
        </form>

        <div className="report-upload-column">
          <div className="card upload-dropzone">
            {preview ? (
              <div className="upload-preview">
                <img src={preview} alt="Preview of uploaded issue photo" className="upload-preview-img" />
                <button
                  type="button"
                  onClick={() => { setPreview(null); setFormData(prev => ({ ...prev, image: '' })); }}
                  className="btn btn-danger"
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                >
                  Remove Photo
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div className="upload-icon-circle">
                  <Camera size={28} aria-hidden="true" />
                </div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Upload Photo of Condition</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '240px', margin: '0 auto 1.5rem auto' }}>
                  Upload clear photos showing the damage to help repairs teams understand what tools are required.
                </p>
                <label className="btn btn-secondary upload-label">
                  <Upload size={16} aria-hidden="true" />
                  <span>Choose Photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="card guideline-card">
            <h4 className="guideline-title">
              <AlertCircle size={16} aria-hidden="true" style={{ color: 'var(--color-primary)' }} />
              Important Guideline
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Report issues directly to aid the school maintenance office. If you notice hazardous electrical wires, major water leaks, or collapsed desks that pose immediate physical danger to children, mark them as <strong>HIGH PRIORITY</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
