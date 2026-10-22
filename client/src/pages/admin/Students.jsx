import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api.js';
import { fmtDate } from '../../lib/utils.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import { EmptyState, Spinner } from '../../components/ui.jsx';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [withApps, setWithApps] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/users/students', { params });
      setStudents(res.data);
    } catch {
      /* empty state */
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener('server:refresh', handler);
    return () => window.removeEventListener('server:refresh', handler);
  }, [load]);

  const shown = withApps ? students.filter((s) => s.application) : students;
  const applied = students.filter((s) => s.application).length;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Student Database</h1>
          <p>{students.length} registered · {applied} with an application on file</p>
        </div>
        <label className="check-inline">
          <input type="checkbox" checked={withApps} onChange={(e) => setWithApps(e.target.checked)} />
          Only applicants
        </label>
      </header>

      <div className="filter-bar">
        <input className="field" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="center-pad"><Spinner /></div>
      ) : shown.length === 0 ? (
        <EmptyState icon="👥" title="No students found" message="Adjust the search or filters." />
      ) : (
        <div className="table-wrap panel">
          <table className="data">
            <thead>
              <tr>
                <th>Student</th>
                <th>Contact</th>
                <th>Application</th>
                <th>Course</th>
                <th>Quota</th>
                <th>Status</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="cell-with-avatar">
                      <span className="avatar">{s.name?.charAt(0).toUpperCase()}</span>
                      <b>{s.name}</b>
                    </div>
                  </td>
                  <td>
                    <div className="cell-main">{s.email}</div>
                    <div className="cell-sub">{s.phone || '—'}</div>
                  </td>
                  <td className="mono">{s.application?.applicationNumber || '—'}</td>
                  <td>{s.application?.course || '—'}</td>
                  <td>{s.application ? <StatusBadge quota={s.application.quota} /> : '—'}</td>
                  <td>{s.application ? <StatusBadge status={s.application.status} /> : <span className="badge badge-docs">Not applied</span>}</td>
                  <td>{fmtDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
