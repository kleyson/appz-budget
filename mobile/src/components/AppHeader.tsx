import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

export const AppHeader = () => {
  const { isDark, toggleTheme } = useTheme();
  const { logout, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const isSettingsScreen = segments[0] === "settings";
  const isApiConfigScreen = segments[0] === "api-config";

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  const handleBack = () => {
    // Navigate to home instead of going back to avoid errors when there's no history
    router.replace("/");
  };

  const styles = getStyles(isDark, insets.top);

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {isSettingsScreen ? (
          <View style={styles.leftContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDark ? "#ffffff" : "#111827"}
              />
            </TouchableOpacity>
            <Text style={styles.title}>Settings</Text>
          </View>
        ) : isApiConfigScreen ? (
          <Text style={styles.title}>API Configuration</Text>
        ) : (
          <Text style={styles.title}>💰 Appz Budget</Text>
        )}
      </View>
      <View style={styles.rightSection}>
        {!isSettingsScreen && !isApiConfigScreen && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/settings")}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={isDark ? "#ffffff" : "#111827"}
            />
          </TouchableOpacity>
        )}
        {isSettingsScreen && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/api-config")}
          >
            <Ionicons
              name="server-outline"
              size={24}
              color={isDark ? "#ffffff" : "#111827"}
            />
          </TouchableOpacity>
        )}
        {!isApiConfigScreen && (
          <>
            <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
              <Ionicons
                name={isDark ? "sunny" : "moon"}
                size={24}
                color={isDark ? "#ffffff" : "#111827"}
              />
            </TouchableOpacity>
            {isAuthenticated && (
              <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const getStyles = (isDark: boolean, topInset: number) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: Math.max(topInset, 12),
      paddingBottom: 12,
      paddingHorizontal: 16,
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#374151" : "#e5e7eb",
    },
    leftSection: {
      flex: 1,
    },
    leftContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    backButton: {
      padding: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: isDark ? "#ffffff" : "#111827",
    },
    rightSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconButton: {
      padding: 8,
    },
  });
