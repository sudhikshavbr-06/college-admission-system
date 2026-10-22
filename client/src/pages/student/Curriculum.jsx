import { useEffect, useState } from 'react';
import api from '../../lib/api.js';

export default function Curriculum() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [open, setOpen] = useState(1);

  useEffect(() => {
    api.get('/courses?active=true').then((r) => {
      setCourses(r.data);
      if (r.data[0]) setCourseId(r.data[0]._id);
    }).catch(() => {});
  }, []);

  const course = courses.find((c) => c._id === courseId);
  const totalCredits = course?.curriculum.reduce((s, sem) => s + sem.subjects.reduce((x, sub) => x + (sub.credits || 0), 0), 0) || 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Curriculum & Syllabus</h1>
          <p>Semester-wise subjects with credits — regulated by the academic council, revised annually.</p>
        </div>
        <select
          value={courseId}
          onChange={(e) => { setCourseId(e.target.value); setOpen(1); }}
          style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 600 }}
        >
          {courses.map((c) => <option key={c._id} value={c._id}>{c.degree} {c.name}</option>)}
        </select>
      </div>

      {!course ? (
        <p style={{ color: 'var(--muted)' }}>Loading curriculum…</p>
      ) : (
        <>
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card"><div className="stat-icon stat-primary">🎓</div>
              <div><div className="stat-value">{course.degree}</div><div className="stat-label">{course.department}</div></div></div>
          <div className="stat-card"><div className="stat-icon stat-gold">📆</div>
              <div><div className="stat-value">{course.durationYears} yrs</div><div className="stat-label">{course.curriculum.length} semesters</div></div></div>
            <div className="stat-card"><div className="stat-icon stat-green">🎯</div>
              <div><div className="stat-value">{totalCredits}</div><div className="stat-label">Total credits</div></div></div>
          </div>

          {course.curriculum.map((sem) => {
            const credits = sem.subjects.reduce((s, sub) => s + (sub.credits || 0), 0);
            const isOpen = open === sem.semester;
            return (
              <div className="semester-card" key={sem.semester}>
                <div className="semester-head" onClick={() => setOpen(isOpen ? -1 : sem.semester)}>
                  <span>Semester {sem.semester}</span>
                  <span className="sem-meta">{sem.subjects.length} subjects · {credits} credits {isOpen ? '▲' : '▼'}</span>
                </div>
                {isOpen && sem.subjects.map((sub) => (
                  <div className="subject-row" key={sub.code}>
                    <code>{sub.code}</code>
                    <span>{sub.name}</span>
                    <span className="credits">{sub.credits} credits</span>
                  </div>
                ))}
                {isOpen && sem.subjects.length === 0 && (
                  <div style={{ padding: '12px 18px', fontSize: 13, color: 'var(--muted)' }}>Electives announced at semester start.</div>
                )}
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
