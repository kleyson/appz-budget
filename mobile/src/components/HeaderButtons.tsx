import React from "react";
import { View, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { router, useSegments } from "expo-router";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { getThemeColors, radius } from "../utils/colors";
import { Icon } from "./shared/Icon";

export function HeaderRightButtons() {
  const { isDark, toggleTheme } = useTheme();
  const { logout, isAuthenticated } = useAuth();
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

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      {!isSettingsScreen && !isApiConfigScreen && (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/settings")}
          activeOpacity={0.7}
        >
          <View style={styles.iconButtonInner}>
            <Icon name="cog-outline" size={20} color={theme.textSecondary} />
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
            <Icon name="server-outline" size={20} color={theme.textSecondary} />
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
              <Icon
                name={isDark ? "sunny" : "moon"}
                size={18}
                color={theme.themeToggleIcon}
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
                <Icon name="log-out-outline" size={18} color={theme.danger} />
              </View>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const getStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginRight: 8,
    },
    iconButton: {
      padding: 2,
    },
    iconButtonInner: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: theme.surfaceDefault,
      alignItems: "center",
      justifyContent: "center",
      borderCurve: "continuous",
    },
    themeButton: {
      backgroundColor: theme.themeButtonBg,
    },
    logoutButton: {
      backgroundColor: theme.logoutButtonBg,
    },
  });
