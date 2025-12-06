import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, getShadow, radius } from "../../utils/colors";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  style?: ViewStyle;
}

export const Card = ({
  children,
  variant = "default",
  padding = "md",
  style,
}: CardProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(isDark, theme);

  const paddingValues = { none: 0, sm: 10, md: 14, lg: 20 };

  return (
    <View
      style={[
        styles.card,
        variant === "elevated" && styles.elevated,
        variant === "outlined" && styles.outlined,
        { padding: paddingValues[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.cardSolid,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      ...getShadow(isDark, "sm"),
    },
    elevated: {
      ...getShadow(isDark, "md"),
    },
    outlined: {
      backgroundColor: "transparent",
      ...getShadow(isDark, "sm"),
    },
  });
