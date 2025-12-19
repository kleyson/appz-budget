import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, radius, spacing } from "../../utils/colors";
import { colorOptions as defaultColorOptions } from "../../utils/styles";

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  colors?: string[];
}

export const ColorPicker = ({
  label = "Color",
  value,
  onChange,
  colors = defaultColorOptions,
}: ColorPickerProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(isDark, theme);

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.container}>
        {colors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.option,
              { backgroundColor: color },
              value === color && styles.optionSelected,
            ]}
            onPress={() => onChange(color)}
            activeOpacity={0.7}
          >
            {value === color && <Ionicons name="checkmark" size={18} color="#ffffff" />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    group: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    container: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    option: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: "transparent",
    },
    optionSelected: {
      borderColor: theme.text,
    },
  });
