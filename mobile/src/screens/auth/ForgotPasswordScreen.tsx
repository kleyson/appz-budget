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
import { router } from "expo-router";
import { authApi } from "../../api/client";
import { useTheme } from "../../contexts/ThemeContext";
import { getErrorMessage } from "../../utils/errorHandler";

export const ForgotPasswordScreen = () => {
  const { isDark } = useTheme();
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

  const styles = getStyles(isDark);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.description}>
            Enter your email address and we'll send you a password reset link.
          </Text>

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
                <Text style={styles.submitButtonText}>Send reset link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/(auth)/login")}
            >
              <Text style={styles.backText}>Back to sign in</Text>
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
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      color: isDark ? "#ffffff" : "#111827",
      marginBottom: 8,
    },
    description: {
      fontSize: 14,
      textAlign: "center",
      color: isDark ? "#9ca3af" : "#6b7280",
      marginBottom: 32,
    },
    form: {
      width: "100%",
    },
    input: {
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#d1d5db",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDark ? "#ffffff" : "#111827",
      marginBottom: 24,
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
    backButton: {
      alignItems: "center",
    },
    backText: {
      color: "#3b82f6",
      fontSize: 14,
      fontWeight: "600",
    },
  });
