import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { QUOTA_LABELS, errMessage } from '../../lib/utils.js';

const emptyPersonal = {
  fullName: '', dob: '', gender: '', email: '', phone: '', parentName: '', parentPhone: '',
  address: { street: '', city: '', state: '', pincode: '' },
};
const emptyAcademic = {
  tenth: { school: '', board: 'CBSE', year: '', percentage: '' },
  twelfth: { school: '', board: 'CBSE', year: '', percentage: '', cutOffMark: '' },
};

export default function Apply() {
  const { user } = useAuth();
  const { pushToast } = useSocket();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [existing, setExisting] = useState(null);
  const [done, setDone] = useState(null);
  const [personal, setPersonal] = useState({ ...emptyPersonal, fullName: user?.name || '', email: user?.email || '' });
  const [academic, setAcademic] = useState(emptyAcademic);
  const [courseId, setCourseId] = useState('');
  const [quota, setQuota] = useState('government');
  const [category, setCategory] = useState('OC');
  const [scholarshipId, setScholarshipId] = useState('');

  useEffect(() => {
    api.get('/applications/mine').then((r) => { if (r.data) setExisting(r.data); }).catch(() => {});
    api.get('/courses?active=true').then((r) => setCourses(r.data)).catch(() => {});
    api.get('/scholarships?active=true').then((r) => setScholarships(r.data)).catch(() => {});
  }, []);

  if (done) {
    return (
      <div className="card card-pad" style={{ textAlign: 'center', padding: '60px 30px' }}>
        <div className="empty-icon" style={{ fontSize: 60 }}>🎉</div>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy-900)', margin: '12px 0 8px' }}>Application submitted!</h1>
        <p style={{ color: 'var(--muted)', maxWidth: 460, margin: '0 auto 8px' }}>
          Your application number is <b style={{ color: 'var(--gold-deep)' }}>{done.applicationNumber}</b>.
          Track its status in real time — you'll be notified instantly at every stage.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 22 }}>
          <Link to="/dashboard" className="btn btn-primary btn-lg">Go to Dashboard</Link>
          <Link to="/dashboard/documents" className="btn btn-outline btn-lg">Upload Documents</Link>
        </div>
      </div>
    );
  }

  if (existing) {
    return (
      <div className="card card-pad" style={{ textAlign: 'center', padding: '60px 30px' }}>
        <div className="empty-icon" style={{ fontSize: 54 }}>🗂️</div>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy-900)', margin: '10px 0' }}>You already have an application</h2>
        <p style={{ color: 'var(--muted)' }}>
          {existing.applicationNumber} is in the system. Only one application is allowed per student.
        </p>
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: 18 }}>View Application Status</Link>
      </div>
    );
  }

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!personal.fullName || !personal.dob || !personal.gender || !personal.phone || !personal.parentName || !personal.parentPhone || !personal.address.city || !personal.address.state || !personal.address.pincode) {
        return 'Please fill in all required personal details.';
      }
    }
    if (step === 2) {
      const t = academic.tenth, tw = academic.twelfth;
      if (!t.school || !t.year || t.percentage === '') return 'Please complete 10th standard details.';
      if (!tw.school || !tw.year || tw.percentage === '' || tw.cutOffMark === '') return 'Please complete 12th standard details.';
      if (Number(tw.cutOffMark) > 200) return 'Cutoff mark cannot exceed 200.';
    }
    if (step === 3) {
      if (!courseId) return 'Please select a course.';
      if (quota === 'scholarship' && !scholarshipId) return 'Please choose a scholarship.';
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) return setError(err);
    setStep((s) => s + 1);
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/applications', {
        courseId,
        quota,
        category,
        scholarshipId: quota === 'scholarship' ? scholarshipId : null,
        personal: {
          ...personal,
          dob: personal.dob,
          address: personal.address,
        },
        academic: {
          tenth: { ...academic.tenth, year: Number(academic.tenth.year), percentage: Number(academic.tenth.percentage) },
          twelfth: { ...academic.twelfth, year: Number(academic.twelfth.year), percentage: Number(academic.twelfth.percentage), cutOffMark: Number(academic.twelfth.cutOffMark) },
        },
      });
      pushToast({ title: 'Application Submitted', message: `${res.data.applicationNumber} received successfully`, type: 'success' });
      setDone(res.data);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const course = courses.find((c) => c._id === courseId);
  const selectedScholarship = scholarships.find((s) => s._id === scholarshipId);
  const pf = (k) => (e) => setPersonal({ ...personal, [k]: e.target.value });
  const pa = (k) => (e) => setPersonal({ ...personal, address: { ...personal.address, [k]: e.target.value } });
  const af = (lvl, k) => (e) => setAcademic({ ...academic, [lvl]: { ...academic[lvl], [k]: e.target.value } });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Application Form 2026–27</h1>
          <p>Complete all four steps. You can review before submitting.</p>
        </div>
      </div>

      <div className="wizard-steps">
        {['Personal Details', 'Academics', 'Course & Quota', 'Review'].map((label, i) => (
          <div key={label} className={`wizard-step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
            {step > i + 1 ? '✓ ' : `${i + 1}. `}{label}
          </div>
        ))}
      </div>

      {error && <div className="form-error">{error}</div>}

      {step === 1 && (
        <div className="card card-pad">
          <h3 className="card-title">Personal details</h3>
          <p className="card-sub">Exactly as they appear on your official certificates.</p>
          <div className="form-grid">
            <div className="field"><label>Full name <span className="req">*</span></label>
              <input value={personal.fullName} onChange={pf('fullName')} placeholder="As per 10th certificate" /></div>
            <div className="field"><label>Date of birth <span className="req">*</span></label>
              <input type="date" value={personal.dob} onChange={pf('dob')} /></div>
            <div className="field"><label>Gender <span className="req">*</span></label>
              <select value={personal.gender} onChange={pf('gender')}>
                <option value="">Select…</option><option>Male</option><option>Female</option><option>Other</option>
              </select></div>
            <div className="field"><label>Email <span className="req">*</span></label>
              <input type="email" value={personal.email} onChange={pf('email')} /></div>
            <div className="field"><label>Mobile number <span className="req">*</span></label>
              <input value={personal.phone} onChange={pf('phone')} placeholder="+91 98765 43210" /></div>
            <div className="field"><label>Parent / guardian name <span className="req">*</span></label>
              <input value={personal.parentName} onChange={pf('parentName')} /></div>
            <div className="field"><label>Parent mobile <span className="req">*</span></label>
              <input value={personal.parentPhone} onChange={pf('parentPhone')} /></div>
            <div className="field"><label>Street / locality</label>
              <input value={personal.address.street} onChange={pa('street')} /></div>
            <div className="field"><label>City <span className="req">*</span></label>
              <input value={personal.address.city} onChange={pa('city')} /></div>
            <div className="field"><label>State <span className="req">*</span></label>
              <input value={personal.address.state} onChange={pa('state')} /></div>
            <div className="field"><label>Pincode <span className="req">*</span></label>
              <input value={personal.address.pincode} onChange={pa('pincode')} maxLength={6} /></div>
          </div>
          <button className="btn btn-primary" onClick={next}>Continue →</button>
        </div>
      )}

      {step === 2 && (
        <div className="card card-pad">
          <h3 className="card-title">Academic record</h3>
          <p className="card-sub">Cutoff mark = Maths + Physics + Chemistry (out of 200).</p>
          <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gold-deep)', margin: '6px 0 12px' }}>10th Standard</h4>
          <div className="form-grid-3">
            <div className="field"><label>School <span className="req">*</span></label><input value={academic.tenth.school} onChange={af('tenth', 'school')} /></div>
            <div className="field"><label>Board</label>
              <select value={academic.tenth.board} onChange={af('tenth', 'board')}>
                <option>CBSE</option><option>State Board</option><option>ICSE</option><option>IB / IGCSE</option>
              </select></div>
            <div className="field"><label>Year of passing <span className="req">*</span></label>
              <input type="number" min="2015" max="2026" value={academic.tenth.year} onChange={af('tenth', 'year')} /></div>
            <div className="field"><label>Percentage <span className="req">*</span></label>
              <input type="number" min="0" max="100" step="0.1" value={academic.tenth.percentage} onChange={af('tenth', 'percentage')} /></div>
          </div>
          <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gold-deep)', margin: '18px 0 12px' }}>12th Standard</h4>
          <div className="form-grid-3">
            <div className="field"><label>School <span className="req">*</span></label><input value={academic.twelfth.school} onChange={af('twelfth', 'school')} /></div>
            <div className="field"><label>Board</label>
              <select value={academic.twelfth.board} onChange={af('twelfth', 'board')}>
                <option>CBSE</option><option>State Board</option><option>ICSE</option><option>IB / IGCSE</option>
              </select></div>
            <div className="field"><label>Year of passing <span className="req">*</span></label>
              <input type="number" min="2017" max="2026" value={academic.twelfth.year} onChange={af('twelfth', 'year')} /></div>
            <div className="field"><label>Percentage <span className="req">*</span></label>
              <input type="number" min="0" max="100" step="0.1" value={academic.twelfth.percentage} onChange={af('twelfth', 'percentage')} /></div>
            <div className="field"><label>Cutoff mark / 200 <span className="req">*</span></label>
              <input type="number" min="0" max="200" step="0.01" value={academic.twelfth.cutOffMark} onChange={af('twelfth', 'cutOffMark')} />
              <span className="hint">Used for government quota cutoff comparison</span></div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" onClick={next}>Continue →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card card-pad">
          <h3 className="card-title">Course & admission route</h3>
          <p className="card-sub">Choose your program and the quota you wish to apply under.</p>
          <div className="field">
            <label>Program <span className="req">*</span></label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">Select a program…</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.degree} {c.name} ({c.code}) — {c.totalSeats} seats</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Admission route <span className="req">*</span></label>
            <div className="quota-select">
              {['government', 'management', 'scholarship'].map((q) => (
                <button type="button" key={q} className={`quota-option ${quota === q ? 'selected' : ''}`} onClick={() => setQuota(q)}>
                  <b>{QUOTA_LABELS[q]}</b>
                  <span>
                    {q === 'government' && 'Merit-based · lowest fee · all categories'}
                    {q === 'management' && 'Direct admission · relaxed cutoff'}
                    {q === 'scholarship' && '25–50% tuition waiver · eligibility applies'}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Community category <span className="req">*</span></label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {['OC', 'BC', 'MBC', 'SC', 'ST'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            {quota === 'scholarship' && (
              <div className="field">
                <label>Scholarship <span className="req">*</span></label>
                <select value={scholarshipId} onChange={(e) => setScholarshipId(e.target.value)}>
                  <option value="">Select a scholarship…</option>
                  {scholarships.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} — {s.discountPercent}% waiver (min {s.minPercentage}%)
                    </option>
                  ))}
                </select>
                {selectedScholarship && (
                  <span className="hint">{selectedScholarship.description}</span>
                )}
              </div>
            )}
          </div>
          {course && (
            <div className="receipt-summary">
              <div className="row"><span>Program</span><b>{course.degree} {course.name}</b></div>
              <div className="row"><span>Duration</span><span>{course.durationYears} years · {course.curriculum.length} semesters</span></div>
              <div className="row">
                <span>Estimated annual fee ({QUOTA_LABELS[quota].toLowerCase()})</span>
                <b>
                  {quota === 'management'
                    ? `₹${course.mgmtAnnualFee.toLocaleString('en-IN')}`
                    : quota === 'scholarship' && selectedScholarship
                      ? `₹${Math.round(course.annualFee * (1 - selectedScholarship.discountPercent / 100)).toLocaleString('en-IN')} (after ${selectedScholarship.discountPercent}% waiver)`
                      : `₹${course.annualFee.toLocaleString('en-IN')}`}
                </b>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-primary" onClick={next}>Review →</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card card-pad">
          <h3 className="card-title">Review & submit</h3>
          <p className="card-sub">Please verify every detail — information cannot be edited after submission.</p>
          <div className="review-block">
            <h4>Personal</h4>
            <div style={{ fontSize: 14 }}>
              <b>{personal.fullName}</b> · {personal.gender} · DOB {personal.dob}<br />
              📧 {personal.email} · 📱 {personal.phone}<br />
              Guardian: {personal.parentName} ({personal.parentPhone})<br />
              📍 {personal.address.street ? `${personal.address.street}, ` : ''}{personal.address.city}, {personal.address.state} — {personal.address.pincode}
            </div>
          </div>
          <div className="review-block">
            <h4>Academics</h4>
            <div style={{ fontSize: 14 }}>
              10th — {academic.tenth.school} ({academic.tenth.board}, {academic.tenth.year}) · {academic.tenth.percentage}%<br />
              12th — {academic.twelfth.school} ({academic.twelfth.board}, {academic.twelfth.year}) · {academic.twelfth.percentage}% · Cutoff <b>{academic.twelfth.cutOffMark}/200</b>
            </div>
          </div>
          <div className="review-block">
            <h4>Course & Quota</h4>
            <div style={{ fontSize: 14 }}>
              {course ? `${course.degree} ${course.name} (${course.code})` : '—'}<br />
              Route: <b>{QUOTA_LABELS[quota]}</b> · Category: <b>{category}</b>
              {quota === 'scholarship' && selectedScholarship ? <> · Scholarship: <b>{selectedScholarship.name}</b></> : null}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={() => setStep(3)}>← Back</button>
            <button className="btn btn-gold btn-lg" onClick={submit} disabled={busy}>
              {busy ? 'Submitting…' : '✓ Submit Application'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
