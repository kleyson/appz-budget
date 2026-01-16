import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../src/contexts/ThemeContext";
import {
  useExpense,
  useCreateExpense,
  useUpdateExpense,
} from "../src/hooks/useExpenses";
import { useCategories } from "../src/hooks/useCategories";
import { usePeriods } from "../src/hooks/usePeriods";
import type { ExpenseCreate, Purchase } from "../src/types";
import { getErrorMessage } from "../src/utils/errorHandler";
import {
  getThemeColors,
  gradientColors,
  radius,
  spacing,
} from "../src/utils/colors";
import { FormInput, ChipGroup, IconButton, Icon } from "../src/components/shared";

export default function ExpenseFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; monthId?: string }>();
  const expenseId = params.id ? parseInt(params.id) : 0;
  const monthId = params.monthId ? parseInt(params.monthId) : null;

  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { data: existingExpense } = useExpense(expenseId); // Will be skipped if expenseId is 0
  const { data: categories } = useCategories();
  const { data: periods } = usePeriods();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  const [expenseName, setExpenseName] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchaseAmountInputs, setPurchaseAmountInputs] = useState<
    Record<number, string>
  >({});

  const isEditing = expenseId > 0;

  useEffect(() => {
    if (existingExpense) {
      setExpenseName(existingExpense.expense_name);
      setSelectedPeriod(existingExpense.period);
      setSelectedCategory(existingExpense.category);
      setBudget(existingExpense.budget.toString());
      setNotes(existingExpense.notes || "");
      setPurchases(existingExpense.purchases || []);
      const inputs: Record<number, string> = {};
      (existingExpense.purchases || []).forEach((p, i) => {
        inputs[i] = p.amount.toString();
      });
      setPurchaseAmountInputs(inputs);
    }
  }, [existingExpense]);

  const hasPurchases = purchases.length > 0;
  const calculatedCost = purchases.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );

  const handleAddPurchase = () => {
    const newIndex = purchases.length;
    setPurchases([...purchases, { name: "", amount: 0 }]);
    setPurchaseAmountInputs((prev) => ({ ...prev, [newIndex]: "" }));
  };

  const handleRemovePurchase = (index: number) => {
    setPurchases(purchases.filter((_, i) => i !== index));
    setPurchaseAmountInputs((prev) => {
      const newInputs: Record<number, string> = {};
      Object.keys(prev).forEach((key) => {
        const keyNum = parseInt(key);
        if (keyNum < index) {
          newInputs[keyNum] = prev[keyNum];
        } else if (keyNum > index) {
          newInputs[keyNum - 1] = prev[keyNum];
        }
      });
      return newInputs;
    });
  };

  const handlePurchaseChange = (
    index: number,
    field: "name" | "amount",
    value: string | number
  ) => {
    if (field === "amount" && typeof value === "string") {
      setPurchaseAmountInputs((prev) => ({ ...prev, [index]: value }));
      const numValue =
        value === "" || value === "." ? 0 : parseFloat(value) || 0;
      setPurchases(
        purchases.map((item, i) =>
          i === index ? { ...item, amount: numValue } : item
        )
      );
    } else {
      setPurchases(
        purchases.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      );
    }
  };

  const handleSubmit = async () => {
    if (
      !expenseName ||
      !selectedPeriod ||
      !selectedCategory ||
      !budget ||
      !monthId
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!calculatedCost) {
      Alert.alert("Error", "Please add purchases with amounts");
      return;
    }

    const data: ExpenseCreate = {
      expense_name: expenseName,
      period: selectedPeriod,
      category: selectedCategory,
      budget: parseFloat(budget),
      cost: calculatedCost,
      notes: notes || null,
      month_id: monthId,
      purchases: purchases.filter(
        (item) => item.name.trim() !== "" || item.amount > 0
      ),
    };

    try {
      if (isEditing && expenseId) {
        await updateMutation.mutateAsync({ id: expenseId, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      router.back();
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error, "Failed to save expense"));
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const styles = getStyles(theme);
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? "Edit Expense" : "Add Expense",
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
      >
        {/* Expense Name */}
        <FormInput
          label="Expense Name"
          placeholder="Enter expense name"
          value={expenseName}
          onChangeText={setExpenseName}
          icon="receipt-outline"
        />

        {/* Period Selection */}
        <ChipGroup
          label="Period"
          icon="calendar-outline"
          iconBgColor={theme.primaryBg}
          iconColor={theme.primary}
          options={periods || []}
          selectedValue={selectedPeriod}
          onSelect={setSelectedPeriod}
          showAllOption={false}
        />

        {/* Category Selection */}
        <View style={styles.chipGroupSpacing}>
          <ChipGroup
            label="Category"
            icon="pricetag-outline"
            iconBgColor={theme.dangerBg}
            iconColor={theme.danger}
            options={categories || []}
            selectedValue={selectedCategory}
            onSelect={setSelectedCategory}
            showAllOption={false}
          />
        </View>

        {/* Budget Input */}
        <FormInput
          label="Budget"
          placeholder="0.00"
          value={budget}
          onChangeText={setBudget}
          keyboardType="decimal-pad"
          icon="wallet-outline"
        />

        {/* Calculated Cost (Read-only) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Calculated Cost</Text>
          <View style={[styles.inputWrapper, styles.inputDisabled]}>
            <View style={styles.inputIconWrapper}>
              <Icon
                name="calculator-outline"
                size={18}
                color={theme.textMuted}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={theme.placeholder}
              value={calculatedCost.toFixed(2)}
              keyboardType="decimal-pad"
              editable={false}
            />
          </View>
        </View>

        {/* Purchases Section */}
        <View style={styles.purchasesSection}>
          <View style={styles.purchasesLabelRow}>
            <View style={styles.filterHeader}>
              <View
                style={[styles.filterIcon, { backgroundColor: theme.primaryBg }]}
              >
                <Icon name="cart-outline" size={14} color={theme.primary} />
              </View>
              <Text style={styles.label}>Purchases</Text>
            </View>
            <TouchableOpacity
              style={styles.addPurchaseButton}
              onPress={handleAddPurchase}
              activeOpacity={0.7}
            >
              <Icon name="add-circle" size={18} color={theme.primary} />
              <Text style={styles.addPurchaseText}>Add</Text>
            </TouchableOpacity>
          </View>

          {hasPurchases ? (
            <View style={styles.purchasesContainer}>
              {purchases.map((purchase, index) => (
                <View key={index} style={styles.purchaseRow}>
                  <View style={[styles.inputWrapper, styles.purchaseNameInput]}>
                    <TextInput
                      style={styles.purchaseInput}
                      placeholder="Name"
                      placeholderTextColor={theme.placeholder}
                      value={purchase.name}
                      onChangeText={(value) =>
                        handlePurchaseChange(index, "name", value)
                      }
                    />
                  </View>
                  <View
                    style={[styles.inputWrapper, styles.purchaseAmountInput]}
                  >
                    <TextInput
                      style={styles.purchaseInput}
                      placeholder="0.00"
                      placeholderTextColor={theme.placeholder}
                      value={
                        purchaseAmountInputs[index] ?? purchase.amount.toString()
                      }
                      onChangeText={(value) =>
                        handlePurchaseChange(index, "amount", value)
                      }
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <IconButton
                    icon="trash-outline"
                    onPress={() => handleRemovePurchase(index)}
                    variant="danger"
                  />
                </View>
              ))}
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text
                  style={[
                    styles.totalText,
                    calculatedCost === 0 && styles.totalTextZero,
                  ]}
                >
                  ${calculatedCost.toFixed(2)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyPurchases}>
              <Icon name="cart-outline" size={24} color={theme.textMuted} />
              <Text style={styles.purchasesHint}>
                Add purchases to calculate cost
              </Text>
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (optional)</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any notes..."
              placeholderTextColor={theme.placeholder}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          </View>
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
            style={[styles.submitButton, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={gradientColors.teal}
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
                  <Text style={styles.submitButtonText}>Save Expense</Text>
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
    content: {
      padding: spacing.lg,
      paddingBottom: spacing["4xl"],
    },
    chipGroupSpacing: {
      marginBottom: spacing.lg,
    },
    inputGroup: {
      marginBottom: spacing.lg,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: radius.md,
      borderCurve: "continuous",
    },
    inputIconWrapper: {
      paddingLeft: spacing.md,
    },
    input: {
      flex: 1,
      padding: spacing.md,
      paddingLeft: spacing.sm,
      fontSize: 15,
      color: theme.text,
    },
    textAreaWrapper: {
      alignItems: "flex-start",
    },
    textArea: {
      height: 80,
      textAlignVertical: "top",
      paddingTop: spacing.md,
      paddingLeft: spacing.md,
    },
    inputDisabled: {
      opacity: 0.6,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    filterHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    filterIcon: {
      width: 24,
      height: 24,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      borderCurve: "continuous",
    },
    purchasesSection: {
      marginBottom: spacing.lg,
    },
    purchasesLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    addPurchaseButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: theme.primaryBg,
      borderRadius: radius.sm,
      borderCurve: "continuous",
    },
    addPurchaseText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "600",
    },
    purchasesContainer: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.md,
      padding: spacing.md,
      backgroundColor: theme.surfaceSubtle,
      gap: spacing.sm,
      borderCurve: "continuous",
    },
    purchaseRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    purchaseNameInput: {
      flex: 1,
    },
    purchaseAmountInput: {
      width: 90,
    },
    purchaseInput: {
      flex: 1,
      padding: 10,
      fontSize: 14,
      color: theme.text,
    },
    emptyPurchases: {
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      backgroundColor: theme.surfaceSubtle,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: "dashed",
      gap: spacing.sm,
      borderCurve: "continuous",
    },
    totalContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: spacing.md,
      marginTop: 4,
    },
    totalLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    totalText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
    },
    totalTextZero: {
      color: theme.textMuted,
    },
    purchasesHint: {
      fontSize: 13,
      color: theme.textMuted,
      textAlign: "center",
    },
    footer: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.lg,
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
