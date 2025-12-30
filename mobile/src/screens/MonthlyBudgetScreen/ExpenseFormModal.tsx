import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../contexts/ThemeContext";
import { useCreateExpense, useUpdateExpense } from "../../hooks/useExpenses";
import { useCategories } from "../../hooks/useCategories";
import { usePeriods } from "../../hooks/usePeriods";
import { Ionicons } from "@expo/vector-icons";
import type { Expense, ExpenseCreate, Purchase } from "../../types";
import { getErrorMessage } from "../../utils/errorHandler";
import { getThemeColors, getShadow, gradientColors, radius, spacing, rgba } from "../../utils/colors";
import { FormInput, ChipGroup, IconButton } from "../../components/shared";
import { useResponsive, responsive } from "../../hooks/useResponsive";

interface ExpenseFormModalProps {
  visible: boolean;
  expense?: Expense | null;
  monthId?: number | null;
  onClose: () => void;
}

export const ExpenseFormModal = ({
  visible,
  expense,
  monthId,
  onClose,
}: ExpenseFormModalProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { isTablet } = useResponsive();
  const { data: categories } = useCategories();
  const { data: periods } = usePeriods();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  const [expenseName, setExpenseName] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [_cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchaseAmountInputs, setPurchaseAmountInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    if (expense) {
      setExpenseName(expense.expense_name);
      setSelectedPeriod(expense.period);
      setSelectedCategory(expense.category);
      setBudget(expense.budget.toString());
      setCost(expense.cost.toString());
      setNotes(expense.notes || "");
      setPurchases(expense.purchases || []);
      // Initialize raw input values for existing purchases
      const inputs: Record<number, string> = {};
      (expense.purchases || []).forEach((p, i) => {
        inputs[i] = p.amount.toString();
      });
      setPurchaseAmountInputs(inputs);
    } else {
      setExpenseName("");
      setSelectedPeriod("");
      setSelectedCategory("");
      setBudget("");
      setCost("");
      setNotes("");
      setPurchases([]);
      setPurchaseAmountInputs({});
    }
  }, [expense, visible]);

  const hasPurchases = purchases.length > 0;
  const calculatedCost = purchases.reduce((sum, item) => sum + (item.amount || 0), 0);

  useEffect(() => {
    const total = purchases.reduce((sum, item) => sum + (item.amount || 0), 0);
    setCost(total.toString());
  }, [purchases]);

  const handleAddPurchase = () => {
    const newIndex = purchases.length;
    setPurchases([...purchases, { name: "", amount: 0 }]);
    setPurchaseAmountInputs((prev) => ({ ...prev, [newIndex]: "" }));
  };

  const handleRemovePurchase = (index: number) => {
    setPurchases(purchases.filter((_, i) => i !== index));
    // Re-index the raw inputs after removal
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
      // Store the raw input string for display
      setPurchaseAmountInputs((prev) => ({ ...prev, [index]: value }));
      // Parse for calculations (allow empty string and partial decimals)
      const numValue = value === "" || value === "." ? 0 : parseFloat(value) || 0;
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
    if (!expenseName || !selectedPeriod || !selectedCategory || !budget || !monthId) {
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
      purchases: purchases.filter((item) => item.name.trim() !== "" || item.amount > 0),
    };

    try {
      if (expense) {
        await updateMutation.mutateAsync({ id: expense.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error, "Failed to save expense"));
    }
  };

  const styles = getStyles(isDark, theme, isTablet);
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible={visible} transparent animationType={isTablet ? "fade" : "slide"} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalWrapper}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIcon, { backgroundColor: theme.dangerBg }]}>
                <Ionicons name="wallet" size={20} color={theme.danger} />
              </View>
              <Text style={styles.title}>{expense ? "Edit Expense" : "Add Expense"}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                  <Ionicons name="calculator-outline" size={18} color={theme.textMuted} />
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
                  <View style={[styles.filterIcon, { backgroundColor: theme.primaryBg }]}>
                    <Ionicons name="cart-outline" size={14} color={theme.primary} />
                  </View>
                  <Text style={styles.label}>Purchases</Text>
                </View>
                <TouchableOpacity
                  style={styles.addPurchaseButton}
                  onPress={handleAddPurchase}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={18} color={theme.primary} />
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
                          onChangeText={(value) => handlePurchaseChange(index, "name", value)}
                        />
                      </View>
                      <View style={[styles.inputWrapper, styles.purchaseAmountInput]}>
                        <TextInput
                          style={styles.purchaseInput}
                          placeholder="0.00"
                          placeholderTextColor={theme.placeholder}
                          value={purchaseAmountInputs[index] ?? purchase.amount.toString()}
                          onChangeText={(value) => handlePurchaseChange(index, "amount", value)}
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
                    <Text style={[styles.totalText, calculatedCost === 0 && styles.totalTextZero]}>
                      ${calculatedCost.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyPurchases}>
                  <Ionicons name="cart-outline" size={24} color={theme.textMuted} />
                  <Text style={styles.purchasesHint}>Add purchases to calculate cost</Text>
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
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
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
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                    <Text style={styles.submitButtonText}>Save Expense</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>, isTablet: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: rgba.overlay,
      justifyContent: isTablet ? "center" : "flex-end",
    },
    modalWrapper: {
      maxWidth: isTablet ? responsive.maxWidths.modal : undefined,
      width: isTablet ? "100%" : undefined,
      alignSelf: isTablet ? "center" : undefined,
      paddingHorizontal: isTablet ? spacing.xl : 0,
    },
    modal: {
      backgroundColor: theme.cardSolid,
      borderTopLeftRadius: radius["2xl"],
      borderTopRightRadius: radius["2xl"],
      borderBottomLeftRadius: isTablet ? radius["2xl"] : 0,
      borderBottomRightRadius: isTablet ? radius["2xl"] : 0,
      maxHeight: isTablet ? "80%" : "90%",
      ...getShadow(isDark, "xl"),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      letterSpacing: -0.3,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: theme.surfaceDefault,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      padding: spacing.lg,
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
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    cancelButton: {
      flex: 1,
      padding: 14,
      borderRadius: radius.md,
      alignItems: "center",
      backgroundColor: theme.surfaceDefault,
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
      ...getShadow(isDark, "sm"),
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
