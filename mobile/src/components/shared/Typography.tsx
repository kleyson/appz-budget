import React from "react";
import { Text, StyleSheet, TextStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors } from "../../utils/colors";

// Section Title - Used for section headers
interface SectionTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const SectionTitle = ({ children, style }: SectionTitleProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(theme);

  return <Text style={[styles.sectionTitle, style]}>{children}</Text>;
};

// Input Label - Used for form field labels
interface InputLabelProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const InputLabel = ({ children, style }: InputLabelProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(theme);

  return <Text style={[styles.inputLabel, style]}>{children}</Text>;
};

// Hint Text - Used for helper text and hints
interface HintTextProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  style?: TextStyle;
}

export const HintText = ({ children, variant = "default", style }: HintTextProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(theme);

  const variantColors = {
    default: theme.textMuted,
    success: theme.success,
    warning: theme.warning,
    danger: theme.danger,
  };

  return (
    <Text style={[styles.hintText, { color: variantColors[variant] }, style]}>
      {children}
    </Text>
  );
};

// Value Label - Small label above values (e.g., "Spent", "Budget")
interface ValueLabelProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const ValueLabel = ({ children, style }: ValueLabelProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(theme);

  return <Text style={[styles.valueLabel, style]}>{children}</Text>;
};

// Value Amount - Used for displaying monetary or numeric values
interface ValueAmountProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "bold";
  style?: TextStyle;
}

export const ValueAmount = ({ children, variant = "default", style }: ValueAmountProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(theme);

  const variantStyles: Record<string, TextStyle> = {
    default: {},
    success: { color: theme.success },
    danger: { color: theme.danger },
    bold: { fontWeight: "700" },
  };

  return (
    <Text style={[styles.valueAmount, variantStyles[variant], style]}>
      {children}
    </Text>
  );
};

const getStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      letterSpacing: -0.3,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    hintText: {
      fontSize: 12,
      color: theme.textMuted,
      lineHeight: 16,
    },
    valueLabel: {
      fontSize: 11,
      color: theme.textMuted,
      marginBottom: 2,
    },
    valueAmount: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
  });
