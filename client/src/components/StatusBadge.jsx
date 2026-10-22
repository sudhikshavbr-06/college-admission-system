import { STATUS_LABELS } from '../lib/utils.js';

export default function StatusBadge({ status, quota }) {
  if (quota) {
    const map = {
      government: { label: 'Govt. Quota', cls: 'badge-govt' },
      management: { label: 'Mgmt. Quota', cls: 'badge-mgmt' },
      scholarship: { label: 'Scholarship', cls: 'badge-schol' },
    };
    const m = map[quota] || map.government;
    return <span className={`badge ${m.cls}`}>{m.label}</span>;
  }
  const label = STATUS_LABELS[status] || status;
  return <span className={`badge badge-${status}`}>{label}</span>;
}
