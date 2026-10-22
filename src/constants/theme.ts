export const colors = {
  // Vibrant Ocean Sapphire Blue Palette
  primary: '#1D64F2', // Radiant Sapphire Blue
  primaryHover: '#1552C6', // Deep Royal Blue
  primaryDark: '#0E3A8C', // Deep Midnight Navy
  primaryLight: '#EBF3FF', // Ice Blue Tint
  primaryLighter: '#F5F9FF', // Ultra Light Blue Background Tint
  primaryGlow: 'rgba(29, 100, 242, 0.15)',

  // Secondary & Neutral
  secondary: '#0F172A', // Slate 900
  secondaryLight: '#1E293B', // Slate 800
  background: '#F4F7FC', // Elegant Cool Gray-Blue Background
  surface: '#FFFFFF',
  surfaceSubtle: '#F0F5FA', // Soft Tinted Surface
  surfaceElevated: '#FFFFFF',
  border: '#E2EAF4', // Crisp Light Blue-Gray Border
  borderFocus: '#2563EB', // Blue 600
  borderSubtle: '#EDF2F9',

  // Typography
  text: '#0B192C', // Deep Navy Black
  textSecondary: '#4A5D78', // Slate Navy Secondary
  textMuted: '#8FA3BF', // Soft Muted Blue-Gray
  textInverted: '#FFFFFF',

  // Status & Badges
  success: '#059669', // Emerald Mint
  successLight: '#ECFDF5',
  successBorder: '#A7F3D0',
  error: '#E11D48', // Rose Red
  errorLight: '#FFF1F2',
  errorBorder: '#FECDD3',
  warning: '#D97706', // Warm Amber
  warningLight: '#FFFBEB',

  // Status categories
  toRead: '#0284C7', // Sky Blue
  toReadLight: '#E0F2FE',
  toReadBorder: '#BAE6FD',
  reading: '#D97706', // Warm Amber
  readingLight: '#FEF3C7',
  readingBorder: '#FDE68A',
  finished: '#059669', // Emerald
  finishedLight: '#D1FAE5',
  finishedBorder: '#A7F3D0',

  // Genre categories
  fictionBadge: '#E0E7FF',
  fictionText: '#4338CA',
  nonFictionBadge: '#E0F2FE',
  nonFictionText: '#0369A1',
  academicBadge: '#F3E8FF',
  academicText: '#7E22CE',
  otherBadge: '#F1F5F9',
  otherText: '#475569',

  // Favorite star
  starActive: '#F59E0B', // Amber 500
  starInactive: '#94A3B8', // Slate 400
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const shadows = {
  soft: {
    shadowColor: '#1D64F2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  floating: {
    shadowColor: '#1D64F2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 6,
  },
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, lineHeight: 34, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  captionMedium: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  small: { fontSize: 11, fontWeight: '600' as const, lineHeight: 15, letterSpacing: 0.2 },
};
