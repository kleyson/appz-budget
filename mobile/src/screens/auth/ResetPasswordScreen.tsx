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
import { useLocalSearchParams, router } from "expo-router";
import { authApi } from "../../api/client";
import { useTheme } from "../../contexts/ThemeContext";
import { getErrorMessage } from "../../utils/errorHandler";
import { Ionicons } from "@expo/vector-icons";

export const ResetPasswordScreen = () => {
  const { token: tokenFromRoute } = useLocalSearchParams<{ token?: string }>();
  const { isDark } = useTheme();
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

  const styles = getStyles(isDark);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Reset your password</Text>

          <View style={styles.form}>
            {!tokenFromRoute && (
              <TextInput
                style={styles.input}
                placeholder="Reset token"
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
              />
            )}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="New Password (min. 8 characters)"
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoComplete="password-new"
              />
              <View style={styles.eyeButtonContainer}>
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off" : "eye"}
                    size={20}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoComplete="password-new"
              />
              <View style={styles.eyeButtonContainer}>
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </TouchableOpacity>
              </View>
            </View>

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
                <Text style={styles.submitButtonText}>Reset password</Text>
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
    submitButton: {
      backgroundColor: "#3b82f6",
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 8,
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
