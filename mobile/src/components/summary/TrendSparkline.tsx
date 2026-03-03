import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useMonthlyTrends } from '../../hooks/useSummary';
import { getThemeColors, getShadow, radius } from '../../utils/colors';
import { formatCurrency } from '../../utils/styles';
import { SectionTitle } from '../../components/shared';

const CHART_WIDTH = 320;
const CHART_HEIGHT = 120;
const PADDING_LEFT = 8;
const PADDING_RIGHT = 8;
const PADDING_TOP = 8;
const PADDING_BOTTOM = 24;
const PLOT_WIDTH = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

function buildLinePath(values: number[], maxVal: number): string {
  if (values.length === 0) return '';
  const stepX = PLOT_WIDTH / Math.max(values.length - 1, 1);
  return values
    .map((v, i) => {
      const x = PADDING_LEFT + i * stepX;
      const y = PADDING_TOP + PLOT_HEIGHT - (maxVal > 0 ? (v / maxVal) * PLOT_HEIGHT : 0);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function buildAreaPath(values: number[], maxVal: number): string {
  if (values.length === 0) return '';
  const stepX = PLOT_WIDTH / Math.max(values.length - 1, 1);
  const lineParts = values.map((v, i) => {
    const x = PADDING_LEFT + i * stepX;
    const y = PADDING_TOP + PLOT_HEIGHT - (maxVal > 0 ? (v / maxVal) * PLOT_HEIGHT : 0);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  });
  const bottomY = PADDING_TOP + PLOT_HEIGHT;
  const lastX = PADDING_LEFT + (values.length - 1) * stepX;
  const firstX = PADDING_LEFT;
  return `${lineParts.join(' ')} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
}

export const TrendSparkline = () => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { data, isLoading } = useMonthlyTrends({ num_months: 6 });

  if (isLoading || !data || data.months.length === 0) {
    return null;
  }

  const incomeValues = data.months.map((m) => m.total_income);
  const expenseValues = data.months.map((m) => m.total_expenses);
  const allValues = [...incomeValues, ...expenseValues];
  const maxVal = Math.max(...allValues, 1);
  const labels = data.months.map((m) => m.month_name.slice(0, 3));
  const stepX = PLOT_WIDTH / Math.max(data.months.length - 1, 1);

  return (
    <View style={[styles.container, { backgroundColor: theme.cardSolid, borderColor: theme.border }, getShadow(isDark, 'sm')]}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: theme.primaryBg }]}>
          <Ionicons name="trending-up" size={14} color={theme.primary} />
        </View>
        <SectionTitle>6-Month Trend</SectionTitle>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={[styles.legendLabel, { color: theme.textMuted }]}>Income</Text>
          <Text style={[styles.legendValue, { color: theme.success }]}>
            avg {formatCurrency(data.average_income)}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={[styles.legendLabel, { color: theme.textMuted }]}>Expenses</Text>
          <Text style={[styles.legendValue, { color: theme.danger }]}>
            avg {formatCurrency(data.average_expenses)}
          </Text>
        </View>
      </View>

      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <Defs>
          <LinearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="expenseAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        <Line
          x1={PADDING_LEFT}
          y1={PADDING_TOP + PLOT_HEIGHT}
          x2={PADDING_LEFT + PLOT_WIDTH}
          y2={PADDING_TOP + PLOT_HEIGHT}
          stroke={theme.border}
          strokeWidth="1"
        />

        {/* Income area + line */}
        <Path d={buildAreaPath(incomeValues, maxVal)} fill="url(#incomeAreaGrad)" />
        <Path d={buildLinePath(incomeValues, maxVal)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Expense area + line */}
        <Path d={buildAreaPath(expenseValues, maxVal)} fill="url(#expenseAreaGrad)" />
        <Path d={buildLinePath(expenseValues, maxVal)} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* X-axis labels */}
        {labels.map((label, i) => (
          <SvgText
            key={i}
            x={PADDING_LEFT + i * stepX}
            y={CHART_HEIGHT - 4}
            fill={theme.textMuted}
            fontSize="9"
            fontWeight="500"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    gap: 10,
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
  legendRow: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 11,
    fontWeight: '700',
  },
});
