import { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api.js';

const QUOTAS = [
  { key: 'government', label: 'Government Quota' },
  { key: 'management', label: 'Management Quota' },
];
const CATEGORIES = ['OC', 'BC', 'MBC', 'SC', 'ST'];

export default function Cutoffs() {
  const [cutoffs, setCutoffs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [year, setYear] = useState(2026);
  const [quota, setQuota] = useState('government');
  const [category, setCategory] = useState('OC');
  const [myMark, setMyMark] = useState(null);
  const [myCategory, setMyCategory] = useState('OC');

  useEffect(() => {
    api.get('/cutoffs').then((r) => {
      setCutoffs(r.data);
      const years = [...new Set(r.data.map((c) => c.year))];
      if (years.length && !years.includes(2026)) setYear(years[0]);
    }).catch(() => {});
    api.get('/courses?active=true').then((r) => setCourses(r.data)).catch(() => {});
    api.get('/applications/mine').then((r) => {
      if (r.data) {
        setMyMark(r.data.academic?.twelfth?.cutOffMark ?? null);
        setMyCategory(r.data.category || 'OC');
      }
    }).catch(() => {});
  }, []);

  const rows = useMemo(() => {
    const filtered = cutoffs.filter((c) => c.year === year && c.quota === quota && c.category === category);
    const byCourse = new Map();
    for (const c of filtered) {
      if (!byCourse.has(c.course?._id)) byCourse.set(c.course?._id, { course: c.course, closing: c.closingMark, opening: c.openingMark });
      else {
        const cur = byCourse.get(c.course?._id);
        cur.closing = Math.max(cur.closing, c.closingMark);
        cur.opening = Math.min(cur.opening, c.openingMark);
      }
    }
    return [...byCourse.values()];
  }, [cutoffs, year, quota, category]);

  const years = [...new Set(cutoffs.map((c) => c.year))].sort((a, b) => b - a);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Cutoff Explorer</h1>
          <p>Opening and closing marks out of 200 (Maths + Physics + Chemistry).</p>
        </div>
      </div>

      <div className="filter-bar">
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={quota} onChange={(e) => setQuota(e.target.value)}>
          {QUOTAS.map((q) => <option key={q.key} value={q.key}>{q.label}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          {myMark !== null
            ? <>Your cutoff: <b style={{ color: 'var(--gold-deep)' }}>{myMark}/200</b> (category {myCategory}) — rows where you qualify are highlighted.</>
            : 'Submit your application to see personalised eligibility highlights.'}
        </span>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Program</th><th>Degree</th><th>Opening Mark</th><th>Closing Mark</th><th>Eligibility</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const eligible = myMark !== null && myMark >= r.closing && category === myCategory;
              return (
                <tr key={r.course?._id} className={eligible ? 'eligible-row' : ''}>
                  <td className="table-strong">{r.course?.name}</td>
                  <td>{r.course?.degree}</td>
                  <td>{r.opening.toFixed(2)}</td>
                  <td className="table-strong">{r.closing.toFixed(2)}</td>
                  <td>
                    {myMark === null ? <span className="table-muted">—</span>
                      : eligible ? <span className="badge badge-accepted">You qualify ✓</span>
                        : <span className="badge badge-rejected">Below cutoff</span>}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>No cutoff data for this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
