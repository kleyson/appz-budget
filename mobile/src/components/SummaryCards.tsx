import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors, colors, getShadow } from "../utils/colors";
import type { SummaryTotals } from "../types";

interface SummaryCardsProps {
  totals?: SummaryTotals;
}

interface CardConfig {
  title: string;
  value: number;
  gradientColors: readonly [string, string];
  iconName: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
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

  const cards: CardConfig[] = [
    {
      title: "Budgeted Expenses",
      value: totals.total_budgeted_expenses,
      gradientColors: [colors.info.light, "#2563eb"],
      iconName: "clipboard-outline",
      iconBg: theme.infoBg,
      iconColor: theme.info,
    },
    {
      title: "Actual Expenses",
      value: totals.total_current_expenses,
      gradientColors: [colors.danger.light, "#dc2626"],
      iconName: "wallet-outline",
      iconBg: theme.dangerBg,
      iconColor: theme.danger,
    },
    {
      title: "Budgeted Income",
      value: totals.total_budgeted_income,
      gradientColors: ["#06b6d4", "#0891b2"],
      iconName: "document-text-outline",
      iconBg: "rgba(6, 182, 212, 0.15)",
      iconColor: "#06b6d4",
    },
    {
      title: "Actual Income",
      value: totals.total_current_income,
      gradientColors: [colors.success.light, "#059669"],
      iconName: "cash-outline",
      iconBg: theme.successBg,
      iconColor: theme.success,
    },
    {
      title: "Budgeted Balance",
      value: totals.total_budgeted,
      gradientColors:
        totals.total_budgeted >= 0
          ? [colors.success.light, "#059669"]
          : [colors.danger.light, "#dc2626"],
      iconName: "scale-outline",
      iconBg: totals.total_budgeted >= 0 ? theme.successBg : theme.dangerBg,
      iconColor: totals.total_budgeted >= 0 ? theme.success : theme.danger,
    },
    {
      title: "Actual Balance",
      value: totals.total_current,
      gradientColors:
        totals.total_current >= 0
          ? [colors.success.light, "#059669"]
          : [colors.danger.light, "#dc2626"],
      iconName: "calculator-outline",
      iconBg: totals.total_current >= 0 ? theme.successBg : theme.dangerBg,
      iconColor: totals.total_current >= 0 ? theme.success : theme.danger,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.grid}>
        {cards.map((card, index) => (
          <View key={card.title} style={styles.cardWrapper}>
            <View style={styles.card}>
              {/* Gradient accent bar */}
              <LinearGradient
                colors={card.gradientColors}
                style={styles.accentBar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />

              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: card.iconBg }]}>
                    <Ionicons name={card.iconName} size={18} color={card.iconColor} />
                  </View>
                  {totals.total_budgeted_income > 0 && (
                    <View style={[styles.percentBadge, { backgroundColor: card.iconBg }]}>
                      <Text style={[styles.percentText, { color: card.iconColor }]}>
                        {card.value >= 0 ? "+" : ""}
                        {((card.value / totals.total_budgeted_income) * 100).toFixed(0)}%
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.cardLabel}>{card.title}</Text>
                <Text
                  style={[
                    styles.cardValue,
                    { color: card.value === 0 ? theme.textMuted : card.iconColor },
                  ]}
                >
                  ${Math.abs(card.value).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      gap: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
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
      flexWrap: "wrap",
      gap: 12,
    },
    cardWrapper: {
      width: "48%",
      flexGrow: 1,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
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
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    percentBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    percentText: {
      fontSize: 11,
      fontWeight: "600",
    },
    cardLabel: {
      fontSize: 12,
      fontWeight: "500",
      color: theme.textSecondary,
      marginBottom: 4,
    },
    cardValue: {
      fontSize: 22,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
  });
