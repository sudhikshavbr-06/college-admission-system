import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMessage } from '../lib/utils.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(form.email, form.password);
      const from = location.state?.from;
      navigate(from || (user.role === 'admin' ? '/admin' : '/dashboard'), { replace: true });
    } catch (err) {
      setError(errMessage(err, 'Login failed'));
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
            “An investment in knowledge pays the <em>best interest</em>.”
          </blockquote>
          <div className="who">— Benjamin Franklin</div>
          <div className="stats-row">
            <div><b>96%</b><span>Placement rate</span></div>
            <div><b>240+</b><span>Recruiters</span></div>
            <div><b>A++</b><span>NAAC accredited</span></div>
          </div>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="sub">Sign in to continue your admission journey.</p>
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={submit}>
            <div className="field">
              <label>Email address</label>
              <input
                type="email" required placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password" required placeholder="••••••••" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p style={{ marginTop: 18, fontSize: 14 }}>
            New applicant? <Link to="/register"><b>Create an account</b></Link>
          </p>
          <div className="demo-creds">
            <p>Demo credentials — click to fill</p>
            <div className="demo-chips">
              <button type="button" className="demo-chip" onClick={() => setForm({ email: 'admin@meridian.edu', password: 'Admin@123' })}>
                <b>👑 Admin console</b><span>admin@meridian.edu / Admin@123</span>
              </button>
              <button type="button" className="demo-chip" onClick={() => setForm({ email: 'student@meridian.edu', password: 'Student@123' })}>
                <b>🎓 Student portal</b><span>student@meridian.edu / Student@123</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
