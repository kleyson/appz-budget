import React from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, radius, spacing } from "../../utils/colors";

interface FormInputProps extends Omit<TextInputProps, "style"> {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
}

export const FormInput = ({
  label,
  icon,
  error,
  placeholder,
  value,
  onChangeText,
  ...rest
}: FormInputProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(isDark, theme);

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.wrapper, error && styles.wrapperError]}>
        {icon && (
          <View style={styles.iconWrapper}>
            <Ionicons name={icon} size={18} color={theme.textMuted} />
          </View>
        )}
        <TextInput
          style={icon ? styles.input : styles.inputFull}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          value={value}
          onChangeText={onChangeText}
          {...rest}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
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
    wrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: radius.md,
    },
    wrapperError: {
      borderColor: theme.danger,
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
    errorText: {
      fontSize: 12,
      color: theme.danger,
      marginTop: 4,
    },
  });
