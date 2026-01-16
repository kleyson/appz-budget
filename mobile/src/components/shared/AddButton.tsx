import React from "react";
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, radius, spacing } from "../../utils/colors";
import { Icon } from "./Icon";

type AddButtonVariant = "primary" | "success" | "danger";

interface AddButtonProps {
  label: string;
  onPress: () => void;
  variant?: AddButtonVariant;
  icon?: string;
  style?: ViewStyle;
}

export const AddButton = ({
  label,
  onPress,
  variant = "primary",
  icon = "add",
  style,
}: AddButtonProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(theme);

  const variantColors = {
    primary: {
      bg: theme.primaryBg,
      border: theme.primaryBorderSubtle,
      iconBg: theme.primarySurface,
      color: theme.primary,
    },
    success: {
      bg: theme.successBg,
      border: theme.successBorderSubtle,
      iconBg: theme.successSurface,
      color: theme.success,
    },
    danger: {
      bg: theme.dangerBg,
      border: theme.dangerBorderSubtle,
      iconBg: theme.dangerSurface,
      color: theme.danger,
    },
  };

  const colors = variantColors[variant];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.bg, borderColor: colors.border },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrapper, { backgroundColor: colors.iconBg }]}>
        <Icon name={icon} size={18} color={colors.color} />
      </View>
      <Text style={[styles.text, { color: colors.color }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const getStyles = (_theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 14,
      borderRadius: radius.md,
      borderWidth: 1,
      marginBottom: spacing.lg,
    },
    iconWrapper: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      fontSize: 15,
      fontWeight: "600",
    },
  });
