import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, getShadow, radius, spacing, gradientColors, rgba } from "../../utils/colors";

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconBgColor?: string;
  iconColor?: string;
  children: React.ReactNode;
  // Footer props
  showFooter?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  saveText?: string;
  cancelText?: string;
  saveDisabled?: boolean;
  saveGradient?: readonly [string, string];
  saveIcon?: keyof typeof Ionicons.glyphMap;
  // Layout options
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
}

export const BottomSheetModal = ({
  visible,
  onClose,
  title,
  icon,
  iconBgColor,
  iconColor,
  children,
  showFooter = true,
  onSave,
  onCancel,
  saveText = "Save",
  cancelText = "Cancel",
  saveDisabled = false,
  saveGradient = gradientColors.teal,
  saveIcon = "checkmark-circle",
  scrollable = false,
  keyboardAvoiding = true,
}: BottomSheetModalProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(isDark, theme);

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const content = (
    <View style={scrollable ? styles.contentScrollable : styles.content}>
      {/* Header */}
      <View style={[styles.header, scrollable && styles.headerScrollable]}>
        <View style={styles.titleRow}>
          {icon && (
            <View style={[styles.iconWrapper, { backgroundColor: iconBgColor || theme.primaryBg }]}>
              <Ionicons name={icon} size={20} color={iconColor || theme.primary} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {scrollable ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}

      {/* Footer */}
      {showFooter && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>{cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, saveDisabled && styles.saveButtonDisabled]}
            onPress={onSave}
            disabled={saveDisabled}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={saveGradient}
              style={styles.saveGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={saveIcon} size={18} color="#ffffff" />
              <Text style={styles.saveButtonText}>{saveText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {keyboardAvoiding ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            {content}
          </KeyboardAvoidingView>
        ) : (
          content
        )}
      </View>
    </Modal>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: rgba.overlay,
      justifyContent: "flex-end",
    },
    keyboardView: {
      justifyContent: "flex-end",
    },
    content: {
      backgroundColor: theme.cardSolid,
      borderTopLeftRadius: radius["2xl"],
      borderTopRightRadius: radius["2xl"],
      padding: spacing.xl,
      ...getShadow(isDark, "xl"),
    },
    contentScrollable: {
      backgroundColor: theme.cardSolid,
      borderTopLeftRadius: radius["2xl"],
      borderTopRightRadius: radius["2xl"],
      maxHeight: "90%",
      ...getShadow(isDark, "xl"),
    },
    scrollContent: {
      padding: spacing.xl,
      paddingTop: 0,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    headerScrollable: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
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
      backgroundColor: theme.surfaceDefault,
      alignItems: "center",
      justifyContent: "center",
    },
    footer: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    cancelButton: {
      flex: 1,
      padding: 14,
      borderRadius: radius.md,
      alignItems: "center",
      backgroundColor: theme.surfaceDefault,
    },
    cancelButtonText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "600",
    },
    saveButton: {
      flex: 1.5,
      borderRadius: radius.md,
      overflow: "hidden",
      ...getShadow(isDark, "sm"),
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      gap: spacing.sm,
    },
    saveButtonText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "600",
    },
  });
