import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useInsights } from '../../hooks/useSummary';
import { radius } from '../../utils/colors';

interface InsightsBarProps {
  monthId?: number | null;
}

const typeColors = {
  positive: {
    light: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)', text: '#059669' },
    dark: { bg: 'rgba(52, 211, 153, 0.18)', border: 'rgba(52, 211, 153, 0.3)', text: '#34d399' },
  },
  warning: {
    light: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', text: '#d97706' },
    dark: { bg: 'rgba(251, 191, 36, 0.18)', border: 'rgba(251, 191, 36, 0.3)', text: '#fbbf24' },
  },
  neutral: {
    light: { bg: 'rgba(100, 116, 139, 0.1)', border: 'rgba(100, 116, 139, 0.2)', text: '#475569' },
    dark: { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.25)', text: '#94a3b8' },
  },
};

export const InsightsBar = ({ monthId = null }: InsightsBarProps) => {
  const { isDark } = useTheme();
  const { data, isLoading } = useInsights({ month_id: monthId });

  if (isLoading || !data || data.insights.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scrollView}
    >
      {data.insights.map((insight, index) => {
        const colors = typeColors[insight.type]?.[isDark ? 'dark' : 'light'] ?? typeColors.neutral[isDark ? 'dark' : 'light'];
        return (
          <View
            key={index}
            style={[
              styles.card,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={styles.icon}>{insight.icon}</Text>
            <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
              {insight.message}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    marginHorizontal: -4,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 10,
    paddingBottom: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    maxWidth: 280,
  },
  icon: {
    fontSize: 16,
    flexShrink: 0,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
});
