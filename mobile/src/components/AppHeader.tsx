import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { getThemeColors, colors, getShadow } from "../utils/colors";

export const AppHeader = () => {
  const { isDark, toggleTheme } = useTheme();
  const { logout, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const theme = getThemeColors(isDark);
  const isSettingsScreen = segments[0] === "settings";
  const isApiConfigScreen = segments[0] === "api-config";

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  const handleBack = () => {
    router.replace("/");
  };

  const styles = getStyles(isDark, theme, insets.top);

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          {isSettingsScreen ? (
            <View style={styles.leftContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={theme.text}
                />
              </TouchableOpacity>
              <Text style={styles.title}>Settings</Text>
            </View>
          ) : isApiConfigScreen ? (
            <View style={styles.leftContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={theme.text}
                />
              </TouchableOpacity>
              <Text style={styles.title}>API Configuration</Text>
            </View>
          ) : (
            <View style={styles.brandContainer}>
              <LinearGradient
                colors={[colors.primary[500], colors.primary[600]]}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.logoEmoji}>💰</Text>
              </LinearGradient>
              <Text style={styles.brandTitle}>Appz Budget</Text>
            </View>
          )}
        </View>

        <View style={styles.rightSection}>
          {!isSettingsScreen && !isApiConfigScreen && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/settings")}
              activeOpacity={0.7}
            >
              <View style={styles.iconButtonInner}>
                <Ionicons
                  name="settings-outline"
                  size={22}
                  color={theme.textSecondary}
                />
              </View>
            </TouchableOpacity>
          )}
          {isSettingsScreen && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/api-config")}
              activeOpacity={0.7}
            >
              <View style={styles.iconButtonInner}>
                <Ionicons
                  name="server-outline"
                  size={22}
                  color={theme.textSecondary}
                />
              </View>
            </TouchableOpacity>
          )}
          {!isApiConfigScreen && (
            <>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={toggleTheme}
                activeOpacity={0.7}
              >
                <View style={[styles.iconButtonInner, styles.themeButton]}>
                  <Ionicons
                    name={isDark ? "sunny-outline" : "moon-outline"}
                    size={22}
                    color={isDark ? colors.accent[400] : colors.primary[500]}
                  />
                </View>
              </TouchableOpacity>
              {isAuthenticated && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconButtonInner, styles.logoutButton]}>
                    <Ionicons
                      name="log-out-outline"
                      size={22}
                      color={theme.danger}
                    />
                  </View>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const getStyles = (
  isDark: boolean,
  theme: ReturnType<typeof getThemeColors>,
  topInset: number
) =>
  StyleSheet.create({
    header: {
      paddingTop: Math.max(topInset, 12),
      backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 12,
      paddingHorizontal: 16,
    },
    leftSection: {
      flex: 1,
    },
    leftContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.backgroundTertiary,
      alignItems: "center",
      justifyContent: "center",
    },
    brandContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    logoGradient: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      ...getShadow(isDark, "sm"),
    },
    logoEmoji: {
      fontSize: 22,
    },
    brandTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
      letterSpacing: -0.3,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
    },
    rightSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    iconButton: {
      padding: 4,
    },
    iconButtonInner: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.backgroundTertiary,
      alignItems: "center",
      justifyContent: "center",
    },
    themeButton: {
      backgroundColor: isDark
        ? "rgba(251, 191, 36, 0.15)"
        : "rgba(90, 111, 242, 0.1)",
    },
    logoutButton: {
      backgroundColor: isDark
        ? "rgba(248, 113, 113, 0.15)"
        : "rgba(239, 68, 68, 0.1)",
    },
  });
