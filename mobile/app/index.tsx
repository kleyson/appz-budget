import { MonthlyBudgetScreen } from "../src/screens/MonthlyBudgetScreen";
import { AppHeader } from "../src/components/AppHeader";
import { TestBackendWarning } from "../src/components/TestBackendWarning";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../src/contexts/ThemeContext";
import { getThemeColors } from "../src/utils/colors";

export default function HomeScreen() {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader />
      <TestBackendWarning />
      <MonthlyBudgetScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

