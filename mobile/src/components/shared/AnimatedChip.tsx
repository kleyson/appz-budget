import React from "react";
import { Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  SlideInLeft,
} from "react-native-reanimated";
import { getThemeColors, radius, isDarkColor } from "../../utils/colors";
import { springConfigs, getStaggerDelay } from "../../utils/animations";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface AnimatedChipProps {
  label: string;
  isSelected: boolean;
  color?: string;
  onPress: () => void;
  index?: number;
  theme: ReturnType<typeof getThemeColors>;
  animated?: boolean;
}

export const AnimatedChip = ({
  label,
  isSelected,
  color,
  onPress,
  index = 0,
  theme,
  animated = true,
}: AnimatedChipProps) => {
  const styles = getStyles(theme);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, springConfigs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigs.snappy);
  };

  const chipStyle =
    isSelected && color
      ? { backgroundColor: color, borderColor: color }
      : isSelected
        ? styles.chipActive
        : {};

  const textColor =
    isSelected && color
      ? isDarkColor(color)
        ? "#ffffff"
        : "#0f172a"
      : isSelected
        ? theme.primary
        : theme.textSecondary;

  const enteringAnimation = animated
    ? SlideInLeft.delay(getStaggerDelay(index, 40)).duration(300).springify()
    : undefined;

  return (
    <AnimatedPressable
      entering={enteringAnimation}
      style={[styles.chip, chipStyle, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text
        style={[
          styles.chipText,
          isSelected && styles.chipTextActive,
          { color: textColor },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
};

const getStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSubtle,
    },
    chipActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryBg,
    },
    chipText: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.textSecondary,
    },
    chipTextActive: {
      fontWeight: "600",
    },
  });
