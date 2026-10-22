import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api.js';
import { inr, errMessage } from '../../lib/utils.js';
import Modal from '../../components/Modal.jsx';
import { EmptyState, Spinner } from '../../components/ui.jsx';

const DEGREES = ['B.Tech', 'B.E', 'BBA', 'B.Sc', 'BCA'];
const ICONS = ['💻', '🤖', '📡', '⚙️', '📊', '📈', '🔬', '🏗️', '🧬', '🎓'];

const emptyCourse = {
  name: '',
  code: '',
  degree: 'B.Tech',
  department: '',
  durationYears: 4,
  totalSeats: 60,
  govtSeats: 36,
  mgmtSeats: 24,
  annualFee: 120000,
  mgmtAnnualFee: 250000,
  description: '',
  icon: '🎓',
  active: true,
};

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyCourse);
  const [curriculum, setCurriculum] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
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
    setForm(emptyCourse);
    setCurriculum([{ semester: 1, subjects: [{ code: '', name: '', credits: 3 }] }]);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name,
      code: c.code,
      degree: c.degree,
      department: c.department,
      durationYears: c.durationYears,
      totalSeats: c.totalSeats,
      govtSeats: c.govtSeats,
      mgmtSeats: c.mgmtSeats,
      annualFee: c.annualFee,
      mgmtAnnualFee: c.mgmtAnnualFee,
      description: c.description || '',
      icon: c.icon || '🎓',
      active: c.active,
    });
    setCurriculum(
      c.curriculum?.length
        ? c.curriculum.map((s) => ({ semester: s.semester, subjects: s.subjects.map((x) => ({ ...x })) }))
        : [{ semester: 1, subjects: [] }]
    );
    setError('');
    setModalOpen(true);
  };

  const setSubject = (si, i, key, value) => {
    setCurriculum((prev) =>
      prev.map((sem, idx) =>
        idx === si
          ? { ...sem, subjects: sem.subjects.map((sub, j) => (j === i ? { ...sub, [key]: value } : sub)) }
          : sem
      )
    );
  };

  const addSubject = (si) => {
    setCurriculum((prev) =>
      prev.map((sem, idx) => (idx === si ? { ...sem, subjects: [...sem.subjects, { code: '', name: '', credits: 3 }] } : sem))
    );
  };

  const removeSubject = (si, i) => {
    setCurriculum((prev) =>
      prev.map((sem, idx) => (idx === si ? { ...sem, subjects: sem.subjects.filter((_, j) => j !== i) } : sem))
    );
  };

  const addSemester = () => {
    setCurriculum((prev) => [...prev, { semester: prev.length + 1, subjects: [] }]);
  };

  const removeSemester = (si) => {
    setCurriculum((prev) => prev.filter((_, idx) => idx !== si).map((s, i) => ({ ...s, semester: i + 1 })));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      durationYears: Number(form.durationYears),
      totalSeats: Number(form.totalSeats),
      govtSeats: Number(form.govtSeats),
      mgmtSeats: Number(form.mgmtSeats),
      annualFee: Number(form.annualFee),
      mgmtAnnualFee: Number(form.mgmtAnnualFee),
      curriculum: curriculum
        .map((sem, i) => ({
          semester: i + 1,
          subjects: sem.subjects.filter((s) => s.code.trim() && s.name.trim()),
        }))
        .filter((sem) => sem.subjects.length > 0),
    };
    try {
      if (editing) await api.put(`/courses/${editing._id}`, payload);
      else await api.post('/courses', payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.name}"? Existing applications referencing it may break.`)) return;
    try {
      await api.delete(`/courses/${c._id}`);
      await load();
    } catch (err) {
      setError(errMessage(err));
    }
  };

  const toggleActive = async (c) => {
    try {
      await api.put(`/courses/${c._id}`, { active: !c.active });
      await load();
    } catch (err) {
      setError(errMessage(err));
    }
  };

  const totalCredits = curriculum.reduce(
    (sum, sem) => sum + sem.subjects.reduce((s, sub) => s + (Number(sub.credits) || 0), 0),
    0
  );

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Programs & Curriculum</h1>
          <p>Manage courses, seats, fees and semester-wise curriculum</p>
        </div>
        <button className="btn btn-gold" onClick={openCreate}>+ Add Program</button>
      </header>

      {error && !modalOpen && <p className="form-error">{error}</p>}

      {loading ? (
        <div className="center-pad"><Spinner /></div>
      ) : courses.length === 0 ? (
        <EmptyState icon="🎓" title="No programs yet" message="Add the first program offered by the institute." action={<button className="btn btn-gold" onClick={openCreate}>+ Add Program</button>} />
      ) : (
        <div className="course-admin-grid">
          {courses.map((c) => (
            <div key={c._id} className={`panel course-admin-card ${c.active ? '' : 'inactive'}`}>
              <div className="course-admin-head">
                <span className="course-icon">{c.icon}</span>
                <div>
                  <h3>{c.name}</h3>
                  <p className="cell-sub">{c.degree} · {c.department} · {c.durationYears} yrs</p>
                </div>
                <span className="mono code-chip">{c.code}</span>
              </div>
              <div className="kv-grid">
                <div><span>Total seats</span><b>{c.totalSeats}</b></div>
                <div><span>Govt / Mgmt</span><b>{c.govtSeats} / {c.mgmtSeats}</b></div>
                <div><span>Annual fee (Govt)</span><b>{inr(c.annualFee)}</b></div>
                <div><span>Annual fee (Mgmt)</span><b>{inr(c.mgmtAnnualFee)}</b></div>
              </div>
              <p className="cell-sub">{c.curriculum?.length || 0} semesters in curriculum</p>
              <div className="row-actions">
                <button className="btn btn-outline btn-sm" onClick={() => toggleActive(c)}>{c.active ? 'Deactivate' : 'Activate'}</button>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>Delete</button>
                <span className={`badge ${c.active ? 'badge-verified' : 'badge-rejected'}`}>{c.active ? 'Active' : 'Hidden'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        wide
        title={editing ? `Edit — ${editing.name}` : 'Add Program'}
        subtitle={editing ? 'Update details and curriculum' : 'Program details and semester curriculum'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={save} className="form-grid">
          <label className="field">
            <span>Program name</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Computer Science & Engineering" />
          </label>
          <label className="field">
            <span>Code</span>
            <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CSE" />
          </label>
          <label className="field">
            <span>Degree</span>
            <select value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })}>
              {DEGREES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Department</span>
            <input required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </label>
          <label className="field">
            <span>Duration (years)</span>
            <input type="number" min="1" max="6" required value={form.durationYears} onChange={(e) => setForm({ ...form, durationYears: e.target.value })} />
          </label>
          <label className="field">
            <span>Icon</span>
            <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
              {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Total seats</span>
            <input type="number" min="1" required value={form.totalSeats} onChange={(e) => setForm({ ...form, totalSeats: e.target.value })} />
          </label>
          <div className="field-pair">
            <label className="field">
              <span>Govt seats</span>
              <input type="number" min="0" required value={form.govtSeats} onChange={(e) => setForm({ ...form, govtSeats: e.target.value })} />
            </label>
            <label className="field">
              <span>Mgmt seats</span>
              <input type="number" min="0" required value={form.mgmtSeats} onChange={(e) => setForm({ ...form, mgmtSeats: e.target.value })} />
            </label>
          </div>
          <label className="field">
            <span>Annual fee — Government (₹)</span>
            <input type="number" min="0" required value={form.annualFee} onChange={(e) => setForm({ ...form, annualFee: e.target.value })} />
          </label>
          <label className="field">
            <span>Annual fee — Management (₹)</span>
            <input type="number" min="0" required value={form.mgmtAnnualFee} onChange={(e) => setForm({ ...form, mgmtAnnualFee: e.target.value })} />
          </label>
          <label className="field span-2">
            <span>Description</span>
            <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="check-inline span-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active (visible on the public site and open for applications)
          </label>

          <div className="span-2">
            <div className="curriculum-editor-head">
              <h4>Curriculum — {curriculum.length} semesters · {totalCredits} credits</h4>
              <button type="button" className="btn btn-outline btn-sm" onClick={addSemester}>+ Add Semester</button>
            </div>
            {curriculum.map((sem, si) => (
              <div key={si} className="semester-editor">
                <div className="semester-editor-bar">
                  <b>Semester {si + 1}</b>
                  {curriculum.length > 1 && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeSemester(si)}>Remove</button>
                  )}
                </div>
                {sem.subjects.map((sub, i) => (
                  <div key={i} className="subject-editor-row">
                    <input className="field" placeholder="CS101" value={sub.code} onChange={(e) => setSubject(si, i, 'code', e.target.value.toUpperCase())} />
                    <input className="field subject-name" placeholder="Subject name" value={sub.name} onChange={(e) => setSubject(si, i, 'name', e.target.value)} />
                    <input className="field subject-credits" type="number" min="1" max="10" value={sub.credits} onChange={(e) => setSubject(si, i, 'credits', e.target.value)} />
                    <button type="button" className="icon-btn" onClick={() => removeSubject(si, i)} aria-label="Remove subject">✕</button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm" onClick={() => addSubject(si)}>+ Add Subject</button>
              </div>
            ))}
          </div>

          {error && <p className="form-error span-2">{error}</p>}
          <div className="modal-actions span-2">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Spinner /> : editing ? 'Save Changes' : 'Add Program'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
