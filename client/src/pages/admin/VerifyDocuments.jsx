import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api.js';
import { fmtDateTime, DOC_TYPE_LABELS, errMessage } from '../../lib/utils.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import { EmptyState, Spinner } from '../../components/ui.jsx';

export default function VerifyDocuments() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyDoc, setBusyDoc] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/applications', { params: { hasPendingDocs: '1' } });
      setApps(res.data);
    } catch {
      /* empty state */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('server:refresh', handler);
    return () => window.removeEventListener('server:refresh', handler);
  }, [load]);

  const reviewDoc = async (app, doc, next) => {
    setBusyDoc(doc._id);
    setError('');
    try {
      const remarks = next === 'rejected' ? window.prompt('Reason for rejection (shown to the student):') ?? '' : '';
      await api.put(`/applications/${app._id}/documents/${doc._id}`, { status: next, remarks });
      await load();
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusyDoc(null);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Document Verification</h1>
          <p>Queue of uploaded documents awaiting review — verify all docs to auto-advance the application</p>
        </div>
        <span className="live-pill"><span className="live-dot" /> Live</span>
      </header>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <div className="center-pad"><Spinner /></div>
      ) : apps.length === 0 ? (
        <EmptyState icon="✅" title="Queue is clear" message="No documents are waiting for verification right now." />
      ) : (
        <div className="verify-stack">
          {apps.map((a) => {
            const pending = a.documents?.filter((d) => d.status === 'pending') || [];
            const verified = a.documents?.filter((d) => d.status === 'verified') || [];
            const rejected = a.documents?.filter((d) => d.status === 'rejected') || [];
            return (
              <div key={a._id} className="panel verify-card">
                <div className="verify-card-head">
                  <div>
                    <div className="cell-with-avatar">
                      <span className="avatar">{a.personal?.fullName?.charAt(0)}</span>
                      <div>
                        <b>{a.personal?.fullName}</b>
                        <span className="cell-sub mono"> {a.applicationNumber}</span>
                      </div>
                    </div>
                    <p className="cell-sub">{a.course?.name} · {a.academic?.twelfth?.cutOffMark ?? '—'}/200 · <StatusBadge status={a.status} /></p>
                  </div>
                  <div className="verify-counts">
                    <span className="badge badge-verified">{verified.length} verified</span>
                    <span className="badge badge-docs">{pending.length} pending</span>
                    {rejected.length > 0 && <span className="badge badge-rejected">{rejected.length} rejected</span>}
                  </div>
                </div>
                <div className="doc-review-list">
                  {pending.map((d) => (
                    <div key={d._id} className="doc-review-row pending">
                      <div className="doc-review-info">
                        <b>{DOC_TYPE_LABELS[d.type] || d.type}</b>
                        <a href={d.url} target="_blank" rel="noreferrer" className="doc-link">{d.originalName}</a>
                        <span className="cell-sub">Uploaded {fmtDateTime(d.uploadedAt)}</span>
                      </div>
                      <div className="doc-review-actions">
                        <button className="btn btn-success btn-sm" disabled={busyDoc === d._id} onClick={() => reviewDoc(a, d, 'verified')}>
                          {busyDoc === d._id ? <Spinner /> : 'Verify'}
                        </button>
                        <button className="btn btn-danger btn-sm" disabled={busyDoc === d._id} onClick={() => reviewDoc(a, d, 'rejected')}>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  {rejected.map((d) => (
                    <div key={d._id} className="doc-review-row rejected">
                      <div className="doc-review-info">
                        <b>{DOC_TYPE_LABELS[d.type] || d.type}</b>
                        <span className="doc-remarks">{d.remarks || 'Rejected'}</span>
                      </div>
                      <div className="doc-review-actions">
                        <span className="badge badge-rejected">Rejected</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
