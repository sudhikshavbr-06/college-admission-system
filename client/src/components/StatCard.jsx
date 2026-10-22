export default function StatCard({ icon, label, value, sub, tone = 'primary' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-${tone}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}
