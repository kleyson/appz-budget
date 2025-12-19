import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, radius, spacing, isDarkColor } from "../../utils/colors";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  disabled?: boolean;
}

export const Chip = ({ label, selected = false, onPress, color, disabled = false }: ChipProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(isDark, theme);

  const backgroundColor = selected && color ? color : selected ? theme.primaryBg : undefined;
  const borderColor = selected && color ? color : selected ? theme.primary : undefined;
  const textColor = selected && color
    ? (isDarkColor(color) ? "#ffffff" : "#0f172a")
    : selected
    ? theme.primary
    : theme.textSecondary;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && styles.chipActive,
        backgroundColor && { backgroundColor },
        borderColor && { borderColor },
        disabled && styles.chipDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive, { color: textColor }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Chip Group for filter selections
interface ChipGroupProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconBgColor?: string;
  iconColor?: string;
  options: Array<{ id: string | number; name: string; color?: string }>;
  selectedValue: string;
  onSelect: (value: string) => void;
  showAllOption?: boolean;
  allLabel?: string;
}

export const ChipGroup = ({
  label,
  icon,
  iconBgColor,
  iconColor,
  options,
  selectedValue,
  onSelect,
  showAllOption = true,
  allLabel = "All",
}: ChipGroupProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(isDark, theme);

  return (
    <View style={styles.group}>
      {label && (
        <View style={styles.header}>
          {icon && (
            <View style={[styles.headerIcon, { backgroundColor: iconBgColor || theme.primaryBg }]}>
              <Ionicons name={icon} size={14} color={iconColor || theme.primary} />
            </View>
          )}
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {showAllOption && (
          <Chip
            label={allLabel}
            selected={selectedValue === ""}
            onPress={() => onSelect("")}
          />
        )}
        {options.map((option) => (
          <Chip
            key={option.id}
            label={option.name}
            selected={selectedValue === option.name}
            color={option.color}
            onPress={() => onSelect(option.name)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// Selectable Chip Group (for forms - wrapping layout)
interface SelectableChipGroupProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconBgColor?: string;
  iconColor?: string;
  options: Array<{ id: string | number; name: string; color?: string }>;
  selectedValue: string;
  onSelect: (value: string) => void;
}

export const SelectableChipGroup = ({
  label,
  icon,
  iconBgColor,
  iconColor,
  options,
  selectedValue,
  onSelect,
}: SelectableChipGroupProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(isDark, theme);

  return (
    <View style={styles.groupMargin}>
      {label && (
        <View style={styles.header}>
          {icon && (
            <View style={[styles.headerIcon, { backgroundColor: iconBgColor || theme.primaryBg }]}>
              <Ionicons name={icon} size={14} color={iconColor || theme.primary} />
            </View>
          )}
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
      <View style={styles.wrapContainer}>
        {options.map((option) => (
          <Chip
            key={option.id}
            label={option.name}
            selected={selectedValue === option.name}
            color={option.color}
            onPress={() => onSelect(option.name)}
          />
        ))}
      </View>
    </View>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    group: {
      gap: spacing.sm,
    },
    groupMargin: {
      marginBottom: spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    headerIcon: {
      width: 24,
      height: 24,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    container: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingRight: spacing.lg,
    },
    wrapContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
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
    chipDisabled: {
      opacity: 0.5,
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
