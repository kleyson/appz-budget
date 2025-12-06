import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTheme } from "../contexts/ThemeContext";
import { useApiConfig } from "../contexts/ApiConfigContext";
import { Ionicons } from "@expo/vector-icons";
import { getErrorMessage } from "../utils/errorHandler";
import { getThemeColors, getShadow, gradientColors, radius } from "../utils/colors";

interface ApiConfigScreenProps {
  onComplete?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const ApiConfigScreen = ({
  onComplete: _onComplete,
  showBackButton: _showBackButton = false,
  onBack,
}: ApiConfigScreenProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { apiUrl, apiKey, setApiUrl, setApiKey } = useApiConfig();
  const defaultApiKey = "your-secret-api-key-change-this";
  const defaultApiUrl = "https://budget.appz.wtf";
  const [url, setUrl] = useState(apiUrl || defaultApiUrl);
  const [key, setKey] = useState(apiKey || defaultApiKey);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (apiUrl) {
      setUrl(apiUrl);
    }
    if (apiKey) {
      setKey(apiKey);
    } else if (!apiKey) {
      setKey(defaultApiKey);
    }
  }, [apiUrl, apiKey, defaultApiKey]);

  const validateUrl = (urlString: string): boolean => {
    if (!urlString.trim()) {
      return false;
    }
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return /^[a-zA-Z0-9.-]+(:[0-9]+)?(\/.*)?$/.test(urlString.trim());
    }
  };

  const handleSave = async () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      Alert.alert("Error", "Please enter an API URL");
      return;
    }

    let finalUrl = trimmedUrl;
    if (
      !trimmedUrl.startsWith("http://") &&
      !trimmedUrl.startsWith("https://")
    ) {
      finalUrl = `http://${trimmedUrl}`;
    }

    if (!validateUrl(finalUrl)) {
      Alert.alert(
        "Error",
        "Please enter a valid URL (e.g., http://192.168.1.100:8000 or https://api.example.com)"
      );
      return;
    }

    setIsSaving(true);
    try {
      await setApiUrl(finalUrl);
      const keyToSave = key.trim() || defaultApiKey;
      if (keyToSave) {
        await setApiKey(keyToSave);
      }
      if (onBack) {
        onBack();
      } else {
        router.replace("/");
      }
    } catch (_error) {
      Alert.alert(
        "Error",
        "Failed to save API configuration. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onBack) {
      onBack();
    } else {
      router.replace("/");
    }
  };

  const handleTest = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      Alert.alert("Error", "Please enter an API URL first");
      return;
    }

    let finalUrl = trimmedUrl;
    if (
      !trimmedUrl.startsWith("http://") &&
      !trimmedUrl.startsWith("https://")
    ) {
      finalUrl = `http://${trimmedUrl}`;
    }

    setIsTesting(true);
    try {
      const response = await fetch(`${finalUrl}/api/v1/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          "Connection Successful",
          `API is reachable!\n\nStatus: ${data.status}\nVersion: ${data.version}`
        );
      } else {
        Alert.alert(
          "Warning",
          `API responded with status ${response.status}. The URL may be incorrect.`
        );
      }
    } catch (error: unknown) {
      Alert.alert(
        "Connection Failed",
        `Could not reach the API at ${finalUrl}. Please check:\n\n• The URL is correct\n• The server is running\n• Your device is on the same network\n\nError: ${getErrorMessage(
          error,
          "Unknown error"
        )}`
      );
    } finally {
      setIsTesting(false);
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
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
                colors={gradientColors.purple}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="server" size={32} color="#ffffff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>API Configuration</Text>
            <Text style={styles.description}>
              Connect to your budget API server to sync your financial data securely.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* API URL Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Server URL</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="globe-outline" size={18} color={theme.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="https://api.example.com"
                  placeholderTextColor={theme.placeholder}
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  autoComplete="off"
                />
              </View>
              <Text style={styles.hint}>
                Enter your API server address (e.g., https://budget.appz.wtf)
              </Text>
            </View>

            {/* API Key Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>API Key</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="key-outline" size={18} color={theme.textMuted} />
                </View>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter your API key"
                  placeholderTextColor={theme.placeholder}
                  value={key}
                  onChangeText={setKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showApiKey}
                  autoComplete="off"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowApiKey(!showApiKey)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showApiKey ? "eye-off" : "eye"}
                    size={18}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>
                Required for authentication with the backend server
              </Text>
            </View>

            {/* Test Connection Button */}
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTest}
              disabled={isTesting}
              activeOpacity={0.8}
            >
              <View style={[styles.testButtonInner, isTesting && styles.buttonDisabled]}>
                {isTesting ? (
                  <ActivityIndicator size="small" color={theme.success} />
                ) : (
                  <>
                    <View style={styles.testIconWrapper}>
                      <Ionicons name="wifi" size={18} color={theme.success} />
                    </View>
                    <Text style={[styles.testButtonText, { color: theme.success }]}>
                      Test Connection
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.cancelButton, isSaving && styles.buttonDisabled]}
                onPress={handleCancel}
                disabled={isSaving}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={theme.textSecondary} />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={gradientColors.teal}
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={18} color="#ffffff" />
                      <Text style={styles.saveButtonText}>Save</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <View style={styles.helpItem}>
              <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
              <Text style={styles.helpText}>
                Make sure your server is running and accessible from this device
              </Text>
            </View>
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
      width: 260,
      height: 260,
      top: -60,
      right: -60,
      backgroundColor: isDark
        ? "rgba(139, 92, 246, 0.1)"
        : "rgba(139, 92, 246, 0.06)",
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
      maxWidth: 440,
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
    passwordInput: {
      paddingRight: 48,
    },
    eyeButton: {
      position: "absolute",
      right: 14,
      padding: 4,
    },
    hint: {
      fontSize: 12,
      color: theme.textMuted,
      lineHeight: 16,
    },
    testButton: {
      marginTop: 4,
    },
    testButtonInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 14,
      backgroundColor: theme.successBg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.connectedBorder,
    },
    testIconWrapper: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      backgroundColor: theme.connectedSurface,
      alignItems: "center",
      justifyContent: "center",
    },
    testButtonText: {
      fontSize: 15,
      fontWeight: "600",
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 4,
    },
    cancelButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 14,
      backgroundColor: theme.surfaceDefault,
      borderRadius: radius.md,
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    saveButton: {
      flex: 1.5,
      borderRadius: radius.md,
      overflow: "hidden",
      ...getShadow(isDark, "sm"),
    },
    saveButtonGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 14,
    },
    saveButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: "#ffffff",
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    helpSection: {
      marginTop: 20,
      gap: 8,
    },
    helpItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 4,
    },
    helpText: {
      flex: 1,
      fontSize: 13,
      color: theme.textMuted,
      lineHeight: 18,
    },
  });
