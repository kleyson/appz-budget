import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors, colors, getShadow, gradientColors, radius } from "../utils/colors";
import type { SummaryTotals } from "../types";

interface SummaryCardsProps {
  totals?: SummaryTotals;
}

interface CardConfig {
  title: string;
  value: number;
  gradientColors: readonly [string, string];
  iconName: keyof typeof Ionicons.glyphMap;
  type: 'expense' | 'income' | 'balance';
}

export const SummaryCards = ({ totals }: SummaryCardsProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(isDark, theme);

  if (!totals) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingSpinner} />
        <Text style={styles.loadingText}>Loading summary...</Text>
      </View>
    );
  }

  const expenseCards: CardConfig[] = [
    {
      title: "Budgeted",
      value: totals.total_budgeted_expenses,
      gradientColors: gradientColors.blue,
      iconName: "clipboard-outline",
      type: 'expense',
    },
    {
      title: "Actual",
      value: totals.total_current_expenses,
      gradientColors: gradientColors.red,
      iconName: "wallet-outline",
      type: 'expense',
    },
  ];

  const incomeCards: CardConfig[] = [
    {
      title: "Budgeted",
      value: totals.total_budgeted_income,
      gradientColors: gradientColors.cyan,
      iconName: "document-text-outline",
      type: 'income',
    },
    {
      title: "Actual",
      value: totals.total_current_income,
      gradientColors: gradientColors.emerald,
      iconName: "cash-outline",
      type: 'income',
    },
  ];

  const balanceCards: CardConfig[] = [
    {
      title: "Budgeted",
      value: totals.total_budgeted,
      gradientColors: totals.total_budgeted >= 0 ? gradientColors.teal : gradientColors.red,
      iconName: "scale-outline",
      type: 'balance',
    },
    {
      title: "Actual",
      value: totals.total_current,
      gradientColors: totals.total_current >= 0 ? gradientColors.green : gradientColors.red,
      iconName: "calculator-outline",
      type: 'balance',
    },
  ];

  const formatCurrency = (value: number) => {
    return `$${Math.abs(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getPercentage = (value: number) => {
    if (totals.total_budgeted_income === 0) return null;
    return ((value / totals.total_budgeted_income) * 100).toFixed(0);
  };

  const renderCard = (card: CardConfig, index: number) => {
    const percentage = getPercentage(card.value);
    const isPositive = card.value >= 0;

    return (
      <View key={`${card.title}-${index}`} style={styles.cardWrapper}>
        <View style={styles.card}>
          <LinearGradient
            colors={card.gradientColors}
            style={styles.accentBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />

          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${card.gradientColors[0]}20` }]}>
                <Ionicons name={card.iconName} size={18} color={card.gradientColors[0]} />
              </View>
              {percentage && (
                <View style={[styles.percentBadge, { backgroundColor: `${card.gradientColors[0]}15` }]}>
                  <Text style={[styles.percentText, { color: card.gradientColors[0] }]}>
                    {isPositive ? "+" : ""}{percentage}%
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.cardLabel}>{card.title}</Text>
            <Text
              style={[
                styles.cardValue,
                { color: card.value === 0 ? theme.textMuted : card.gradientColors[0] },
              ]}
            >
              {!isPositive && "-"}{formatCurrency(card.value)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Expenses Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: theme.dangerBg }]}>
            <Ionicons name="trending-down" size={16} color={theme.danger} />
          </View>
          <Text style={styles.sectionTitle}>Expenses</Text>
        </View>
        <View style={styles.grid}>
          {expenseCards.map(renderCard)}
        </View>
      </View>

      {/* Income Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: theme.successBg }]}>
            <Ionicons name="trending-up" size={16} color={theme.success} />
          </View>
          <Text style={styles.sectionTitle}>Income</Text>
        </View>
        <View style={styles.grid}>
          {incomeCards.map(renderCard)}
        </View>
      </View>

      {/* Balance Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: theme.primaryBg }]}>
            <Ionicons name="wallet" size={16} color={theme.primary} />
          </View>
          <Text style={styles.sectionTitle}>Balance</Text>
        </View>
        <View style={styles.grid}>
          {balanceCards.map(renderCard)}
        </View>
      </View>
    </View>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      gap: 20,
    },
    section: {
      gap: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    sectionIcon: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      letterSpacing: -0.3,
    },
    loadingContainer: {
      padding: 48,
      alignItems: "center",
    },
    loadingSpinner: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: theme.border,
      borderTopColor: theme.primary,
    },
    loadingText: {
      marginTop: 12,
      color: theme.textSecondary,
    },
    grid: {
      flexDirection: "row",
      gap: 12,
    },
    cardWrapper: {
      flex: 1,
    },
    card: {
      backgroundColor: theme.cardSolid,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
      ...getShadow(isDark, "sm"),
    },
    accentBar: {
      height: 3,
    },
    cardContent: {
      padding: 14,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    iconContainer: {
      width: 34,
      height: 34,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    percentBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    percentText: {
      fontSize: 11,
      fontWeight: "700",
    },
    cardLabel: {
      fontSize: 12,
      fontWeight: "500",
      color: theme.textSecondary,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    cardValue: {
      fontSize: 20,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
  });
