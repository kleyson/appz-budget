import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors, getShadow, radius } from "../../../utils/colors";
import { springConfigs, getStaggerDelay } from "../../../utils/animations";
import type { User } from "../../../types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface AnimatedUserCardProps {
  user: User;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
}

export const AnimatedUserCard = ({
  user,
  index,
  onEdit,
  onDelete,
  theme,
  isDark,
}: AnimatedUserCardProps) => {
  const styles = getStyles(isDark, theme);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.9);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    const delay = getStaggerDelay(index, 50);
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(delay, withSpring(0, springConfigs.gentle));
    scale.value = withDelay(delay, withSpring(1, springConfigs.gentle));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value * pressScale.value },
    ],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.98, springConfigs.snappy);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, springConfigs.snappy);
  };

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <View
        style={[
          styles.colorBar,
          {
            backgroundColor: user.is_admin ? theme.primary : theme.success,
          },
        ]}
      />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.userIcon}>
            <Ionicons
              name={user.is_admin ? "shield" : "person"}
              size={16}
              color={user.is_admin ? theme.primary : theme.success}
            />
          </View>
          <View
            style={[
              styles.statusBadge,
              !user.is_active && styles.statusBadgeInactive,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                !user.is_active && styles.statusTextInactive,
              ]}
            >
              {user.is_active ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
        <Text style={styles.cardEmail} numberOfLines={1} ellipsizeMode="tail">
          {user.email}
        </Text>
        {user.full_name && (
          <Text style={styles.cardName} numberOfLines={1}>
            {user.full_name}
          </Text>
        )}
        <View style={styles.cardActions}>
          <AnimatedPressable
            style={styles.editButton}
            onPress={onEdit}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Ionicons name="pencil-outline" size={14} color={theme.primary} />
          </AnimatedPressable>
          <AnimatedPressable
            style={styles.deleteButton}
            onPress={onDelete}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Ionicons name="trash-outline" size={14} color={theme.danger} />
          </AnimatedPressable>
        </View>
      </View>
    </Animated.View>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    card: {
      flex: 1,
      minWidth: 0,
      backgroundColor: theme.cardSolid,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 12,
      overflow: "hidden",
      ...getShadow(isDark, "sm"),
    },
    colorBar: {
      height: 4,
    },
    cardContent: {
      padding: 12,
      gap: 8,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    userIcon: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      backgroundColor: theme.surfaceDefault,
      alignItems: "center",
      justifyContent: "center",
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.sm,
      backgroundColor: theme.successBg,
    },
    statusBadgeInactive: {
      backgroundColor: theme.surfaceDefault,
    },
    statusText: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.success,
      textTransform: "uppercase",
    },
    statusTextInactive: {
      color: theme.textMuted,
    },
    cardEmail: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.text,
    },
    cardName: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    cardActions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 4,
    },
    editButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      backgroundColor: theme.primaryBg,
      borderRadius: radius.sm,
      gap: 4,
    },
    deleteButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      backgroundColor: theme.dangerBg,
      borderRadius: radius.sm,
      gap: 4,
    },
  });
