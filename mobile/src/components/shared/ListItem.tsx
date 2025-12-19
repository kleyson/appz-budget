import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeIn,
  Layout,
} from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, getShadow, radius, spacing } from "../../utils/colors";
import { IconButton } from "./IconButton";
import { springConfigs, timingConfigs, getStaggerDelay } from "../../utils/animations";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ListItemProps {
  name: string;
  subtitle?: string;
  color?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onPress?: () => void;
  children?: React.ReactNode;
  rightContent?: React.ReactNode;
  /** Enable entrance animation */
  animated?: boolean;
  /** Index for stagger animation delay */
  animationIndex?: number;
}

export const ListItem = ({
  name,
  subtitle,
  color,
  onEdit,
  onDelete,
  onPress,
  children,
  rightContent,
  animated = false,
  animationIndex = 0,
}: ListItemProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(isDark, theme);

  // Animation values
  const opacity = useSharedValue(animated ? 0 : 1);
  const translateX = useSharedValue(animated ? -20 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (animated) {
      const delay = getStaggerDelay(animationIndex);
      opacity.value = withDelay(delay, withTiming(1, timingConfigs.normal));
      translateX.value = withDelay(delay, withSpring(0, springConfigs.gentle));
    }
  }, [animated, animationIndex]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, springConfigs.snappy);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, springConfigs.snappy);
    }
  };

  const Container = onPress ? AnimatedPressable : Animated.View;

  return (
    <Container
      style={[styles.container, animated && entranceStyle, onPress && pressStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      layout={Layout.springify()}
    >
      {color && (
        <Animated.View
          style={[styles.colorIndicator, { backgroundColor: color }]}
          entering={FadeIn.duration(200)}
        />
      )}
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </View>
      {rightContent}
      {(onEdit || onDelete) && (
        <Animated.View style={styles.actions} entering={FadeIn.delay(100).duration(200)}>
          {onEdit && <IconButton icon="pencil-outline" onPress={onEdit} variant="primary" />}
          {onDelete && <IconButton icon="trash-outline" onPress={onDelete} variant="danger" />}
        </Animated.View>
      )}
    </Container>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      backgroundColor: theme.cardSolid,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      gap: spacing.md,
      ...getShadow(isDark, "sm"),
    },
    colorIndicator: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
    },
    content: {
      flex: 1,
    },
    name: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },
    subtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
    },
  });
