import { SettingsScreen } from "../src/screens/SettingsScreen";
import { AppHeader } from "../src/components/AppHeader";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../src/contexts/ThemeContext";

export default function SettingsPage() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <AppHeader />
      <SettingsScreen />
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#111827" : "#f9fafb",
    },
  });

