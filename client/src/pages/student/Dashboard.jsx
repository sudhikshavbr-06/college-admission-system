import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { EmptyState } from '../../components/ui.jsx';
import { fmtDate, inr } from '../../lib/utils.js';

const STEPS = ['submitted', 'under_review', 'verified', 'accepted'];

function StatusStepper({ status }) {
  if (status === 'rejected') {
    return (
      <div className="stepper">
        <div className="step done"><div className="step-dot">✓</div><span>Submitted</span></div>
        <div className="step rejected"><div className="step-dot">✕</div><span>Rejected</span></div>
      </div>
    );
  }
  if (status === 'documents_pending') {
    return (
      <div className="stepper">
        <div className="step done"><div className="step-dot">✓</div><span>Submitted</span></div>
        <div className="step current"><div className="step-dot">!</div><span>Docs Pending</span></div>
        <div className="step"><div className="step-dot">3</div><span>Verified</span></div>
        <div className="step"><div className="step-dot">4</div><span>Accepted</span></div>
      </div>
    );
  }
  const idx = STEPS.indexOf(status);
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <div key={s} className={`step ${i < idx ? 'done' : i === idx ? 'current' : ''}`}>
          <div className="step-dot">{i < idx ? '✓' : i + 1}</div>
          <span>{s === 'under_review' ? 'Under Review' : s[0].toUpperCase() + s.slice(1)}</span>
        </div>
      ))}
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [due, setDue] = useState([]);

  const load = useCallback(() => {
    api.get('/applications/mine').then((r) => setApp(r.data)).finally(() => setLoading(false));
    api.get('/payments/due').then((r) => setDue(r.data.items || [])).catch(() => {});
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    const onChange = () => load();
    window.addEventListener('server:refresh', onChange);
    return () => window.removeEventListener('server:refresh', onChange);
  }, [load]);

  if (loading) return <p style={{ color: 'var(--muted)' }}>Loading your application…</p>;

  if (!app) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Welcome, {user?.name?.split(' ')[0]} 👋</h1>
            <p>Your admission journey starts here.</p>
          </div>
        </div>
        <div className="card card-pad">
          <EmptyState
            icon="🚀"
            title="You haven't applied yet"
            message="Complete the three-step application — personal details, academics and course selection — in under five minutes."
            action={<Link to="/dashboard/apply" className="btn btn-primary btn-lg">Start Application →</Link>}
          />
        </div>
      </>
    );
  }

  const docs = app.documents || [];
  const verifiedDocs = docs.filter((d) => d.status === 'verified').length;
  const rejectedDocs = docs.filter((d) => d.status === 'rejected');

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Application {app.applicationNumber}</h1>
          <p>{app.course?.degree} {app.course?.name} · <StatusBadge quota={app.quota} /> · Category {app.category}</p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <StatusStepper status={app.status} />
        {app.adminRemark && (
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 14 }}>
            <b>Admissions office:</b> {app.adminRemark}
          </p>
        )}
      </div>

      <div className="grid-2-1" style={{ marginBottom: 20 }}>
        <div className="card card-pad">
          <h3 className="card-title">Your checklist</h3>
          <p className="card-sub">Complete these steps to secure your seat.</p>
          <div className="check-item">
            <div className={`check-ico ${docs.length > 0 ? 'done' : 'todo'}`}>{docs.length > 0 ? '✓' : '•'}</div>
            <div style={{ flex: 1 }}>
              <b>Upload required documents</b>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{verifiedDocs}/{Math.max(docs.length, 1)} verified{docs.length === 0 ? ' — none uploaded yet' : ''}</div>
            </div>
            <Link to="/dashboard/documents" className="btn btn-outline btn-sm">Manage</Link>
          </div>
          <div className="check-item">
            <div className={`check-ico ${due.length === 0 ? 'done' : 'todo'}`}>{due.length === 0 ? '✓' : '•'}</div>
            <div style={{ flex: 1 }}>
              <b>{due.length > 0 ? `Fee payment due (${due.length})` : 'All fees cleared'}</b>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                {due.length > 0 ? `${inr(due.reduce((s, d) => s + d.amount, 0))} outstanding` : 'Thank you!'}
              </div>
            </div>
            <Link to="/dashboard/payments" className="btn btn-outline btn-sm">{due.length ? 'Pay now' : 'Receipts'}</Link>
          </div>
          <div className="check-item">
            <div className={`check-ico ${['verified', 'accepted'].includes(app.status) ? 'done' : 'todo'}`}>{['verified', 'accepted'].includes(app.status) ? '✓' : '•'}</div>
            <div style={{ flex: 1 }}>
              <b>Application verification</b>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                {['verified', 'accepted'].includes(app.status) ? 'Verified by admissions office' : 'Awaiting review by admissions office'}
              </div>
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <h3 className="card-title">Recent activity</h3>
          <p className="card-sub">Timeline of your application.</p>
          <ul className="timeline">
            {[...app.timeline].reverse().slice(0, 6).map((t, i) => (
              <li key={i}>
                <b>{t.status.replaceAll('_', ' ')}</b>
                <p>{t.note}</p>
                <span>{fmtDate(t.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {rejectedDocs.length > 0 && (
        <div className="card card-pad" style={{ borderLeft: '4px solid var(--danger)' }}>
          <h3 className="card-title">⚠️ Action required — re-upload documents</h3>
          {rejectedDocs.map((d) => (
            <p key={d._id} style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 6 }}>
              <b>{d.type.replaceAll('_', ' ')}</b>{d.remarks ? ` — ${d.remarks}` : ''}
            </p>
          ))}
          <Link to="/dashboard/documents" className="btn btn-danger btn-sm" style={{ marginTop: 12 }}>Re-upload now</Link>
        </div>
      )}
    </>
  );
}
