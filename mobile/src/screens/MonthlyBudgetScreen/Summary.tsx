import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useCategorySummary } from '../../hooks/useCategories';
import { useIncomeTypeSummary, usePeriodSummary } from '../../hooks/useSummary';
import { useCategories } from '../../hooks/useCategories';
import { useIncomeTypes } from '../../hooks/useIncomeTypes';
import { getThemeColors, getShadow, isDarkColor, radius, gradientColors, colors } from '../../utils/colors';
import { formatCurrency } from '../../utils/styles';
import { ProgressBar, SectionTitle } from '../../components/shared';
import type { CategorySummary, IncomeTypeSummary, PeriodSummary, Category, IncomeType } from '../../types';

interface SummaryProps {
  periodFilter?: string | null;
  monthId?: number | null;
}

export const Summary = ({ periodFilter = null, monthId = null }: SummaryProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { data: summary, isLoading } = useCategorySummary({
    period: periodFilter,
    month_id: monthId,
  });
  const { data: categories } = useCategories();
  const { data: incomeTypeSummary, isLoading: isLoadingIncomeSummary } = useIncomeTypeSummary({
    period: periodFilter,
    month_id: monthId,
  });
  const { data: incomeTypes } = useIncomeTypes();
  const { data: periodSummary, isLoading: isLoadingPeriodSummary } = usePeriodSummary({
    month_id: monthId,
  });
  const styles = getStyles(isDark, theme);

  const getCategoryColor = (categoryName: string): string => {
    const category = categories?.find((c: Category) => c.name === categoryName);
    return category?.color || colors.primary[500];
  };

  const getIncomeTypeColor = (incomeTypeName: string): string => {
    const incomeType = incomeTypes?.find((it: IncomeType) => it.name === incomeTypeName);
    return incomeType?.color || colors.success.light;
  };

  if (isLoading || isLoadingIncomeSummary || isLoadingPeriodSummary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading summary...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Period Summary Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: theme.primaryBg }]}>
            <Ionicons name="calendar" size={16} color={theme.primary} />
          </View>
          <SectionTitle>By Period</SectionTitle>
        </View>

        {!periodSummary || periodSummary.periods.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={24} color={theme.textMuted} />
            <Text style={styles.emptyText}>No period data available</Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {periodSummary.periods.map((item: PeriodSummary) => (
              <View key={item.period} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.chip,
                      { backgroundColor: item.color || theme.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isDarkColor(item.color || theme.primary) ? '#ffffff' : '#0f172a' },
                      ]}
                    >
                      {item.period}
                    </Text>
                  </View>
                  <View style={styles.valueContainer}>
                    <Text style={styles.valueLabel}>Income</Text>
                    <Text style={[styles.valueAmount, { color: theme.success }]}>
                      {formatCurrency(item.total_income)}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardBottomRow}>
                  <View style={styles.valueContainer}>
                    <Text style={styles.valueLabel}>Expenses</Text>
                    <Text style={[styles.valueAmount, { color: theme.danger }]}>
                      {formatCurrency(item.total_expenses)}
                    </Text>
                  </View>
                  <View style={styles.valueContainer}>
                    <Text style={styles.valueLabel}>Balance</Text>
                    <Text
                      style={[
                        styles.valueAmount,
                        styles.valueBold,
                        { color: item.difference >= 0 ? theme.success : theme.danger },
                      ]}
                    >
                      {item.difference < 0 ? '-' : ''}{formatCurrency(item.difference)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Total Card */}
            <View style={styles.totalCard}>
              <LinearGradient
                colors={gradientColors.teal}
                style={styles.totalGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.totalContent}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <View style={styles.totalValueContainer}>
                      <Ionicons name="trending-up" size={14} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.totalValueLabel}>Income</Text>
                      <Text style={styles.totalValue}>
                        {formatCurrency(periodSummary.grand_total_income)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.totalRow}>
                    <View />
                    <View style={styles.totalValueContainer}>
                      <Ionicons name="trending-down" size={14} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.totalValueLabel}>Expenses</Text>
                      <Text style={styles.totalValue}>
                        {formatCurrency(periodSummary.grand_total_expenses)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.totalDivider} />
                  <View style={styles.totalRow}>
                    <View />
                    <View style={styles.totalValueContainer}>
                      <Ionicons name="wallet" size={14} color="#ffffff" />
                      <Text style={[styles.totalValueLabel, { color: '#ffffff' }]}>Balance</Text>
                      <Text style={[styles.totalValue, styles.totalValueBold]}>
                        {periodSummary.grand_total_difference < 0 ? '-' : ''}
                        {formatCurrency(periodSummary.grand_total_difference)}
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}
      </View>

      {/* Category Summary Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: theme.dangerBg }]}>
            <Ionicons name="pie-chart" size={16} color={theme.danger} />
          </View>
          <SectionTitle>Expenses by Category</SectionTitle>
        </View>

        {!summary || summary.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="pie-chart-outline" size={24} color={theme.textMuted} />
            <Text style={styles.emptyText}>No category data available</Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {summary.map((item: CategorySummary) => {
              const difference = item.budget - item.total;
              const isWithinBudget = !item.over_budget;
              const categoryColor = getCategoryColor(item.category);
              const progress = item.budget > 0 ? Math.min((item.total / item.budget) * 100, 100) : 0;

              return (
                <View key={item.category} style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.chip,
                        { backgroundColor: categoryColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isDarkColor(categoryColor) ? '#ffffff' : '#0f172a' },
                        ]}
                      >
                        {item.category}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusChip,
                        isWithinBudget ? styles.statusSuccess : styles.statusDanger,
                      ]}
                    >
                      <Ionicons
                        name={isWithinBudget ? 'checkmark-circle' : 'alert-circle'}
                        size={12}
                        color={isWithinBudget ? theme.success : theme.danger}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: isWithinBudget ? theme.success : theme.danger },
                        ]}
                      >
                        {isWithinBudget ? 'On Budget' : 'Over'}
                      </Text>
                    </View>
                  </View>

                  <ProgressBar
                    progress={progress}
                    color={isWithinBudget ? theme.success : theme.danger}
                  />

                  <View style={styles.cardBottomRow}>
                    <View style={styles.valueContainer}>
                      <Text style={styles.valueLabel}>Spent</Text>
                      <Text style={styles.valueAmount}>{formatCurrency(item.total)}</Text>
                    </View>
                    <View style={styles.valueContainer}>
                      <Text style={styles.valueLabel}>Budget</Text>
                      <Text style={styles.valueAmount}>{formatCurrency(item.budget)}</Text>
                    </View>
                    <View style={styles.valueContainer}>
                      <Text style={styles.valueLabel}>Left</Text>
                      <Text
                        style={[
                          styles.valueAmount,
                          styles.valueBold,
                          { color: difference >= 0 ? theme.success : theme.danger },
                        ]}
                      >
                        {difference < 0 ? '-' : ''}{formatCurrency(difference)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Budget Control Total Card */}
            {(() => {
              const totalBudget = summary.reduce((acc: number, item: CategorySummary) => acc + item.budget, 0);
              const totalPaidCapped = summary.reduce(
                (acc: number, item: CategorySummary) => acc + Math.min(item.total, item.budget),
                0
              );
              const diffWithoutOver = totalBudget - totalPaidCapped;

              return (
                <View style={[styles.card, styles.summaryCard]}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.summaryCardTitle}>Budget Control</Text>
                  </View>
                  <View style={styles.cardBottomRow}>
                    <View style={styles.valueContainer}>
                      <Text style={styles.valueLabel}>Spent</Text>
                      <Text style={styles.valueAmount}>{formatCurrency(totalPaidCapped)}</Text>
                    </View>
                    <View style={styles.valueContainer}>
                      <Text style={styles.valueLabel}>Budget</Text>
                      <Text style={styles.valueAmount}>{formatCurrency(totalBudget)}</Text>
                    </View>
                    <View style={styles.valueContainer}>
                      <Text style={styles.valueLabel}>Left</Text>
                      <Text
                        style={[
                          styles.valueAmount,
                          styles.valueBold,
                          { color: diffWithoutOver >= 0 ? theme.success : theme.danger },
                        ]}
                      >
                        {diffWithoutOver < 0 ? '-' : ''}{formatCurrency(diffWithoutOver)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })()}

            {/* Total with Over Card */}
            <View style={styles.totalCard}>
              <LinearGradient
                colors={gradientColors.purple}
                style={styles.totalGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {(() => {
                  const totalBudget = summary.reduce((acc: number, item: CategorySummary) => acc + item.budget, 0);
                  const totalActual = summary.reduce((acc: number, item: CategorySummary) => acc + item.total, 0);
                  const diffWithOver = totalBudget - totalActual;

                  return (
                    <View style={styles.totalContent}>
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total (with over)</Text>
                        <View style={styles.totalValueContainer}>
                          <Ionicons name="wallet" size={14} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.totalValueLabel}>Budget</Text>
                          <Text style={styles.totalValue}>
                            {formatCurrency(totalBudget)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.totalRow}>
                        <View />
                        <View style={styles.totalValueContainer}>
                          <Ionicons name="cart" size={14} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.totalValueLabel}>Spent</Text>
                          <Text style={styles.totalValue}>
                            {formatCurrency(totalActual)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.totalDivider} />
                      <View style={styles.totalRow}>
                        <View />
                        <View style={styles.totalValueContainer}>
                          <Ionicons
                            name={diffWithOver >= 0 ? 'checkmark-circle' : 'alert-circle'}
                            size={14}
                            color="#ffffff"
                          />
                          <Text style={[styles.totalValueLabel, { color: '#ffffff' }]}>Left</Text>
                          <Text style={[styles.totalValue, styles.totalValueBold]}>
                            {diffWithOver < 0 ? '-' : ''}
                            {formatCurrency(diffWithOver)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}
              </LinearGradient>
            </View>
          </View>
        )}
      </View>

      {/* Income Type Summary Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: theme.successBg }]}>
            <Ionicons name="cash" size={16} color={theme.success} />
          </View>
          <SectionTitle>Income by Type</SectionTitle>
        </View>

        {!incomeTypeSummary || incomeTypeSummary.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cash-outline" size={24} color={theme.textMuted} />
            <Text style={styles.emptyText}>No income data available</Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {incomeTypeSummary.map((item: IncomeTypeSummary) => {
              const difference = item.total - item.budget;
              const incomeTypeColor = getIncomeTypeColor(item.income_type);
              const progress = item.budget > 0 ? Math.min((item.total / item.budget) * 100, 100) : 0;

              return (
                <View key={item.income_type} style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.chip,
                        { backgroundColor: incomeTypeColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isDarkColor(incomeTypeColor) ? '#ffffff' : '#0f172a' },
                        ]}
                      >
                        {item.income_type}
                      </Text>
                    </View>
                  </View>

                  <ProgressBar progress={progress} color={theme.success} />

                  <View style={styles.cardBottomRow}>
                    <View style={styles.valueContainer}>
                      <Text style={styles.valueLabel}>Received</Text>
                      <Text style={[styles.valueAmount, { color: theme.success }]}>
                        {formatCurrency(item.total)}
                      </Text>
                    </View>
                    <View style={styles.valueContainer}>
                      <Text style={styles.valueLabel}>Expected</Text>
                      <Text style={styles.valueAmount}>{formatCurrency(item.budget)}</Text>
                    </View>
                    <View style={styles.valueContainer}>
                      <Text style={styles.valueLabel}>Diff</Text>
                      <Text
                        style={[
                          styles.valueAmount,
                          styles.valueBold,
                          { color: difference >= 0 ? theme.success : theme.danger },
                        ]}
                      >
                        {difference < 0 ? '-' : '+'}{formatCurrency(difference)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      gap: 24,
    },
    loadingContainer: {
      padding: 48,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      color: theme.textSecondary,
      fontSize: 14,
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
    emptyCard: {
      backgroundColor: theme.cardSolid,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 32,
      alignItems: 'center',
      gap: 8,
    },
    emptyText: {
      fontSize: 14,
      color: theme.textMuted,
    },
    cardsContainer: {
      gap: 12,
    },
    card: {
      backgroundColor: theme.cardSolid,
      borderRadius: radius.lg,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
      ...getShadow(isDark, 'sm'),
    },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    valueContainer: {
      alignItems: 'flex-end',
    },
    valueLabel: {
      fontSize: 10,
      color: theme.textMuted,
      marginBottom: 2,
      textTransform: 'uppercase',
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    valueAmount: {
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
    },
    valueBold: {
      fontWeight: '700',
    },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.sm,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '600',
    },
    statusChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    statusSuccess: {
      backgroundColor: theme.successBg,
    },
    statusDanger: {
      backgroundColor: theme.dangerBg,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
    },
    totalCard: {
      borderRadius: radius.lg,
      overflow: 'hidden',
      ...getShadow(isDark, 'md'),
    },
    totalGradient: {
      padding: 16,
    },
    totalContent: {
      gap: 10,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: '#ffffff',
    },
    totalValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    totalValueLabel: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '500',
    },
    totalValue: {
      fontSize: 14,
      color: '#ffffff',
      fontWeight: '500',
    },
    totalValueBold: {
      fontSize: 16,
      fontWeight: '700',
    },
    totalDivider: {
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.2)',
      marginVertical: 4,
    },
    summaryCard: {
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 2,
      borderColor: theme.border,
    },
    summaryCardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
    },
  });
