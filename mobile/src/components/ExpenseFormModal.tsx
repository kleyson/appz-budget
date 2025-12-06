import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useCreateExpense, useUpdateExpense } from '../hooks/useExpenses';
import { useCategories } from '../hooks/useCategories';
import { usePeriods } from '../hooks/usePeriods';
import { Ionicons } from '@expo/vector-icons';
import type { Expense, ExpenseCreate, Purchase } from '../types';
import { getErrorMessage } from '../utils/errorHandler';
import { getThemeColors, colors, getShadow, gradientColors, radius, isDarkColor } from '../utils/colors';

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
  const { data: categories } = useCategories();
  const { data: periods } = usePeriods();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  const [expenseName, setExpenseName] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    if (expense) {
      setExpenseName(expense.expense_name);
      setSelectedPeriod(expense.period);
      setSelectedCategory(expense.category);
      setBudget(expense.budget.toString());
      setCost(expense.cost.toString());
      setNotes(expense.notes || '');
      setPurchases(expense.purchases || []);
    } else {
      setExpenseName('');
      setSelectedPeriod('');
      setSelectedCategory('');
      setBudget('');
      setCost('');
      setNotes('');
      setPurchases([]);
    }
  }, [expense, visible]);

  // Calculate cost from purchases (always calculated, never manually editable)
  const hasPurchases = purchases.length > 0;
  const calculatedCost = purchases.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Update cost when purchases change
  useEffect(() => {
    const total = purchases.reduce((sum, item) => sum + (item.amount || 0), 0);
    setCost(total.toString());
  }, [purchases]);

  const handleAddPurchase = () => {
    setPurchases([...purchases, { name: '', amount: 0 }]);
  };

  const handleRemovePurchase = (index: number) => {
    setPurchases(purchases.filter((_, i) => i !== index));
  };

  const handlePurchaseChange = (
    index: number,
    field: 'name' | 'amount',
    value: string | number
  ) => {
    setPurchases(
      purchases.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === 'amount' ? (typeof value === 'string' ? parseFloat(value) || 0 : value) : value,
            }
          : item
      )
    );
  };

  const handleSubmit = async () => {
    if (!expenseName || !selectedPeriod || !selectedCategory || !budget || !monthId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!calculatedCost) {
      Alert.alert('Error', 'Please add purchases with amounts');
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
      purchases: purchases.filter((item) => item.name.trim() !== '' || item.amount > 0),
    };

    try {
      if (expense) {
        await updateMutation.mutateAsync({ id: expense.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to save expense'));
    }
  };

  const styles = getStyles(isDark, theme);
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIcon}>
                <Ionicons name="wallet" size={20} color={theme.danger} />
              </View>
              <Text style={styles.title}>{expense ? 'Edit Expense' : 'Add Expense'}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Expense Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expense Name</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="receipt-outline" size={18} color={theme.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter expense name"
                  placeholderTextColor={theme.placeholder}
                  value={expenseName}
                  onChangeText={setExpenseName}
                />
              </View>
            </View>

            {/* Period Selection */}
            <View style={styles.filterGroup}>
              <View style={styles.filterHeader}>
                <View style={[styles.filterIcon, { backgroundColor: theme.primaryBg }]}>
                  <Ionicons name="calendar-outline" size={14} color={theme.primary} />
                </View>
                <Text style={styles.label}>Period</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {periods?.map((period) => {
                  const isSelected = selectedPeriod === period.name;
                  return (
                    <TouchableOpacity
                      key={period.id}
                      style={[
                        styles.chip,
                        isSelected && styles.chipActive,
                        isSelected && { backgroundColor: period.color, borderColor: period.color },
                      ]}
                      onPress={() => setSelectedPeriod(period.name)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                          isSelected && { color: isDarkColor(period.color) ? '#ffffff' : '#0f172a' },
                        ]}
                      >
                        {period.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Category Selection */}
            <View style={styles.filterGroup}>
              <View style={styles.filterHeader}>
                <View style={[styles.filterIcon, { backgroundColor: theme.dangerBg }]}>
                  <Ionicons name="pricetag-outline" size={14} color={theme.danger} />
                </View>
                <Text style={styles.label}>Category</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {categories?.map((category) => {
                  const isSelected = selectedCategory === category.name;
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.chip,
                        isSelected && styles.chipActive,
                        isSelected && { backgroundColor: category.color, borderColor: category.color },
                      ]}
                      onPress={() => setSelectedCategory(category.name)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                          isSelected && { color: isDarkColor(category.color) ? '#ffffff' : '#0f172a' },
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Budget Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Budget</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="wallet-outline" size={18} color={theme.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={theme.placeholder}
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

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
                          onChangeText={(value) => handlePurchaseChange(index, 'name', value)}
                        />
                      </View>
                      <View style={[styles.inputWrapper, styles.purchaseAmountInput]}>
                        <TextInput
                          style={styles.purchaseInput}
                          placeholder="0.00"
                          placeholderTextColor={theme.placeholder}
                          value={purchase.amount.toString()}
                          onChangeText={(value) => handlePurchaseChange(index, 'amount', value)}
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.removePurchaseButton}
                        onPress={() => handleRemovePurchase(index)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={18} color={theme.danger} />
                      </TouchableOpacity>
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
                  <Ionicons name="cart-outline" size={24} color={theme.textMuted} />
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
          </ScrollView>

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
    </Modal>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modal: {
      backgroundColor: theme.cardSolid,
      borderTopLeftRadius: radius['2xl'],
      borderTopRightRadius: radius['2xl'],
      maxHeight: '90%',
      ...getShadow(isDark, 'xl'),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: theme.dangerBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      letterSpacing: -0.3,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: isDark ? 'rgba(51, 65, 85, 0.5)' : colors.slate[100],
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      padding: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: radius.md,
    },
    inputIconWrapper: {
      paddingLeft: 12,
    },
    input: {
      flex: 1,
      padding: 12,
      paddingLeft: 8,
      fontSize: 15,
      color: theme.text,
    },
    textAreaWrapper: {
      alignItems: 'flex-start',
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
      paddingTop: 12,
      paddingLeft: 12,
    },
    inputDisabled: {
      opacity: 0.6,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    filterGroup: {
      marginBottom: 16,
    },
    filterHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    filterIcon: {
      width: 24,
      height: 24,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chips: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 16,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: isDark ? 'rgba(51, 65, 85, 0.3)' : colors.slate[50],
    },
    chipActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryBg,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    chipTextActive: {
      fontWeight: '600',
      color: theme.primary,
    },
    purchasesSection: {
      marginBottom: 16,
    },
    purchasesLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    addPurchaseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: theme.primaryBg,
      borderRadius: radius.sm,
    },
    addPurchaseText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    purchasesContainer: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.md,
      padding: 12,
      backgroundColor: isDark ? 'rgba(51, 65, 85, 0.2)' : colors.slate[50],
      gap: 8,
    },
    purchaseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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
    removePurchaseButton: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: theme.dangerBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyPurchases: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: isDark ? 'rgba(51, 65, 85, 0.2)' : colors.slate[50],
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
      gap: 8,
    },
    totalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 12,
      marginTop: 4,
    },
    totalLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    totalText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    totalTextZero: {
      color: theme.textMuted,
    },
    purchasesHint: {
      fontSize: 13,
      color: theme.textMuted,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    cancelButton: {
      flex: 1,
      padding: 14,
      borderRadius: radius.md,
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(51, 65, 85, 0.5)' : colors.slate[100],
    },
    cancelButtonText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '600',
    },
    submitButton: {
      flex: 1.5,
      borderRadius: radius.md,
      overflow: 'hidden',
      ...getShadow(isDark, 'sm'),
    },
    submitGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      gap: 8,
    },
    submitButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '600',
    },
    buttonDisabled: {
      opacity: 0.7,
    },
  });

