import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMessage } from '../lib/utils.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      navigate('/dashboard/apply', { replace: true });
    } catch (err) {
      setError(errMessage(err, 'Registration failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-side">
        <div className="brand" style={{ display: 'flex', gap: 12, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div className="brand-mark">M</div>
          <div>
            <div className="brand-name">Meridian Institute of Technology</div>
            <div className="brand-tag">Admissions Portal</div>
          </div>
        </div>
        <div className="auth-quote">
          <blockquote>
            “The beautiful thing about learning is that no one can take it away from <em>you</em>.”
          </blockquote>
          <div className="who">— B.B. King</div>
          <div className="stats-row">
            <div><b>3 min</b><span>To complete your application</span></div>
            <div><b>100%</b><span>Online process</span></div>
            <div><b>Real-time</b><span>Status updates</span></div>
          </div>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-card">
          <h1>Create your account</h1>
          <p className="sub">One account for applications, documents, payments and updates.</p>
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={submit}>
            <div className="field">
              <label>Full name <span className="req">*</span></label>
              <input required placeholder="As per 10th certificate" value={form.name} onChange={set('name')} />
            </div>
            <div className="field">
              <label>Email address <span className="req">*</span></label>
              <input type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} />
            </div>
            <div className="field">
              <label>Mobile number</label>
              <input placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Password <span className="req">*</span></label>
                <input type="password" required minLength={6} placeholder="Min 6 characters" value={form.password} onChange={set('password')} />
              </div>
              <div className="field">
                <label>Confirm password <span className="req">*</span></label>
                <input type="password" required placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} />
              </div>
            </div>
            <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
              {busy ? 'Creating account…' : 'Create account & start application'}
            </button>
          </form>
          <p style={{ marginTop: 18, fontSize: 14 }}>
            Already registered? <Link to="/login"><b>Sign in</b></Link>
          </p>
        </div>
      </div>
    </div>
  );
}
