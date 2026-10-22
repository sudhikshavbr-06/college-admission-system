import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api.js';
import { errMessage } from '../../lib/utils.js';
import Modal from '../../components/Modal.jsx';
import { EmptyState, Spinner } from '../../components/ui.jsx';

const CATEGORIES = ['OC', 'BC', 'MBC', 'SC', 'ST'];
const YEARS = [2026, 2025];

const emptyForm = { courseId: '', year: 2026, quota: 'government', category: 'OC', openingMark: '', closingMark: '' };

export default function ManageCutoffs() {
  const [cutoffs, setCutoffs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('2026');
  const [quota, setQuota] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = { year };
      if (quota) params.quota = quota;
      const [c, cs] = await Promise.all([api.get('/cutoffs', { params }), api.get('/courses')]);
      setCutoffs(c.data);
      setCourses(cs.data);
    } catch {
      /* empty state */
    } finally {
      setLoading(false);
    }
  }, [year, quota]);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('server:refresh', handler);
    return () => window.removeEventListener('server:refresh', handler);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, year: Number(year) || 2026 });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      courseId: c.course?._id || '',
      year: c.year,
      quota: c.quota,
      category: c.category,
      openingMark: c.openingMark,
      closingMark: c.closingMark,
    });
    setError('');
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      course: form.courseId,
      year: Number(form.year),
      quota: form.quota,
      category: form.category,
      openingMark: Number(form.openingMark),
      closingMark: Number(form.closingMark),
    };
    try {
      if (editing) await api.put(`/cutoffs/${editing._id}`, payload);
      else await api.post('/cutoffs', payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete the ${c.category} cutoff for ${c.course?.code}?`)) return;
    try {
      await api.delete(`/cutoffs/${c._id}`);
      await load();
    } catch (err) {
      setError(errMessage(err));
    }
  };

  const grouped = courses
    .map((course) => ({
      course,
      rows: cutoffs.filter((c) => c.course?._id === course._id),
    }))
    .filter((g) => g.rows.length > 0);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Cutoff Management</h1>
          <p>Opening and closing marks by course, quota and category</p>
        </div>
        <button className="btn btn-gold" onClick={openCreate}>+ Add Cutoff</button>
      </header>

      <div className="filter-bar">
        <select className="field" value={year} onChange={(e) => setYear(e.target.value)}>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="field" value={quota} onChange={(e) => setQuota(e.target.value)}>
          <option value="">All quotas</option>
          <option value="government">Government</option>
          <option value="management">Management</option>
        </select>
      </div>

      {error && !modalOpen && <p className="form-error">{error}</p>}

      {loading ? (
        <div className="center-pad"><Spinner /></div>
      ) : grouped.length === 0 ? (
        <EmptyState icon="📊" title="No cutoffs for this filter" message="Add cutoff entries or change the year/quota." action={<button className="btn btn-gold" onClick={openCreate}>+ Add Cutoff</button>} />
      ) : (
        grouped.map(({ course, rows }) => (
          <div key={course._id} className="panel cutoff-block">
            <div className="cutoff-block-head">
              <h3><span className="mono">{course.code}</span> {course.name}</h3>
            </div>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Quota</th>
                    <th>Category</th>
                    <th>Opening</th>
                    <th>Closing</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c._id}>
                      <td>{c.quota === 'government' ? 'Government' : 'Management'}</td>
                      <td><span className="badge badge-cat">{c.category}</span></td>
                      <td className="mono">{c.openingMark}</td>
                      <td className="mono"><b>{c.closingMark}</b></td>
                      <td className="row-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Cutoff' : 'Add Cutoff'}
        subtitle="Marks are out of 200"
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={save} className="form-grid">
          <label className="field">
            <span>Course</span>
            <select required value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              <option value="">Select course…</option>
              {courses.map((c) => <option key={c._id} value={c._id}>{c.code} — {c.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Year</span>
            <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Quota</span>
            <select value={form.quota} onChange={(e) => setForm({ ...form, quota: e.target.value })}>
              <option value="government">Government</option>
              <option value="management">Management</option>
            </select>
          </label>
          <label className="field">
            <span>Category</span>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Opening mark</span>
            <input type="number" min="0" max="200" required value={form.openingMark} onChange={(e) => setForm({ ...form, openingMark: e.target.value })} />
          </label>
          <label className="field">
            <span>Closing mark</span>
            <input type="number" min="0" max="200" required value={form.closingMark} onChange={(e) => setForm({ ...form, closingMark: e.target.value })} />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Spinner /> : editing ? 'Save Changes' : 'Add Cutoff'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
