import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, getShadow, radius, spacing } from "../../utils/colors";
import { IconButton } from "./IconButton";

interface ListItemProps {
  name: string;
  subtitle?: string;
  color?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export const ListItem = ({
  name,
  subtitle,
  color,
  onEdit,
  onDelete,
  children,
  rightContent,
}: ListItemProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(isDark, theme);

  return (
    <View style={styles.container}>
      {color && <View style={[styles.colorIndicator, { backgroundColor: color }]} />}
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </View>
      {rightContent}
      {(onEdit || onDelete) && (
        <View style={styles.actions}>
          {onEdit && <IconButton icon="pencil-outline" onPress={onEdit} variant="primary" />}
          {onDelete && <IconButton icon="trash-outline" onPress={onDelete} variant="danger" />}
        </View>
      )}
    </View>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
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
