import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, radius } from "../../utils/colors";

export interface Tab<T extends string> {
  id: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface TabsProps<T extends string> {
  tabs: Tab<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
  showScrollIndicators?: boolean;
}

export function Tabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  showScrollIndicators = true,
}: TabsProps<T>) {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(true);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollViewWidth, setScrollViewWidth] = useState(0);

  const styles = getStyles(theme);

  const handleScroll = (event: any) => {
    if (!showScrollIndicators) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollX = contentOffset.x;
    const maxScrollX = contentSize.width - layoutMeasurement.width;

    setShowLeftIndicator(scrollX > 10);
    setShowRightIndicator(scrollX < maxScrollX - 10);
  };

  const handleContentSizeChange = (width: number) => {
    if (!showScrollIndicators) return;
    setContentWidth(width);
    setShowRightIndicator(width > scrollViewWidth);
  };

  const handleLayout = (event: any) => {
    if (!showScrollIndicators) return;
    const { width } = event.nativeEvent.layout;
    setScrollViewWidth(width);
    setShowRightIndicator(contentWidth > width);
  };

  return (
    <View style={styles.wrapper}>
      {showScrollIndicators && showLeftIndicator && (
        <View style={[styles.scrollIndicator, styles.leftIndicator]}>
          <Ionicons name="chevron-back" size={14} color={theme.textMuted} />
        </View>
      )}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        style={styles.scrollView}
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
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.tabIconWrapper,
                  isActive && styles.activeTabIconWrapper,
                ]}
              >
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
      {showScrollIndicators && showRightIndicator && (
        <View style={[styles.scrollIndicator, styles.rightIndicator]}>
          <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
        </View>
      )}
    </View>
  );
}

const getStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    wrapper: {
      position: "relative",
      backgroundColor: theme.cardSolid,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    scrollView: {
      maxHeight: 56,
    },
    container: {
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
      backgroundColor: theme.surfaceSubtle,
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
      backgroundColor: theme.surfaceElevated,
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
    },
    rightIndicator: {
      right: 0,
    },
  });
