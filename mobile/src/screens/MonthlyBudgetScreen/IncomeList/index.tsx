import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors, colors, radius } from "../../../utils/colors";
import { useResponsive } from "../../../hooks/useResponsive";
import { AnimatedIncomeItem } from "./AnimatedIncomeItem";
import type { Income, IncomeType, Period } from "../../../types";

export interface IncomeListProps {
  incomes: Income[];
  isLoading: boolean;
  incomeTypes: IncomeType[];
  periods: Period[];
  onEdit: (income: Income) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
}

export const IncomeList = ({
  incomes,
  isLoading,
  incomeTypes,
  periods,
  onEdit,
  onDelete,
  onAdd,
  theme,
  isDark,
}: IncomeListProps) => {
  const { columns, isTablet } = useResponsive();
  const styles = getStyles(theme, isTablet);

  const getIncomeTypeName = (incomeTypeId: number) => {
    const incomeType = incomeTypes?.find(
      (it: IncomeType) => it.id === incomeTypeId
    );
    return incomeType?.name || `Type #${incomeTypeId}`;
  };

  const getIncomeTypeColor = (incomeTypeId: number) => {
    const incomeType = incomeTypes?.find(
      (it: IncomeType) => it.id === incomeTypeId
    );
    return incomeType?.color || colors.success.light;
  };

  const getPeriodColor = (periodName: string) => {
    const period = periods?.find((p: Period) => p.name === periodName);
    return period?.color || colors.primary[500];
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading income...</Text>
      </View>
    );
  }

  // Render items in a responsive grid for tablets
  const renderItems = () => {
    if (incomes.length === 0) {
      return (
        <Animated.View
          style={styles.emptyContainer}
          entering={FadeIn.delay(100).duration(300)}
        >
          <View style={styles.emptyIcon}>
            <Ionicons name="cash-outline" size={40} color={theme.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No income yet</Text>
          <Text style={styles.emptyText}>
            Add your income to track your earnings
          </Text>
        </Animated.View>
      );
    }

    if (columns === 1) {
      // Single column layout (phones)
      return incomes.map((income: Income, index: number) => (
        <AnimatedIncomeItem
          key={income.id}
          income={income}
          index={index}
          incomeTypeName={getIncomeTypeName(income.income_type_id)}
          incomeTypeColor={getIncomeTypeColor(income.income_type_id)}
          periodColor={getPeriodColor(income.period)}
          onEdit={() => onEdit(income)}
          onDelete={() => onDelete(income.id)}
          theme={theme}
          isDark={isDark}
        />
      ));
    }

    // Multi-column grid layout (tablets)
    const rows: Income[][] = [];
    for (let i = 0; i < incomes.length; i += columns) {
      rows.push(incomes.slice(i, i + columns));
    }

    return rows.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.gridRow}>
        {row.map((income, colIndex) => (
          <View key={income.id} style={styles.gridItem}>
            <AnimatedIncomeItem
              income={income}
              index={rowIndex * columns + colIndex}
              incomeTypeName={getIncomeTypeName(income.income_type_id)}
              incomeTypeColor={getIncomeTypeColor(income.income_type_id)}
              periodColor={getPeriodColor(income.period)}
              onEdit={() => onEdit(income)}
              onDelete={() => onDelete(income.id)}
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
            style={[styles.addButtonIcon, { backgroundColor: theme.successBg }]}
          >
            <Ionicons
              name="trending-up-outline"
              size={20}
              color={theme.success}
            />
          </View>
          <Text style={styles.addButtonText}>Add Income</Text>
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
