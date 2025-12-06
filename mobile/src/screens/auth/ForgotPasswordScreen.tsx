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
import { router } from "expo-router";
import { authApi } from "../../api/client";
import { useTheme } from "../../contexts/ThemeContext";
import { getErrorMessage } from "../../utils/errorHandler";
import { getThemeColors, getShadow, gradientColors, radius } from "../../utils/colors";
import { Ionicons } from "@expo/vector-icons";

export const ForgotPasswordScreen = () => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.forgotPassword({ email });
      let message = response.data.message;
      if (response.data.token) {
        message = `${response.data.message}\n\nReset token (dev only): ${response.data.token}\n\nIn production, this would be sent via email.`;
      }
      Alert.alert("Success", message, [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        getErrorMessage(err, "Failed to send reset email. Please try again.")
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
                colors={gradientColors.amber}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="key" size={32} color="#ffffff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.description}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="mail-outline" size={18} color={theme.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
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
                    <Text style={styles.submitButtonText}>Send Reset Link</Text>
                    <Ionicons name="send" size={18} color="#ffffff" />
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
      width: 240,
      height: 240,
      top: -40,
      left: -60,
      backgroundColor: isDark
        ? "rgba(251, 191, 36, 0.1)"
        : "rgba(251, 191, 36, 0.06)",
    },
    orb2: {
      width: 280,
      height: 280,
      bottom: -80,
      right: -80,
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
      gap: 20,
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
    submitButton: {
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
