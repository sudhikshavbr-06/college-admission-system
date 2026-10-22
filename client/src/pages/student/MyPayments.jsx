import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { EmptyState, Spinner } from '../../components/ui.jsx';
import { errMessage, fmtDate, inr } from '../../lib/utils.js';

const METHODS = [
  { key: 'upi', label: 'UPI', icon: '📱' },
  { key: 'card', label: 'Card', icon: '💳' },
  { key: 'netbanking', label: 'Net Banking', icon: '🏦' },
];
const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Punjab National Bank'];

function PayModal({ item, applicationId, applicationNumber, onClose, onPaid }) {
  const [method, setMethod] = useState('upi');
  const [vpa, setVpa] = useState('');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [bank, setBank] = useState(BANKS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pay = async () => {
    if (method === 'upi' && !vpa.includes('@')) return setError('Enter a valid UPI ID (e.g. name@bank).');
    if (method === 'card' && (card.number.replace(/\s/g, '').length < 12 || !card.name || !card.expiry || card.cvv.length < 3)) {
      return setError('Enter complete card details.');
    }
    setBusy(true);
    setError('');
    try {
      await api.post('/payments', { applicationId, type: item.type, method });
      onPaid();
    } catch (err) {
      setError(errMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog">
        <div className="modal-head">
          <div>
            <h3>Secure Checkout</h3>
            <p className="modal-sub">🔒 Demo payment gateway — no real money is charged</p>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="receipt-summary">
            <div className="row"><span>{item.label}</span><b>{inr(item.amount)}</b></div>
            <div className="row"><span>Application</span><span>{applicationNumber}</span></div>
          </div>
          <div className="pill-tabs">
            {METHODS.map((m) => (
              <button key={m.key} type="button" className={`pill-tab ${method === m.key ? 'active' : ''}`} onClick={() => setMethod(m.key)}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
          {error && <div className="form-error">{error}</div>}
          {method === 'upi' && (
            <div className="field">
              <label>UPI ID</label>
              <input placeholder="yourname@okbank" value={vpa} onChange={(e) => setVpa(e.target.value)} />
            </div>
          )}
          {method === 'card' && (
            <>
              <div className="field"><label>Card number</label>
                <input placeholder="4111 1111 1111 1111" maxLength={19} value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value.replace(/[^\d ]/g, '') })} /></div>
              <div className="form-grid">
                <div className="field"><label>Name on card</label>
                  <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} /></div>
                <div className="field"><label>Expiry (MM/YY)</label>
                  <input placeholder="09/28" maxLength={5} value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} /></div>
              </div>
              <div className="field"><label>CVV</label>
                <input type="password" maxLength={4} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })} /></div>
            </>
          )}
          {method === 'netbanking' && (
            <div className="field">
              <label>Select bank</label>
              <select value={bank} onChange={(e) => setBank(e.target.value)}>
                {BANKS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
          )}
          <button className="btn btn-gold btn-block btn-lg" onClick={pay} disabled={busy}>
            {busy ? <><Spinner /> Processing payment…</> : `Pay ${inr(item.amount)} securely`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyPayments() {
  const [due, setDue] = useState([]);
  const [appId, setAppId] = useState('');
  const [appNumber, setAppNumber] = useState('');
  const [noApp, setNoApp] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paying, setPaying] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.get('/payments/due')
      .then((r) => {
        setDue(r.data.items || []);
        setAppId(r.data.applicationId || '');
        setAppNumber(r.data.applicationNumber || '');
        if (!r.data.applicationNumber) setNoApp(true);
      })
      .catch(() => setNoApp(true));
    api.get('/payments/mine').then((r) => setPayments(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  if (loading) return <p style={{ color: 'var(--muted)' }}>Loading payments…</p>;

  if (noApp) {
    return (
      <div className="card card-pad">
        <EmptyState icon="💳" title="Nothing to pay yet"
          message="Fees become available once you submit an application."
          action={<Link to="/dashboard/apply" className="btn btn-primary">Start Application</Link>} />
      </div>
    );
  }

  const totalDue = due.reduce((s, d) => s + d.amount, 0);
  const totalPaid = payments.filter((p) => p.status === 'success').reduce((s, p) => s + p.amount, 0);
  const label = { application_fee: 'Application Fee', admission_fee: 'Admission Fee' };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Fees & Payments</h1>
          <p>{appNumber} · Receipts are generated instantly and confirmed in real time.</p>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="stat-card">
          <div className="stat-icon stat-red">⏳</div>
          <div><div className="stat-value">{inr(totalDue)}</div><div className="stat-label">Outstanding dues ({due.length})</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-green">✅</div>
          <div><div className="stat-value">{inr(totalPaid)}</div><div className="stat-label">Total paid ({payments.length} receipts)</div></div>
        </div>
      </div>

      {due.map((item) => (
        <div className="fee-card" key={item.type}>
          <div className="fee-info">
            <b>{item.label}</b>
            <span>Due now — pay online to proceed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="fee-amt">{inr(item.amount)}</span>
            <button className="btn btn-primary" onClick={() => setPaying(item)}>Pay Now</button>
          </div>
        </div>
      ))}
      {due.length === 0 && (
        <div className="card card-pad" style={{ marginBottom: 20, textAlign: 'center', color: 'var(--success)', fontWeight: 600 }}>
          🎉 All fees cleared. No outstanding dues.
        </div>
      )}

      <h3 className="card-title" style={{ margin: '22px 0 12px' }}>Payment history</h3>
      {payments.length === 0 ? (
        <div className="card"><EmptyState icon="🧾" title="No receipts yet" message="Your payment receipts will appear here." /></div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Receipt</th><th>Fee</th><th>Amount</th><th>Method</th><th>Transaction ID</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td className="table-strong">{p.receiptNo}</td>
                  <td>{label[p.type] || p.type}</td>
                  <td className="table-strong">{inr(p.amount)}</td>
                  <td style={{ textTransform: 'uppercase', fontWeight: 600 }}>{p.method}</td>
                  <td className="table-muted">{p.transactionId}</td>
                  <td className="table-muted">{fmtDate(p.paidAt)}</td>
                  <td><span className="badge badge-accepted">{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paying && (
        <PayModal
          item={paying}
          applicationId={appId}
          applicationNumber={appNumber}
          onClose={() => setPaying(null)}
          onPaid={() => {
            setPaying(null);
            load();
          }}
        />
      )}
    </>
  );
}
