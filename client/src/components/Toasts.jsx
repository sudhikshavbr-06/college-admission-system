const ICONS = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };

export default function Toasts({ toasts, dismiss }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type || 'info'}`} onClick={() => dismiss(t.id)}>
          <div className="toast-bar" />
          <span className="toast-icon">{ICONS[t.type] || ICONS.info}</span>
          <div className="toast-body">
            <strong>{t.title}</strong>
            <p>{t.message}</p>
          </div>
          <button className="toast-close" aria-label="Dismiss">×</button>
        </div>
      ))}
    </div>
  );
}
