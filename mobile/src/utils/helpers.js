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
  // Legacy mappings mapped to new design system colors
  teal:       '#0058be', // Primary Vibrant Blue
  tealLight:  '#2170e4', // Primary Container Blue
  teal50:     '#eff4ff', // Surface Container Low
  teal100:    '#d3e4fe', // Surface Container Highest
  cream:      '#f8f9ff', // Base Canvas background
  creamDark:  '#e5eeff', // Surface Container
  white:      '#ffffff', // Surface Container Lowest
  red:        '#ba1a1a', // Error red
  red50:      '#ffdad6', // Error container
  green:      '#006c49', // Secondary emerald green
  green50:    '#6cf8bb', // Secondary container
  amber:      '#825100', // Tertiary amber
  amber50:    '#ffddb8', // Tertiary container
  gray:       '#727785', // Outline
  gray100:    '#c2c6d6', // Outline variant

  // New design system semantic tokens
  primary: '#0058be',
  primaryContainer: '#2170e4',
  secondary: '#006c49',
  secondaryContainer: '#6cf8bb',
  tertiary: '#825100',
  tertiaryContainer: '#a36700',
  background: '#f8f9ff',
  onSurface: '#0b1c30',
  onSurfaceVariant: '#424754',
  outline: '#727785',
  outlineVariant: '#c2c6d6',
  surfaceVariant: '#d3e4fe',
  surfaceContainerLow: '#eff4ff',
  surfaceContainerLowest: '#ffffff',
};