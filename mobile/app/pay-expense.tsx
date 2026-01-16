import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../src/contexts/ThemeContext";
import { useExpense, usePayExpense } from "../src/hooks/useExpenses";
import {
  getThemeColors,
  gradientColors,
  radius,
  spacing,
} from "../src/utils/colors";
import { formatCurrency } from "../src/utils/styles";
import { FormInput, Icon } from "../src/components/shared";

export default function PayExpenseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const expenseId = params.id ? parseInt(params.id) : 0;

  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { data: expense, isLoading: expenseLoading } = useExpense(expenseId);
  const payMutation = usePayExpense();

  const [amount, setAmount] = useState("");
  const [purchaseName, setPurchaseName] = useState("");

  const hasPurchases = expense?.purchases && expense.purchases.length > 0;
  const isAddingPurchase = hasPurchases;

  useEffect(() => {
    if (expense) {
      setAmount(isAddingPurchase ? "" : expense.budget.toFixed(2));
      setPurchaseName("");
    }
  }, [expense, isAddingPurchase]);

  const handleConfirm = async () => {
    if (!expense) return;

    const parsedAmount = parseFloat(amount) || 0;
    if (parsedAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      await payMutation.mutateAsync({
        id: expense.id,
        data: { amount: parsedAmount, name: purchaseName || "Payment" },
      });

      Alert.alert(
        isAddingPurchase ? "Purchase Added" : "Payment Added",
        isAddingPurchase
          ? `Purchase "${purchaseName || "Payment"}" of $${parsedAmount.toFixed(2)} has been added.`
          : `Payment of $${parsedAmount.toFixed(2)} has been added.`
      );
      router.back();
    } catch (_error) {
      Alert.alert(
        "Error",
        isAddingPurchase
          ? "Failed to add purchase. Please try again."
          : "Failed to pay expense. Please try again."
      );
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const styles = getStyles(theme);
  const isLoading = payMutation.isPending;
  const parsedAmount = parseFloat(amount) || 0;

  if (expenseLoading || !expense) {
    return (
      <>
        <Stack.Screen options={{ title: "Loading..." }} />
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </>
    );
  }

  const currentTotal =
    expense.purchases?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remainingBudget = expense.budget - currentTotal;

  return (
    <>
      <Stack.Screen
        options={{
          title: isAddingPurchase ? "Add Purchase" : "Pay Expense",
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.description}>
          {isAddingPurchase ? 'Add a purchase to "' : 'Add a payment to "'}
          <Text style={styles.expenseName}>{expense.expense_name}</Text>"
        </Text>

        {isAddingPurchase && (
          <FormInput
            label="Purchase Name"
            icon="pricetag-outline"
            value={purchaseName}
            onChangeText={setPurchaseName}
            placeholder="e.g., Groceries, Gas, etc."
          />
        )}

        <FormInput
          label={isAddingPurchase ? "Purchase Amount" : "Payment Amount"}
          icon="cash-outline"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        <View style={styles.hintsContainer}>
          <Text style={styles.budgetHint}>
            Budgeted: {formatCurrency(expense.budget)}
          </Text>
          {isAddingPurchase && (
            <>
              <Text style={styles.budgetHint}>
                Current total: {formatCurrency(currentTotal)}
              </Text>
              <Text
                style={[
                  styles.budgetHint,
                  remainingBudget < 0 && styles.overBudget,
                ]}
              >
                Remaining: {formatCurrency(remainingBudget)}
              </Text>
            </>
          )}
        </View>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isLoading || parsedAmount <= 0) && styles.buttonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={isLoading || parsedAmount <= 0}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={gradientColors.emerald}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Icon
                    name="checkmark-circle"
                    size={18}
                    color="#ffffff"
                  />
                  <Text style={styles.submitButtonText}>
                    {isAddingPurchase ? "Add" : "Pay"}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const getStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.cardSolid,
    },
    loadingContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing["4xl"],
    },
    description: {
      fontSize: 15,
      color: theme.textSecondary,
      marginBottom: spacing.lg,
      lineHeight: 22,
    },
    expenseName: {
      color: theme.text,
      fontWeight: "600",
    },
    hintsContainer: {
      marginTop: -spacing.sm,
    },
    budgetHint: {
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: 2,
    },
    overBudget: {
      color: theme.danger,
    },
    footer: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.xl,
    },
    cancelButton: {
      flex: 1,
      padding: 14,
      borderRadius: radius.md,
      alignItems: "center",
      backgroundColor: theme.surfaceDefault,
      borderCurve: "continuous",
    },
    cancelButtonText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "600",
    },
    submitButton: {
      flex: 1.5,
      borderRadius: radius.md,
      overflow: "hidden",
      borderCurve: "continuous",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    submitGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      gap: spacing.sm,
    },
    submitButtonText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "600",
    },
    buttonDisabled: {
      opacity: 0.7,
    },
  });
