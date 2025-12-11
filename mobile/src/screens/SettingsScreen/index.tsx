import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInRight } from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { CategoryManagement } from "./CategoryManagement";
import { PeriodManagement } from "./PeriodManagement";
import { IncomeTypeManagement } from "./IncomeTypeManagement";
import { UserManagement } from "./UserManagement";
import { ChangePasswordScreen } from "../auth/ChangePasswordScreen";
import { APP_VERSION, getVersionFromBackend } from "../../utils/version";
import { useApiConfig } from "../../contexts/ApiConfigContext";
import { getThemeColors } from "../../utils/colors";
import { Tabs, Tab } from "../../components/shared";

type SettingsTab =
  | "categories"
  | "periods"
  | "income-types"
  | "users"
  | "change-password";

const tabs: Tab<SettingsTab>[] = [
  { id: "categories", label: "Categories", icon: "pricetag" },
  { id: "periods", label: "Periods", icon: "calendar" },
  { id: "income-types", label: "Income", icon: "cash" },
  { id: "users", label: "Users", icon: "people" },
  { id: "change-password", label: "Password", icon: "lock-closed" },
];

export const SettingsScreen = () => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { apiUrl } = useApiConfig();
  const [activeTab, setActiveTab] = useState<SettingsTab>("categories");
  const [backendVersion, setBackendVersion] = useState<string | null>(null);

  useEffect(() => {
    if (apiUrl) {
      getVersionFromBackend(apiUrl).then(setBackendVersion);
    } else {
      setBackendVersion(null);
    }

  }, [apiUrl]);

  const styles = getStyles(theme);

  const renderTabContent = () => {
    // Use a unique key based on activeTab to trigger enter/exit animations
    return (
      <Animated.View
        key={activeTab}
        style={styles.contentWrapper}
        entering={SlideInRight.duration(250).springify()}
        exiting={FadeOut.duration(150)}
      >
        {activeTab === "categories" && <CategoryManagement />}
        {activeTab === "periods" && <PeriodManagement />}
        {activeTab === "income-types" && <IncomeTypeManagement />}
        {activeTab === "users" && <UserManagement />}
        {activeTab === "change-password" && <ChangePasswordScreen />}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <View style={styles.content}>
        {renderTabContent()}
      </View>

      <Animated.View
        style={styles.versionContainer}
        entering={FadeIn.delay(300).duration(300)}
      >
        <View style={styles.versionRow}>
          <View style={styles.versionItem}>
            <Ionicons name="phone-portrait-outline" size={12} color={theme.textMuted} />
            <Text style={styles.versionText}>App {APP_VERSION}</Text>
          </View>
          {backendVersion && (
            <>
              <View style={styles.versionDot} />
              <View style={styles.versionItem}>
                <Ionicons name="server-outline" size={12} color={theme.textMuted} />
                <Text style={styles.versionText}>API {backendVersion}</Text>
              </View>
            </>
          )}
          {!backendVersion && apiUrl && (
            <>
              <View style={styles.versionDot} />
              <Text style={[styles.versionText, styles.versionTextMuted]}>
                API unavailable
              </Text>
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
    },
    contentWrapper: {
      flex: 1,
    },
    versionContainer: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.cardSolid,
    },
    versionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    versionItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    versionDot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: theme.textMuted,
      marginHorizontal: 4,
    },
    versionText: {
      fontSize: 11,
      color: theme.textMuted,
      fontWeight: "500",
    },
    versionTextMuted: {
      opacity: 0.6,
    },
  });
