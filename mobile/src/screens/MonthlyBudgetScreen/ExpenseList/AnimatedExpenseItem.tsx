import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors, getShadow, isDarkColor, radius } from "../../../utils/colors";
import { formatCurrency } from "../../../utils/styles";
import { springConfigs, getStaggerDelay } from "../../../utils/animations";
import type { Expense, Purchase } from "../../../types";

export interface AnimatedExpenseItemProps {
  expense: Expense;
  index: number;
  categoryColor: string;
  periodColor: string;
  onEdit: () => void;
  onDelete: () => void;
  onPay: () => void;
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
}

const PURCHASE_ITEM_HEIGHT = 44;
const PURCHASES_HEADER_HEIGHT = 32;
const PURCHASES_PADDING = 12;

export const AnimatedExpenseItem = ({
  expense,
  index,
  categoryColor,
  periodColor,
  onEdit,
  onDelete,
  onPay,
  theme,
  isDark,
}: AnimatedExpenseItemProps) => {
  const styles = getStyles(isDark, theme);
  const isOnBudget = expense.cost <= expense.budget;
  const progress =
    expense.budget > 0
      ? Math.min((expense.cost / expense.budget) * 100, 100)
      : 0;

  const hasPurchases = expense.purchases && expense.purchases.length > 0;
  const purchaseCount = expense.purchases?.length || 0;

  const [isExpanded, setIsExpanded] = useState(false);

  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-30);
  const scale = useSharedValue(0.95);
  const progressWidth = useSharedValue(0);
  const expandHeight = useSharedValue(0);
  const chevronRotation = useSharedValue(0);

  useEffect(() => {
    const delay = getStaggerDelay(index, 60);
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateX.value = withDelay(delay, withSpring(0, springConfigs.gentle));
    scale.value = withDelay(delay, withSpring(1, springConfigs.gentle));
    progressWidth.value = withDelay(
      delay + 200,
      withTiming(progress, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
  }, [index, progress, opacity, translateX, scale, progressWidth]);

  const toggleExpand = useCallback(() => {
    if (!hasPurchases) return;

    const targetHeight = isExpanded
      ? 0
      : PURCHASES_HEADER_HEIGHT + purchaseCount * PURCHASE_ITEM_HEIGHT + PURCHASES_PADDING;

    expandHeight.value = withSpring(targetHeight, springConfigs.gentle);
    chevronRotation.value = withSpring(isExpanded ? 0 : 180, springConfigs.gentle);
    setIsExpanded(!isExpanded);
  }, [isExpanded, hasPurchases, purchaseCount, expandHeight, chevronRotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const expandedSectionStyle = useAnimatedStyle(() => ({
    height: expandHeight.value,
    opacity: interpolate(expandHeight.value, [0, 50], [0, 1]),
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const formatPurchaseDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <Animated.View style={[styles.listItem, animatedStyle]}>
      <View
        style={[styles.listItemAccent, { backgroundColor: categoryColor }]}
      />
      <View style={styles.listItemMainContainer}>
        <View style={styles.listItemContent}>
          <View style={styles.listItemHeader}>
            <Text style={styles.listItemTitle} numberOfLines={1}>
              {expense.expense_name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                isOnBudget ? styles.statusSuccess : styles.statusDanger,
              ]}
            >
              <Ionicons
                name={isOnBudget ? "checkmark" : "alert"}
                size={10}
                color={isOnBudget ? theme.success : theme.danger}
              />
            </View>
          </View>

          <View style={styles.chipsContainer}>
            <View style={[styles.chip, { backgroundColor: categoryColor }]}>
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isDarkColor(categoryColor) ? "#fff" : "#0f172a",
                  },
                ]}
              >
                {expense.category}
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
                {expense.period}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: isOnBudget ? theme.success : theme.danger,
                  },
                  progressAnimatedStyle,
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
          </View>

          <View style={styles.amountRow}>
            <View>
              <Text style={styles.amountLabel}>Spent</Text>
              <Text
                style={[
                  styles.listItemAmount,
                  { color: isOnBudget ? theme.text : theme.danger },
                ]}
              >
                {formatCurrency(expense.cost)}
              </Text>
            </View>
            <View style={styles.amountDivider} />
            <View>
              <Text style={styles.amountLabel}>Budget</Text>
              <Text style={styles.listItemBudget}>
                {formatCurrency(expense.budget)}
              </Text>
            </View>
          </View>

          {/* Purchases Toggle Row */}
          {hasPurchases && (
            <Pressable
              style={styles.purchasesToggle}
              onPress={toggleExpand}
            >
              <View style={styles.purchasesToggleLeft}>
                <View style={[styles.purchasesIcon, { backgroundColor: theme.primaryBg }]}>
                  <Ionicons name="receipt-outline" size={12} color={theme.primary} />
                </View>
                <Text style={styles.purchasesToggleText}>
                  {purchaseCount} purchase{purchaseCount !== 1 ? "s" : ""}
                </Text>
              </View>
              <Animated.View style={chevronStyle}>
                <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
              </Animated.View>
            </Pressable>
          )}

          {/* Expandable Purchases List */}
          <Animated.View style={[styles.purchasesContainer, expandedSectionStyle]}>
            <View style={styles.purchasesDivider} />
            <Text style={styles.purchasesHeader}>Purchase History</Text>
            {expense.purchases?.map((purchase: Purchase, idx: number) => (
              <View key={idx} style={styles.purchaseItem}>
                <View style={styles.purchaseItemLeft}>
                  <View style={[styles.purchaseDot, { backgroundColor: categoryColor }]} />
                  <Text style={styles.purchaseName} numberOfLines={1}>
                    {purchase.name}
                  </Text>
                </View>
                <View style={styles.purchaseItemRight}>
                  {purchase.date && (
                    <Text style={styles.purchaseDate}>
                      {formatPurchaseDate(purchase.date)}
                    </Text>
                  )}
                  <Text style={styles.purchaseAmount}>
                    {formatCurrency(purchase.amount)}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        </View>

        <View style={styles.listItemActions}>
          <TouchableOpacity
            style={[styles.actionIcon, { backgroundColor: theme.successBg }]}
            onPress={onPay}
            activeOpacity={0.7}
          >
            <Ionicons
              name={hasPurchases ? "add-circle-outline" : "card-outline"}
              size={16}
              color={theme.success}
            />
          </TouchableOpacity>
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
    listItemMainContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
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
    statusBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },
    statusSuccess: {
      backgroundColor: theme.successBg,
    },
    statusDanger: {
      backgroundColor: theme.dangerBg,
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
      justifyContent: "flex-start",
      paddingTop: 14,
    },
    actionIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    // Purchases Toggle
    purchasesToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: theme.surfaceSubtle,
      borderRadius: radius.md,
      marginTop: 2,
    },
    purchasesToggleLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    purchasesIcon: {
      width: 24,
      height: 24,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    purchasesToggleText: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.textSecondary,
    },
    // Purchases List
    purchasesContainer: {
      overflow: "hidden",
    },
    purchasesDivider: {
      height: 1,
      backgroundColor: theme.divider,
      marginBottom: 8,
    },
    purchasesHeader: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    purchaseItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      height: PURCHASE_ITEM_HEIGHT,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    purchaseItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 8,
    },
    purchaseDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    purchaseName: {
      fontSize: 14,
      color: theme.text,
      flex: 1,
    },
    purchaseItemRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    purchaseDate: {
      fontSize: 12,
      color: theme.textMuted,
    },
    purchaseAmount: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
  });
