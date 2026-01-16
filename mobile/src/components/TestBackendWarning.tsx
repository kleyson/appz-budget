import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApiConfig } from "../contexts/ApiConfigContext";
import { useTheme } from "../contexts/ThemeContext";
import { colors, radius, spacing } from "../utils/colors";
import { Icon } from "./shared/Icon";

const GITHUB_REPO_URL =
  "https://github.com/kleyson/appz-budget#quick-start-with-docker";
const TEST_BACKEND_HOST = "budget.appz.wtf";

/**
 * Detects if the app is connected to the test/demo backend.
 */
const isTestBackend = (apiUrl: string | null): boolean => {
  if (!apiUrl) return false;
  try {
    const url = new URL(apiUrl);
    return url.hostname === TEST_BACKEND_HOST;
  } catch {
    return apiUrl.includes(TEST_BACKEND_HOST);
  }
};

/**
 * Warning banner displayed when connected to the test/demo backend.
 * Warns users not to save personal data and provides self-hosting link.
 * Dismissible per session (reappears on app restart).
 */
export const TestBackendWarning = () => {
  const { apiUrl } = useApiConfig();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't render if not on test backend or if dismissed
  if (!isTestBackend(apiUrl) || isDismissed) {
    return null;
  }

  const handleOpenDocs = () => {
    Linking.openURL(GITHUB_REPO_URL);
  };

  const styles = getStyles(isDark, insets.top);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Warning Icon */}
        <View style={styles.iconContainer}>
          <Icon
            name="warning"
            size={18}
            color={isDark ? colors.accent[400] : colors.accent[600]}
          />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Demo Server</Text>
          <Text style={styles.message}>
            Do not store personal data. Data may be deleted without notice.{" "}
            <Text style={styles.link} onPress={handleOpenDocs}>
              Self-host your own instance
            </Text>
          </Text>
        </View>

        {/* Dismiss Button */}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => setIsDismissed(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon
            name="close"
            size={16}
            color={isDark ? colors.accent[400] : colors.accent[700]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (isDark: boolean, _topInset: number) =>
  StyleSheet.create({
    container: {
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      backgroundColor: isDark
        ? "rgba(245, 158, 11, 0.15)"
        : "rgba(254, 243, 199, 1)",
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(245, 158, 11, 0.3)"
        : "rgba(217, 119, 6, 0.3)",
      borderCurve: "continuous",
    },
    content: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    iconContainer: {
      marginTop: 2,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? colors.accent[300] : colors.accent[800],
      marginBottom: 2,
    },
    message: {
      fontSize: 13,
      lineHeight: 18,
      color: isDark ? colors.accent[200] : colors.accent[700],
    },
    link: {
      fontWeight: "600",
      textDecorationLine: "underline",
      color: isDark ? colors.accent[300] : colors.accent[800],
    },
    dismissButton: {
      padding: spacing.xs,
      borderRadius: radius.sm,
      backgroundColor: isDark
        ? "rgba(245, 158, 11, 0.2)"
        : "rgba(217, 119, 6, 0.1)",
    },
  });
