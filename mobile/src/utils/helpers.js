export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
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
  // Brand Deep Teal & Warm Cream palette (matching web client)
  teal:       '#004643', // Primary Deep Teal
  tealLight:  '#1A706B', // Medium Teal
  teal50:     '#E6F0EF', // Surface Container Low
  teal100:    '#B3D0CE', // Outline Variant
  teal200:    '#80B0AD', // Outline
  teal300:    '#4D908C', // Text Secondary
  teal400:    '#1A706B', // Text Subtitle
  cream:      '#F0EDE5', // Base Canvas Warm Cream
  creamDark:  '#E5E0D5', // Surface Container Warm Cream Dark
  white:      '#ffffff', // Surface Container Lowest
  red:        '#ba1a1a', // Error red
  red50:      '#ffdad6', // Error container
  green:      '#006c49', // Emerald green
  green50:    '#e6f4ea', // Emerald container
  amber:      '#825100', // Amber
  amber50:    '#ffddb8', // Amber container
  gray:       '#4D908C', // Outline
  gray100:    '#B3D0CE', // Outline variant

  // Semantic design system tokens
  primary: '#004643',
  primaryContainer: '#003D3A',
  secondary: '#006c49',
  secondaryContainer: '#e6f4ea',
  tertiary: '#825100',
  tertiaryContainer: '#ffddb8',
  background: '#F0EDE5',
  onSurface: '#0f172a',
  onSurfaceVariant: '#475569',
  outline: '#94a3b8',
  outlineVariant: '#e2e8f0',
  surfaceContainerLow: '#f8fafc',
  surfaceContainer: '#f1f5f9',
  // Status Badges
  badgePendingBg: '#FEF3C7',
  badgePendingText: '#92400E',
  badgeApprovedBg: '#D1FAE5',
  badgeApprovedText: '#065F46',
  badgeRejectedBg: '#FEE2E2',
  badgeRejectedText: '#991B1B',
  badgePaidBg: '#E0F2FE',
  badgePaidText: '#075985',
};

export const getStatusBadgeStyle = (status = '') => {
  const s = status.toLowerCase();
  if (s === 'approved' || s === 'completed' || s === 'active') {
    return { bg: COLORS.badgeApprovedBg, text: COLORS.badgeApprovedText, label: status || 'Approved' };
  }
  if (s === 'pending' || s === 'due soon') {
    return { bg: COLORS.badgePendingBg, text: COLORS.badgePendingText, label: status || 'Pending' };
  }
  if (s === 'rejected' || s === 'overdue' || s === 'unpaid') {
    return { bg: COLORS.badgeRejectedBg, text: COLORS.badgeRejectedText, label: status || 'Rejected' };
  }
  if (s === 'paid') {
    return { bg: COLORS.badgePaidBg, text: COLORS.badgePaidText, label: status || 'Paid' };
  }
  return { bg: COLORS.surfaceContainerLow, text: COLORS.onSurfaceVariant, label: status || 'General' };
};