export const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';

export const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  documents_pending: 'Docs Pending',
  verified: 'Verified',
  accepted: 'Accepted',
  rejected: 'Rejected',
  pending: 'Pending',
};

export const QUOTA_LABELS = {
  government: 'Government Quota',
  management: 'Management Quota',
  scholarship: 'Scholarship Quota',
};

export const STATUS_FLOW = {
  submitted: ['under_review', 'documents_pending', 'rejected'],
  under_review: ['documents_pending', 'verified', 'rejected'],
  documents_pending: ['verified', 'rejected'],
  verified: ['accepted', 'rejected'],
  accepted: [],
  rejected: [],
};

export const DOC_TYPE_LABELS = {
  photo: 'Passport-size Photograph',
  id_proof: 'Aadhaar / ID Proof',
  tenth_marksheet: '10th Marksheet',
  twelfth_marksheet: '12th Marksheet',
  transfer_certificate: 'Transfer Certificate',
  community_certificate: 'Community Certificate',
  income_certificate: 'Income Certificate',
  migration_certificate: 'Migration Certificate',
};

export const errMessage = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || err?.message || fallback;
