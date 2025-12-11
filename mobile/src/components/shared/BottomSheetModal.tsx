import React, { useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, getShadow, radius, spacing, gradientColors, rgba } from "../../utils/colors";
import { springConfigs } from "../../utils/animations";
import { useResponsive, responsive } from "../../hooks/useResponsive";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const { isTablet } = useResponsive();
  const { height: screenHeight } = useWindowDimensions();
  const styles = getStyles(isDark, theme, isTablet);

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const translateY = useSharedValue(screenHeight);
  const contentScale = useSharedValue(isTablet ? 0.9 : 0.95);
  const closeButtonScale = useSharedValue(1);
  const cancelButtonScale = useSharedValue(1);
  const saveButtonScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Animate in
      overlayOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, springConfigs.smooth);
      contentScale.value = withSpring(1, springConfigs.gentle);
    } else {
      // Animate out
      overlayOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(screenHeight, {
        duration: 200,
        easing: Easing.in(Easing.cubic),
      });
      contentScale.value = withTiming(isTablet ? 0.9 : 0.95, { duration: 150 });
    }
  }, [visible, screenHeight, isTablet]);

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: contentScale.value },
    ],
  }));

  const closeButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: closeButtonScale.value }],
  }));

  const cancelButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cancelButtonScale.value }],
  }));

  const saveButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveButtonScale.value }],
  }));

  const handleCloseButtonPressIn = () => {
    closeButtonScale.value = withSpring(0.9, springConfigs.snappy);
  };

  const handleCloseButtonPressOut = () => {
    closeButtonScale.value = withSpring(1, springConfigs.snappy);
  };

  const handleCancelPressIn = () => {
    cancelButtonScale.value = withSpring(0.96, springConfigs.snappy);
  };

  const handleCancelPressOut = () => {
    cancelButtonScale.value = withSpring(1, springConfigs.snappy);
  };

  const handleSavePressIn = () => {
    if (!saveDisabled) {
      saveButtonScale.value = withSpring(0.96, springConfigs.snappy);
    }
  };

  const handleSavePressOut = () => {
    saveButtonScale.value = withSpring(1, springConfigs.snappy);
  };

  const content = (
    <Animated.View style={[scrollable ? styles.contentScrollable : styles.content, contentAnimatedStyle]}>
      {/* Drag Handle */}
      <View style={styles.dragHandleContainer}>
        <View style={styles.dragHandle} />
      </View>

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
        <AnimatedPressable
          style={[styles.closeButton, closeButtonAnimatedStyle]}
          onPress={onClose}
          onPressIn={handleCloseButtonPressIn}
          onPressOut={handleCloseButtonPressOut}
        >
          <Ionicons name="close" size={20} color={theme.textSecondary} />
        </AnimatedPressable>
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
          <AnimatedPressable
            style={[styles.cancelButton, cancelButtonAnimatedStyle]}
            onPress={handleCancel}
            onPressIn={handleCancelPressIn}
            onPressOut={handleCancelPressOut}
          >
            <Text style={styles.cancelButtonText}>{cancelText}</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={[styles.saveButton, saveDisabled && styles.saveButtonDisabled, saveButtonAnimatedStyle]}
            onPress={onSave}
            onPressIn={handleSavePressIn}
            onPressOut={handleSavePressOut}
            disabled={saveDisabled}
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
          </AnimatedPressable>
        </View>
      )}
    </Animated.View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        {keyboardAvoiding ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <View style={styles.contentWrapper}>
              {content}
            </View>
          </KeyboardAvoidingView>
        ) : (
          <View style={styles.contentWrapper}>
            {content}
          </View>
        )}
      </View>
    </Modal>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>, isTablet: boolean) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: isTablet ? "center" : "flex-end",
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: rgba.overlay,
    },
    keyboardView: {
      flex: isTablet ? 1 : undefined,
      justifyContent: isTablet ? "center" : "flex-end",
    },
    contentWrapper: {
      maxWidth: isTablet ? responsive.maxWidths.modal : undefined,
      width: isTablet ? "100%" : undefined,
      alignSelf: isTablet ? "center" : undefined,
      paddingHorizontal: isTablet ? spacing.xl : 0,
    },
    content: {
      backgroundColor: theme.cardSolid,
      borderTopLeftRadius: radius["2xl"],
      borderTopRightRadius: radius["2xl"],
      borderBottomLeftRadius: isTablet ? radius["2xl"] : 0,
      borderBottomRightRadius: isTablet ? radius["2xl"] : 0,
      padding: spacing.xl,
      paddingTop: spacing.sm,
      ...getShadow(isDark, "xl"),
    },
    contentScrollable: {
      backgroundColor: theme.cardSolid,
      borderTopLeftRadius: radius["2xl"],
      borderTopRightRadius: radius["2xl"],
      borderBottomLeftRadius: isTablet ? radius["2xl"] : 0,
      borderBottomRightRadius: isTablet ? radius["2xl"] : 0,
      maxHeight: isTablet ? "80%" : "90%",
      paddingTop: spacing.sm,
      ...getShadow(isDark, "xl"),
    },
    dragHandleContainer: {
      alignItems: "center",
      paddingVertical: spacing.sm,
    },
    dragHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
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
      marginTop: spacing.sm,
    },
    headerScrollable: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
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
