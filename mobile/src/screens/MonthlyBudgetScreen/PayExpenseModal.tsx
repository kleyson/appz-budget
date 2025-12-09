import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors, spacing, gradientColors } from "../../utils/colors";
import { formatCurrency } from "../../utils/styles";
import { BottomSheetModal, FormInput } from "../../components/shared";
import type { Expense } from "../../types";

interface PayExpenseModalProps {
  visible: boolean;
  expense: Expense | null;
  onClose: () => void;
  onConfirm: (amount: number, purchaseName: string) => void;
  isLoading?: boolean;
}

export const PayExpenseModal = ({
  visible,
  expense,
  onClose,
  onConfirm,
  isLoading = false,
}: PayExpenseModalProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const styles = getStyles(isDark, theme);

  const [amount, setAmount] = useState("");
  const [purchaseName, setPurchaseName] = useState("");

  const hasPurchases = expense?.purchases && expense.purchases.length > 0;
  const isAddingPurchase = hasPurchases;

  // Reset form when expense changes or modal opens
  useEffect(() => {
    if (expense && visible) {
      // If adding to existing purchases, start with empty amount; otherwise use budget
      setAmount(isAddingPurchase ? "" : expense.budget.toFixed(2));
      setPurchaseName("");
    }
  }, [expense, visible, isAddingPurchase]);

  const handleConfirm = () => {
    const parsedAmount = parseFloat(amount) || 0;
    onConfirm(parsedAmount, purchaseName || "Payment");
  };

  const parsedAmount = parseFloat(amount) || 0;

  if (!expense) return null;

  // Calculate current total from existing purchases
  const currentTotal = expense.purchases?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remainingBudget = expense.budget - currentTotal;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={isAddingPurchase ? "Add Purchase" : "Pay Expense"}
      icon={isAddingPurchase ? "add-circle-outline" : "card-outline"}
      iconBgColor={theme.successBg}
      iconColor={theme.success}
      saveText={isLoading ? "Processing..." : isAddingPurchase ? "Add" : "Pay"}
      saveDisabled={isLoading || parsedAmount <= 0}
      saveGradient={gradientColors.emerald}
      saveIcon="checkmark-circle"
      onSave={handleConfirm}
    >
      <View style={styles.container}>
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
              <Text style={[styles.budgetHint, remainingBudget < 0 && styles.overBudget]}>
                Remaining: {formatCurrency(remainingBudget)}
              </Text>
            </>
          )}
        </View>
      </View>
    </BottomSheetModal>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.md,
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
  });
