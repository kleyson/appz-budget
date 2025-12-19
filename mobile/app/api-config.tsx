import { ApiConfigScreen } from "../src/screens/ApiConfigScreen";
import { AppHeader } from "../src/components/AppHeader";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../src/contexts/ThemeContext";
import { getThemeColors } from "../src/utils/colors";
import { router } from "expo-router";

export default function ApiConfigPage() {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);

  const handleBack = () => {
    // Navigate to home instead of going back to avoid errors when there's no history
    router.replace("/");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader />
      <ApiConfigScreen showBackButton onBack={handleBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
