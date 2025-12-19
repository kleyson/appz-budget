import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors, colors, radius } from "../../../utils/colors";
import { useResponsive } from "../../../hooks/useResponsive";
import { AnimatedExpenseItem } from "./AnimatedExpenseItem";
import type { Expense, Category, Period } from "../../../types";

export interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
  categories: Category[];
  periods: Period[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
  onPay: (expense: Expense) => void;
  onAdd: () => void;
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
}

export const ExpenseList = ({
  expenses,
  isLoading,
  categories,
  periods,
  onEdit,
  onDelete,
  onPay,
  onAdd,
  theme,
  isDark,
}: ExpenseListProps) => {
  const { columns, isTablet } = useResponsive();
  const styles = getStyles(theme, isTablet);

  const getCategoryColor = (categoryName: string) => {
    const category = categories?.find(
      (cat: Category) => cat.name === categoryName
    );
    return category?.color || colors.primary[500];
  };

  const getPeriodColor = (periodName: string) => {
    const period = periods?.find((p: Period) => p.name === periodName);
    return period?.color || colors.primary[500];
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  // Render items in a responsive grid for tablets
  const renderItems = () => {
    if (expenses.length === 0) {
      return (
        <Animated.View
          style={styles.emptyContainer}
          entering={FadeIn.delay(100).duration(300)}
        >
          <View style={styles.emptyIcon}>
            <Ionicons name="wallet-outline" size={40} color={theme.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No expenses yet</Text>
          <Text style={styles.emptyText}>
            Add your first expense to start tracking
          </Text>
        </Animated.View>
      );
    }

    if (columns === 1) {
      // Single column layout (phones)
      return expenses.map((expense: Expense, index: number) => (
        <AnimatedExpenseItem
          key={expense.id}
          expense={expense}
          index={index}
          categoryColor={getCategoryColor(expense.category)}
          periodColor={getPeriodColor(expense.period)}
          onEdit={() => onEdit(expense)}
          onDelete={() => onDelete(expense.id)}
          onPay={() => onPay(expense)}
          theme={theme}
          isDark={isDark}
        />
      ));
    }

    // Multi-column grid layout (tablets)
    const rows: Expense[][] = [];
    for (let i = 0; i < expenses.length; i += columns) {
      rows.push(expenses.slice(i, i + columns));
    }

    return rows.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.gridRow}>
        {row.map((expense, colIndex) => (
          <View key={expense.id} style={styles.gridItem}>
            <AnimatedExpenseItem
              expense={expense}
              index={rowIndex * columns + colIndex}
              categoryColor={getCategoryColor(expense.category)}
              periodColor={getPeriodColor(expense.period)}
              onEdit={() => onEdit(expense)}
              onDelete={() => onDelete(expense.id)}
              onPay={() => onPay(expense)}
              theme={theme}
              isDark={isDark}
            />
          </View>
        ))}
        {/* Fill empty spots in last row */}
        {row.length < columns &&
          Array.from({ length: columns - row.length }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.gridItem} />
          ))}
      </View>
    ));
  };

  return (
    <View style={styles.listContainer}>
      <Animated.View entering={FadeIn.duration(300)}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAdd}
          activeOpacity={0.7}
        >
          <View
            style={[styles.addButtonIcon, { backgroundColor: theme.dangerBg }]}
          >
            <Ionicons name="wallet-outline" size={20} color={theme.danger} />
          </View>
          <Text style={styles.addButtonText}>Add Expense</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </Animated.View>

      {renderItems()}
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getThemeColors>, isTablet: boolean) =>
  StyleSheet.create({
    listContainer: {
      gap: isTablet ? 16 : 12,
    },
    gridRow: {
      flexDirection: "row",
      gap: 12,
    },
    gridItem: {
      flex: 1,
    },
    loadingContainer: {
      padding: 48,
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      color: theme.textSecondary,
      fontSize: 14,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      backgroundColor: theme.cardSolid,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: "dashed",
    },
    addButtonIcon: {
      width: 38,
      height: 38,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    addButtonText: {
      flex: 1,
      fontWeight: "600",
      fontSize: 15,
      color: theme.text,
    },
    emptyContainer: {
      padding: 48,
      alignItems: "center",
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: radius.xl,
      backgroundColor: theme.backgroundTertiary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 6,
    },
    emptyText: {
      textAlign: "center",
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
  });
