import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { router, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { getThemeColors, colors, getShadow, gradientColors, radius } from "../utils/colors";

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

  const HeaderBackground = ({ children }: { children: React.ReactNode }) => {
    if (Platform.OS === 'ios') {
      return (
        <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={styles.blurView}>
          {children}
        </BlurView>
      );
    }
    return <View style={styles.headerFallback}>{children}</View>;
  };

  return (
    <View style={styles.header}>
      <HeaderBackground>
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
                    size={22}
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
                    size={22}
                    color={theme.text}
                  />
                </TouchableOpacity>
                <Text style={styles.title}>API Configuration</Text>
              </View>
            ) : (
              <View style={styles.brandContainer}>
                <LinearGradient
                  colors={gradientColors.teal}
                  style={styles.logoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="wallet" size={22} color="#ffffff" />
                </LinearGradient>
                <View>
                  <Text style={styles.brandTitle}>Budget</Text>
                  <Text style={styles.brandSubtitle}>Financial Tracker</Text>
                </View>
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
                    name="cog-outline"
                    size={20}
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
                    size={20}
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
                      name={isDark ? "sunny" : "moon"}
                      size={18}
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
                        size={18}
                        color={theme.danger}
                      />
                    </View>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </HeaderBackground>
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
      backgroundColor: theme.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
    },
    blurView: {
      overflow: 'hidden',
    },
    headerFallback: {
      backgroundColor: theme.headerBg,
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
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
      width: 38,
      height: 38,
      borderRadius: radius.md,
      backgroundColor: isDark ? 'rgba(51, 65, 85, 0.5)' : colors.slate[100],
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.borderGlass,
    },
    brandContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    logoGradient: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      ...getShadow(isDark, "md"),
    },
    brandTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
      letterSpacing: -0.5,
    },
    brandSubtitle: {
      fontSize: 12,
      fontWeight: "500",
      color: theme.textMuted,
      marginTop: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      letterSpacing: -0.3,
    },
    rightSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    iconButton: {
      padding: 2,
    },
    iconButtonInner: {
      width: 38,
      height: 38,
      borderRadius: radius.md,
      backgroundColor: isDark ? 'rgba(51, 65, 85, 0.5)' : colors.slate[100],
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.borderGlass,
    },
    themeButton: {
      backgroundColor: isDark
        ? "rgba(251, 191, 36, 0.12)"
        : "rgba(20, 184, 166, 0.1)",
    },
    logoutButton: {
      backgroundColor: isDark
        ? "rgba(248, 113, 113, 0.12)"
        : "rgba(239, 68, 68, 0.08)",
    },
  });
