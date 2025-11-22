import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { CategoryManagement } from "../components/settings/CategoryManagement";
import { PeriodManagement } from "../components/settings/PeriodManagement";
import { IncomeTypeManagement } from "../components/settings/IncomeTypeManagement";
import { ChangePasswordScreen } from "./auth/ChangePasswordScreen";
import { APP_VERSION, getVersionFromBackend } from "../utils/version";
import { useApiConfig } from "../contexts/ApiConfigContext";

type SettingsTab =
  | "categories"
  | "periods"
  | "income-types"
  | "change-password";

export const SettingsScreen = () => {
  const { isDark } = useTheme();
  const { apiUrl } = useApiConfig();
  const [activeTab, setActiveTab] = useState<SettingsTab>("categories");
  const scrollViewRef = useRef<ScrollView>(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(true);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const [backendVersion, setBackendVersion] = useState<string | null>(null);

  useEffect(() => {
    // Try to get version from backend if API URL is configured
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
    { id: "income-types", label: "Income Types", icon: "cash" },
    { id: "change-password", label: "Change Password", icon: "lock-closed" },
  ];

  const styles = getStyles(isDark);

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
      <View style={styles.tabsWrapper}>
        {showLeftIndicator && (
          <View style={[styles.scrollIndicator, styles.leftIndicator, isDark && styles.leftIndicatorDark]}>
            <Ionicons name="chevron-back" size={16} color={isDark ? "#9ca3af" : "#6b7280"} style={styles.indicatorIcon} />
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
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={18}
                color={
                  activeTab === tab.id
                    ? "#3b82f6"
                    : isDark
                    ? "#9ca3af"
                    : "#6b7280"
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {showRightIndicator && (
          <View style={[styles.scrollIndicator, styles.rightIndicator, isDark && styles.rightIndicatorDark]}>
            <Ionicons name="chevron-forward" size={16} color={isDark ? "#9ca3af" : "#6b7280"} style={styles.indicatorIcon} />
          </View>
        )}
      </View>

      <View style={styles.content}>
        {activeTab === "categories" && <CategoryManagement />}
        {activeTab === "periods" && <PeriodManagement />}
        {activeTab === "income-types" && <IncomeTypeManagement />}
        {activeTab === "change-password" && <ChangePasswordScreen />}
      </View>

      {/* Version display */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>App Version: {APP_VERSION}</Text>
        {backendVersion && (
          <Text style={styles.versionText}>Backend Version: {backendVersion}</Text>
        )}
        {!backendVersion && apiUrl && (
          <Text style={[styles.versionText, styles.versionTextMuted]}>
            Backend Version: Unable to fetch
          </Text>
        )}
      </View>
    </View>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#111827" : "#f9fafb",
    },
    tabsWrapper: {
      position: "relative",
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#374151" : "#e5e7eb",
    },
    tabsScrollView: {
      maxHeight: 50,
    },
    tabsContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      minHeight: 48,
    },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 14,
      gap: 6,
      minWidth: 100,
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
      backgroundColor: "transparent",
    },
    leftIndicator: {
      left: 0,
    },
    leftIndicatorDark: {
      // No special styling needed
    },
    rightIndicator: {
      right: 0,
    },
    rightIndicatorDark: {
      // No special styling needed
    },
    indicatorIcon: {
      opacity: 0.7,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: "#3b82f6",
    },
    tabText: {
      fontSize: 14,
      color: isDark ? "#9ca3af" : "#6b7280",
    },
    activeTabText: {
      color: "#3b82f6",
      fontWeight: "600",
    },
    content: {
      flex: 1,
      padding: 16,
    },
    versionContainer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#374151" : "#e5e7eb",
      alignItems: "center",
    },
    versionText: {
      fontSize: 12,
      color: isDark ? "#6b7280" : "#9ca3af",
    },
    versionTextMuted: {
      opacity: 0.6,
    },
  });
