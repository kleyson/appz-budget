// Modern Fintech Color Palette
// Glassmorphism + Dark Mode optimized design system

export const colors = {
  // Primary - Deep teal (Trust + Modern)
  primary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },

  // Accent - Vibrant amber/gold (Premium feel)
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Slate - Deep dark mode neutrals (OLED optimized)
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    850: '#151d2e',
    900: '#0f172a',
    950: '#080d19',
  },

  // Purple accent for CTA elements
  purple: {
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
  },

  // Semantic colors with enhanced vibrancy
  success: {
    light: '#10b981',
    dark: '#34d399',
    vibrant: '#22c55e',
    bg: {
      light: 'rgba(16, 185, 129, 0.12)',
      dark: 'rgba(52, 211, 153, 0.18)',
    },
  },

  danger: {
    light: '#ef4444',
    dark: '#f87171',
    vibrant: '#f43f5e',
    bg: {
      light: 'rgba(239, 68, 68, 0.12)',
      dark: 'rgba(248, 113, 113, 0.18)',
    },
  },

  warning: {
    light: '#f59e0b',
    dark: '#fbbf24',
    vibrant: '#eab308',
    bg: {
      light: 'rgba(245, 158, 11, 0.12)',
      dark: 'rgba(251, 191, 36, 0.18)',
    },
  },

  info: {
    light: '#3b82f6',
    dark: '#60a5fa',
    vibrant: '#0ea5e9',
    bg: {
      light: 'rgba(59, 130, 246, 0.12)',
      dark: 'rgba(96, 165, 250, 0.18)',
    },
  },
};

// Theme-aware color getter with glassmorphism support
export const getThemeColors = (isDark: boolean) => ({
  // Backgrounds - OLED optimized dark mode
  background: isDark ? colors.slate[950] : colors.slate[50],
  backgroundSecondary: isDark ? colors.slate[900] : '#ffffff',
  backgroundTertiary: isDark ? colors.slate[800] : colors.slate[100],

  // Glassmorphism card styles
  card: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
  cardSolid: isDark ? colors.slate[900] : '#ffffff',
  cardElevated: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.95)',
  cardHover: isDark ? colors.slate[800] : colors.slate[50],

  // Text with better contrast
  text: isDark ? '#f8fafc' : colors.slate[900],
  textSecondary: isDark ? colors.slate[300] : colors.slate[600],
  textMuted: isDark ? colors.slate[400] : colors.slate[500],

  // Borders - subtle glassmorphism effect
  border: isDark ? 'rgba(51, 65, 85, 0.6)' : colors.slate[200],
  borderLight: isDark ? 'rgba(51, 65, 85, 0.4)' : colors.slate[100],
  borderGlass: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',

  // Primary colors - Teal theme
  primary: colors.primary[500],
  primaryHover: colors.primary[600],
  primaryLight: isDark ? colors.primary[400] : colors.primary[600],
  primaryBg: isDark ? 'rgba(20, 184, 166, 0.15)' : 'rgba(20, 184, 166, 0.1)',

  // CTA Purple accent
  cta: isDark ? colors.purple[400] : colors.purple[500],
  ctaBg: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',

  // Semantic colors with vibrant option
  success: isDark ? colors.success.dark : colors.success.light,
  successBg: isDark ? colors.success.bg.dark : colors.success.bg.light,
  successVibrant: colors.success.vibrant,

  danger: isDark ? colors.danger.dark : colors.danger.light,
  dangerBg: isDark ? colors.danger.bg.dark : colors.danger.bg.light,
  dangerVibrant: colors.danger.vibrant,

  warning: isDark ? colors.warning.dark : colors.warning.light,
  warningBg: isDark ? colors.warning.bg.dark : colors.warning.bg.light,
  warningVibrant: colors.warning.vibrant,

  info: isDark ? colors.info.dark : colors.info.light,
  infoBg: isDark ? colors.info.bg.dark : colors.info.bg.light,
  infoVibrant: colors.info.vibrant,

  // Header with glassmorphism
  headerBg: isDark ? 'rgba(8, 13, 25, 0.85)' : 'rgba(255, 255, 255, 0.85)',
  headerBorder: isDark ? 'rgba(51, 65, 85, 0.5)' : colors.slate[200],

  // Input styles
  inputBg: isDark ? 'rgba(30, 41, 59, 0.6)' : colors.slate[50],
  inputBorder: isDark ? 'rgba(51, 65, 85, 0.5)' : colors.slate[200],
  inputFocusBorder: colors.primary[500],
  inputFocusGlow: isDark ? 'rgba(20, 184, 166, 0.3)' : 'rgba(20, 184, 166, 0.2)',
  placeholder: isDark ? colors.slate[500] : colors.slate[400],

  // Tab styles - pill design
  tabBg: isDark ? 'rgba(30, 41, 59, 0.5)' : colors.slate[100],
  tabActiveBg: isDark ? colors.primary[600] : colors.primary[500],
  tabActiveText: '#ffffff',
  tabInactive: isDark ? colors.slate[400] : colors.slate[500],

  // Shadow colors
  shadow: isDark ? '#000000' : colors.slate[900],

  // Gradient overlays
  gradientStart: isDark ? 'rgba(8, 13, 25, 0)' : 'rgba(248, 250, 252, 0)',
  gradientEnd: isDark ? 'rgba(8, 13, 25, 1)' : 'rgba(248, 250, 252, 1)',
});

// Card gradient accent colors - modern fintech palette
export const gradientColors = {
  teal: ['#14b8a6', '#0d9488'] as const,
  cyan: ['#06b6d4', '#0891b2'] as const,
  emerald: ['#10b981', '#059669'] as const,
  green: ['#22c55e', '#16a34a'] as const,
  red: ['#f43f5e', '#e11d48'] as const,
  amber: ['#f59e0b', '#d97706'] as const,
  purple: ['#8b5cf6', '#7c3aed'] as const,
  blue: ['#3b82f6', '#2563eb'] as const,
  pink: ['#ec4899', '#db2777'] as const,
};

// Enhanced shadow styles with glow option
export const getShadow = (isDark: boolean, size: 'sm' | 'md' | 'lg' | 'xl' = 'md') => {
  const shadowOpacity = isDark ? 0.5 : 0.1;
  const elevations = {
    sm: { elevation: 2, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
    md: { elevation: 4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
    lg: { elevation: 8, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
    xl: { elevation: 12, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  };

  return {
    ...elevations[size],
    shadowColor: isDark ? '#000000' : colors.slate[900],
    shadowOpacity,
  };
};

// Colored glow shadow for accent elements
export const getGlowShadow = (color: string, isDark: boolean) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: isDark ? 0.4 : 0.25,
  shadowRadius: 12,
  elevation: 8,
});

// Utility to check if a color is dark (for text contrast)
export const isDarkColor = (color: string): boolean => {
  // Handle rgba colors
  if (color.startsWith('rgba')) {
    return false;
  }
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

// Spacing constants for consistent design
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

// Border radius constants
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};
