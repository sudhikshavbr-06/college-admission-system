import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { inr } from '../lib/utils.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [cutoffs, setCutoffs] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [stats, setStats] = useState({ courses: 0, applications: 0, scholarships: 0, placementRate: 96, recruitingPartners: 240 });

  useEffect(() => {
    api.get('/courses?active=true').then((r) => setCourses(r.data)).catch(() => {});
    api.get('/cutoffs?year=2026&quota=government').then((r) => setCutoffs(r.data.slice(0, 8))).catch(() => {});
    api.get('/scholarships?active=true').then((r) => setScholarships(r.data)).catch(() => {});
    api.get('/stats/public').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const cseCutoffs = cutoffs.filter((c) => c.course?.code === 'CSE');
  const cutoffRows = cseCutoffs.length ? cseCutoffs : cutoffs;

  return (
    <div className="landing">
      <div className="notice-bar">
        🎓 Admissions open for 2026–27 · Government quota closes 31 Dec 2026 · Scholarship deadline varies by program
      </div>

      <nav className="landing-nav">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <div className="brand-name">Meridian Institute of Technology</div>
            <div className="brand-tag">Admissions Portal</div>
          </div>
        </div>
        <div className="links">
          <a href="#programs">Programs</a>
          <a href="#quotas">Admission Routes</a>
          <a href="#cutoffs">Cutoffs</a>
          <a href="#scholarships">Scholarships</a>
        </div>
        <div className="nav-cta">
          {user ? (
            <Link className="btn btn-gold" to={user.role === 'admin' ? '/admin' : '/dashboard'}>
              My Dashboard →
            </Link>
          ) : (
            <>
              <Link className="btn btn-outline-light" to="/login">Sign in</Link>
              <Link className="btn btn-gold" to="/register">Apply Now</Link>
            </>
          )}
        </div>
      </nav>

      <header className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">★ NAAC A++ Accredited · Admissions 2026–27</div>
          <h1>
            Where ambition meets <em>opportunity</em>
          </h1>
          <p className="lead">
            Apply to Meridian Institute of Technology in minutes — choose your quota, upload documents,
            track your application in real time and pay fees securely, all from one portal.
          </p>
          <div className="hero-ctas">
            <Link className="btn btn-gold btn-lg" to={user ? (user.role === 'admin' ? '/admin' : '/dashboard/apply') : '/register'}>
              Start Your Application
            </Link>
            <a className="btn btn-outline-light btn-lg" href="#programs">Explore Programs</a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><b>{stats.courses}+</b><span>UGC-approved programs</span></div>
            <div className="hero-stat"><b>{stats.applications.toLocaleString('en-IN')}+</b><span>Applications received</span></div>
            <div className="hero-stat"><b>{stats.placementRate}%</b><span>Placement rate</span></div>
            <div className="hero-stat"><b>{stats.recruitingPartners}+</b><span>Recruiting partners</span></div>
          </div>
        </div>
      </header>

      <section className="section" id="programs">
        <div className="section-head">
          <span className="kicker">Undergraduate Programs</span>
          <h2>Choose the program that fits your future</h2>
          <p>Industry-aligned curricula reviewed every year with our board of studies and industry partners.</p>
        </div>
        <div className="program-grid">
          {courses.map((c) => (
            <div className="program-card" key={c._id}>
              <div className="program-ico">{c.icon}</div>
              <span className="dept">{c.degree} · {c.code}</span>
              <h3>{c.name}</h3>
              <p>{c.description}</p>
              <div className="program-meta">
                <div className="fee">
                  <b>{inr(c.annualFee)}</b>
                  <span>per year · govt quota</span>
                </div>
                <div className="seats">
                  {c.totalSeats} seats<br />
                  {c.durationYears} years · {c.curriculum.length} semesters
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="quotas">
        <div className="section-head">
          <span className="kicker">Three ways to join</span>
          <h2>Admission routes built for every student</h2>
        </div>
        <div className="quota-grid">
          <div className="quota-card quota-govt">
            <span className="quota-tag">70% of seats</span>
            <h3>Government Quota</h3>
            <ul>
              <li>Lowest annual fee, fixed by the state fee committee</li>
              <li>Allotment based on 12th standard cutoff marks (out of 200)</li>
              <li>All community categories eligible — OC, BC, MBC, SC, ST</li>
            </ul>
          </div>
          <div className="quota-card quota-mgmt">
            <span className="quota-tag">30% of seats</span>
            <h3>Management Quota</h3>
            <ul>
              <li>Direct admission on merit, no entrance rank required</li>
              <li>Relaxed cutoff compared to government quota</li>
              <li>Same degree, same curriculum, same placement cell</li>
            </ul>
          </div>
          <div className="quota-card quota-schol">
            <span className="quota-tag">Up to 50% waiver</span>
            <h3>Scholarship Route</h3>
            <ul>
              <li>Merit, sports, women-in-STEM and need-based aid</li>
              <li>25–50% tuition waiver for eligible students</li>
              <li>Apply with a single application — auto-verified</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="cutoffs">
        <div className="section-head">
          <span className="kicker">Transparency first</span>
          <h2>2026 government quota cutoffs</h2>
          <p>Cutoff marks out of 200 (Maths + Physics + Chemistry). Full tables available inside the portal after sign-in.</p>
        </div>
        <div className="split-2">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Course</th><th>Category</th><th>Opening</th><th>Closing</th></tr>
              </thead>
              <tbody>
                {cutoffRows.map((c) => (
                  <tr key={c._id}>
                    <td className="table-strong">{c.course?.code}</td>
                    <td>{c.category}</td>
                    <td>{c.openingMark.toFixed(2)}</td>
                    <td className="table-strong">{c.closingMark.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div className="section-head" style={{ textAlign: 'left', margin: '0 0 22px' }}>
              <span className="kicker">Live scholarships</span>
              <h2 style={{ fontSize: 26 }}>Funding that recognises talent</h2>
            </div>
            {scholarships.slice(0, 4).map((s) => (
              <div className="scholar-card" key={s._id}>
                <h4>{s.name}</h4>
                <p>{s.description}</p>
                <div className="scholar-meta">
                  <span>{s.discountPercent}% waiver</span>
                  <span>Min {s.minPercentage}% in 12th</span>
                  <span>Until {new Date(s.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="scholarships" style={{ textAlign: 'center', paddingBottom: 60 }}>
        <div className="section-head" style={{ marginBottom: 30 }}>
          <span className="kicker">Ready to begin?</span>
          <h2>Your seat is waiting</h2>
          <p>Create your account, complete the three-step application and track every update in real time.</p>
        </div>
        <Link to={user ? (user.role === 'admin' ? '/admin' : '/dashboard/apply') : '/register'} className="btn btn-primary btn-lg">
          Apply for 2026–27 Admissions →
        </Link>
      </section>

      <footer className="landing-footer">
        <div className="cols">
          <div>
            <div className="brand" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <div className="brand-mark">M</div>
              <div>
                <div className="brand-name" style={{ color: '#fff' }}>Meridian Institute of Technology</div>
                <div className="brand-tag">Est. 1984 · Chennai</div>
              </div>
            </div>
            <p style={{ fontSize: 13.5, maxWidth: 320 }}>
              A NAAC A++ institution offering engineering, technology and business programs with a
              96% placement record and 240+ recruiting partners.
            </p>
          </div>
          <div>
            <h4>Portal</h4>
            <Link to="/register">Apply Online</Link>
            <Link to="/login">Student Sign in</Link>
            <Link to="/login">Admin Console</Link>
          </div>
          <div>
            <h4>Admissions</h4>
            <span>Government Quota</span>
            <span>Management Quota</span>
            <span>Scholarships</span>
          </div>
          <div>
            <h4>Contact</h4>
            <span>admissions@meridian.edu</span>
            <span>+91 44 4000 1234</span>
            <span>Meridian Campus, OMR, Chennai</span>
          </div>
        </div>
        <div className="foot-note">© 2026 Meridian Institute of Technology · For demonstration purposes</div>
      </footer>
    </div>
  );
}
