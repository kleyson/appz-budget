import { MonthlyBudgetScreen } from "../src/screens/MonthlyBudgetScreen";
import { AppHeader } from "../src/components/AppHeader";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../src/contexts/ThemeContext";

export default function HomeScreen() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <AppHeader />
      <MonthlyBudgetScreen />
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

