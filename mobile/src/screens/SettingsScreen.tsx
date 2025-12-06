import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { CategoryManagement } from "../components/settings/CategoryManagement";
import { PeriodManagement } from "../components/settings/PeriodManagement";
import { IncomeTypeManagement } from "../components/settings/IncomeTypeManagement";
import { UserManagement } from "../components/settings/UserManagement";
import { ChangePasswordScreen } from "./auth/ChangePasswordScreen";
import { APP_VERSION, getVersionFromBackend } from "../utils/version";
import { useApiConfig } from "../contexts/ApiConfigContext";
import { getThemeColors, colors, radius } from "../utils/colors";

type SettingsTab =
  | "categories"
  | "periods"
  | "income-types"
  | "users"
  | "change-password";

export const SettingsScreen = () => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { apiUrl } = useApiConfig();
  const [activeTab, setActiveTab] = useState<SettingsTab>("categories");
  const scrollViewRef = useRef<ScrollView>(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(true);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const [backendVersion, setBackendVersion] = useState<string | null>(null);

  useEffect(() => {
    if (apiUrl) {
      getVersionFromBackend(apiUrl).then(setBackendVersion);
    } else {
      setBackendVersion(null);
    }
  }, [apiUrl]);

  const tabs: {
    id: SettingsTab;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { id: "categories", label: "Categories", icon: "pricetag" },
    { id: "periods", label: "Periods", icon: "calendar" },
    { id: "income-types", label: "Income", icon: "cash" },
    { id: "users", label: "Users", icon: "people" },
    { id: "change-password", label: "Password", icon: "lock-closed" },
  ];

  const styles = getStyles(isDark, theme);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollX = contentOffset.x;
    const maxScrollX = contentSize.width - layoutMeasurement.width;

    setShowLeftIndicator(scrollX > 10);
    setShowRightIndicator(scrollX < maxScrollX - 10);
  };

  const handleContentSizeChange = (width: number) => {
    setContentWidth(width);
    setShowRightIndicator(width > scrollViewWidth);
  };

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setScrollViewWidth(width);
    setShowRightIndicator(contentWidth > width);
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabsWrapper}>
        {showLeftIndicator && (
          <View style={[styles.scrollIndicator, styles.leftIndicator]}>
            <Ionicons
              name="chevron-back"
              size={14}
              color={theme.textMuted}
            />
          </View>
        )}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
          style={styles.tabsScrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onContentSizeChange={handleContentSizeChange}
          onLayout={handleLayout}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.tabIconWrapper, isActive && styles.activeTabIconWrapper]}>
                  <Ionicons
                    name={tab.icon}
                    size={16}
                    color={isActive ? "#ffffff" : theme.textMuted}
                  />
                </View>
                <Text
                  style={[styles.tabText, isActive && styles.activeTabText]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {showRightIndicator && (
          <View style={[styles.scrollIndicator, styles.rightIndicator]}>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={theme.textMuted}
            />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "categories" && <CategoryManagement />}
        {activeTab === "periods" && <PeriodManagement />}
        {activeTab === "income-types" && <IncomeTypeManagement />}
        {activeTab === "users" && <UserManagement />}
        {activeTab === "change-password" && <ChangePasswordScreen />}
      </View>

      {/* Version Footer */}
      <View style={styles.versionContainer}>
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
      </View>
    </View>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    tabsWrapper: {
      position: "relative",
      backgroundColor: theme.cardSolid,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tabsScrollView: {
      maxHeight: 56,
    },
    tabsContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 12,
      gap: 8,
      borderRadius: radius.md,
      backgroundColor: isDark ? "rgba(51, 65, 85, 0.3)" : colors.slate[100],
    },
    activeTab: {
      backgroundColor: theme.primaryBg,
    },
    tabIconWrapper: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(51, 65, 85, 0.5)" : colors.slate[200],
    },
    activeTabIconWrapper: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.textSecondary,
    },
    activeTabText: {
      color: theme.primary,
      fontWeight: "600",
    },
    scrollIndicator: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: 24,
      zIndex: 1,
      pointerEvents: "none",
      justifyContent: "center",
      alignItems: "center",
    },
    leftIndicator: {
      left: 0,
      background: isDark
        ? "linear-gradient(to right, rgba(15,23,42,1), transparent)"
        : "linear-gradient(to right, rgba(255,255,255,1), transparent)",
    },
    rightIndicator: {
      right: 0,
    },
    content: {
      flex: 1,
      padding: 16,
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
