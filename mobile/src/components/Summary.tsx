import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useCategorySummary } from '../hooks/useCategories';
import { useIncomeTypeSummary } from '../hooks/useSummary';
import { useCategories } from '../hooks/useCategories';
import { useIncomeTypes } from '../hooks/useIncomeTypes';
import type { CategorySummary, IncomeTypeSummary, Category, IncomeType } from '../types';


interface SummaryProps {
  periodFilter?: string | null;
  monthId?: number | null;
}

export const Summary = ({ periodFilter = null, monthId = null }: SummaryProps) => {
  const { isDark } = useTheme();
  const { data: summary, isLoading } = useCategorySummary(periodFilter || null);
  const { data: categories } = useCategories();
  const { data: incomeTypeSummary, isLoading: isLoadingIncomeSummary } = useIncomeTypeSummary({
    period: periodFilter,
    month_id: monthId,
  });
  const { data: incomeTypes } = useIncomeTypes();
  const styles = getStyles(isDark);

  const getCategoryColor = (categoryName: string): string => {
    const category = categories?.find((c: Category) => c.name === categoryName);
    return category?.color || '#8b5cf6';
  };

  const getIncomeTypeColor = (incomeTypeName: string): string => {
    const incomeType = incomeTypes?.find((it: IncomeType) => it.name === incomeTypeName);
    return incomeType?.color || '#10b981';
  };

  const isDarkColor = (color: string): boolean => {
    // Simple check for dark colors
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  if (isLoading || isLoadingIncomeSummary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading summary...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Expenses by Category</Text>

      {!summary || summary.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No category summary data available.</Text>
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          {summary.map((item: CategorySummary) => {
            const difference = item.budget - item.total;
            const isWithinBudget = !item.over_budget;
            const categoryColor = getCategoryColor(item.category);

            return (
              <View key={item.category} style={styles.categoryCard}>
                <View style={styles.categoryCardTopRow}>
                  <View
                    style={[
                      styles.chip,
                      { backgroundColor: categoryColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isDarkColor(categoryColor) ? '#ffffff' : '#111827' },
                      ]}
                    >
                      {item.category}
                    </Text>
                  </View>
                  <View style={styles.categoryCardValueContainer}>
                    <Text style={styles.categoryCardLabel}>Budget</Text>
                    <Text style={styles.categoryCardValue}>${item.budget.toFixed(2)}</Text>
                  </View>
                </View>
                <View style={styles.categoryCardMiddleRow}>
                  <View style={styles.categoryCardValueContainer}>
                    <Text style={styles.categoryCardLabel}>Total</Text>
                    <Text style={styles.categoryCardValue}>${item.total.toFixed(2)}</Text>
                  </View>
                </View>
                <View style={styles.categoryCardBottomRow}>
                  <View style={styles.categoryCardValueContainer}>
                    <Text style={styles.categoryCardLabel}>Status</Text>
                    <View
                      style={[
                        styles.statusChip,
                        isWithinBudget ? styles.statusChipSuccess : styles.statusChipDanger,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          isWithinBudget ? styles.statusChipTextSuccess : styles.statusChipTextDanger,
                        ]}
                      >
                        {isWithinBudget ? '✅ On Budget' : '🔴 Over Budget'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryCardValueContainer}>
                    <Text style={styles.categoryCardLabel}>Difference</Text>
                    <Text
                      style={[
                        styles.categoryCardValue,
                        styles.categoryCardBold,
                        difference >= 0 ? styles.textSuccess : styles.textDanger,
                      ]}
                    >
                      ${difference.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>Income Summary</Text>

      {!incomeTypeSummary || incomeTypeSummary.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No income type summary data available.</Text>
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          {incomeTypeSummary.map((item: IncomeTypeSummary) => {
            const difference = item.total - item.budget;
            const incomeTypeColor = getIncomeTypeColor(item.income_type);

            return (
              <View key={item.income_type} style={styles.categoryCard}>
                <View style={styles.categoryCardTopRow}>
                  <View
                    style={[
                      styles.chip,
                      { backgroundColor: incomeTypeColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isDarkColor(incomeTypeColor) ? '#ffffff' : '#111827' },
                      ]}
                    >
                      {item.income_type}
                    </Text>
                  </View>
                  <View style={styles.categoryCardValueContainer}>
                    <Text style={styles.categoryCardLabel}>Budget</Text>
                    <Text style={styles.categoryCardValue}>${item.budget.toFixed(2)}</Text>
                  </View>
                </View>
                <View style={styles.categoryCardBottomRow}>
                  <View style={styles.categoryCardValueContainer}>
                    <Text style={styles.categoryCardLabel}>Total</Text>
                    <Text style={styles.categoryCardValue}>${item.total.toFixed(2)}</Text>
                  </View>
                  <View style={styles.categoryCardValueContainer}>
                    <Text style={styles.categoryCardLabel}>Difference</Text>
                    <Text
                      style={[
                        styles.categoryCardValue,
                        styles.categoryCardBold,
                        difference >= 0 ? styles.textSuccess : styles.textDanger,
                      ]}
                    >
                      ${difference.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      padding: 32,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#111827',
      marginBottom: 16,
      marginTop: 8,
    },
    sectionTitleMargin: {
      marginTop: 32,
    },
    emptyContainer: {
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    cardsContainer: {
      gap: 12,
    },
    categoryCard: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      gap: 12,
    },
    categoryCardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    categoryCardMiddleRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'flex-start',
    },
    categoryCardBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    categoryCardValueContainer: {
      alignItems: 'flex-end',
    },
    categoryCardLabel: {
      fontSize: 10,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginBottom: 4,
      textTransform: 'uppercase',
      fontWeight: '600',
    },
    categoryCardValue: {
      fontSize: 14,
      color: isDark ? '#ffffff' : '#111827',
    },
    categoryCardBold: {
      fontWeight: '600',
    },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    chipText: {
      fontSize: 12,
      fontWeight: '600',
    },
    statusChip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    statusChipSuccess: {
      backgroundColor: isDark ? '#064e3b' : '#d1fae5',
    },
    statusChipDanger: {
      backgroundColor: isDark ? '#7f1d1d' : '#fee2e2',
    },
    statusChipText: {
      fontSize: 12,
      fontWeight: '600',
    },
    statusChipTextSuccess: {
      color: isDark ? '#6ee7b7' : '#065f46',
    },
    statusChipTextDanger: {
      color: isDark ? '#fca5a5' : '#991b1b',
    },
    textSuccess: {
      color: '#10b981',
    },
    textDanger: {
      color: '#ef4444',
    },
  });

