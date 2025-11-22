import { ApiConfigScreen } from "../src/screens/ApiConfigScreen";
import { AppHeader } from "../src/components/AppHeader";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../src/contexts/ThemeContext";
import { router } from "expo-router";

export default function ApiConfigPage() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  const handleBack = () => {
    // Navigate to home instead of going back to avoid errors when there's no history
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      <ApiConfigScreen showBackButton onBack={handleBack} />
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
