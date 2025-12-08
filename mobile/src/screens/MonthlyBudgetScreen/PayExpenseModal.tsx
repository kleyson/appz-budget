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
  onConfirm: (amount: number) => void;
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

  // Reset amount to budget when expense changes or modal opens
  useEffect(() => {
    if (expense && visible) {
      setAmount(expense.budget.toFixed(2));
    }
  }, [expense, visible]);

  const handleConfirm = () => {
    const parsedAmount = parseFloat(amount) || 0;
    onConfirm(parsedAmount);
  };

  const parsedAmount = parseFloat(amount) || 0;

  if (!expense) return null;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Pay Expense"
      icon="card-outline"
      iconBgColor={theme.successBg}
      iconColor={theme.success}
      saveText={isLoading ? "Processing..." : "Pay"}
      saveDisabled={isLoading || parsedAmount <= 0}
      saveGradient={gradientColors.emerald}
      saveIcon="checkmark-circle"
      onSave={handleConfirm}
    >
      <View style={styles.container}>
        <Text style={styles.description}>
          Add a payment to "<Text style={styles.expenseName}>{expense.expense_name}</Text>"
        </Text>

        <FormInput
          label="Payment Amount"
          icon="cash-outline"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        <Text style={styles.budgetHint}>
          Budgeted: {formatCurrency(expense.budget)}
        </Text>
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
    budgetHint: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: -spacing.sm,
    },
  });
