import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { SummaryTotals } from '../types';

interface SummaryCardsProps {
  totals?: SummaryTotals;
}

export const SummaryCards = ({ totals }: SummaryCardsProps) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  if (!totals) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading summary...</Text>
      </View>
    );
  }

  const cards = [
    {
      title: 'Total Budgeted Expenses',
      value: totals.total_budgeted_expenses,
      color: '#3b82f6',
    },
    {
      title: 'Total Expenses',
      value: totals.total_current_expenses,
      color: '#ef4444',
    },
    {
      title: 'Total Budgeted Income',
      value: totals.total_budgeted_income,
      color: '#3b82f6',
    },
    {
      title: 'Total Current Income',
      value: totals.total_current_income,
      color: '#10b981',
    },
    {
      title: 'Total Budgeted',
      value: totals.total_budgeted,
      color: totals.total_budgeted >= 0 ? '#10b981' : '#ef4444',
    },
    {
      title: 'Total Current',
      value: totals.total_current,
      color: totals.total_current >= 0 ? '#10b981' : '#ef4444',
    },
  ];

  return (
    <View style={styles.container}>
      {cards.map((card, index) => {
        // Create rows of 2 cards
        if (index % 2 === 0) {
          return (
            <View key={card.title} style={styles.row}>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                  },
                ]}
              >
                <Text style={styles.cardLabel}>{card.title}</Text>
                <Text style={[styles.cardValue, { color: card.color }]}>
                  ${Math.abs(card.value).toFixed(2)}
                </Text>
              </View>
              {cards[index + 1] && (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                    },
                  ]}
                >
                  <Text style={styles.cardLabel}>{cards[index + 1].title}</Text>
                  <Text style={[styles.cardValue, { color: cards[index + 1].color }]}>
                    ${Math.abs(cards[index + 1].value).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          );
        }
        return null;
      })}
    </View>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      gap: 12,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    card: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    cardLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#9ca3af' : '#6b7280',
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    cardValue: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    loadingText: {
      textAlign: 'center',
      color: isDark ? '#9ca3af' : '#6b7280',
      padding: 32,
    },
  });

