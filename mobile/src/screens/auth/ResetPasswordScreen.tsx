import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import { authApi } from "../../api/client";
import { useTheme } from "../../contexts/ThemeContext";
import { getErrorMessage } from "../../utils/errorHandler";
import { getThemeColors, getShadow, gradientColors, radius } from "../../utils/colors";
import { Ionicons } from "@expo/vector-icons";

export const ResetPasswordScreen = () => {
  const { token: tokenFromRoute } = useLocalSearchParams<{ token?: string }>();
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const [token, setToken] = useState(tokenFromRoute || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert("Error", "Reset token is required");
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.resetPassword({
        token,
        new_password: newPassword,
      });
      Alert.alert("Success", response.data.message, [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        getErrorMessage(err, "Failed to reset password. Please try again.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const styles = getStyles(isDark, theme);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Background orbs */}
        <View style={styles.backgroundOrbs}>
          <View style={[styles.orb, styles.orb1]} />
          <View style={[styles.orb, styles.orb2]} />
        </View>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={gradientColors.emerald}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="shield-checkmark" size={32} color="#ffffff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.description}>
              Enter your reset token and choose a strong new password.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {!tokenFromRoute && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reset Token</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconWrapper}>
                    <Ionicons name="barcode-outline" size={18} color={theme.textMuted} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your reset token"
                    placeholderTextColor={theme.placeholder}
                    value={token}
                    onChangeText={setToken}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} />
                </View>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={theme.placeholder}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoComplete="password-new"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off" : "eye"}
                    size={18}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} />
                </View>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={theme.placeholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="password-new"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={18}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={gradientColors.teal}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Reset Password</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Back Link */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(auth)/login")}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={theme.primary} />
            <Text style={styles.backText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 20,
      paddingVertical: 40,
    },
    backgroundOrbs: {
      ...StyleSheet.absoluteFillObject,
      overflow: "hidden",
    },
    orb: {
      position: "absolute",
      borderRadius: 999,
    },
    orb1: {
      width: 260,
      height: 260,
      top: -60,
      right: -60,
      backgroundColor: isDark
        ? "rgba(16, 185, 129, 0.1)"
        : "rgba(16, 185, 129, 0.06)",
    },
    orb2: {
      width: 300,
      height: 300,
      bottom: -100,
      left: -100,
      backgroundColor: isDark
        ? "rgba(20, 184, 166, 0.1)"
        : "rgba(20, 184, 166, 0.06)",
    },
    content: {
      width: "100%",
      maxWidth: 400,
      alignSelf: "center",
    },
    header: {
      alignItems: "center",
      marginBottom: 28,
    },
    iconContainer: {
      marginBottom: 16,
    },
    iconGradient: {
      width: 64,
      height: 64,
      borderRadius: radius.xl,
      alignItems: "center",
      justifyContent: "center",
      ...getShadow(isDark, "lg"),
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    description: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      paddingHorizontal: 16,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: radius["2xl"],
      padding: 24,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 18,
      ...getShadow(isDark, "lg"),
    },
    inputGroup: {
      gap: 8,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: radius.md,
    },
    inputIconWrapper: {
      paddingLeft: 14,
    },
    input: {
      flex: 1,
      padding: 14,
      paddingLeft: 10,
      fontSize: 15,
      color: theme.text,
    },
    passwordInput: {
      paddingRight: 48,
    },
    eyeButton: {
      position: "absolute",
      right: 14,
      padding: 4,
    },
    submitButton: {
      marginTop: 4,
      borderRadius: radius.lg,
      overflow: "hidden",
      ...getShadow(isDark, "md"),
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      gap: 8,
    },
    submitButtonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 24,
      gap: 8,
    },
    backText: {
      color: theme.primary,
      fontSize: 15,
      fontWeight: "600",
    },
  });
