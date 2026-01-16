import { ApiConfigScreen } from "../src/screens/ApiConfigScreen";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../src/contexts/ThemeContext";
import { getThemeColors } from "../src/utils/colors";
import { router } from "expo-router";

export default function ApiConfigPage() {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);

  const handleBack = () => {
    router.replace("/");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ApiConfigScreen showBackButton onBack={handleBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
