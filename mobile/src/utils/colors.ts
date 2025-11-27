// Refined Finance Color Palette
// Matching the web app's sophisticated design aesthetic

export const colors = {
  // Primary - Deep indigo blue
  primary: {
    50: '#f0f4ff',
    100: '#e0e9ff',
    200: '#c7d6fe',
    300: '#a4bbfc',
    400: '#7a95f8',
    500: '#5a6ff2',
    600: '#4650e6',
    700: '#3b40cb',
    800: '#3236a4',
    900: '#2e3382',
  },

  // Accent - Warm amber
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

  // Slate - Refined neutrals
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
    850: '#172033',
    900: '#0f172a',
    950: '#0c1222',
  },

  // Semantic colors
  success: {
    light: '#10b981',
    dark: '#34d399',
    bg: {
      light: 'rgba(16, 185, 129, 0.1)',
      dark: 'rgba(52, 211, 153, 0.2)',
    },
  },

  danger: {
    light: '#ef4444',
    dark: '#f87171',
    bg: {
      light: 'rgba(239, 68, 68, 0.1)',
      dark: 'rgba(248, 113, 113, 0.2)',
    },
  },

  warning: {
    light: '#f59e0b',
    dark: '#fbbf24',
    bg: {
      light: 'rgba(245, 158, 11, 0.1)',
      dark: 'rgba(251, 191, 36, 0.2)',
    },
  },

  info: {
    light: '#3b82f6',
    dark: '#60a5fa',
    bg: {
      light: 'rgba(59, 130, 246, 0.1)',
      dark: 'rgba(96, 165, 250, 0.2)',
    },
  },
};

// Theme-aware color getter
export const getThemeColors = (isDark: boolean) => ({
  // Backgrounds
  background: isDark ? colors.slate[950] : colors.slate[50],
  backgroundSecondary: isDark ? colors.slate[900] : '#ffffff',
  backgroundTertiary: isDark ? colors.slate[800] : colors.slate[100],
  card: isDark ? colors.slate[900] : '#ffffff',
  cardHover: isDark ? colors.slate[800] : colors.slate[50],

  // Text
  text: isDark ? '#ffffff' : colors.slate[900],
  textSecondary: isDark ? colors.slate[400] : colors.slate[500],
  textMuted: isDark ? colors.slate[500] : colors.slate[400],

  // Borders
  border: isDark ? colors.slate[800] : colors.slate[200],
  borderLight: isDark ? colors.slate[700] : colors.slate[100],

  // Primary colors
  primary: colors.primary[500],
  primaryHover: colors.primary[600],
  primaryLight: isDark ? colors.primary[400] : colors.primary[600],
  primaryBg: isDark ? 'rgba(90, 111, 242, 0.15)' : 'rgba(90, 111, 242, 0.1)',

  // Semantic
  success: isDark ? colors.success.dark : colors.success.light,
  successBg: isDark ? colors.success.bg.dark : colors.success.bg.light,
  danger: isDark ? colors.danger.dark : colors.danger.light,
  dangerBg: isDark ? colors.danger.bg.dark : colors.danger.bg.light,
  warning: isDark ? colors.warning.dark : colors.warning.light,
  warningBg: isDark ? colors.warning.bg.dark : colors.warning.bg.light,
  info: isDark ? colors.info.dark : colors.info.light,
  infoBg: isDark ? colors.info.bg.dark : colors.info.bg.light,

  // Header
  headerBg: isDark ? colors.slate[900] : '#ffffff',
  headerBorder: isDark ? colors.slate[800] : colors.slate[200],

  // Input
  inputBg: isDark ? colors.slate[800] : colors.slate[50],
  inputBorder: isDark ? colors.slate[700] : colors.slate[200],
  inputFocusBorder: colors.primary[500],
  placeholder: isDark ? colors.slate[500] : colors.slate[400],

  // Tab
  tabBg: isDark ? colors.slate[800] : colors.slate[100],
  tabActiveBg: isDark ? colors.slate[900] : '#ffffff',
  tabInactive: isDark ? colors.slate[400] : colors.slate[500],

  // Shadow colors (for iOS)
  shadow: isDark ? '#000000' : colors.slate[900],
});

// Card gradient accent colors
export const gradientColors = {
  blue: ['#5a6ff2', '#4650e6'],
  cyan: ['#06b6d4', '#0891b2'],
  emerald: ['#10b981', '#059669'],
  red: ['#ef4444', '#dc2626'],
  amber: ['#f59e0b', '#d97706'],
  purple: ['#8b5cf6', '#7c3aed'],
};

// Common shadow styles
export const getShadow = (isDark: boolean, size: 'sm' | 'md' | 'lg' = 'md') => {
  const shadowOpacity = isDark ? 0.4 : 0.08;
  const elevations = {
    sm: { elevation: 2, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
    md: { elevation: 4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    lg: { elevation: 8, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  };

  return {
    ...elevations[size],
    shadowColor: isDark ? '#000000' : colors.slate[900],
    shadowOpacity,
  };
};

// Utility to check if a color is dark (for text contrast)
export const isDarkColor = (color: string): boolean => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};
