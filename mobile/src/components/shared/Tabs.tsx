import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  LayoutChangeEvent,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, radius } from "../../utils/colors";
import { springConfigs } from "../../utils/animations";

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedTabProps<T extends string> {
  tab: Tab<T>;
  isActive: boolean;
  onPress: () => void;
  theme: ReturnType<typeof getThemeColors>;
  onLayout?: (event: LayoutChangeEvent) => void;
}

function AnimatedTab<T extends string>({
  tab,
  isActive,
  onPress,
  theme,
  onLayout,
}: AnimatedTabProps<T>) {
  const styles = getStyles(theme);
  const scale = useSharedValue(1);
  const activeProgress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    activeProgress.value = withTiming(isActive ? 1 : 0, { duration: 200 });
  }, [isActive]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      activeProgress.value,
      [0, 1],
      [theme.surfaceSubtle, theme.primaryBg]
    ),
  }));

  const animatedIconWrapperStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      activeProgress.value,
      [0, 1],
      [theme.surfaceElevated, theme.primary]
    ),
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      activeProgress.value,
      [0, 1],
      [theme.textSecondary, theme.primary]
    ),
    fontWeight: isActive ? "600" : "500",
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, springConfigs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigs.snappy);
  };

  return (
    <AnimatedPressable
      onLayout={onLayout}
      style={[styles.tab, animatedContainerStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.tabIconWrapper, animatedIconWrapperStyle]}>
        <Ionicons
          name={tab.icon}
          size={16}
          color={isActive ? "#ffffff" : theme.textMuted}
        />
      </Animated.View>
      <Animated.Text style={[styles.tabText, animatedTextStyle]} numberOfLines={1}>
        {tab.label}
      </Animated.Text>
    </AnimatedPressable>
  );
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

  // Indicator animation values
  const indicatorOpacity = useSharedValue(0);

  useEffect(() => {
    // Fade in indicator after initial render
    indicatorOpacity.value = withTiming(1, { duration: 300 });
  }, []);

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

  const leftIndicatorStyle = useAnimatedStyle(() => ({
    opacity: showLeftIndicator ? 1 : 0,
  }));

  const rightIndicatorStyle = useAnimatedStyle(() => ({
    opacity: showRightIndicator ? 1 : 0,
  }));

  return (
    <View style={styles.wrapper}>
      {showScrollIndicators && (
        <Animated.View style={[styles.scrollIndicator, styles.leftIndicator, leftIndicatorStyle]}>
          <Ionicons name="chevron-back" size={14} color={theme.textMuted} />
        </Animated.View>
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
            <AnimatedTab
              key={tab.id}
              tab={tab}
              isActive={isActive}
              onPress={() => onTabChange(tab.id)}
              theme={theme}
            />
          );
        })}
      </ScrollView>
      {showScrollIndicators && (
        <Animated.View style={[styles.scrollIndicator, styles.rightIndicator, rightIndicatorStyle]}>
          <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
        </Animated.View>
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
    },
    tabIconWrapper: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    tabText: {
      fontSize: 13,
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
