import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, getShadow, gradientColors, radius } from "../../utils/colors";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  gradient?: readonly [string, string];
  style?: ViewStyle;
}

export const Button = ({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  gradient,
  style,
}: ButtonProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(isDark, theme);

  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 13, iconSize: 14 },
    md: { paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, iconSize: 18 },
    lg: { paddingVertical: 16, paddingHorizontal: 20, fontSize: 17, iconSize: 20 },
  };

  const currentSize = sizeStyles[size];

  // Determine gradient colors based on variant
  const getGradient = (): readonly [string, string] => {
    if (gradient) return gradient;
    switch (variant) {
      case "primary":
        return gradientColors.teal;
      case "danger":
        return gradientColors.red;
      case "success":
        return gradientColors.emerald;
      default:
        return gradientColors.teal;
    }
  };

  const renderContent = () => {
    const textColor = variant === "secondary" || variant === "ghost" ? theme.text : "#ffffff";
    const iconColor = variant === "secondary" || variant === "ghost" ? theme.textSecondary : "#ffffff";

    return (
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <Ionicons name={icon} size={currentSize.iconSize} color={iconColor} />
            )}
            <Text
              style={[
                styles.label,
                { fontSize: currentSize.fontSize, color: textColor },
              ]}
            >
              {label}
            </Text>
            {icon && iconPosition === "right" && (
              <Ionicons name={icon} size={currentSize.iconSize} color={iconColor} />
            )}
          </>
        )}
      </View>
    );
  };

  // Secondary and Ghost variants don't use gradients
  if (variant === "secondary" || variant === "ghost") {
    return (
      <TouchableOpacity
        style={[
          styles.button,
          variant === "secondary" && styles.secondaryButton,
          variant === "ghost" && styles.ghostButton,
          {
            paddingVertical: currentSize.paddingVertical,
            paddingHorizontal: currentSize.paddingHorizontal,
          },
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  // Primary, danger, success variants use gradients
  return (
    <TouchableOpacity
      style={[
        styles.gradientContainer,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getGradient()}
        style={[
          styles.gradient,
          {
            paddingVertical: currentSize.paddingVertical,
            paddingHorizontal: currentSize.paddingHorizontal,
          },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {renderContent()}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    button: {
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryButton: {
      backgroundColor: theme.surfaceDefault,
    },
    ghostButton: {
      backgroundColor: "transparent",
    },
    gradientContainer: {
      borderRadius: radius.md,
      overflow: "hidden",
      ...getShadow(isDark, "sm"),
    },
    gradient: {
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    label: {
      fontWeight: "600",
    },
    fullWidth: {
      flex: 1,
    },
    disabled: {
      opacity: 0.5,
    },
  });
