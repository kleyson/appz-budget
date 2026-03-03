import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useCategorySummary, useCategories } from '../../hooks/useCategories';
import { getThemeColors, getShadow, radius, colors } from '../../utils/colors';
import { formatCurrency } from '../../utils/styles';
import { SectionTitle } from '../../components/shared';
import type { Category, CategorySummary } from '../../types';

interface ExpenseDonutChartProps {
  monthId?: number | null;
  periodFilter?: string | null;
}

const CHART_SIZE = 180;
const STROKE_WIDTH = 28;
const CENTER = CHART_SIZE / 2;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  // Clamp to avoid full-circle SVG issues
  const sweep = Math.min(endAngle - startAngle, 359.99);
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, startAngle + sweep);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export const ExpenseDonutChart = ({ monthId = null, periodFilter = null }: ExpenseDonutChartProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { data: summary, isLoading } = useCategorySummary({
    period: periodFilter,
    month_id: monthId,
  });
  const { data: categories } = useCategories();

  const getCategoryColor = (categoryName: string): string => {
    const category = categories?.find((c: Category) => c.name === categoryName);
    return category?.color || colors.primary[500];
  };

  if (isLoading) {
    return null;
  }

  if (!summary || summary.length === 0) {
    return null;
  }

  const chartData = summary
    .filter((item: CategorySummary) => item.total > 0)
    .map((item: CategorySummary) => ({
      name: item.category,
      value: item.total,
      color: getCategoryColor(item.category),
    }));

  if (chartData.length === 0) {
    return null;
  }

  const totalExpenses = chartData.reduce((acc: number, item: { value: number }) => acc + item.value, 0);

  // Build arc segments
  let currentAngle = 0;
  const arcs = chartData.map((item: { name: string; value: number; color: string }) => {
    const sweep = (item.value / totalExpenses) * 360;
    const startAngle = currentAngle;
    currentAngle += sweep;
    return {
      ...item,
      startAngle,
      endAngle: startAngle + sweep,
      percentage: ((item.value / totalExpenses) * 100).toFixed(1),
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.cardSolid, borderColor: theme.border }, getShadow(isDark, 'sm')]}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: theme.dangerBg }]}>
          <Ionicons name="pie-chart" size={14} color={theme.danger} />
        </View>
        <SectionTitle>Expense Breakdown</SectionTitle>
      </View>

      <View style={styles.chartRow}>
        <View style={styles.chartContainer}>
          <Svg width={CHART_SIZE} height={CHART_SIZE}>
            {/* Background circle */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={theme.border}
              strokeWidth={STROKE_WIDTH}
            />
            {/* Data arcs */}
            {arcs.map((arc: { name: string; color: string; startAngle: number; endAngle: number }, index: number) => (
              <Path
                key={index}
                d={describeArc(CENTER, CENTER, RADIUS, arc.startAngle, arc.endAngle)}
                fill="none"
                stroke={arc.color}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="butt"
              />
            ))}
          </Svg>
          {/* Center label */}
          <View style={styles.centerLabel}>
            <Text style={[styles.centerTotal, { color: theme.text }]}>
              {formatCurrency(totalExpenses)}
            </Text>
            <Text style={[styles.centerSubtext, { color: theme.textMuted }]}>Total</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {arcs.map((arc: { name: string; color: string; percentage: string; value: number }, index: number) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: arc.color }]} />
              <View style={styles.legendText}>
                <Text style={[styles.legendLabel, { color: theme.text }]} numberOfLines={1}>
                  {arc.name}
                </Text>
                <Text style={[styles.legendValue, { color: theme.textMuted }]}>
                  {arc.percentage}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  chartContainer: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    position: 'relative',
  },
  centerLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTotal: {
    fontSize: 14,
    fontWeight: '700',
  },
  centerSubtext: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  legend: {
    flex: 1,
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  legendValue: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
});
