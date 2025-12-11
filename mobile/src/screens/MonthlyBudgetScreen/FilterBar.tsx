import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, radius } from "../../utils/colors";
import { springConfigs } from "../../utils/animations";
import { AnimatedChip } from "../../components/shared";
import type { Period, Category } from "../../types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FilterBarProps {
  periods: Period[];
  categories: Category[];
  selectedPeriod: string;
  selectedCategory: string;
  onPeriodChange: (period: string) => void;
  onCategoryChange: (category: string) => void;
  showCategoryFilter?: boolean;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export const FilterBar = ({
  periods,
  categories,
  selectedPeriod,
  selectedCategory,
  onPeriodChange,
  onCategoryChange,
  showCategoryFilter = true,
  showFilters,
  onToggleFilters: _onToggleFilters,
}: FilterBarProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(theme);

  const expandProgress = useSharedValue(showFilters ? 1 : 0);

  useEffect(() => {
    expandProgress.value = withSpring(showFilters ? 1 : 0, springConfigs.smooth);
  }, [showFilters]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
    transform: [
      {
        translateY: interpolate(
          expandProgress.value,
          [0, 1],
          [-10, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  if (!showFilters) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, containerAnimatedStyle]}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
    >
      <View style={styles.filtersContent}>
        {/* Period Filter */}
        <Animated.View
          style={styles.filterGroup}
          entering={FadeIn.delay(50).duration(200)}
          layout={Layout.springify()}
        >
          <View style={styles.filterHeader}>
            <Animated.View
              style={[styles.filterIcon, { backgroundColor: theme.primaryBg }]}
              entering={FadeIn.delay(100).duration(200)}
            >
              <Ionicons name="calendar-outline" size={14} color={theme.primary} />
            </Animated.View>
            <Text style={styles.label}>Period</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            <AnimatedChip
              label="All"
              isSelected={selectedPeriod === ""}
              onPress={() => onPeriodChange("")}
              index={0}
              theme={theme}
            />
            {periods.map((period, idx) => (
              <AnimatedChip
                key={period.id}
                label={period.name}
                isSelected={selectedPeriod === period.name}
                color={selectedPeriod === period.name ? period.color : undefined}
                onPress={() => onPeriodChange(period.name)}
                index={idx + 1}
                theme={theme}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Category Filter */}
        {showCategoryFilter && (
          <Animated.View
            style={styles.filterGroup}
            entering={FadeIn.delay(150).duration(200)}
            layout={Layout.springify()}
          >
            <View style={styles.filterHeader}>
              <Animated.View
                style={[styles.filterIcon, { backgroundColor: theme.dangerBg }]}
                entering={FadeIn.delay(200).duration(200)}
              >
                <Ionicons name="pricetag-outline" size={14} color={theme.danger} />
              </Animated.View>
              <Text style={styles.label}>Category</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              <AnimatedChip
                label="All"
                isSelected={selectedCategory === ""}
                onPress={() => onCategoryChange("")}
                index={0}
                theme={theme}
              />
              {categories.map((category, idx) => (
                <AnimatedChip
                  key={category.id}
                  label={category.name}
                  isSelected={selectedCategory === category.name}
                  color={selectedCategory === category.name ? category.color : undefined}
                  onPress={() => onCategoryChange(category.name)}
                  index={idx + 1}
                  theme={theme}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
};

export const FilterToggleButton = ({
  showFilters,
  onToggle,
}: {
  showFilters: boolean;
  onToggle: () => void;
}) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getToggleStyles(theme);

  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withSpring(showFilters ? 180 : 0, springConfigs.snappy);
  }, [showFilters]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, springConfigs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigs.snappy);
  };

  return (
    <AnimatedPressable
      style={[styles.toggleButton, showFilters && styles.toggleButtonActive]}
      onPress={onToggle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={showFilters ? "filter" : "filter-outline"}
          size={18}
          color={showFilters ? theme.primary : theme.textSecondary}
        />
      </Animated.View>
    </AnimatedPressable>
  );
};

const getStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      gap: 12,
    },
    filtersContent: {
      gap: 14,
    },
    filterGroup: {
      gap: 8,
    },
    filterHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    filterIcon: {
      width: 24,
      height: 24,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    chips: {
      flexDirection: "row",
      gap: 8,
      paddingRight: 16,
    },
  });

const getToggleStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    toggleButton: {
      alignItems: "center",
      justifyContent: "center",
      width: 42,
      height: 42,
      backgroundColor: theme.surfaceMuted,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.borderGlass,
    },
    toggleButtonActive: {
      backgroundColor: theme.primaryBg,
      borderColor: theme.primaryBorder,
    },
  });
