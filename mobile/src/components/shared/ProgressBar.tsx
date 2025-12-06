import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors } from "../../utils/colors";

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

export const ProgressBar = ({
  progress,
  color,
  showPercentage = true,
  size = "md",
  style,
}: ProgressBarProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(theme);

  const clampedProgress = Math.min(100, Math.max(0, progress));
  const fillColor = color || theme.primary;

  const heights = { sm: 4, md: 6, lg: 8 };
  const height = heights[size];

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: fillColor,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={styles.percentage}>{clampedProgress.toFixed(0)}%</Text>
      )}
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    track: {
      flex: 1,
      backgroundColor: theme.divider,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
    },
    percentage: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.textSecondary,
      width: 36,
      textAlign: "right",
    },
  });
