import { StyleSheet } from "react-native";
import { getThemeColors, colors, getShadow, radius, spacing } from "./colors";

type ThemeColors = ReturnType<typeof getThemeColors>;

// Common color options for color pickers
export const colorOptions = [
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
];

// Currency formatter utility
// Uses Math.abs to return absolute value - callers should handle sign display separately
export const formatCurrency = (value: number): string => {
  return `$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Shared modal styles
export const getModalStyles = (isDark: boolean, theme: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    content: {
      backgroundColor: theme.cardSolid,
      borderTopLeftRadius: radius["2xl"],
      borderTopRightRadius: radius["2xl"],
      padding: spacing.xl,
      ...getShadow(isDark, "xl"),
    },
    scrollContent: {
      backgroundColor: theme.cardSolid,
      borderTopLeftRadius: radius["2xl"],
      borderTopRightRadius: radius["2xl"],
      maxHeight: "90%",
      ...getShadow(isDark, "xl"),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    headerBordered: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    iconWrapper: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      letterSpacing: -0.3,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: isDark ? "rgba(51, 65, 85, 0.5)" : colors.slate[100],
      alignItems: "center",
      justifyContent: "center",
    },
    footer: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    footerPadded: {
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.lg,
      paddingTop: spacing.sm,
    },
  });

// Shared input styles
export const getInputStyles = (isDark: boolean, theme: ThemeColors) =>
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
    wrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: radius.md,
    },
    iconWrapper: {
      paddingLeft: spacing.md,
    },
    input: {
      flex: 1,
      padding: spacing.md,
      paddingLeft: spacing.sm,
      fontSize: 15,
      color: theme.text,
    },
    inputFull: {
      flex: 1,
      padding: spacing.md,
      fontSize: 15,
      color: theme.text,
    },
  });

// Shared button styles
export const getButtonStyles = (isDark: boolean, theme: ThemeColors) =>
  StyleSheet.create({
    // Cancel button (secondary)
    cancel: {
      flex: 1,
      padding: 14,
      borderRadius: radius.md,
      alignItems: "center",
      backgroundColor: isDark ? "rgba(51, 65, 85, 0.5)" : colors.slate[100],
    },
    cancelText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "600",
    },
    // Save/Primary button container
    primary: {
      flex: 1.5,
      borderRadius: radius.md,
      overflow: "hidden",
      ...getShadow(isDark, "sm"),
    },
    primaryEqual: {
      flex: 1,
      borderRadius: radius.md,
      overflow: "hidden",
      ...getShadow(isDark, "sm"),
    },
    // Gradient button inner
    gradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      gap: spacing.sm,
    },
    gradientText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "600",
    },
    // Icon action button (edit/delete)
    iconAction: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    iconActionSmall: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    // Add item button
    addItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 14,
      borderRadius: radius.md,
      borderWidth: 1,
      marginBottom: spacing.lg,
    },
    addItemIcon: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    addItemText: {
      fontSize: 15,
      fontWeight: "600",
    },
  });

// Shared list item styles
export const getListItemStyles = (isDark: boolean, theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      backgroundColor: theme.cardSolid,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      gap: spacing.md,
      ...getShadow(isDark, "sm"),
    },
    colorIndicator: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
    },
    content: {
      flex: 1,
    },
    name: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },
    subtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
    },
  });

// Shared chip/badge styles
export const getChipStyles = (isDark: boolean, theme: ThemeColors) =>
  StyleSheet.create({
    container: {
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
      backgroundColor: isDark ? "rgba(51, 65, 85, 0.3)" : colors.slate[50],
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
    // Small badge style
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "600",
    },
  });

// Shared color picker styles
export const getColorPickerStyles = (isDark: boolean, theme: ThemeColors) =>
  StyleSheet.create({
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

// Shared tab styles
export const getTabStyles = (isDark: boolean, theme: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: theme.cardSolid,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: isDark ? "rgba(51, 65, 85, 0.3)" : colors.slate[100],
    },
    tabActive: {
      backgroundColor: theme.primaryBg,
    },
    tabIconWrapper: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(51, 65, 85, 0.5)" : colors.slate[200],
    },
    tabIconWrapperActive: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.textSecondary,
    },
    tabTextActive: {
      color: theme.primary,
      fontWeight: "600",
    },
  });

// Shared empty/loading state styles
export const getStateStyles = (isDark: boolean, theme: ThemeColors) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 48,
    },
    loadingText: {
      marginTop: spacing.md,
      color: theme.textSecondary,
      fontSize: 14,
    },
    emptyContainer: {
      padding: 48,
      alignItems: "center",
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: radius.xl,
      backgroundColor: theme.backgroundTertiary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 6,
    },
    emptyText: {
      textAlign: "center",
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
  });

// Helper to get semantic button colors
export const getSemanticColors = (
  variant: "primary" | "success" | "danger" | "warning" | "info",
  theme: ThemeColors
) => {
  const colorMap = {
    primary: { color: theme.primary, bg: theme.primaryBg },
    success: { color: theme.success, bg: theme.successBg },
    danger: { color: theme.danger, bg: theme.dangerBg },
    warning: { color: theme.warning, bg: theme.warningBg },
    info: { color: theme.info, bg: theme.infoBg },
  };
  return colorMap[variant];
};
