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
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "../contexts/ThemeContext";
import { useApiConfig } from "../contexts/ApiConfigContext";
import { Ionicons } from "@expo/vector-icons";
import { getErrorMessage } from "../utils/errorHandler";

interface ApiConfigScreenProps {
  onComplete?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const ApiConfigScreen = ({
  onComplete,
  showBackButton = false,
  onBack,
}: ApiConfigScreenProps) => {
  const { isDark } = useTheme();
  const { apiUrl, apiKey, setApiUrl, setApiKey } = useApiConfig();
  // Default API key for dev mode
  const defaultApiKey = __DEV__ ? "your-secret-api-key-change-this" : "";
  const defaultApiUrl = "https://budget.appz.wtf";
  const [url, setUrl] = useState(apiUrl || defaultApiUrl);
  const [key, setKey] = useState(apiKey || defaultApiKey);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Update local state when apiUrl or apiKey changes
  useEffect(() => {
    if (apiUrl) {
      setUrl(apiUrl);
    }
    if (apiKey) {
      setKey(apiKey);
    } else if (__DEV__ && !apiKey) {
      // Pre-fill with default key in dev mode if no key is set
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
      // If URL constructor fails, try adding http://
      return /^[a-zA-Z0-9.-]+(:[0-9]+)?(\/.*)?$/.test(urlString.trim());
    }
  };

  const handleSave = async () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      Alert.alert("Error", "Please enter an API URL");
      return;
    }

    // Auto-add http:// if no protocol is specified
    let finalUrl = trimmedUrl;
    if (
      !trimmedUrl.startsWith("http://") &&
      !trimmedUrl.startsWith("https://")
    ) {
      finalUrl = `http://${trimmedUrl}`;
    }

    // Validate URL
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
      // Save API key (use default in dev if empty)
      const keyToSave = key.trim() || (__DEV__ ? defaultApiKey : "");
      if (keyToSave) {
        await setApiKey(keyToSave);
      }
      // Navigate back after successful save
      if (onBack) {
        onBack();
      } else {
        // Navigate to home instead of going back to avoid errors when there's no history
        router.replace("/");
      }
    } catch (error) {
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
      // Navigate to home instead of going back to avoid errors when there's no history
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
          "Success",
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
          <View style={styles.iconContainer}>
            <Ionicons name="server" size={64} color="#3b82f6" />
          </View>

          <Text style={styles.title}>Configure API Server</Text>
          <Text style={styles.description}>
            Enter the URL and API key of your budget API server. This is
            required to connect to your backend.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>API Server URL</Text>
            <TextInput
              style={styles.input}
              placeholder="http://192.168.1.100:8000"
              placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              autoComplete="off"
            />
            <Text style={styles.hint}>
              Examples:{"\n"}• http://192.168.1.100:8000{"\n"}•
              https://api.example.com{"\n"}• http://localhost:8000 (for iOS
              Simulator)
            </Text>

            <Text style={styles.label}>API Key</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your API key"
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                value={key}
                onChangeText={setKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showApiKey}
                autoComplete="off"
              />
              <View style={styles.eyeButtonContainer}>
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowApiKey(!showApiKey)}
                >
                  <Ionicons
                    name={showApiKey ? "eye-off" : "eye"}
                    size={20}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.hint}>
              The API key is required to authenticate with the backend server.
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.testButton]}
                onPress={handleTest}
                disabled={isSaving}
              >
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.testButtonText}>Test Connection</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  isSaving && styles.buttonDisabled,
                ]}
                onPress={handleCancel}
                disabled={isSaving}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={isDark ? "#111827" : "#6b7280"}
                />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  isSaving && styles.buttonDisabled,
                ]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <Ionicons name="save" size={20} color="#ffffff" />
                <Text style={styles.saveButtonText}>
                  {isSaving ? "Saving..." : "Save & Continue"}
                </Text>
              </TouchableOpacity>
            </View>
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
      maxWidth: 500,
      alignSelf: "center",
    },
    iconContainer: {
      alignItems: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      textAlign: "center",
      color: isDark ? "#ffffff" : "#111827",
      marginBottom: 12,
    },
    description: {
      fontSize: 16,
      textAlign: "center",
      color: isDark ? "#9ca3af" : "#6b7280",
      marginBottom: 32,
      lineHeight: 22,
    },
    form: {
      width: "100%",
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#ffffff" : "#111827",
      marginBottom: 8,
    },
    inputContainer: {
      position: "relative",
      marginBottom: 8,
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
    hint: {
      fontSize: 12,
      color: isDark ? "#6b7280" : "#9ca3af",
      marginBottom: 24,
      lineHeight: 18,
    },
    buttonRow: {
      marginBottom: 12,
      flexDirection: "row",
      gap: 12,
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 14,
      borderRadius: 8,
      marginBottom: 12,
      flex: 1,
    },
    testButton: {
      backgroundColor: "#10b981",
    },
    testButtonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    cancelButton: {
      backgroundColor: isDark ? "#374151" : "#e5e7eb",
    },
    cancelButtonText: {
      color: isDark ? "#ffffff" : "#111827",
      fontSize: 16,
      fontWeight: "600",
    },
    saveButton: {
      backgroundColor: "#3b82f6",
    },
    saveButtonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    buttonDisabled: {
      opacity: 0.5,
    },
  });
