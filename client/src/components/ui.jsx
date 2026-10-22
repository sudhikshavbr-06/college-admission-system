export function FullScreenLoader({ label = 'Loading your portal…' }) {
  return (
    <div className="fullscreen-loader">
      <div className="loader-ring" />
      <p>{label}</p>
    </div>
  );
}

export function Spinner() {
  return <span className="loader-ring loader-inline" />;
}

export function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export default EmptyState;
