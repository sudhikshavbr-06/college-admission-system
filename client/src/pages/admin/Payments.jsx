import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api.js';
import { fmtDateTime, inr } from '../../lib/utils.js';
import StatCard from '../../components/StatCard.jsx';
import { EmptyState, Spinner } from '../../components/ui.jsx';

const TYPE_LABELS = { application_fee: 'Application Fee', admission_fee: 'Admission Fee' };
const METHOD_LABELS = { upi: 'UPI', card: 'Card', netbanking: 'Net Banking' };

export default function ManagePayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [method, setMethod] = useState('');

  const load = useCallback(async () => {
    try {
      const params = {};
      if (type) params.type = type;
      if (method) params.method = method;
      const res = await api.get('/payments', { params });
      setPayments(res.data);
    } catch {
      /* empty state */
    } finally {
      setLoading(false);
    }
  }, [type, method]);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('server:refresh', handler);
    return () => window.removeEventListener('server:refresh', handler);
  }, [load]);

  const total = payments.filter((p) => p.status === 'success').reduce((s, p) => s + p.amount, 0);
  const appFees = payments.filter((p) => p.type === 'application_fee' && p.status === 'success').length;
  const admFees = payments.filter((p) => p.type === 'admission_fee' && p.status === 'success').length;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Payments Ledger</h1>
          <p>All fee transactions collected through the portal</p>
        </div>
        <span className="live-pill"><span className="live-dot" /> Live</span>
      </header>

      <div className="stat-grid">
        <StatCard icon="💰" label="Total Collected" value={inr(total)} sub={`${payments.length} transactions`} tone="gold" />
        <StatCard icon="📝" label="Application Fees" value={appFees} sub="₹1,000 each" tone="primary" />
        <StatCard icon="🎓" label="Admission Fees" value={admFees} sub="annual fee per seat" tone="green" />
      </div>

      <div className="filter-bar">
        <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All fee types</option>
          <option value="application_fee">Application Fee</option>
          <option value="admission_fee">Admission Fee</option>
        </select>
        <select className="field" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="">All methods</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
          <option value="netbanking">Net Banking</option>
        </select>
      </div>

      {loading ? (
        <div className="center-pad"><Spinner /></div>
      ) : payments.length === 0 ? (
        <EmptyState icon="🧾" title="No transactions" message="Payments will appear here in real time as students pay." />
      ) : (
        <div className="table-wrap panel">
          <table className="data">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Student</th>
                <th>Application</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Transaction</th>
                <th>Paid At</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td className="mono">{p.receiptNo}</td>
                  <td>
                    <div className="cell-main">{p.student?.name}</div>
                    <div className="cell-sub">{p.student?.email}</div>
                  </td>
                  <td className="mono">{p.application?.applicationNumber || '—'}</td>
                  <td>{TYPE_LABELS[p.type] || p.type}</td>
                  <td><b>{inr(p.amount)}</b></td>
                  <td>{METHOD_LABELS[p.method] || p.method}</td>
                  <td className="mono cell-sub">{p.transactionId}</td>
                  <td>{fmtDateTime(p.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
