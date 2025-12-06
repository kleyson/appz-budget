import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, radius, isDarkColor } from "../../utils/colors";
import type { Period, Category } from "../../types";

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
  const styles = getStyles(isDark, theme);

  return (
    <View style={styles.container}>
      {showFilters && (
        <View style={styles.filtersContent}>
          {/* Period Filter */}
          <View style={styles.filterGroup}>
            <View style={styles.filterHeader}>
              <View style={[styles.filterIcon, { backgroundColor: theme.primaryBg }]}>
                <Ionicons name="calendar-outline" size={14} color={theme.primary} />
              </View>
              <Text style={styles.label}>Period</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              <TouchableOpacity
                style={[styles.chip, selectedPeriod === "" && styles.chipActive]}
                onPress={() => onPeriodChange("")}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.chipText, selectedPeriod === "" && styles.chipTextActive]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {periods.map((period) => {
                const isSelected = selectedPeriod === period.name;
                return (
                  <TouchableOpacity
                    key={period.id}
                    style={[
                      styles.chip,
                      isSelected && styles.chipActive,
                      isSelected && { backgroundColor: period.color, borderColor: period.color },
                    ]}
                    onPress={() => onPeriodChange(period.name)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                        isSelected && {
                          color: isDarkColor(period.color) ? "#ffffff" : "#0f172a",
                        },
                      ]}
                    >
                      {period.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Category Filter */}
          {showCategoryFilter && (
            <View style={styles.filterGroup}>
              <View style={styles.filterHeader}>
                <View style={[styles.filterIcon, { backgroundColor: theme.dangerBg }]}>
                  <Ionicons name="pricetag-outline" size={14} color={theme.danger} />
                </View>
                <Text style={styles.label}>Category</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                <TouchableOpacity
                  style={[styles.chip, selectedCategory === "" && styles.chipActive]}
                  onPress={() => onCategoryChange("")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === "" && styles.chipTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => {
                  const isSelected = selectedCategory === category.name;
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.chip,
                        isSelected && styles.chipActive,
                        isSelected && {
                          backgroundColor: category.color,
                          borderColor: category.color,
                        },
                      ]}
                      onPress={() => onCategoryChange(category.name)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                          isSelected && {
                            color: isDarkColor(category.color) ? "#ffffff" : "#0f172a",
                          },
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </View>
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
  const styles = getToggleStyles(isDark, theme);

  return (
    <TouchableOpacity
      style={[styles.toggleButton, showFilters && styles.toggleButtonActive]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Ionicons
        name={showFilters ? "filter" : "filter-outline"}
        size={18}
        color={showFilters ? theme.primary : theme.textSecondary}
      />
    </TouchableOpacity>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
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
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSubtle,
    },
    chipActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryBg,
    },
    chipText: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.textSecondary,
    },
    chipTextActive: {
      fontWeight: "600",
      color: theme.primary,
    },
  });

const getToggleStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
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
