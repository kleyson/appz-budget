import React, { useEffect } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors } from "../../utils/colors";

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
  /** Enable entrance animation */
  animated?: boolean;
  /** Delay before animation starts (ms) */
  animationDelay?: number;
}

export const ProgressBar = ({
  progress,
  color,
  showPercentage = true,
  size = "md",
  style,
  animated = true,
  animationDelay = 0,
}: ProgressBarProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(theme);

  const clampedProgress = Math.min(100, Math.max(0, progress));
  const fillColor = color || theme.primary;

  const heights = { sm: 4, md: 6, lg: 8 };
  const height = heights[size];

  // Animation value
  const animatedProgress = useSharedValue(animated ? 0 : clampedProgress);

  useEffect(() => {
    if (animated) {
      animatedProgress.value = withDelay(
        animationDelay,
        withTiming(clampedProgress, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        })
      );
    } else {
      animatedProgress.value = clampedProgress;
    }
  }, [clampedProgress, animated, animationDelay, animatedProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }));

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: fillColor,
              borderRadius: height / 2,
            },
            animatedStyle,
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
