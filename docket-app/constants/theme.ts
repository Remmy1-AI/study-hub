/** Docket theme — Ace cream / forest / ochre, tuned for mobile. */
export const colors = {
  paper: '#F3F0E6',
  paperDeep: '#E8E3D4',
  ink: '#1A1A1A',
  muted: '#5C635C',
  dim: '#7A827A',
  forest: '#1F4A36',
  forestDeep: '#163828',
  forestSoft: '#D8E2D9',
  ochre: '#C9A227',
  ochreSoft: '#E8D48A',
  card: '#FFFCF4',
  line: 'rgba(31, 74, 54, 0.14)',
  danger: '#8B3A2F',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
} as const;

export const typography = {
  display: 'LibreBaskerville_700Bold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  typography,
} as const;

export type Theme = typeof theme;
