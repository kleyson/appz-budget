import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, radius } from "../../utils/colors";

type BadgeVariant = "default" | "success" | "danger" | "warning" | "info" | "primary";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

export const Badge = ({
  label,
  variant = "default",
  size = "sm",
  style,
}: BadgeProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(theme);

  const variantColors = {
    default: { bg: theme.surfaceDefault, text: theme.textSecondary },
    success: { bg: theme.successBg, text: theme.success },
    danger: { bg: theme.dangerBg, text: theme.danger },
    warning: { bg: theme.warningBg, text: theme.warning },
    info: { bg: theme.infoBg, text: theme.info },
    primary: { bg: theme.primaryBg, text: theme.primary },
  };

  const sizeStyles = {
    sm: { paddingHorizontal: 8, paddingVertical: 2, fontSize: 10 },
    md: { paddingHorizontal: 10, paddingVertical: 4, fontSize: 12 },
  };

  const colors = variantColors[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          paddingVertical: sizeStyle.paddingVertical,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors.text, fontSize: sizeStyle.fontSize },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const getStyles = (_theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    badge: {
      borderRadius: radius.sm,
      alignSelf: "flex-start",
    },
    text: {
      fontWeight: "600",
      textTransform: "uppercase",
    },
  });
