export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

export const COLORS = {
  teal:       '#004643',
  tealLight:  '#1a706b',
  teal50:     '#E6F0EF',
  teal100:    '#B3D0CE',
  cream:      '#F0EDE5',
  creamDark:  '#E5E0D5',
  white:      '#FFFFFF',
  red:        '#dc2626',
  red50:      '#fef2f2',
  green:      '#16a34a',
  green50:    '#f0fdf4',
  amber:      '#d97706',
  amber50:    '#fffbeb',
  gray:       '#6b7280',
  gray100:    '#f3f4f6',
};