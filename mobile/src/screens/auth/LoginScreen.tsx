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
import { router } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getErrorMessage } from "../../utils/errorHandler";
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

      // Try biometric login on mount if enabled
      const enabled = await isBiometricEnabled();
      if (enabled) {
        const credentials = await getBiometricCredentials();
        if (credentials) {
          // Small delay to ensure UI is ready
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
                  // Check if it's a 403 error (invalid API key)
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
              // Biometric auth cancelled or failed, user will need to type password
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

    // If disabling biometrics, clear saved credentials
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

      // Save credentials if biometric is enabled
      if (biometricAvailable && biometricEnabled) {
        try {
          await saveBiometricCredentials({ email, password });
        } catch (error) {
          console.error("Error saving biometric credentials:", error);
        }
      }

      router.replace("/");
    } catch (err: unknown) {
      // Check if it's a 403 error (invalid API key)
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

  const styles = getStyles(isDark);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>💰 Appz Budget</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <View style={styles.eyeButtonContainer}>
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => router.push("/(auth)/forgot-password")}
            >
              <Text style={styles.forgotText}>Forgot your password?</Text>
            </TouchableOpacity>

            {biometricAvailable && (
              <View style={styles.biometricToggleContainer}>
                <View style={styles.biometricToggleRow}>
                  <Ionicons
                    name={
                      biometricType === "Face ID" ? "person" : "lock-closed"
                    }
                    size={20}
                    color={
                      biometricEnabled
                        ? "#3b82f6"
                        : isDark
                        ? "#9ca3af"
                        : "#6b7280"
                    }
                  />
                  <Text style={styles.biometricToggleLabel}>
                    Use {biometricType} for quick login
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    biometricEnabled && styles.toggleActive,
                  ]}
                  onPress={() => handleBiometricToggle(!biometricEnabled)}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      biometricEnabled && styles.toggleThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Sign in</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.apiConfigButton}
              onPress={() => router.push("/api-config")}
            >
              <Ionicons
                name="server"
                size={16}
                color={isDark ? "#9ca3af" : "#6b7280"}
              />
              <Text style={styles.apiConfigText}>Configure API Server</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#111827" : "#f9fafb",
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 20,
    },
    content: {
      width: "100%",
      maxWidth: 400,
      alignSelf: "center",
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      textAlign: "center",
      color: isDark ? "#ffffff" : "#111827",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      color: isDark ? "#ffffff" : "#111827",
      marginBottom: 32,
    },
    form: {
      width: "100%",
    },
    inputContainer: {
      position: "relative",
      marginBottom: 16,
    },
    input: {
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#d1d5db",
      borderRadius: 8,
      padding: 12,
      paddingRight: 45,
      fontSize: 16,
      lineHeight: 20,
      color: isDark ? "#ffffff" : "#111827",
      marginBottom: 16,
    },
    eyeButtonContainer: {
      position: "absolute",
      right: 12,
      top: 12,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    eyeButton: {
      padding: 0,
    },
    forgotButton: {
      alignSelf: "flex-end",
      marginBottom: 24,
    },
    forgotText: {
      color: "#3b82f6",
      fontSize: 14,
    },
    submitButton: {
      backgroundColor: "#3b82f6",
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 16,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    switchContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    switchText: {
      color: isDark ? "#9ca3af" : "#6b7280",
      fontSize: 14,
    },
    switchLink: {
      color: "#3b82f6",
      fontSize: 14,
      fontWeight: "600",
    },
    apiConfigButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: 16,
      padding: 8,
    },
    apiConfigText: {
      color: isDark ? "#9ca3af" : "#6b7280",
      fontSize: 14,
    },
    biometricButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 14,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: "#3b82f6",
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      marginBottom: 16,
    },
    biometricButtonText: {
      color: "#3b82f6",
      fontSize: 16,
      fontWeight: "600",
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 16,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? "#374151" : "#d1d5db",
    },
    dividerText: {
      marginHorizontal: 12,
      color: isDark ? "#9ca3af" : "#6b7280",
      fontSize: 14,
    },
    biometricToggleContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 4,
      marginBottom: 16,
      backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
      borderRadius: 8,
      padding: 12,
    },
    biometricToggleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    biometricToggleLabel: {
      fontSize: 14,
      color: isDark ? "#ffffff" : "#111827",
      flex: 1,
    },
    toggle: {
      width: 50,
      height: 30,
      borderRadius: 15,
      backgroundColor: isDark ? "#374151" : "#d1d5db",
      justifyContent: "center",
      paddingHorizontal: 2,
    },
    toggleActive: {
      backgroundColor: "#3b82f6",
    },
    toggleThumb: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: "#ffffff",
      alignSelf: "flex-start",
    },
    toggleThumbActive: {
      alignSelf: "flex-end",
    },
  });
