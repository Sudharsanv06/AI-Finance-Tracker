// Format currency in INR
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

// Format date
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });
};

// Get budget utilization percentage
export const getUtilization = (spent, total) => {
  if (!total) return 0;
  return Math.min(Math.round((spent / total) * 100), 100);
};

// Get utilization color class
export const getUtilizationColor = (pct) => {
  if (pct >= 90) return 'text-red-600';
  if (pct >= 70) return 'text-amber-600';
  return 'text-teal';
};

// Get utilization bar color
export const getUtilizationBarColor = (pct) => {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-amber-500';
  return 'bg-teal';
};

// Get status badge class
export const getStatusBadgeClass = (status) => {
  const map = {
    Pending:   'badge-pending',
    Approved:  'badge-approved',
    Rejected:  'badge-rejected',
    Paid:      'badge-paid',
    active:    'badge-active',
    completed: 'badge-completed',
    draft:     'badge-draft',
    upcoming:  'badge-active',
    cancelled: 'badge-rejected',
  };
  return `badge ${map[status] || 'badge-draft'}`;
};

// Truncate long text
export const truncate = (str, n = 40) =>
  str?.length > n ? str.slice(0, n) + '...' : str || '';

// Get user initials
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};