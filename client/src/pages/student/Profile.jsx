import { useState } from 'react';
import api from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { errMessage } from '../../lib/utils.js';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      const res = await api.put('/auth/profile', { name, phone });
      setUser(res.data.user);
      localStorage.setItem('mit_user', JSON.stringify(res.data.user));
      setMsg('Profile updated successfully.');
    } catch (err) {
      setError(errMessage(err));
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwdMsg('');
    setPwdError('');
    try {
      await api.put('/auth/password', pwd);
      setPwdMsg('Password changed successfully.');
      setPwd({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPwdError(errMessage(err));
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My Profile</h1>
          <p>Account details and security.</p>
        </div>
      </div>
      <div className="grid-2">
        <div className="card card-pad">
          <h3 className="card-title">Account information</h3>
          <p className="card-sub">Email and role cannot be changed.</p>
          {msg && <div className="form-success">{msg}</div>}
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={saveProfile}>
            <div className="field">
              <label>Email</label>
              <input value={user?.email || ''} disabled style={{ background: '#f6f8fc', color: 'var(--muted)' }} />
            </div>
            <div className="field">
              <label>Role</label>
              <input value={user?.role === 'admin' ? 'Administrator' : 'Student Applicant'} disabled style={{ background: '#f6f8fc', color: 'var(--muted)' }} />
            </div>
            <div className="field">
              <label>Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Mobile number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <button className="btn btn-primary">Save changes</button>
          </form>
        </div>

        <div className="card card-pad">
          <h3 className="card-title">Change password</h3>
          <p className="card-sub">Use at least 6 characters.</p>
          {pwdMsg && <div className="form-success">{pwdMsg}</div>}
          {pwdError && <div className="form-error">{pwdError}</div>}
          <form onSubmit={savePassword}>
            <div className="field">
              <label>Current password</label>
              <input type="password" required value={pwd.currentPassword}
                onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
            </div>
            <div className="field">
              <label>New password</label>
              <input type="password" required minLength={6} value={pwd.newPassword}
                onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
            </div>
            <button className="btn btn-outline">Update password</button>
          </form>
        </div>
      </div>
    </>
  );
}
