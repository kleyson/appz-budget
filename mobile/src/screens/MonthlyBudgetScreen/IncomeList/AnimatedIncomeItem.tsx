import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors, getShadow, isDarkColor, radius } from "../../../utils/colors";
import { formatCurrency } from "../../../utils/styles";
import { springConfigs, getStaggerDelay } from "../../../utils/animations";
import type { Income } from "../../../types";

export interface AnimatedIncomeItemProps {
  income: Income;
  index: number;
  incomeTypeName: string;
  incomeTypeColor: string;
  periodColor: string;
  onEdit: () => void;
  onDelete: () => void;
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
}

export const AnimatedIncomeItem = ({
  income,
  index,
  incomeTypeName,
  incomeTypeColor,
  periodColor,
  onEdit,
  onDelete,
  theme,
  isDark,
}: AnimatedIncomeItemProps) => {
  const styles = getStyles(isDark, theme);
  const progress =
    income.budget > 0
      ? Math.min((income.amount / income.budget) * 100, 100)
      : 0;

  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-30);
  const scale = useSharedValue(0.95);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    const delay = getStaggerDelay(index, 60);
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateX.value = withDelay(delay, withSpring(0, springConfigs.gentle));
    scale.value = withDelay(delay, withSpring(1, springConfigs.gentle));
    progressWidth.value = withDelay(
      delay + 200,
      withTiming(progress, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <Animated.View style={[styles.listItem, animatedStyle]}>
      <View
        style={[styles.listItemAccent, { backgroundColor: theme.success }]}
      />
      <View style={styles.listItemContent}>
        <View style={styles.listItemHeader}>
          <Text style={styles.listItemTitle} numberOfLines={1}>
            {incomeTypeName}
          </Text>
        </View>

        <View style={styles.chipsContainer}>
          <View style={[styles.chip, { backgroundColor: incomeTypeColor }]}>
            <Text
              style={[
                styles.chipText,
                {
                  color: isDarkColor(incomeTypeColor) ? "#fff" : "#0f172a",
                },
              ]}
            >
              {incomeTypeName}
            </Text>
          </View>
          <View style={[styles.chip, { backgroundColor: periodColor }]}>
            <Text
              style={[
                styles.chipText,
                {
                  color: isDarkColor(periodColor) ? "#fff" : "#0f172a",
                },
              ]}
            >
              {income.period}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: theme.success },
                progressAnimatedStyle,
              ]}
            />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
        </View>

        <View style={styles.amountRow}>
          <View>
            <Text style={styles.amountLabel}>Received</Text>
            <Text style={[styles.listItemAmount, { color: theme.success }]}>
              {formatCurrency(income.amount)}
            </Text>
          </View>
          <View style={styles.amountDivider} />
          <View>
            <Text style={styles.amountLabel}>Expected</Text>
            <Text style={styles.listItemBudget}>
              {formatCurrency(income.budget)}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.listItemActions}>
        <TouchableOpacity
          style={[styles.actionIcon, { backgroundColor: theme.primaryBg }]}
          onPress={onEdit}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={14} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionIcon, { backgroundColor: theme.dangerBg }]}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash" size={14} color={theme.danger} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    listItem: {
      flexDirection: "row",
      alignItems: "stretch",
      backgroundColor: theme.cardSolid,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
      ...getShadow(isDark, "sm"),
    },
    listItemAccent: {
      width: 4,
    },
    listItemContent: {
      flex: 1,
      padding: 14,
      gap: 10,
    },
    listItemHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    listItemTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      flex: 1,
    },
    chipsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    chip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    chipText: {
      fontSize: 11,
      fontWeight: "600",
    },
    progressContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    progressBar: {
      flex: 1,
      height: 5,
      backgroundColor: theme.divider,
      borderRadius: 3,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
    },
    progressText: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.textSecondary,
      width: 32,
      textAlign: "right",
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    amountLabel: {
      fontSize: 10,
      color: theme.textMuted,
      textTransform: "uppercase",
      fontWeight: "600",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    amountDivider: {
      width: 1,
      height: 24,
      backgroundColor: theme.border,
      marginHorizontal: 12,
    },
    listItemAmount: {
      fontSize: 16,
      fontWeight: "700",
    },
    listItemBudget: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: "500",
    },
    listItemActions: {
      flexDirection: "column",
      gap: 6,
      padding: 10,
      justifyContent: "center",
    },
    actionIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
  });
