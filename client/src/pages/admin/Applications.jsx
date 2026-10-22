import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api.js';
import { fmtDate, fmtDateTime, STATUS_LABELS, QUOTA_LABELS, DOC_TYPE_LABELS, errMessage } from '../../lib/utils.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import Modal from '../../components/Modal.jsx';
import { EmptyState, Spinner } from '../../components/ui.jsx';

const STATUS_TABS = ['', 'submitted', 'under_review', 'documents_pending', 'verified', 'accepted', 'rejected'];

const REVIEW_TRANSITIONS = {
  submitted: ['under_review', 'documents_pending', 'rejected'],
  under_review: ['verified', 'documents_pending', 'rejected'],
  documents_pending: ['verified', 'rejected'],
  verified: ['accepted', 'rejected'],
  accepted: [],
  rejected: [],
};

const TRANSITION_STYLES = {
  under_review: 'btn-outline',
  documents_pending: 'btn-warn',
  verified: 'btn-success',
  accepted: 'btn-primary',
  rejected: 'btn-danger',
};

export default function ManageApplications() {
  const [apps, setApps] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [quota, setQuota] = useState('');
  const [courseId, setCourseId] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [busyDoc, setBusyDoc] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const params = {};
      if (status) params.status = status;
      if (quota) params.quota = quota;
      if (courseId) params.courseId = courseId;
      if (search.trim()) params.search = search.trim();
      const [a, c] = await Promise.all([api.get('/applications', { params }), api.get('/courses')]);
      setApps(a.data);
      setCourses(c.data);
    } catch {
      /* handled by empty state */
    } finally {
      setLoading(false);
    }
  }, [status, quota, courseId, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener('server:refresh', handler);
    return () => window.removeEventListener('server:refresh', handler);
  }, [load]);

  const refreshSelected = async (id) => {
    try {
      const res = await api.get(`/applications/${id}`);
      setSelected(res.data);
      setApps((prev) => prev.map((a) => (a._id === id ? res.data : a)));
    } catch {
      /* keep old copy */
    }
  };

  const changeStatus = async (app, next) => {
    setError('');
    try {
      await api.put(`/applications/${app._id}/status`, { status: next, note: note.trim() || undefined });
      setNote('');
      await refreshSelected(app._id);
    } catch (err) {
      setError(errMessage(err));
    }
  };

  const reviewDoc = async (app, doc, next) => {
    setBusyDoc(doc._id);
    setError('');
    try {
      const remarks = next === 'rejected' ? window.prompt('Reason for rejection (shown to the student):') ?? '' : '';
      await api.put(`/applications/${app._id}/documents/${doc._id}`, { status: next, remarks });
      await refreshSelected(app._id);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusyDoc(null);
    }
  };

  const transitions = selected ? REVIEW_TRANSITIONS[selected.status] || [] : [];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Applications</h1>
          <p>Review, verify and decide on admission applications</p>
        </div>
      </header>

      <div className="pill-tabs">
        {STATUS_TABS.map((s) => (
          <button key={s || 'all'} className={`pill-tab ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
            {s ? STATUS_LABELS[s] : 'All'}
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <input className="field" placeholder="Search name, email, app no…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="field" value={quota} onChange={(e) => setQuota(e.target.value)}>
          <option value="">All quotas</option>
          <option value="government">Government</option>
          <option value="management">Management</option>
          <option value="scholarship">Scholarship</option>
        </select>
        <select className="field" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.code} — {c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="center-pad"><Spinner /></div>
      ) : apps.length === 0 ? (
        <EmptyState icon="🗂️" title="No applications found" message="Try changing the filters." />
      ) : (
        <div className="table-wrap panel">
          <table className="data">
            <thead>
              <tr>
                <th>App No.</th>
                <th>Student</th>
                <th>Course</th>
                <th>Quota</th>
                <th>Cut-off</th>
                <th>Status</th>
                <th>Applied</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a._id} className="row-click" onClick={() => { setSelected(a); setNote(''); setError(''); }}>
                  <td className="mono">{a.applicationNumber}</td>
                  <td>
                    <div className="cell-main">{a.personal?.fullName}</div>
                    <div className="cell-sub">{a.personal?.email}</div>
                  </td>
                  <td>{a.course?.code}</td>
                  <td><StatusBadge quota={a.quota} /></td>
                  <td className="mono">{a.academic?.twelfth?.cutOffMark ?? '—'}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>{fmtDate(a.createdAt)}</td>
                  <td><button className="btn btn-outline btn-sm">Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!selected}
        wide
        title={selected ? `${selected.applicationNumber} — ${selected.personal?.fullName}` : ''}
        subtitle={selected ? `${selected.course?.name} · ${QUOTA_LABELS[selected.quota]}` : ''}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="review-grid">
            <section className="review-section">
              <h4>Applicant Details</h4>
              <div className="kv-grid">
                <div><span>Email</span><b>{selected.personal?.email}</b></div>
                <div><span>Phone</span><b>{selected.personal?.phone || '—'}</b></div>
                <div><span>Date of Birth</span><b>{fmtDate(selected.personal?.dob)}</b></div>
                <div><span>Gender</span><b>{selected.personal?.gender || '—'}</b></div>
                <div><span>City</span><b>{selected.personal?.address?.city || '—'}</b></div>
                <div><span>Category</span><b>{selected.category}</b></div>
              </div>
              <h4>Academics</h4>
              <div className="kv-grid">
                <div><span>10th — Board</span><b>{selected.academic?.tenth?.board || '—'}</b></div>
                <div><span>10th — %</span><b>{selected.academic?.tenth?.percentage ?? '—'}%</b></div>
                <div><span>12th — Board</span><b>{selected.academic?.twelfth?.board || '—'}</b></div>
                <div><span>12th — Cut-off</span><b>{selected.academic?.twelfth?.cutOffMark ?? '—'} / 200</b></div>
              </div>
              {selected.quota === 'scholarship' && (
                <div className="kv-grid">
                  <div><span>Scholarship</span><b>{selected.scholarship?.name} ({selected.scholarship?.discountPercent}% waiver)</b></div>
                </div>
              )}
            </section>

            <section className="review-section">
              <h4>Documents ({selected.documents?.length || 0})</h4>
              {selected.documents?.length === 0 && <p className="muted">No documents uploaded yet.</p>}
              <div className="doc-review-list">
                {selected.documents?.map((d) => (
                  <div key={d._id} className={`doc-review-row ${d.status}`}>
                    <div className="doc-review-info">
                      <b>{DOC_TYPE_LABELS[d.type] || d.type}</b>
                      <a href={d.url} target="_blank" rel="noreferrer" className="doc-link">{d.originalName}</a>
                      {d.remarks && <span className="doc-remarks">{d.remarks}</span>}
                    </div>
                    <div className="doc-review-actions">
                      <span className={`badge badge-${d.status === 'verified' ? 'verified' : d.status === 'rejected' ? 'rejected' : 'docs'}`}>
                        {d.status === 'pending' ? 'Pending' : STATUS_LABELS[d.status]}
                      </span>
                      {d.status !== 'verified' && (
                        <button className="btn btn-success btn-sm" disabled={busyDoc === d._id} onClick={() => reviewDoc(selected, d, 'verified')}>
                          {busyDoc === d._id ? <Spinner /> : 'Verify'}
                        </button>
                      )}
                      {d.status !== 'rejected' && (
                        <button className="btn btn-danger btn-sm" disabled={busyDoc === d._id} onClick={() => reviewDoc(selected, d, 'rejected')}>
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="review-section">
              <h4>Decision</h4>
              {error && <p className="form-error">{error}</p>}
              <input className="field" placeholder="Optional remark for the student…" value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="decision-row">
                {transitions.length === 0 ? (
                  <p className="muted">No further transitions available — this application is {STATUS_LABELS[selected.status]}.</p>
                ) : (
                  transitions.map((s) => (
                    <button key={s} className={`btn ${TRANSITION_STYLES[s] || 'btn-outline'}`} onClick={() => changeStatus(selected, s)}>
                      {s === 'accepted' ? '✓ Accept' : s === 'rejected' ? '✕ Reject' : `Move to ${STATUS_LABELS[s]}`}
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="review-section">
              <h4>Timeline</h4>
              <div className="timeline">
                {selected.timeline?.slice().reverse().map((t, i) => (
                  <div key={i} className={`timeline-item ${t.status}`}>
                    <div className="timeline-dot" />
                    <div>
                      <b>{STATUS_LABELS[t.status] || t.status}</b>
                      <p>{t.note}</p>
                      <span>{fmtDateTime(t.at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}
