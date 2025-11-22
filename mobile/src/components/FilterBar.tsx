import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import type { Period, Category } from '../types';

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
  onToggleFilters,
}: FilterBarProps) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      {showFilters && (
        <View style={styles.filtersContent}>
          <View style={styles.filterGroup}>
            <Text style={styles.label}>Period:</Text>
            <View style={styles.chips}>
              <TouchableOpacity
                style={[styles.chip, selectedPeriod === '' && styles.chipActive]}
                onPress={() => onPeriodChange('')}
              >
                <Text
                  style={[styles.chipText, selectedPeriod === '' && styles.chipTextActive]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.id}
                  style={[
                    styles.chip,
                    selectedPeriod === period.name && styles.chipActive,
                    { backgroundColor: selectedPeriod === period.name ? period.color : undefined },
                  ]}
                  onPress={() => onPeriodChange(period.name)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedPeriod === period.name && styles.chipTextActive,
                    ]}
                  >
                    {period.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {showCategoryFilter && (
            <View style={styles.filterGroup}>
              <Text style={styles.label}>Category:</Text>
              <View style={styles.chips}>
                <TouchableOpacity
                  style={[styles.chip, selectedCategory === '' && styles.chipActive]}
                  onPress={() => onCategoryChange('')}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === '' && styles.chipTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.chip,
                      selectedCategory === category.name && styles.chipActive,
                      {
                        backgroundColor:
                          selectedCategory === category.name ? category.color : undefined,
                      },
                    ]}
                    onPress={() => onCategoryChange(category.name)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedCategory === category.name && styles.chipTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
  const styles = getToggleStyles(isDark);

  return (
    <TouchableOpacity style={styles.toggleButton} onPress={onToggle}>
      <Ionicons
        name={showFilters ? "filter" : "filter-outline"}
        size={20}
        color={isDark ? "#ffffff" : "#111827"}
      />
    </TouchableOpacity>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      gap: 12,
    },
    filtersContent: {
      gap: 12,
    },
    filterGroup: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#111827',
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#d1d5db',
      backgroundColor: isDark ? '#111827' : '#f3f4f6',
    },
    chipActive: {
      borderColor: '#3b82f6',
    },
    chipText: {
      fontSize: 14,
      color: isDark ? '#ffffff' : '#111827',
    },
    chipTextActive: {
      fontWeight: '600',
      color: '#3b82f6',
    },
  });

const getToggleStyles = (isDark: boolean) =>
  StyleSheet.create({
    toggleButton: {
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
      backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#d1d5db",
      width: 40,
      height: 40,
    },
  });

