import React, { useState, useEffect } from "react";
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
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getErrorMessage } from "../../utils/errorHandler";
import { getThemeColors, colors, getShadow } from "../../utils/colors";
import { Ionicons } from "@expo/vector-icons";
import {
  isBiometricAvailable,
  getBiometricType,
  saveBiometricCredentials,
  setBiometricEnabled,
  isBiometricEnabled,
  removeBiometricCredentials,
  getBiometricCredentials,
  authenticateWithBiometrics,
} from "../../utils/biometric";

export const LoginScreen = () => {
  const { login } = useAuth();
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState("Biometric");
  const [biometricEnabled, setBiometricEnabledState] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await checkBiometricAvailability();
      await checkBiometricEnabled();

      const enabled = await isBiometricEnabled();
      if (enabled) {
        const credentials = await getBiometricCredentials();
        if (credentials) {
          setTimeout(async () => {
            try {
              const authenticated = await authenticateWithBiometrics();
              if (authenticated) {
                setIsLoading(true);
                try {
                  await login(
                    {
                      email: credentials.email,
                      password: credentials.password,
                    },
                    true
                  );
                  router.replace("/");
                } catch (err: unknown) {
                  const errorMessage = getErrorMessage(
                    err,
                    "Failed to login. Please check your credentials."
                  );
                  const isApiKeyError =
                    (err as any)?.response?.status === 403 ||
                    errorMessage.toLowerCase().includes("api key") ||
                    errorMessage.toLowerCase().includes("forbidden");

                  if (isApiKeyError) {
                    Alert.alert(
                      "API Configuration Error",
                      "Invalid API key. Please configure the correct API key in settings.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Configure API",
                          onPress: () => router.push("/api-config"),
                        },
                      ]
                    );
                  } else {
                    Alert.alert("Login Failed", errorMessage);
                  }
                } finally {
                  setIsLoading(false);
                }
              }
            } catch (error) {
              console.log("Biometric authentication cancelled or failed");
            }
          }, 300);
        }
      }
    };

    initialize();
  }, []);

  const checkBiometricAvailability = async () => {
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);
    if (available) {
      const type = await getBiometricType();
      setBiometricType(type);
    }
  };

  const checkBiometricEnabled = async () => {
    const enabled = await isBiometricEnabled();
    setBiometricEnabledState(enabled);
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    setBiometricEnabledState(enabled);
    await setBiometricEnabled(enabled);
    if (!enabled) {
      await removeBiometricCredentials();
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password }, true);

      if (biometricAvailable && biometricEnabled) {
        try {
          await saveBiometricCredentials({ email, password });
        } catch (error) {
          console.error("Error saving biometric credentials:", error);
        }
      }

      router.replace("/");
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(
        err,
        "Failed to login. Please check your credentials."
      );
      const isApiKeyError =
        (err as any)?.response?.status === 403 ||
        errorMessage.toLowerCase().includes("api key") ||
        errorMessage.toLowerCase().includes("forbidden");

      if (isApiKeyError) {
        Alert.alert(
          "API Configuration Error",
          "Invalid API key. Please configure the correct API key in settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Configure API",
              onPress: () => router.push("/api-config"),
            },
          ]
        );
      } else {
        Alert.alert("Login Failed", errorMessage);
      }
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
      >
        {/* Background gradient orbs */}
        <View style={styles.backgroundOrbs}>
          <View style={[styles.orb, styles.orb1]} />
          <View style={[styles.orb, styles.orb2]} />
        </View>

        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[colors.primary[500], colors.primary[600]]}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoEmoji}>💰</Text>
            </LinearGradient>
            <Text style={styles.title}>Appz Budget</Text>
            <Text style={styles.subtitle}>Take control of your finances</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>

            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email address</Text>
                <View style={styles.inputWrapper}>
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

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Text style={styles.forgotText}>Forgot your password?</Text>
              </TouchableOpacity>

              {/* Biometric Toggle */}
              {biometricAvailable && (
                <View style={styles.biometricContainer}>
                  <View style={styles.biometricInfo}>
                    <Ionicons
                      name={biometricType === "Face ID" ? "scan-outline" : "finger-print-outline"}
                      size={20}
                      color={biometricEnabled ? theme.primary : theme.textSecondary}
                    />
                    <Text style={styles.biometricLabel}>
                      Use {biometricType} for quick login
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggle, biometricEnabled && styles.toggleActive]}
                    onPress={() => handleBiometricToggle(!biometricEnabled)}
                  >
                    <View style={[styles.toggleThumb, biometricEnabled && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary[500], colors.primary[600]]}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Sign in</Text>
                      <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* API Config Link */}
          <TouchableOpacity
            style={styles.apiConfigButton}
            onPress={() => router.push("/api-config")}
          >
            <Ionicons name="server-outline" size={16} color={theme.textSecondary} />
            <Text style={styles.apiConfigText}>Configure API Server</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footerText}>
            Secure, simple, and smart budgeting
          </Text>
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
      width: 300,
      height: 300,
      top: -100,
      right: -100,
      backgroundColor: isDark
        ? "rgba(90, 111, 242, 0.15)"
        : "rgba(90, 111, 242, 0.08)",
    },
    orb2: {
      width: 350,
      height: 350,
      bottom: -150,
      left: -150,
      backgroundColor: isDark
        ? "rgba(251, 191, 36, 0.1)"
        : "rgba(251, 191, 36, 0.06)",
    },
    content: {
      width: "100%",
      maxWidth: 400,
      alignSelf: "center",
    },
    logoContainer: {
      alignItems: "center",
      marginBottom: 32,
    },
    logoGradient: {
      width: 80,
      height: 80,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      ...getShadow(isDark, "lg"),
    },
    logoEmoji: {
      fontSize: 40,
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      color: theme.text,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      marginTop: 8,
    },
    card: {
      backgroundColor: isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(255, 255, 255, 0.9)",
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: isDark ? colors.slate[800] : colors.slate[200],
      ...getShadow(isDark, "lg"),
    },
    cardTitle: {
      fontSize: 24,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 24,
    },
    form: {
      gap: 16,
    },
    inputGroup: {
      gap: 8,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.textSecondary,
    },
    inputWrapper: {
      position: "relative",
    },
    input: {
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: theme.text,
    },
    passwordInput: {
      paddingRight: 48,
    },
    eyeButton: {
      position: "absolute",
      right: 14,
      top: 14,
    },
    forgotButton: {
      alignSelf: "flex-end",
    },
    forgotText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: "500",
    },
    biometricContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 12,
      padding: 14,
    },
    biometricInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    biometricLabel: {
      fontSize: 14,
      color: theme.text,
      flex: 1,
    },
    toggle: {
      width: 48,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.inputBorder,
      justifyContent: "center",
      padding: 2,
    },
    toggleActive: {
      backgroundColor: theme.primary,
    },
    toggleThumb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#ffffff",
      ...getShadow(isDark, "sm"),
    },
    toggleThumbActive: {
      alignSelf: "flex-end",
    },
    submitButton: {
      marginTop: 8,
      borderRadius: 14,
      overflow: "hidden",
      ...getShadow(isDark, "md"),
    },
    submitButtonDisabled: {
      opacity: 0.6,
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
    apiConfigButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 24,
      padding: 12,
    },
    apiConfigText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    footerText: {
      textAlign: "center",
      color: theme.textMuted,
      fontSize: 14,
      marginTop: 16,
    },
  });
