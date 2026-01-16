import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, radius } from "../../utils/colors";
import { Icon } from "./Icon";

type IconButtonVariant = "primary" | "success" | "danger" | "warning" | "info" | "muted";
type IconButtonSize = "sm" | "md" | "lg";

interface IconButtonProps {
  icon: string;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
}

export const IconButton = ({
  icon,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  style,
}: IconButtonProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);

  const sizeMap = {
    sm: { container: 28, icon: 14 },
    md: { container: 36, icon: 18 },
    lg: { container: 44, icon: 22 },
  };

  const variantColors = {
    primary: { bg: theme.primaryBg, color: theme.primary },
    success: { bg: theme.successBg, color: theme.success },
    danger: { bg: theme.dangerBg, color: theme.danger },
    warning: { bg: theme.warningBg, color: theme.warning },
    info: { bg: theme.infoBg, color: theme.info },
    muted: { bg: theme.backgroundTertiary, color: theme.textMuted },
  };

  const colors = variantColors[variant];
  const dimensions = sizeMap[size];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: dimensions.container,
          height: dimensions.container,
          backgroundColor: colors.bg,
        },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Icon name={icon} size={dimensions.icon} color={colors.color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});
