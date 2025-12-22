import React, { useEffect } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, getShadow, radius } from "../../utils/colors";
import { springConfigs, timingConfigs, getStaggerDelay } from "../../utils/animations";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  style?: ViewStyle;
  /** Enable entrance animation */
  animated?: boolean;
  /** Index for stagger animation delay */
  animationIndex?: number;
}

export const Card = ({
  children,
  variant = "default",
  padding = "md",
  style,
  animated = false,
  animationIndex = 0,
}: CardProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(isDark, theme);

  const paddingValues = { none: 0, sm: 10, md: 14, lg: 20 };

  // Animation values
  const opacity = useSharedValue(animated ? 0 : 1);
  const translateY = useSharedValue(animated ? 20 : 0);
  const scale = useSharedValue(animated ? 0.95 : 1);

  useEffect(() => {
    if (animated) {
      const delay = getStaggerDelay(animationIndex);
      opacity.value = withDelay(delay, withTiming(1, timingConfigs.normal));
      translateY.value = withDelay(delay, withSpring(0, springConfigs.gentle));
      scale.value = withDelay(delay, withSpring(1, springConfigs.gentle));
    }
  }, [animated, animationIndex, opacity, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.card,
        variant === "elevated" && styles.elevated,
        variant === "outlined" && styles.outlined,
        { padding: paddingValues[padding] },
        animated && animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
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
