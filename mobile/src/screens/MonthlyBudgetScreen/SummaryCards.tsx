import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  Easing,
  FadeIn,
  SlideInRight,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, getShadow, gradientColors, radius } from "../../utils/colors";
import { formatCurrency } from "../../utils/styles";
import { SectionTitle } from "../../components/shared";
import { springConfigs, getStaggerDelay } from "../../utils/animations";
import type { SummaryTotals } from "../../types";

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

interface AnimatedCardProps {
  card: CardConfig;
  index: number;
  totals: SummaryTotals;
  isDark: boolean;
  theme: ReturnType<typeof getThemeColors>;
}

const AnimatedCard = ({ card, index, totals, isDark, theme }: AnimatedCardProps) => {
  const styles = getCardStyles(isDark, theme);

  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    const delay = getStaggerDelay(index, 80);
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(delay, withSpring(0, springConfigs.gentle));
    scale.value = withDelay(delay, withSpring(1, springConfigs.gentle));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const percentage = totals.total_budgeted_income === 0
    ? null
    : ((card.value / totals.total_budgeted_income) * 100).toFixed(0);
  const isPositive = card.value >= 0;

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
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
    </Animated.View>
  );
};

interface AnimatedSectionProps {
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconBgColor: string;
  iconColor: string;
  cards: CardConfig[];
  totals: SummaryTotals;
  sectionIndex: number;
  isDark: boolean;
  theme: ReturnType<typeof getThemeColors>;
}

const AnimatedSection = ({
  title,
  iconName,
  iconBgColor,
  iconColor,
  cards,
  totals,
  sectionIndex,
  isDark,
  theme,
}: AnimatedSectionProps) => {
  const styles = getSectionStyles(theme);
  const baseIndex = sectionIndex * 2;

  return (
    <Animated.View
      style={styles.section}
      entering={FadeIn.delay(sectionIndex * 100).duration(300)}
    >
      <Animated.View
        style={styles.sectionHeader}
        entering={SlideInRight.delay(sectionIndex * 100).duration(300)}
      >
        <View style={[styles.sectionIcon, { backgroundColor: iconBgColor }]}>
          <Ionicons name={iconName} size={16} color={iconColor} />
        </View>
        <SectionTitle>{title}</SectionTitle>
      </Animated.View>
      <View style={styles.grid}>
        {cards.map((card, idx) => (
          <AnimatedCard
            key={`${card.title}-${idx}`}
            card={card}
            index={baseIndex + idx}
            totals={totals}
            isDark={isDark}
            theme={theme}
          />
        ))}
      </View>
    </Animated.View>
  );
};

export const SummaryCards = ({ totals }: SummaryCardsProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(isDark, theme);

  // Loading spinner animation
  const spinnerRotation = useSharedValue(0);

  useEffect(() => {
    if (!totals) {
      spinnerRotation.value = withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      });
    }
  }, [totals]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  if (!totals) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.loadingSpinner, spinnerStyle]} />
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

  return (
    <View style={styles.container}>
      {/* Expenses Section */}
      <AnimatedSection
        title="Expenses"
        iconName="trending-down"
        iconBgColor={theme.dangerBg}
        iconColor={theme.danger}
        cards={expenseCards}
        totals={totals}
        sectionIndex={0}
        isDark={isDark}
        theme={theme}
      />

      {/* Income Section */}
      <AnimatedSection
        title="Income"
        iconName="trending-up"
        iconBgColor={theme.successBg}
        iconColor={theme.success}
        cards={incomeCards}
        totals={totals}
        sectionIndex={1}
        isDark={isDark}
        theme={theme}
      />

      {/* Balance Section */}
      <AnimatedSection
        title="Balance"
        iconName="wallet"
        iconBgColor={theme.primaryBg}
        iconColor={theme.primary}
        cards={balanceCards}
        totals={totals}
        sectionIndex={2}
        isDark={isDark}
        theme={theme}
      />
    </View>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      gap: 20,
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
  });

const getSectionStyles = (_theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
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
    grid: {
      flexDirection: "row",
      gap: 12,
    },
  });

const getCardStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
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
