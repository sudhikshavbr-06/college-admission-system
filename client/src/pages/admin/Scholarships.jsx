import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api.js';
import { fmtDate, errMessage } from '../../lib/utils.js';
import Modal from '../../components/Modal.jsx';
import { EmptyState, Spinner } from '../../components/ui.jsx';

const TYPE_LABELS = { merit: 'Merit', need_based: 'Need Based', sports: 'Sports', special: 'Special' };
const CATEGORIES = ['OC', 'BC', 'MBC', 'SC', 'ST'];

const TYPE_ICONS = { merit: '🏅', need_based: '🤝', sports: '⚽', special: '⭐' };

const emptyForm = {
  name: '',
  description: '',
  type: 'merit',
  minPercentage: 80,
  categories: [],
  discountPercent: 25,
  seats: 50,
  deadline: '',
  active: true,
};

export default function ManageScholarships() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/scholarships');
      setItems(res.data);
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

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description || '',
      type: s.type,
      minPercentage: s.minPercentage,
      categories: s.categories || [],
      discountPercent: s.discountPercent,
      seats: s.seats,
      deadline: s.deadline ? new Date(s.deadline).toISOString().slice(0, 10) : '',
      active: s.active,
    });
    setError('');
    setModalOpen(true);
  };

  const toggleCategory = (c) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c],
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) await api.put(`/scholarships/${editing._id}`, form);
      else await api.post('/scholarships', form);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete scholarship "${s.name}"?`)) return;
    try {
      await api.delete(`/scholarships/${s._id}`);
      await load();
    } catch (err) {
      setError(errMessage(err));
    }
  };

  const toggleActive = async (s) => {
    try {
      await api.put(`/scholarships/${s._id}`, { active: !s.active });
      await load();
    } catch (err) {
      setError(errMessage(err));
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Scholarships</h1>
          <p>Fee waiver programs offered under the scholarship quota</p>
        </div>
        <button className="btn btn-gold" onClick={openCreate}>+ Add Scholarship</button>
      </header>

      {error && !modalOpen && <p className="form-error">{error}</p>}

      {loading ? (
        <div className="center-pad"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState icon="🏅" title="No scholarships yet" message="Create fee waiver programs students can apply under." action={<button className="btn btn-gold" onClick={openCreate}>+ Add Scholarship</button>} />
      ) : (
        <div className="scholar-admin-grid">
          {items.map((s) => (
            <div key={s._id} className={`panel scholar-card-admin ${s.active ? '' : 'inactive'}`}>
              <div className="scholar-admin-head">
                <span className="scholar-icon">{TYPE_ICONS[s.type] || '🏅'}</span>
                <div>
                  <h3>{s.name}</h3>
                  <span className="badge badge-cat">{TYPE_LABELS[s.type]}</span>
                </div>
              </div>
              <p className="muted">{s.description || 'No description'}</p>
              <div className="kv-grid">
                <div><span>Waiver</span><b className="gold-text">{s.discountPercent}%</b></div>
                <div><span>Min. 12th %</span><b>{s.minPercentage}%</b></div>
                <div><span>Seats</span><b>{s.seats}</b></div>
                <div><span>Deadline</span><b>{fmtDate(s.deadline)}</b></div>
              </div>
              <div className="cat-chips">
                {s.categories.length === 0
                  ? <span className="badge badge-docs">All categories</span>
                  : s.categories.map((c) => <span key={c} className="badge badge-cat">{c}</span>)}
              </div>
              <div className="row-actions">
                <button className="btn btn-outline btn-sm" onClick={() => toggleActive(s)}>{s.active ? 'Deactivate' : 'Activate'}</button>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(s)}>Delete</button>
                <span className={`badge ${s.active ? 'badge-verified' : 'badge-rejected'}`}>{s.active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        wide
        title={editing ? `Edit — ${editing.name}` : 'Add Scholarship'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={save} className="form-grid">
          <label className="field span-2">
            <span>Scholarship name</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Merit Excellence Award" />
          </label>
          <label className="field span-2">
            <span>Description</span>
            <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="field">
            <span>Type</span>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Fee waiver (%)</span>
            <input type="number" min="0" max="100" required value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} />
          </label>
          <label className="field">
            <span>Min. 12th percentage</span>
            <input type="number" min="0" max="100" required value={form.minPercentage} onChange={(e) => setForm({ ...form, minPercentage: e.target.value })} />
          </label>
          <label className="field">
            <span>Seats</span>
            <input type="number" min="1" required value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} />
          </label>
          <label className="field">
            <span>Deadline</span>
            <input type="date" required value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </label>
          <div className="field span-2">
            <span>Eligible categories (none = all)</span>
            <div className="cat-chips">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`chip ${form.categories.includes(c) ? 'chip-active' : ''}`}
                  onClick={() => toggleCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <label className="check-inline span-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active (visible to students)
          </label>
          {error && <p className="form-error span-2">{error}</p>}
          <div className="modal-actions span-2">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Spinner /> : editing ? 'Save Changes' : 'Add Scholarship'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
