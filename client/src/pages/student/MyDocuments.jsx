import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { DOC_TYPE_LABELS, errMessage } from '../../lib/utils.js';

const REQUIRED = ['photo', 'id_proof', 'tenth_marksheet', 'twelfth_marksheet', 'transfer_certificate'];

export default function MyDocuments() {
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({});
  const inputsRef = useRef({});

  const load = useCallback(() => {
    api.get('/applications/mine')
      .then((r) => setApp(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  if (loading) return <p style={{ color: 'var(--muted)' }}>Loading documents…</p>;

  if (!app) {
    return (
      <div className="card card-pad" style={{ textAlign: 'center' }}>
        <h3>No application found</h3>
        <p style={{ color: 'var(--muted)', margin: '8px 0 16px' }}>Submit your application first, then upload documents.</p>
        <Link to="/dashboard/apply" className="btn btn-primary">Start Application</Link>
      </div>
    );
  }

  const docsByType = Object.fromEntries((app.documents || []).map((d) => [d.type, d]));
  const rows = [...REQUIRED.map((k) => ({ key: k, required: true })),
    ...['community_certificate', 'income_certificate']
      .filter((k) => docsByType[k] || app.category !== 'OC' || app.quota === 'scholarship')
      .map((k) => ({ key: k, required: false }))];

  const upload = async (type, file) => {
    if (!file) return;
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    try {
      const res = await api.post(`/applications/${app._id}/documents`, fd, {
        onUploadProgress: (e) => setProgress((p) => ({ ...p, [type]: Math.round((e.loaded / (e.total || 1)) * 100) })),
      });
      setApp(res.data);
      setProgress((p) => ({ ...p, [type]: 0 }));
    } catch (err) {
      setError(errMessage(err, 'Upload failed'));
      setProgress((p) => ({ ...p, [type]: 0 }));
    }
  };

  const badgeCls = (status) => `badge badge-doc-${status}`;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Documents & Proofs</h1>
          <p>Upload clear scans (PDF/JPG/PNG, max 5 MB). The admissions office verifies each document — you'll get a live notification with the result.</p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="card card-pad">
        {rows.map(({ key, required }) => {
          const doc = docsByType[key];
          const pct = progress[key];
          return (
            <div className="doc-row" key={key}>
              <div className="doc-info">
                <b>{DOC_TYPE_LABELS[key]} {required && <span style={{ color: 'var(--danger)' }}>*</span>}</b>
                {doc ? (
                  <span>
                    📎 <a href={doc.url} target="_blank" rel="noreferrer">{doc.originalName}</a>
                    {' · '}uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                  </span>
                ) : (
                  <span>No file uploaded yet</span>
                )}
                {doc?.status === 'rejected' && doc.remarks && <div className="remarks">✕ {doc.remarks}</div>}
              </div>
              {doc && <span className={badgeCls(doc.status)}>{doc.status}</span>}
              {doc?.status !== 'verified' && (
                <div className="doc-upload" style={{ minWidth: 190, flexDirection: 'column', gap: 6 }}>
                  <div
                    className="upload-zone"
                    style={{ width: '100%' }}
                    onClick={() => inputsRef.current[key]?.click()}
                  >
                    {pct ? `Uploading… ${pct}%` : doc ? '↻ Re-upload' : '⬆ Upload file'}
                  </div>
                  {pct > 0 && <div className="progress" style={{ width: '100%' }}><div style={{ width: `${pct}%` }} /></div>}
                  <input
                    ref={(el) => (inputsRef.current[key] = el)}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    hidden
                    onChange={(e) => upload(key, e.target.files[0])}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
