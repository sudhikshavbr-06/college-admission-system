import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api.js';
import { fmtDate, fmtDateTime, inr, STATUS_LABELS } from '../../lib/utils.js';
import StatCard from '../../components/StatCard.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { EmptyState } from '../../components/ui.jsx';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

const COLORS = ['#1d4ed8', '#e3a82b', '#0d9488', '#e11d48', '#7c3aed', '#0ea5e9'];
const QUOTA_COLORS = { government: '#1d4ed8', management: '#e3a82b', scholarship: '#0d9488' };

const STATUS_ORDER = ['submitted', 'under_review', 'documents_pending', 'verified', 'accepted', 'rejected'];

export default function AdminOverview() {
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    const res = await api.get('/stats/overview');
    setData(res.data);
  }, []);

  useEffect(() => {
    load().catch(() => {});
    const handler = () => load().catch(() => {});
    window.addEventListener('server:refresh', handler);
    return () => window.removeEventListener('server:refresh', handler);
  }, [load]);

  if (!data) return null;

  const t = data.totals;
  const statusData = STATUS_ORDER.map((s) => ({
    name: STATUS_LABELS[s] || s,
    count: data.byStatus[s] || 0,
  }));
  const quotaData = Object.entries(data.byQuota).map(([k, v]) => ({ name: k, value: v }));

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Admissions Overview</h1>
          <p>Live snapshot of the 2026 admission cycle</p>
        </div>
        <span className="live-pill"><span className="live-dot" /> Live</span>
      </header>

      <div className="stat-grid">
        <StatCard icon="📚" label="Total Applications" value={t.applications} sub={`${t.students} registered students`} tone="primary" />
        <StatCard icon="💰" label="Revenue Collected" value={inr(t.revenue)} sub={`${t.transactions} successful transactions`} tone="gold" />
        <StatCard icon="⏳" label="Docs Awaiting Review" value={t.pendingDocuments} sub="across all applications" tone="red" />
        <StatCard icon="🎓" label="Active Scholarships" value={t.scholarships} sub={`${t.courses} programs offered`} tone="green" />
      </div>

      <div className="chart-row">
        <div className="panel">
          <h3 className="panel-title">Applications by Course</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.byCourse} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5eaf2" />
              <XAxis dataKey="code" tick={{ fontSize: 12, fill: '#5b6b84' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#5b6b84' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(29,78,216,0.06)' }} />
              <Bar dataKey="count" name="Applications" fill="#1d4ed8" radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3 className="panel-title">Quota Split</h3>
          {quotaData.length === 0 ? (
            <EmptyState icon="🥧" title="No data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={quotaData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={92} paddingAngle={3}>
                  {quotaData.map((entry) => (
                    <Cell key={entry.name} fill={QUOTA_COLORS[entry.name] || COLORS[0]} />
                  ))}
                </Pie>
                <Legend formatter={(v) => v.charAt(0).toUpperCase() + v.slice(1) + ' Quota'} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="chart-row">
        <div className="panel">
          <h3 className="panel-title">Fee Collection Trend</h3>
          {data.revenueByMonth.length === 0 ? (
            <EmptyState icon="📈" title="No payments yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.revenueByMonth} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e3a82b" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#e3a82b" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5eaf2" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5b6b84' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#5b6b84' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => inr(v)} />
                <Area type="monotone" dataKey="total" name="Collected" stroke="#e3a82b" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="panel">
          <h3 className="panel-title">Pipeline by Status</h3>
          <div className="status-bars">
            {statusData.map((s) => {
              const max = Math.max(...statusData.map((x) => x.count), 1);
              return (
                <div key={s.name} className="status-bar-row">
                  <span className="status-bar-label">{s.name}</span>
                  <div className="status-bar-track">
                    <div className="status-bar-fill" style={{ width: `${(s.count / max) * 100}%` }} />
                  </div>
                  <span className="status-bar-count">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Latest Applications</h3>
        {data.recentApplications.length === 0 ? (
          <EmptyState icon="🗂️" title="No applications yet" message="New applications will appear here in real time." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>App No.</th>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Quota</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {data.recentApplications.map((a) => (
                  <tr key={a.id}>
                    <td className="mono">{a.applicationNumber}</td>
                    <td>{a.studentName}</td>
                    <td>{a.course || '—'}</td>
                    <td><StatusBadge quota={a.quota} /></td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>{fmtDate(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
