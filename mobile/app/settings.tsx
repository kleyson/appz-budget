import { SettingsScreen } from "../src/screens/SettingsScreen";
import { AppHeader } from "../src/components/AppHeader";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../src/contexts/ThemeContext";
import { getThemeColors } from "../src/utils/colors";

export default function SettingsPage() {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader />
      <SettingsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

