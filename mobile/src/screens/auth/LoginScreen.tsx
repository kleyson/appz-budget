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
import { getThemeColors, colors, getShadow, gradientColors, radius } from "../../utils/colors";
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
        showsVerticalScrollIndicator={false}
      >
        {/* Background gradient orbs */}
        <View style={styles.backgroundOrbs}>
          <View style={[styles.orb, styles.orb1]} />
          <View style={[styles.orb, styles.orb2]} />
          <View style={[styles.orb, styles.orb3]} />
        </View>

        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={gradientColors.teal}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="wallet" size={36} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.title}>Budget</Text>
            <Text style={styles.subtitle}>Take control of your finances</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Sign in to continue tracking your budget</Text>

            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
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

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} />
                  </View>
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
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={18}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => router.push("/(auth)/forgot-password")}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              {/* Biometric Toggle */}
              {biometricAvailable && (
                <TouchableOpacity
                  style={styles.biometricContainer}
                  onPress={() => handleBiometricToggle(!biometricEnabled)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.biometricIcon, biometricEnabled && styles.biometricIconActive]}>
                    <Ionicons
                      name={biometricType === "Face ID" ? "scan" : "finger-print"}
                      size={20}
                      color={biometricEnabled ? theme.primary : theme.textMuted}
                    />
                  </View>
                  <View style={styles.biometricInfo}>
                    <Text style={styles.biometricLabel}>
                      {biometricType}
                    </Text>
                    <Text style={styles.biometricHint}>
                      Quick sign in with {biometricType.toLowerCase()}
                    </Text>
                  </View>
                  <View style={[styles.toggle, biometricEnabled && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, biometricEnabled && styles.toggleThumbActive]} />
                  </View>
                </TouchableOpacity>
              )}

              {/* Submit Button */}
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
                      <Text style={styles.submitButtonText}>Sign in</Text>
                      <Ionicons name="arrow-forward" size={18} color="#ffffff" />
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
            activeOpacity={0.7}
          >
            <View style={styles.apiConfigIcon}>
              <Ionicons name="server-outline" size={16} color={theme.textSecondary} />
            </View>
            <Text style={styles.apiConfigText}>Configure API Server</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerDivider} />
            <Text style={styles.footerText}>Secure & Private</Text>
            <View style={styles.footerDivider} />
          </View>
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
      width: 280,
      height: 280,
      top: -80,
      right: -80,
      backgroundColor: isDark
        ? "rgba(20, 184, 166, 0.12)"
        : "rgba(20, 184, 166, 0.08)",
    },
    orb2: {
      width: 320,
      height: 320,
      bottom: -120,
      left: -120,
      backgroundColor: isDark
        ? "rgba(139, 92, 246, 0.1)"
        : "rgba(139, 92, 246, 0.06)",
    },
    orb3: {
      width: 160,
      height: 160,
      top: '40%',
      right: -60,
      backgroundColor: isDark
        ? "rgba(251, 191, 36, 0.08)"
        : "rgba(251, 191, 36, 0.05)",
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
      width: 72,
      height: 72,
      borderRadius: radius.xl,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      ...getShadow(isDark, "lg"),
    },
    title: {
      fontSize: 30,
      fontWeight: "700",
      color: theme.text,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 15,
      color: theme.textSecondary,
      marginTop: 6,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: radius['2xl'],
      padding: 24,
      borderWidth: 1,
      borderColor: theme.border,
      ...getShadow(isDark, "lg"),
    },
    cardTitle: {
      fontSize: 22,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 6,
    },
    cardSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 24,
    },
    form: {
      gap: 18,
    },
    inputGroup: {
      gap: 8,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    inputWrapper: {
      position: "relative",
      flexDirection: 'row',
      alignItems: 'center',
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
    forgotButton: {
      alignSelf: "flex-end",
      marginTop: -8,
    },
    forgotText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "600",
    },
    biometricContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? 'rgba(51, 65, 85, 0.4)' : colors.slate[50],
      borderRadius: radius.lg,
      padding: 14,
      gap: 12,
    },
    biometricIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: isDark ? 'rgba(51, 65, 85, 0.6)' : colors.slate[100],
      alignItems: 'center',
      justifyContent: 'center',
    },
    biometricIconActive: {
      backgroundColor: theme.primaryBg,
    },
    biometricInfo: {
      flex: 1,
    },
    biometricLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    biometricHint: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    toggle: {
      width: 44,
      height: 26,
      borderRadius: 13,
      backgroundColor: isDark ? colors.slate[700] : colors.slate[300],
      justifyContent: "center",
      padding: 2,
    },
    toggleActive: {
      backgroundColor: theme.primary,
    },
    toggleThumb: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#ffffff",
      ...getShadow(isDark, "sm"),
    },
    toggleThumbActive: {
      alignSelf: "flex-end",
    },
    submitButton: {
      marginTop: 6,
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
    apiConfigButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 24,
      padding: 14,
      backgroundColor: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(148, 163, 184, 0.1)',
      borderRadius: radius.md,
    },
    apiConfigIcon: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      backgroundColor: isDark ? 'rgba(51, 65, 85, 0.5)' : colors.slate[100],
      alignItems: 'center',
      justifyContent: 'center',
    },
    apiConfigText: {
      flex: 1,
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 32,
      gap: 12,
    },
    footerDivider: {
      flex: 1,
      height: 1,
      backgroundColor: theme.border,
      maxWidth: 60,
    },
    footerText: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });
